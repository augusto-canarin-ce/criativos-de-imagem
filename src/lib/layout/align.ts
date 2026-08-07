import type { Frame } from '@/lib/model/types';

// Alinhar, distribuir e esticar (SPEC §8 + feedback pós-Fase 2). Comportamento
// Figma/Photoshop: UMA camada selecionada alinha em relação ao canvas; VÁRIAS, em
// relação à caixa da seleção. Funções puras: recebem quadros, devolvem novas
// posições por id.

export type AlignOp = 'left' | 'hcenter' | 'right' | 'top' | 'vcenter' | 'bottom';

export interface FrameRef {
  id: string;
  frame: Frame;
}

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

function selectionBox(frames: FrameRef[]): Box {
  const x1 = Math.min(...frames.map((f) => f.frame.x));
  const y1 = Math.min(...frames.map((f) => f.frame.y));
  const x2 = Math.max(...frames.map((f) => f.frame.x + f.frame.w));
  const y2 = Math.max(...frames.map((f) => f.frame.y + f.frame.h));
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
}

export function alignFrames(
  frames: FrameRef[],
  op: AlignOp,
  canvas: { w: number; h: number },
): Map<string, Partial<Frame>> {
  if (frames.length === 0) return new Map();
  const box: Box = frames.length === 1 ? { x: 0, y: 0, w: canvas.w, h: canvas.h } : selectionBox(frames);

  const out = new Map<string, Partial<Frame>>();
  for (const { id, frame } of frames) {
    switch (op) {
      case 'left':
        out.set(id, { x: box.x });
        break;
      case 'hcenter':
        out.set(id, { x: Math.round(box.x + (box.w - frame.w) / 2) });
        break;
      case 'right':
        out.set(id, { x: box.x + box.w - frame.w });
        break;
      case 'top':
        out.set(id, { y: box.y });
        break;
      case 'vcenter':
        out.set(id, { y: Math.round(box.y + (box.h - frame.h) / 2) });
        break;
      case 'bottom':
        out.set(id, { y: box.y + box.h - frame.h });
        break;
    }
  }
  return out;
}

/** Espaçamento igual entre as camadas (≥3), mantendo a primeira e a última no
 *  lugar — o comportamento do Figma. */
export function distributeFrames(
  frames: FrameRef[],
  axis: 'h' | 'v',
): Map<string, Partial<Frame>> {
  const out = new Map<string, Partial<Frame>>();
  if (frames.length < 3) return out;

  const pos = axis === 'h' ? 'x' : 'y';
  const size = axis === 'h' ? 'w' : 'h';
  const sorted = [...frames].sort((a, b) => a.frame[pos] - b.frame[pos]);

  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const span = last.frame[pos] + last.frame[size] - first.frame[pos];
  const total = sorted.reduce((acc, f) => acc + f.frame[size], 0);
  const gap = (span - total) / (sorted.length - 1);

  let cursor = first.frame[pos];
  for (const f of sorted) {
    out.set(f.id, { [pos]: Math.round(cursor) } as Partial<Frame>);
    cursor += f.frame[size] + gap;
  }
  return out;
}

/** Estica para 100% da largura ou da altura do formato. */
export function stretchFrames(
  frames: FrameRef[],
  dim: 'width' | 'height',
  canvas: { w: number; h: number },
): Map<string, Partial<Frame>> {
  const out = new Map<string, Partial<Frame>>();
  for (const { id } of frames) {
    if (dim === 'width') out.set(id, { x: 0, w: canvas.w });
    else out.set(id, { y: 0, h: canvas.h });
  }
  return out;
}
