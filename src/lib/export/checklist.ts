import type { Asset, FormatDef, FormatId, Layer, Layout, TextLayer } from '@/lib/model/types';
import { getFormat, FORMAT_IDS } from '@/config/formats';

// Checklist pré-export (SPEC §11). NUNCA bloqueia — informa. Ordem de severidade:
// placeholder vazio primeiro (publicar anúncio com quadro tracejado é o erro que
// só se descobre com o anúncio no ar).
//
// Duas famílias de checagem:
// - ESTÁTICAS (`staticChecklist`): derivadas do modelo, rodam ao vivo no rodapé.
// - DE PIXEL (`contrastWarnings`): contraste contra a luminância média real sob a
//   caixa de texto — precisa do canvas renderizado, roda no diálogo de export.

export interface ChecklistWarning {
  kind:
    | 'placeholder-vazio'
    | 'fora-da-safe-zone'
    | 'contraste'
    | 'fonte-pequena'
    | 'imagem-ampliada'
    | 'fonte-nao-carregada'
    | 'texto-demais';
  severity: 'destaque' | 'aviso' | 'info';
  formatId: FormatId;
  layerName?: string;
  message: string;
}

const MIN_FONT_PX = 28;
const TEXT_AREA_RATIO = 0.2;
const MIN_CONTRAST = 4.5;

function visibleLayers(layout: Layout): Layer[] {
  return layout.layers.filter((l) => l.visible);
}

/** Elemento sujeito ao aviso de safe zone: texto, forma e imagem-elemento (logo).
 *  Imagem de fundo (cobre o formato) deve mesmo sangrar. */
function subjectToSafeZone(layer: Layer, format: FormatDef): boolean {
  if (layer.type === 'text' || layer.type === 'shape') return true;
  if (layer.type === 'image') {
    const coversAll =
      layer.frame.x <= 0 &&
      layer.frame.y <= 0 &&
      layer.frame.x + layer.frame.w >= format.width &&
      layer.frame.y + layer.frame.h >= format.height;
    return !coversAll;
  }
  return false;
}

function outsideSafeZone(layer: Layer, format: FormatDef): boolean {
  const s = format.safeArea;
  const f = layer.frame;
  return (
    f.x < s.left ||
    f.y < s.top ||
    f.x + f.w > format.width - s.right ||
    f.y + f.h > format.height - s.bottom
  );
}

export interface AssetMeta {
  width?: number;
  height?: number;
}

