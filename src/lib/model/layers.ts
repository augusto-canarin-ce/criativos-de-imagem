import type {
  Anchor,
  Effects,
  Frame,
  ImageLayer,
  Layer,
  LayerBase,
  ShapeLayer,
  TextLayer,
} from './types';
import { newId } from './factory';
import { getFormat } from '@/config/formats';
import type { FormatId } from './types';

// Fábricas puras de camada. Defaults escolhidos para anúncio (SPEC §1: expor só o
// que aparece em anúncio). Sem I/O; o tempo/ids entram de forma determinística.

function baseLayer(name: string, frame: Frame, anchor: Anchor['v']): Omit<LayerBase, 'type'> {
  return {
    id: newId(),
    name,
    visible: true,
    locked: false,
    opacity: 1,
    rotation: 0,
    blendMode: 'normal',
    frame,
    anchor: { v: anchor },
    overriddenIn: [],
    effects: {} as Effects,
  };
}

/** Caixa centralizada dentro da safe area, ocupando uma fração da largura útil. */
function centeredBox(formatId: FormatId, wRatio: number, h: number): Frame {
  const f = getFormat(formatId);
  const usableW = f.width - f.safeArea.left - f.safeArea.right;
  const w = Math.round(usableW * wRatio);
  return {
    x: Math.round((f.width - w) / 2),
    y: Math.round((f.height - h) / 2),
    w,
    h,
  };
}

export function createTextLayer(formatId: FormatId, content = 'Título'): TextLayer {
  return {
    ...baseLayer('Texto', centeredBox(formatId, 1, 160), 'top'),
    type: 'text',
    content,
    // Geist Sans: empacotada no bundle → mesmo render em qualquer máquina.
    fontFamily: 'Geist Sans',
    fontWeight: 700,
    fontSize: 96,
    lineHeight: 1.1,
    letterSpacing: 0,
    align: 'center',
    vAlign: 'top',
    transform: 'none',
    underline: false,
    bullet: false,
    fill: { kind: 'solid', color: '#111111' },
    autoFit: { enabled: false, min: 24, max: 200 },
  };
}

export function createRectLayer(formatId: FormatId): ShapeLayer {
  const f = getFormat(formatId);
  const w = 520;
  const h = 132;
  return {
    ...baseLayer('Retângulo', {
      x: Math.round((f.width - w) / 2),
      y: Math.round(f.height * 0.62),
      w,
      h,
    }, 'top'),
    type: 'shape',
    shape: 'rect',
    fill: { kind: 'solid', color: '#2563eb' },
    radius: 16,
  };
}

/** Camada de imagem cobrindo o formato inteiro — o caso "foto de fundo". O quadro
 *  ocupa toda a tela e a âncora 'stretch' faz o fundo acompanhar a altura entre
 *  formatos (Fase 2). `assetId: null` cria um placeholder; com id, já preenchida. */
export function createImageLayer(
  formatId: FormatId,
  assetId: string | null,
  label = 'Imagem',
): ImageLayer {
  const f = getFormat(formatId);
  return {
    ...baseLayer(assetId ? 'Imagem' : 'Placeholder', { x: 0, y: 0, w: f.width, h: f.height }, 'stretch'),
    type: 'image',
    assetId,
    placeholder: { label },
    fit: 'cover',
    focalPoint: { x: 0.5, y: 0.5 },
    adjust: { brightness: 0, contrast: 0, saturation: 0, blur: 0 },
  };
}

/** Camada de imagem como ELEMENTO (logo, ícone, foto de apoio): proporção natural
 *  preservada em 'contain', num tamanho razoável (até metade do formato),
 *  centralizada. Diferente do fundo, que cobre o formato inteiro. */
export function createImageElementLayer(
  formatId: FormatId,
  assetId: string,
  natural: { width: number; height: number },
  label = 'Imagem',
): ImageLayer {
  const f = getFormat(formatId);
  const scale = Math.min(1, (f.width * 0.5) / natural.width, (f.height * 0.5) / natural.height);
  const w = Math.max(24, Math.round(natural.width * scale));
  const h = Math.max(24, Math.round(natural.height * scale));
  return {
    ...baseLayer(label, {
      x: Math.round((f.width - w) / 2),
      y: Math.round((f.height - h) / 2),
      w,
      h,
    }, 'center'),
    type: 'image',
    assetId,
    placeholder: { label },
    fit: 'contain',
    focalPoint: { x: 0.5, y: 0.5 },
    adjust: { brightness: 0, contrast: 0, saturation: 0, blur: 0 },
  };
}

/** Cópia de uma camada com id novo (para "Duplicar"), deslocada para não sobrepor. */
export function cloneLayer(layer: Layer, offset = 24): Layer {
  const copy = structuredClone(layer);
  copy.id = newId();
  copy.name = `${layer.name} cópia`;
  copy.frame = { ...copy.frame, x: copy.frame.x + offset, y: copy.frame.y + offset };
  copy.overriddenIn = [];
  return copy;
}
