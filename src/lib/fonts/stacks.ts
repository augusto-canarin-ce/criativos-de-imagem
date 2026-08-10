import { curatedFont } from './curated';

// Pilhas de fallback de fonte (§9). A família guardada no modelo é o nome lógico
// (ex.: "Montserrat"); a pilha completa é resolvida AQUI, no render — mesma
// filosofia dos tokens de cor. A curadoria (lib/fonts/curated) está empacotada e
// renderiza idêntica em qualquer máquina; sistema/Google/enviadas caem no fallback
// do genérico certo quando indisponíveis.

export type FontGeneric = 'sans' | 'serif' | 'mono';

export interface FontOption {
  family: string;
  label: string;
  generic: FontGeneric;
}

/** Fontes de SISTEMA oferecidas no seletor (grupo próprio, abaixo da curadoria). */
export const SYSTEM_FONT_OPTIONS: FontOption[] = [
  { family: 'Helvetica Neue', label: 'Helvetica Neue', generic: 'sans' },
  { family: 'Arial', label: 'Arial', generic: 'sans' },
  { family: 'system-ui', label: 'Sistema', generic: 'sans' },
  { family: 'Georgia', label: 'Georgia', generic: 'serif' },
  { family: 'Times New Roman', label: 'Times New Roman', generic: 'serif' },
  { family: 'Courier New', label: 'Courier New', generic: 'mono' },
];

// Sem '-apple-system': é legado (system-ui cobre Safari 11+) e o parser de fonte
// do node-canvas rejeita o hífen inicial derrubando a pilha INTEIRA para o default
// de 10px — pego pela suíte de regressão visual.
const GENERIC_FALLBACK: Record<FontGeneric, string> = {
  sans: 'system-ui, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  serif: 'Georgia, "Times New Roman", Times, serif',
  mono: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
};

const SYSTEM_GENERIC = new Map(SYSTEM_FONT_OPTIONS.map((o) => [o.family, o.generic]));

/** Envolve em aspas famílias com espaço (exigência do CSS e do shorthand do canvas). */
function quote(family: string): string {
  return family.includes(' ') ? `"${family}"` : family;
}

/**
 * Resolve uma família lógica na pilha CSS completa, com o fallback do genérico
 * correto ao final. Usada pelo nó Konva, pelo <textarea> de edição e pelo medidor
 * de texto — todos precisam bater exatamente. Família desconhecida assume sans.
 */
export function fontStack(family: string): string {
  const generic = curatedFont(family)?.generic ?? SYSTEM_GENERIC.get(family) ?? 'sans';
  return `${quote(family)}, ${GENERIC_FALLBACK[generic]}`;
}
