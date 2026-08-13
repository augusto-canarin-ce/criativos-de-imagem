import type { GuideSlot, GuideTextRole, ImageLayer, Layer, Project } from '@/lib/model/types';

// A lista de TELAS do modo guiado (SPEC §18) é DERIVADA do roteiro do modelo,
// não escrita à mão. É o que faz "um campo por tela" cair fora sozinho e o que
// permite que um modelo com duas fotos ("Antes e depois") gere duas telas de foto
// sem nenhum código especial.
//
// Os cinco PASSOS são fixos — é o que o contador mostra ("Passo 4 de 5"). Dentro
// de um passo pode haver várias telas, e aí entra o subcontador ("texto 2 de 3").
// Total que muda no meio do caminho quebra a confiança de quem já está inseguro.

export const TOTAL_PASSOS = 5;

export const NOME_DO_PASSO: Record<number, string> = {
  1: 'Escolher o modelo',
  2: 'A foto',
  3: 'Sua logo',
  4: 'Os textos',
  5: 'Conferir',
};

export type GuidedScreenKind = 'modelo' | 'foto' | 'logo' | 'texto' | 'conferir';

export interface GuidedScreen {
  kind: GuidedScreenKind;
  /** Passo mostrado no contador, de 1 a 5. */
  passo: number;
  /** Camada que esta tela edita (ausente em "modelo" e "conferir"). */
  layerId?: string;
  guide?: GuideSlot;
  /** Preenchido só quando o passo tem mais de uma tela. */
  sub?: { indice: number; total: number };
}

function isImage(layer: Layer): layer is ImageLayer {
  return layer.type === 'image';
}

function comRoteiro(project: Project): { layer: Layer; guide: GuideSlot }[] {
  const layers = project.layouts[project.baseFormat].layers;
  return layers
    .filter((l): l is Layer & { guide: GuideSlot } => !!l.guide)
    .map((l) => ({ layer: l, guide: l.guide }))
    .sort((a, b) => a.guide.order - b.guide.order);
}

/** Record EXAUSTIVO de propósito: papel de texto novo que não for listado aqui
 *  não compila — antes era uma lista à mão que já ficou para trás duas vezes
 *  (preco/selo, nome/cargo) e a pergunta simplesmente não aparecia no passo 4. */
const PAPEIS_DE_TEXTO: Record<GuideTextRole, true> = {
  titulo: true,
  subtitulo: true,
  preco: true,
  selo: true,
  nome: true,
  cargo: true,
  beneficio: true,
  botao: true,
};

/**
 * As telas do fluxo, na ordem. O passo 1 só aparece enquanto não há projeto —
 * depois de escolhido o modelo ele já foi respondido, e voltar a ele significaria
 * jogar fora o que a pessoa fez.
 */
export function buildScreens(project: Project): GuidedScreen[] {
  const roteiro = comRoteiro(project);

  const fotos = roteiro.filter(
    (r) => r.guide.role === 'foto-principal' || r.guide.role === 'foto-secundaria',
  );
  const logos = roteiro.filter((r) => r.guide.role === 'logo');
  const textos = roteiro.filter((r) => r.guide.role in PAPEIS_DE_TEXTO);

  const screens: GuidedScreen[] = [];

  const push = (
    kind: GuidedScreenKind,
    passo: number,
    grupo: { layer: Layer; guide: GuideSlot }[],
  ) => {
    grupo.forEach((r, i) => {
      screens.push({
        kind,
        passo,
        layerId: r.layer.id,
        guide: r.guide,
        ...(grupo.length > 1 ? { sub: { indice: i + 1, total: grupo.length } } : {}),
      });
    });
  };

  push('foto', 2, fotos);
  push('logo', 3, logos);
  push('texto', 4, textos);
  screens.push({ kind: 'conferir', passo: 5 });

  return screens;
}

/** Índice seguro: projeto salvo com uma tela que não existe mais não trava. */
export function clampScreen(index: number, screens: GuidedScreen[]): number {
  if (!Number.isFinite(index)) return 0;
  return Math.max(0, Math.min(Math.trunc(index), screens.length - 1));
}

/** Rótulo do contador: "Passo 4 de 5" e, quando o passo tem várias telas,
 *  "Passo 4 de 5 · texto 2 de 3". */
export function labelDoContador(screen: GuidedScreen): string {
  const base = `Passo ${screen.passo} de ${TOTAL_PASSOS}`;
  if (!screen.sub) return base;
  const nome = screen.kind === 'foto' ? 'foto' : screen.kind === 'texto' ? 'texto' : 'item';
  return `${base} · ${nome} ${screen.sub.indice} de ${screen.sub.total}`;
}

/** Camadas de logo puláveis que continuaram vazias. Elas ficam no projeto durante
 *  o fluxo (para a pessoa poder voltar e preencher), mas não podem sobreviver ao
 *  fim dele: placeholder vazio vira aviso no checklist e quadro tracejado no
 *  anúncio publicado. */
export function emptySkippedLogos(project: Project): string[] {
  const ids: string[] = [];
  for (const { layer, guide } of comRoteiro(project)) {
    if (guide.role !== 'logo' || guide.optional !== true) continue;
    if (isImage(layer) && layer.assetId === null) ids.push(layer.id);
  }
  return ids;
}

/** Um texto de exemplo do modelo nunca pode virar anúncio publicado. Uma tela de
 *  texto obrigatório só avança com conteúdo de verdade. */
export function podeAvancar(screen: GuidedScreen, project: Project): boolean {
  if (screen.kind !== 'texto' || screen.guide?.optional) return true;
  const layer = project.layouts[project.baseFormat].layers.find((l) => l.id === screen.layerId);
  return !!(layer?.type === 'text' && layer.content.trim().length > 0);
}
