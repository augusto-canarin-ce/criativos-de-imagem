// Curadoria de fontes (SPEC §9): ~30 famílias escolhidas para ANÚNCIO — alto
// contraste em peso, boa legibilidade em tamanho grande, pelo menos um peso pesado
// em cada. Empacotadas via fontsource (curated-imports.ts), funcionam offline e
// renderizam idêntico em qualquer máquina — a condição do export determinístico.
//
// Divisão do seletor (§9): "Títulos" (display, para chamada) e "Corpo" (leitura).

export interface CuratedFont {
  /** Nome CSS exato registrado pelo @font-face do fontsource. */
  family: string;
  label: string;
  role: 'display' | 'body';
  /** Pesos empacotados — o seletor de peso oferece só estes. */
  weights: number[];
  generic: 'sans' | 'serif';
}

export const CURATED_FONTS: CuratedFont[] = [
  // ── Títulos ────────────────────────────────────────────────────────────────
  { family: 'Anton', label: 'Anton', role: 'display', weights: [400], generic: 'sans' },
  { family: 'Archivo Black', label: 'Archivo Black', role: 'display', weights: [400], generic: 'sans' },
  { family: 'Bebas Neue', label: 'Bebas Neue', role: 'display', weights: [400], generic: 'sans' },
  { family: 'Oswald', label: 'Oswald', role: 'display', weights: [500, 700], generic: 'sans' },
  { family: 'Montserrat', label: 'Montserrat', role: 'display', weights: [700, 800, 900], generic: 'sans' },
  { family: 'Poppins', label: 'Poppins', role: 'display', weights: [700, 900], generic: 'sans' },
  { family: 'Raleway', label: 'Raleway', role: 'display', weights: [800, 900], generic: 'sans' },
  { family: 'Playfair Display', label: 'Playfair Display', role: 'display', weights: [700, 900], generic: 'serif' },
  { family: 'Abril Fatface', label: 'Abril Fatface', role: 'display', weights: [400], generic: 'serif' },
  { family: 'Alfa Slab One', label: 'Alfa Slab One', role: 'display', weights: [400], generic: 'serif' },
  { family: 'Passion One', label: 'Passion One', role: 'display', weights: [700, 900], generic: 'sans' },
  { family: 'Bangers', label: 'Bangers', role: 'display', weights: [400], generic: 'sans' },
  { family: 'Lilita One', label: 'Lilita One', role: 'display', weights: [400], generic: 'sans' },
  { family: 'Righteous', label: 'Righteous', role: 'display', weights: [400], generic: 'sans' },
  { family: 'Fjalla One', label: 'Fjalla One', role: 'display', weights: [400], generic: 'sans' },
  { family: 'Staatliches', label: 'Staatliches', role: 'display', weights: [400], generic: 'sans' },
  { family: 'Barlow Condensed', label: 'Barlow Condensed', role: 'display', weights: [600, 800], generic: 'sans' },

  // ── Corpo ──────────────────────────────────────────────────────────────────
  { family: 'Geist Sans', label: 'Geist', role: 'body', weights: [400, 500, 600, 700], generic: 'sans' },
  { family: 'Inter', label: 'Inter', role: 'body', weights: [400, 600, 800], generic: 'sans' },
  { family: 'Roboto', label: 'Roboto', role: 'body', weights: [400, 700, 900], generic: 'sans' },
  { family: 'Open Sans', label: 'Open Sans', role: 'body', weights: [400, 700, 800], generic: 'sans' },
  { family: 'Lato', label: 'Lato', role: 'body', weights: [400, 700, 900], generic: 'sans' },
  { family: 'Nunito', label: 'Nunito', role: 'body', weights: [400, 700, 900], generic: 'sans' },
  { family: 'DM Sans', label: 'DM Sans', role: 'body', weights: [400, 700, 900], generic: 'sans' },
  { family: 'Work Sans', label: 'Work Sans', role: 'body', weights: [400, 700, 900], generic: 'sans' },
  { family: 'Rubik', label: 'Rubik', role: 'body', weights: [400, 700, 900], generic: 'sans' },
  { family: 'Manrope', label: 'Manrope', role: 'body', weights: [400, 700, 800], generic: 'sans' },
  { family: 'Karla', label: 'Karla', role: 'body', weights: [400, 700, 800], generic: 'sans' },
  { family: 'IBM Plex Sans', label: 'IBM Plex Sans', role: 'body', weights: [400, 600, 700], generic: 'sans' },
];

const BY_FAMILY = new Map(CURATED_FONTS.map((f) => [f.family, f]));

export function curatedFont(family: string): CuratedFont | undefined {
  return BY_FAMILY.get(family);
}

export function isCurated(family: string): boolean {
  return BY_FAMILY.has(family);
}
