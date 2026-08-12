import type { Template } from '@/lib/model/types';

// Modo guiado "Criativo rápido" (SPEC §18).
//
// O passo 1 mostra QUATRO opções, uma por objetivo — não os doze modelos. Uma
// decisão por tela vale aqui também, e uma grade de doze é exatamente o que faz
// este público desistir. Os outros modelos continuam disponíveis no editor.
//
// Os quatro objetivos abaixo são a definição de 2026-08-11 (decisão do usuário,
// que vai desenhar os modelos à mão no próprio editor). Enquanto o modelo
// desenhado não chega, `templateIds` cai no gerado por script mais próximo —
// o fluxo nunca quebra por modelo faltando. Quando o arquivo novo entrar em
// /public/templates com o id da frente, ele vence sozinho.

export interface GuidedObjective {
  id: string;
  /** Rótulo em linguagem de quem anuncia — nunca o nome interno do modelo. */
  label: string;
  /** Uma linha dizendo para que serve, para quem nunca anunciou. */
  description: string;
  /** Candidatos em ordem de preferência: o primeiro id CARREGADO vence. */
  templateIds: string[];
}

export const GUIDED_OBJECTIVES: GuidedObjective[] = [
  {
    id: 'produto-em-destaque',
    label: 'Produto em destaque',
    description: 'Para mostrar o produto ou serviço em primeiro plano.',
    templateIds: ['builtin-produto-em-destaque', 'builtin-oferta-em-destaque'],
  },
  {
    id: 'oferta-e-preco',
    label: 'Oferta e preço',
    description: 'Para promoção, desconto e data comemorativa.',
    templateIds: ['builtin-oferta-e-preco', 'builtin-preco-em-selo'],
  },
  {
    id: 'depoimento',
    label: 'Depoimento',
    description: 'Para mostrar o que um cliente falou sobre você.',
    // O modelo desenhado terá o MESMO id (o arquivo substitui o atual).
    templateIds: ['builtin-depoimento'],
  },
  {
    id: 'antes-e-depois',
    label: 'Antes e depois',
    description: 'Para serviços onde o resultado se vê: estética, reforma, odontologia, jardinagem.',
    templateIds: ['builtin-antes-e-depois'],
  },
];

/** O modelo que representa o objetivo, entre os carregados. */
export function resolveObjectiveTemplate(
  objective: GuidedObjective,
  templates: Template[],
): Template | null {
  for (const id of objective.templateIds) {
    const found = templates.find((t) => t.id === id);
    if (found) return found;
  }
  return null;
}

/** Palavras que não podem aparecer em nenhuma pergunta ou dica (§18). */
export const JARGAO_PROIBIDO = [
  'camada',
  'placeholder',
  'safe zone',
  'área segura',
  'token',
  'âncora',
  'ancora',
  'layout',
  'canvas',
  '4:5',
  '1:1',
  '9:16',
];
