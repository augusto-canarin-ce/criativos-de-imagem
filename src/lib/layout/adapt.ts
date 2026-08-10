import { current, isDraft } from 'immer';
import type { FormatDef, FormatId, Layer, Layout, Project, SafeArea } from '@/lib/model/types';
import { getFormat, FORMAT_IDS } from '@/config/formats';
import { effectiveSafeArea } from '@/lib/store/settings';
import { adaptFrame } from './anchors';
import { isSafeAreaSubject, safeAreaCorrection } from './safeArea';
import { fitFontSize, type TextMeasurer } from './autoFit';

// adaptLayout — SPEC §7. O problema é puramente vertical (largura fixa em 1080).
//
// Semântica de overriddenIn: a marca é autoritativa na CÓPIA do formato derivado —
// editar a camada L no 9:16 empurra '9:16' para o overriddenIn da cópia do 9:16.
// A adaptação preserva essa cópia e re-deriva todas as outras.

export interface AdaptWarning {
  kind: 'safe-area' | 'auto-fit-min';
  formatId: FormatId;
  layerId: string;
  layerName: string;
  message: string;
}

/** Clone profundo que funciona também sobre drafts do Immer — a propagação roda
 *  dentro de produceWithPatches, e structuredClone não aceita Proxy. */
function deepClone<T>(value: T): T {
  return structuredClone(isDraft(value) ? current(value) : value);
}

export interface AdaptContext {
  from: FormatDef;
  to: FormatDef;
  /** Safe area efetiva do destino (editável nas configurações — Fase 7). */
  safeArea: SafeArea;
  /** Medidor de texto para auto-fit; ausente = auto-fit não aplicado. */
  measure?: TextMeasurer;
}

/** Deriva uma camada da base para o destino: âncora → safe zone → auto-fit. */
function deriveLayer(source: Layer, ctx: AdaptContext, warnings: AdaptWarning[]): Layer {
  const delta = ctx.to.height - ctx.from.height;
  const layer = deepClone(source);
  // Cópia recém-derivada por definição NÃO está sobrescrita: marcas de override são
  // autoritativas em cada cópia por formato e nunca viajam no clone (senão um
  // rebase deixaria marcas fantasma congelando camadas indevidamente).
  layer.overriddenIn = [];
  layer.frame = adaptFrame(layer.frame, layer.anchor, delta);

  // Passo 6 — correção de safe zone (texto e forma; imagens sangram).
  if (isSafeAreaSubject(layer)) {
    const corr = safeAreaCorrection(layer.frame, ctx.to, ctx.safeArea);
    if (corr) {
      layer.frame.x += corr.dx;
      layer.frame.y += corr.dy;
      warnings.push({
        kind: 'safe-area',
        formatId: ctx.to.id,
        layerId: layer.id,
        layerName: layer.name,
        message: `"${layer.name}" foi empurrada para dentro da área segura no ${ctx.to.id}.`,
      });
    }
  }

  // Passo 5 — auto-fit de texto (reduz, nunca aumenta).
  if (layer.type === 'text' && layer.autoFit.enabled && ctx.measure) {
    const fitted = fitFontSize(layer, layer.frame.h, ctx.measure);
    if (fitted < layer.fontSize) {
      if (ctx.measure(layer, fitted) > layer.frame.h) {
        warnings.push({
          kind: 'auto-fit-min',
          formatId: ctx.to.id,
          layerId: layer.id,
          layerName: layer.name,
          message: `"${layer.name}" não coube na caixa nem no tamanho mínimo no ${ctx.to.id}.`,
        });
      }
      layer.fontSize = fitted;
    }
  }

  return layer;
}

/**
 * Adapta o layout de destino a partir da origem (base). Regras:
 * 1. destino `detached` → intacto.
 * 2. fundo copiado da base (fundo não tem override por camada; segue a base).
 * 3. camadas da base: re-derivadas, exceto as com override no destino (preservadas).
 * 4. camadas que só existem no destino (adicionadas lá) permanecem no topo da pilha.
 * 5. a ORDEM das camadas vindas da base segue a base.
 */
export function adaptLayout(
  source: Layout,
  dest: Layout,
  ctx: AdaptContext,
): { layout: Layout; warnings: AdaptWarning[] } {
  if (dest.detached) return { layout: dest, warnings: [] };

  const warnings: AdaptWarning[] = [];
  const destById = new Map(dest.layers.map((l) => [l.id, l]));
  const sourceIds = new Set(source.layers.map((l) => l.id));

  const fromBase = source.layers.map((src) => {
    const existing = destById.get(src.id);
    if (existing && existing.overriddenIn.includes(ctx.to.id)) return existing;
    return deriveLayer(src, ctx, warnings);
  });
  const destOnly = dest.layers.filter((l) => !sourceIds.has(l.id));

  return {
    layout: {
      formatId: ctx.to.id,
      background: deepClone(source.background),
      layers: [...fromBase, ...destOnly],
      detached: false,
    },
    warnings,
  };
}

/**
 * INVARIANTE de texto multilinha: a caixa de um TextLayer sem auto-fit tem sempre
 * altura suficiente para TODAS as linhas medidas pelo PRÓPRIO motor de render.
 * Konva.Text com altura fixa não recorta — DERRUBA linhas inteiras que não cabem;
 * qualquer frame.h alguns px curto apaga a última linha. Roda em todo commit e no
 * load (via propagateProject), então sobrevive a arrastar, redimensionar, trocar
 * de formato, recarregar e reabrir. Camadas com auto-fit ficam de fora: o contrato
 * delas é o inverso (caixa fixa, fonte encolhe).
 */
export function normalizeTextHeights(project: Project, measure: TextMeasurer): void {
  for (const id of FORMAT_IDS) {
    for (const layer of project.layouts[id].layers) {
      if (layer.type !== 'text' || layer.autoFit.enabled) continue;
      const needed = Math.ceil(measure(layer, layer.fontSize));
      if (layer.frame.h < needed) layer.frame.h = needed;
    }
  }
}

/**
 * Propaga a base para todos os formatos conectados. MUTA o projeto (feito para
 * rodar dentro de uma receita do Immer — a propagação faz parte do mesmo passo de
 * undo da edição que a disparou). Retorna os avisos de todos os formatos.
 */
export function propagateProject(project: Project, measure?: TextMeasurer): AdaptWarning[] {
  const base = project.layouts[project.baseFormat];
  const from = getFormat(project.baseFormat);
  const all: AdaptWarning[] = [];

  for (const id of FORMAT_IDS) {
    if (id === project.baseFormat) continue;
    const dest = project.layouts[id];
    if (dest.detached) continue;
    const to = getFormat(id);
    const { layout, warnings } = adaptLayout(base, dest, {
      from,
      to,
      safeArea: effectiveSafeArea(id),
      measure,
    });
    project.layouts[id] = layout;
    all.push(...warnings);
  }

  // Garante a invariante em TODOS os layouts, inclusive a base (a adaptação acima
  // só reescreve os derivados). Só quando há medidor — nos testes sem medidor o
  // comportamento antigo permanece.
  if (measure) normalizeTextHeights(project, measure);

  return all;
}
