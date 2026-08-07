// Pilhas de fallback de fonte. SPEC §9: a curadoria via fontsource chega na Fase 5;
// até lá, nenhuma família curada está empacotada, então o que importa é a CADEIA DE
// FALLBACK — sem ela, o canvas cai para o serif padrão do navegador.
//
// A família guardada no modelo é o nome lógico (ex.: "Inter"). A pilha completa é
// resolvida aqui, no render — mesma filosofia dos tokens de cor (resolução no render,
// nunca no modelo). Quando a Fase 5 empacotar as fontes de verdade, "Inter" passa a
// existir e renderiza como Inter, sem migração de dado.

export type FontGeneric = 'sans' | 'serif' | 'mono';

export interface FontOption {
  family: string;
  label: string;
  generic: FontGeneric;
}

// Opções do seletor na Fase 1. Divididas por genérico para o fallback bater com o
// tipo da fonte (uma serifada cai em serifada, não em sans).
export const FONT_OPTIONS: FontOption[] = [
  { family: 'Inter', label: 'Inter', generic: 'sans' },
  { family: 'Helvetica Neue', label: 'Helvetica Neue', generic: 'sans' },
  { family: 'Arial', label: 'Arial', generic: 'sans' },
  { family: 'system-ui', label: 'Sistema', generic: 'sans' },
  { family: 'Georgia', label: 'Georgia', generic: 'serif' },
  { family: 'Times New Roman', label: 'Times New Roman', generic: 'serif' },
  { family: 'Courier New', label: 'Courier New', generic: 'mono' },
];

const GENERIC_FALLBACK: Record<FontGeneric, string> = {
  sans: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  serif: 'Georgia, "Times New Roman", Times, serif',
  mono: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
};

const GENERIC_BY_FAMILY = new Map(FONT_OPTIONS.map((o) => [o.family, o.generic]));

/** Envolve em aspas famílias com espaço (exigência do CSS e do shorthand do canvas). */
function quote(family: string): string {
  return family.includes(' ') ? `"${family}"` : family;
}

/**
 * Resolve uma família lógica na pilha CSS completa, com o fallback do genérico
 * correto ao final. Usada tanto pelo nó Konva quanto pelo <textarea> de edição, para
 * os dois baterem exatamente. Família desconhecida assume sans.
 */
export function fontStack(family: string): string {
  const generic = GENERIC_BY_FAMILY.get(family) ?? 'sans';
  return `${quote(family)}, ${GENERIC_FALLBACK[generic]}`;
}
