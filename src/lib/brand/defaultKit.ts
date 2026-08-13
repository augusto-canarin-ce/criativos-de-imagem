import type { BrandKit } from '@/lib/model/types';

// Kit padrão DE FÁBRICA (decisão de 2026-08-13): o app abre com a marca
// "Conversao Extrema" ativa, sem ninguém precisar escolher nada — um navegador
// limpo já renderiza os modelos com cor e fonte de verdade, não com o cinza de
// token não resolvido.
//
// O id é FIXO (não UUID) de propósito: um projeto exportado numa máquina abre
// com a marca certa em outra, porque a semente recria o mesmo id em qualquer
// navegador. Pelo mesmo motivo, apagar o kit não é definitivo — ele renasce na
// abertura seguinte, como todo padrão de fábrica (comportamento confirmado pelo
// usuário).
//
// Módulo PURO (só tipos): o factory de projeto importa daqui sem arrastar o
// Dexie junto. A semente (`ensureDefaultBrandKit`) vive em lib/db/brand.

export const DEFAULT_BRAND_KIT_ID = 'brand-conversao-extrema';

/** Kit congelado em código. A semente só INSERE quando o id não existe — kit
 *  editado pelo usuário nunca é sobrescrito na abertura. */
export function defaultBrandKit(): BrandKit {
  return {
    id: DEFAULT_BRAND_KIT_ID,
    name: 'Conversao Extrema',
    colors: [
      { id: 'primary', name: 'Esmeralda', hex: '#10b981' },
      { id: 'accent', name: 'Esmeralda claro', hex: '#34d399' },
      { id: 'ink', name: 'Grafite', hex: '#171717' },
      { id: 'secondary', name: 'Cinza', hex: '#525252' },
      { id: 'surface', name: 'Branco', hex: '#ffffff' },
      // Paleta além dos cinco papéis (nomes do usuário, 2026-08-13).
      { id: 'esmeralda-escuro', name: 'Esmeralda escuro', hex: '#059669' },
      { id: 'preto', name: 'Preto', hex: '#0a0a0a' },
      { id: 'cinza-escuro', name: 'Cinza escuro', hex: '#262626' },
      { id: 'cinza-claro', name: 'Cinza claro', hex: '#a1a1a1' },
      { id: 'fundo-claro', name: 'Fundo claro', hex: '#fafafa' },
    ],
    // Geist Sans é curadoria do bundle (self-hosted, pesos 400–700): resolve
    // offline e o loader não dispara nenhuma requisição externa por ela.
    fonts: [
      { role: 'display', family: 'Geist Sans', weights: [400, 500, 600, 700] },
      { role: 'body', family: 'Geist Sans', weights: [400, 500, 600, 700] },
    ],
    logos: [],
    textStyles: {},
  };
}
