import type { TextLayer } from '@/lib/model/types';

// Auto-fit de texto (SPEC §7 passo 5, §8): busca binária sobre fontSize até o texto
// caber na caixa. REDUZ apenas — nunca aumenta além do tamanho original. O medidor
// é injetado: no browser é o Konva (lib/render/measureText); nos testes, uma função
// determinística qualquer.

export type TextMeasurer = (layer: TextLayer, fontSize: number) => number;

/**
 * Maior fontSize inteiro em [min, min(original, max)] cujo texto medido cabe em
 * `boxH`. Se nem o mínimo couber, retorna o mínimo (aviso fica a cargo do chamador).
 */
export function fitFontSize(
  layer: TextLayer,
  boxH: number,
  measure: TextMeasurer,
): number {
  const { min, max } = layer.autoFit;
  const ceil = Math.min(layer.fontSize, max);
  const floor = Math.min(min, ceil);

  if (measure(layer, ceil) <= boxH) return ceil;

  let lo = Math.floor(floor);
  let hi = Math.floor(ceil);
  let best = lo;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (measure(layer, mid) <= boxH) {
      best = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return best;
}