export function staticChecklist(
  layouts: Record<FormatId, Layout>,
  assetMeta: Map<string, AssetMeta>,
  fontLoaded: (family: string, weight: number) => boolean,
): ChecklistWarning[] {
  const out: ChecklistWarning[] = [];

  for (const formatId of FORMAT_IDS) {
    const format = getFormat(formatId);
    const layout = layouts[formatId];

    for (const layer of visibleLayers(layout)) {
      // 1. Placeholder vazio — primeiro da lista, em destaque.
      if (layer.type === 'image' && layer.assetId === null) {
        out.push({
          kind: 'placeholder-vazio',
          severity: 'destaque',
          formatId,
          layerName: layer.name,
          message: `Placeholder "${layer.placeholder.label || layer.name}" ainda vazio no ${formatId}.`,
        });
      }

      // 2. Texto/forma/logo fora da safe zone.
      if (subjectToSafeZone(layer, format) && outsideSafeZone(layer, format)) {
        out.push({
          kind: 'fora-da-safe-zone',
          severity: 'aviso',
          formatId,
          layerName: layer.name,
          message: `"${layer.name}" invade a área que a interface da Meta cobre no ${formatId}.`,
        });
      }

      // 4. Menor fonte renderizada abaixo de 28px (em 1080 de largura).
      if (layer.type === 'text' && layer.fontSize < MIN_FONT_PX) {
        out.push({
          kind: 'fonte-pequena',
          severity: 'aviso',
          formatId,
          layerName: layer.name,
          message: `"${layer.name}" está com fonte de ${Math.round(layer.fontSize)}px no ${formatId} — abaixo de ${MIN_FONT_PX}px fica ilegível no celular.`,
        });
      }

      // 5. Imagem exibida acima de 100% do tamanho original.
      if (layer.type === 'image' && layer.assetId) {
        const meta = assetMeta.get(layer.assetId);
        if (meta?.width && meta.height) {
          const scale =
            layer.fit === 'cover'
              ? Math.max(layer.frame.w / meta.width, layer.frame.h / meta.height)
              : Math.min(layer.frame.w / meta.width, layer.frame.h / meta.height);
          if (scale > 1.001) {
            out.push({
              kind: 'imagem-ampliada',
              severity: 'aviso',
              formatId,
              layerName: layer.name,
              message: `"${layer.name}" está ampliada a ${Math.round(scale * 100)}% no ${formatId} — vai sair borrada.`,
            });
          }
        }
      }
    }

    // 6. Fonte não carregada (§9: o pior bug possível deste app).
    const families = new Map<string, number>();
    for (const layer of visibleLayers(layout)) {
      if (layer.type === 'text') families.set(layer.fontFamily, layer.fontWeight);
    }
    for (const [family, weight] of families) {
      if (!fontLoaded(family, weight)) {
        out.push({
          kind: 'fonte-nao-carregada',
          severity: 'aviso',
          formatId,
          message: `A fonte "${family}" não está carregada — o ${formatId} sairia com fonte substituída.`,
        });
      }
    }

    // 7. Área de texto acima de 20% — informativo.
    const textArea = visibleLayers(layout)
      .filter((l): l is TextLayer => l.type === 'text')
      .reduce((acc, l) => acc + l.frame.w * l.frame.h, 0);
    const ratio = textArea / (format.width * format.height);
    if (ratio > TEXT_AREA_RATIO) {
      out.push({
        kind: 'texto-demais',
        severity: 'info',
        formatId,
        message: `Texto ocupa ${Math.round(ratio * 100)}% do ${formatId}. A Meta não bloqueia mais, mas excesso de texto costuma reduzir a entrega.`,
      });
    }
  }

  // Destaques primeiro, depois avisos, depois informativos.
  const order = { destaque: 0, aviso: 1, info: 2 } as const;
  return out.sort((a, b) => order[a.severity] - order[b.severity]);
}

export function assetMetaFrom(assets: Asset[]): Map<string, AssetMeta> {
  return new Map(assets.map((a) => [a.id, { width: a.width, height: a.height }]));
}

// ---------- contraste (precisa dos pixels renderizados) ----------

function srgbToLinear(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function relativeLuminance(r: number, g: number, b: number): number {
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * Contraste de cada camada de texto contra a LUMINÂNCIA MÉDIA dos pixels sob a
 * caixa (§11: não contra cor chapada, que dá falso positivo em cima de foto).
 * `canvas` é o render final do formato em tamanho real.
 */
export function contrastWarnings(
  canvas: HTMLCanvasElement,
  layout: Layout,
  formatId: FormatId,
): ChecklistWarning[] {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return [];
  const out: ChecklistWarning[] = [];

  for (const layer of visibleLayers(layout)) {
    if (layer.type !== 'text') continue;
    const color =
      layer.fill.kind === 'solid' ? hexToRgb(layer.fill.color) : hexToRgb(layer.fill.stops[0]?.color ?? '');
    if (!color) continue;

    const x = Math.max(0, Math.round(layer.frame.x));
    const y = Math.max(0, Math.round(layer.frame.y));
    const w = Math.min(canvas.width - x, Math.round(layer.frame.w));
    const h = Math.min(canvas.height - y, Math.round(layer.frame.h));
    if (w <= 0 || h <= 0) continue;

    const data = ctx.getImageData(x, y, w, h).data;
    // Amostra 1 a cada 16 pixels — suficiente para média e 16× mais rápido.
    let sum = 0;
    let count = 0;
    for (let i = 0; i < data.length; i += 64) {
      sum += relativeLuminance(data[i], data[i + 1], data[i + 2]);
      count++;
    }
    const bg = sum / Math.max(1, count);
    const fg = relativeLuminance(...color);
    const ratio = (Math.max(bg, fg) + 0.05) / (Math.min(bg, fg) + 0.05);

    if (ratio < MIN_CONTRAST) {
      out.push({
        kind: 'contraste',
        severity: 'aviso',
        formatId,
        layerName: layer.name,
        message: `"${layer.name}" tem contraste ${ratio.toFixed(1)}:1 contra o fundo real no ${formatId} — abaixo de ${MIN_CONTRAST}:1 fica difícil de ler.`,
      });
    }
  }
  return out;
}
