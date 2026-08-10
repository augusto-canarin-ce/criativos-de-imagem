import type { FormatDef, Frame, Layer, SafeArea } from '@/lib/model/types';

// Snapping (SPEC §8) — central, não polimento. Alvos, em ordem:
//   centro do canvas (dois eixos), bordas da safe area, bordas e centros das
//   outras camadas. Tolerância de 6px NA ESCALA DE TELA (o chamador converte para
//   px de documento dividindo pela escala). Guias vermelhas finas só durante o
//   arraste; Alt desativa (tratado pelo chamador).
//
// Espaçamento igual entre 3+ objetos: pendência registrada no PROGRESS.

export const SNAP_TOLERANCE_SCREEN = 6;

export interface SnapGuide {
  axis: 'v' | 'h';
  /** posição da linha no espaço do documento */
  at: number;
}

export interface SnapResult {
  x: number;
  y: number;
  guides: SnapGuide[];
}

interface Candidate {
  at: number;
  guide: number;
}

function candidatesFor(
  format: FormatDef,
  safe: SafeArea,
  others: Frame[],
): { v: Candidate[]; h: Candidate[] } {
  const v: Candidate[] = [
    { at: format.width / 2, guide: format.width / 2 },
    { at: safe.left, guide: safe.left },
    { at: format.width - safe.right, guide: format.width - safe.right },
  ];
  const h: Candidate[] = [
    { at: format.height / 2, guide: format.height / 2 },
    { at: safe.top, guide: safe.top },
    { at: format.height - safe.bottom, guide: format.height - safe.bottom },
  ];
  for (const f of others) {
    v.push(
      { at: f.x, guide: f.x },
      { at: f.x + f.w / 2, guide: f.x + f.w / 2 },
      { at: f.x + f.w, guide: f.x + f.w },
    );
    h.push(
      { at: f.y, guide: f.y },
      { at: f.y + f.h / 2, guide: f.y + f.h / 2 },
      { at: f.y + f.h, guide: f.y + f.h },
    );
  }
  return { v, h };
}

/**
 * Calcula a posição "grudada" de um quadro sendo arrastado. As três linhas do
 * próprio quadro (borda, centro, borda) testam contra cada candidato; vence o
 * menor desvio dentro da tolerância, por eixo.
 */
export function snapFrame(
  frame: Frame,
  format: FormatDef,
  safe: SafeArea,
  others: Frame[],
  tolerance: number,
): SnapResult {
  const { v, h } = candidatesFor(format, safe, others);

  const own = (pos: number, size: number) => [pos, pos + size / 2, pos + size];

  function best(ownLines: number[], candidates: Candidate[]): { delta: number; guide: number } | null {
    let winner: { delta: number; guide: number } | null = null;
    for (const line of ownLines) {
      for (const c of candidates) {
        const delta = c.at - line;
        if (Math.abs(delta) <= tolerance && (!winner || Math.abs(delta) < Math.abs(winner.delta))) {
          winner = { delta, guide: c.guide };
        }
      }
    }
    return winner;
  }

  const sx = best(own(frame.x, frame.w), v);
  const sy = best(own(frame.y, frame.h), h);

  const guides: SnapGuide[] = [];
  if (sx) guides.push({ axis: 'v', at: sx.guide });
  if (sy) guides.push({ axis: 'h', at: sy.guide });

  return {
    x: frame.x + (sx?.delta ?? 0),
    y: frame.y + (sy?.delta ?? 0),
    guides,
  };
}

/** Quadros das outras camadas visíveis do layout (excluindo as arrastadas). */
export function otherFrames(layers: Layer[], excludeIds: string[]): Frame[] {
  return layers
    .filter((l) => l.visible && !excludeIds.includes(l.id))
    .map((l) => l.frame);
}
