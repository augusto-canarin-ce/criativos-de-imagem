import type { BrandKit, TextLayer } from '@/lib/model/types';

// Tokens de marca (SPEC §6/§10). Qualquer campo de cor aceita `#RRGGBB` OU
// `brand.<id>`; a família de fonte aceita um nome OU `brand.display` /
// `brand.body`. A resolução acontece SEMPRE no render, nunca no modelo — é isso
// que permite trocar o brand kit e ver o criativo inteiro atualizar sem tocar em
// uma única camada.

export const COLOR_TOKEN_PREFIX = 'brand.';
export const FONT_DISPLAY_TOKEN = 'brand.display';
export const FONT_BODY_TOKEN = 'brand.body';

/** Cor de fallback quando o token não resolve (kit ausente ou id removido). */
const UNRESOLVED_COLOR = '#888888';

export function isColorToken(value: string): boolean {
  return value.startsWith(COLOR_TOKEN_PREFIX);
}

export function isFontToken(family: string): boolean {
  return family === FONT_DISPLAY_TOKEN || family === FONT_BODY_TOKEN;
}

export function colorTokenId(value: string): string {
  return value.slice(COLOR_TOKEN_PREFIX.length);
}

/** `brand.primary` → hex do kit. Sem kit ou sem o id, devolve o fallback. */
export function resolveBrandColor(value: string, kit: BrandKit | null): string {
  if (!isColorToken(value)) return value;
  const id = colorTokenId(value);
  const hit = kit?.colors.find((c) => c.id === id);
  return hit?.hex ?? UNRESOLVED_COLOR;
}

/** `brand.display`/`brand.body` → família do papel no kit. Sem kit, devolve uma
 *  família neutra para o render não quebrar. */
export function resolveBrandFont(family: string, kit: BrandKit | null): string {
  if (!isFontToken(family)) return family;
  const role = family === FONT_DISPLAY_TOKEN ? 'display' : 'body';
  return kit?.fonts.find((f) => f.role === role)?.family ?? 'Geist Sans';
}

/** Pesos disponíveis para um papel (o seletor de peso usa quando há token). */
export function brandFontWeights(family: string, kit: BrandKit | null): number[] | undefined {
  if (!isFontToken(family)) return undefined;
  const role = family === FONT_DISPLAY_TOKEN ? 'display' : 'body';
  return kit?.fonts.find((f) => f.role === role)?.weights;
}

// ---------- estilos de texto (§10) ----------

/** Campos que um estilo de texto do kit controla. Geometria e conteúdo NUNCA
 *  entram: o estilo é aparência tipográfica, não posição nem texto. */
export const TEXT_STYLE_FIELDS = [
  'fontFamily',
  'fontWeight',
  'fontSize',
  'lineHeight',
  'letterSpacing',
  'align',
  'transform',
  'underline',
  'fill',
  'highlight',
] as const;

export type TextStyleField = (typeof TEXT_STYLE_FIELDS)[number];
export type TextStyle = Partial<Pick<TextLayer, TextStyleField>>;

/** Extrai de uma camada o subconjunto que compõe um estilo. */
export function textStyleFromLayer(layer: TextLayer): TextStyle {
  const style: TextStyle = {};
  for (const field of TEXT_STYLE_FIELDS) {
    const value = layer[field];
    if (value !== undefined) {
      (style as Record<string, unknown>)[field] = structuredClone(value);
    }
  }
  return style;
}

/** A camada ainda está igual ao estilo? (§10: indicação visual quando modificada) */
export function matchesTextStyle(layer: TextLayer, style: TextStyle): boolean {
  for (const field of TEXT_STYLE_FIELDS) {
    if (!(field in style)) continue;
    const a = JSON.stringify(style[field] ?? null);
    const b = JSON.stringify(layer[field] ?? null);
    if (a !== b) return false;
  }
  return true;
}
