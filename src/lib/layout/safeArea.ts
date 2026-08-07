import type { FormatDef, Frame, Layer, SafeArea } from '@/lib/model/types';

// Correção de safe zone (SPEC §7, passo 6): camadas de texto e forma que invadirem
// a safe area são empurradas para dentro pelo caminho mais curto. Camadas de imagem
// são ignoradas — fundo e foto devem mesmo sangrar até a borda. Cada correção gera
// um aviso não bloqueante.

export interface SafeAreaCorrection {
  dx: number;
  dy: number;
}

/** Camadas sujeitas à correção. Imagens (inclusive logos, por ora) ficam de fora —
 *  decisão registrada no PROGRESS; o aviso de "logo fora da safe zone" entra com o
 *  checklist da Fase 3. */
export function isSafeAreaSubject(layer: Layer): boolean {
  return layer.type === 'text' || layer.type === 'shape';
}

/**
 * Menor deslocamento que traz o quadro para dentro da safe area. Se a camada for
 * maior que a área útil, encosta no topo/esquerda dela (deslocamento mínimo que
 * maximiza a parte visível). Rotação é ignorada no cálculo — o quadro axis-aligned
 * é aproximação suficiente para um aviso não bloqueante.
 */
export function safeAreaCorrection(
  frame: Frame,
  format: FormatDef,
  safe: SafeArea,
): SafeAreaCorrection | null {
  const minX = safe.left;
  const maxX = format.width - safe.right - frame.w;
  const minY = safe.top;
  const maxY = format.height - safe.bottom - frame.h;

  // maxX < minX significa camada mais larga que a área útil; encosta em minX.
  const targetX = clamp(frame.x, minX, Math.max(minX, maxX));
  const targetY = clamp(frame.y, minY, Math.max(minY, maxY));

  const dx = targetX - frame.x;
  const dy = targetY - frame.y;
  if (dx === 0 && dy === 0) return null;
  return { dx, dy };
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}
