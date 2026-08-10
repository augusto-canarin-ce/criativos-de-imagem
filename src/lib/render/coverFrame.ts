import type { Frame } from '@/lib/model/types';

export interface NaturalSize {
  width: number;
  height: number;
}

export interface CoverResult {
  width: number;
  height: number;
  crop: { x: number; y: number; width: number; height: number };
}

/**
 * Enquadramento 'cover' não destrutivo: a imagem preenche o quadro inteiro sem
 * distorcer, cortando o excesso. O `focalPoint` (0–1) decide qual parte fica
 * visível — é o que faz a mesma foto ficar bem no 4:5 e no 9:16 (SPEC §8). Retorna
 * o tamanho de exibição (= quadro) e o retângulo de corte na imagem original.
 *
 * NUNCA distorce: se sobrar área, é problema de enquadramento, não de esticar.
 */
export function computeCover(
  frame: Frame,
  natural: NaturalSize,
  focal: { x: number; y: number } = { x: 0.5, y: 0.5 },
  /** Crop NÃO destrutivo (px na imagem original, SPEC §8): o enquadramento passa a
   *  operar só dentro deste retângulo — o original fica intacto no asset. */
  cropRect?: Frame,
): CoverResult {
  // Área-fonte efetiva: o crop, ou a imagem inteira.
  const src = cropRect ?? { x: 0, y: 0, w: natural.width, h: natural.height };
  const iw = src.w;
  const ih = src.h;
  if (iw <= 0 || ih <= 0 || frame.w <= 0 || frame.h <= 0) {
    return { width: frame.w, height: frame.h, crop: { x: src.x, y: src.y, width: iw, height: ih } };
  }

  // Escala que faz a área-fonte cobrir o quadro; a fonte visível é o quadro
  // dividido por essa escala.
  const scale = Math.max(frame.w / iw, frame.h / ih);
  const sw = frame.w / scale;
  const sh = frame.h / scale;

  // Posiciona o corte de modo que o ponto focal caia no ponto relativo do quadro.
  const cx = src.x + clamp(focal.x * iw - sw / 2, 0, iw - sw);
  const cy = src.y + clamp(focal.y * ih - sh / 2, 0, ih - sh);

  return { width: frame.w, height: frame.h, crop: { x: cx, y: cy, width: sw, height: sh } };
}

/** Enquadramento 'contain': a área-fonte cabe inteira dentro do quadro, sem corte. */
export function computeContain(frame: Frame, natural: NaturalSize, cropRect?: Frame): CoverResult {
  const src = cropRect ?? { x: 0, y: 0, w: natural.width, h: natural.height };
  const iw = src.w;
  const ih = src.h;
  if (iw <= 0 || ih <= 0) {
    return { width: frame.w, height: frame.h, crop: { x: src.x, y: src.y, width: iw, height: ih } };
  }
  const scale = Math.min(frame.w / iw, frame.h / ih);
  return {
    width: iw * scale,
    height: ih * scale,
    crop: { x: src.x, y: src.y, width: iw, height: ih },
  };
}

function clamp(v: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.min(Math.max(v, min), max);
}
