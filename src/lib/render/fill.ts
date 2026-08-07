import type { Fill } from '@/lib/model/types';

// Resolução de preenchimento para o render. SPEC §6: qualquer campo de cor aceita
// `#RRGGBB` ou token `brand.<id>`; a resolução acontece AQUI, no render, nunca no
// modelo — é isso que permite trocar o brand kit e ver o criativo inteiro atualizar.
//
// Fase 1 ainda não tem brand kit ativo, então tokens caem para um cinza neutro; a
// resolução real contra o BrandKit entra na Fase 6. Gradiente em Konva chega na
// Fase 4 — por ora só o sólido resolve para o canvas, e o gradiente vira uma cor de
// fallback (primeira parada) para não quebrar o preview.

export type ColorResolver = (token: string) => string | undefined;

const FALLBACK = '#888888';

export function resolveColor(color: string, resolve?: ColorResolver): string {
  if (color.startsWith('#')) return color;
  if (color.startsWith('brand.')) return resolve?.(color.slice(6)) ?? FALLBACK;
  return color; // nomes CSS válidos passam direto
}

/** Cor sólida efetiva de um Fill para uso no canvas Konva (Fase 1). */
export function fillToSolid(fill: Fill, resolve?: ColorResolver): string {
  if (fill.kind === 'solid') return resolveColor(fill.color, resolve);
  // Gradiente: fallback para a primeira parada até o suporte completo (Fase 4).
  return fill.stops.length > 0 ? resolveColor(fill.stops[0].color, resolve) : FALLBACK;
}

/** CSS `background` a partir de um Fill (miniaturas, prévias em HTML). */
export function fillToCss(fill: Fill, resolve?: ColorResolver): string {
  if (fill.kind === 'solid') return resolveColor(fill.color, resolve);
  const stops = fill.stops.map((s) => `${resolveColor(s.color, resolve)} ${s.offset * 100}%`).join(', ');
  if (fill.kind === 'linear') return `linear-gradient(${fill.angle}deg, ${stops})`;
  return `radial-gradient(circle at ${fill.cx * 100}% ${fill.cy * 100}%, ${stops})`;
}
