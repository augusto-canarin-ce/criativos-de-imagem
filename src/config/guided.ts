import type { TemplateCategory } from '@/lib/model/types';

// Modo guiado "Criativo rápido" (SPEC §18).
//
// O passo 1 mostra QUATRO opções, uma por objetivo — não os doze modelos. Uma
// decisão por tela vale aqui também, e uma grade de doze é exatamente o que faz
// este público desistir. Os outros oito continuam disponíveis no editor completo.
//
// O representante de cada objetivo precisa ter roteiro completo: uma foto
// principal, pelo menos um texto e um espaço de logo pulável. É por isso que o
// institucional é o "Equipe" e não o "Marca em destaque" — neste último a logo é
// o modelo inteiro e não há foto para pedir no passo 2.

export interface GuidedObjective {
  category: TemplateCategory;
  /** Rótulo em linguagem de quem anuncia — nunca o nome interno do modelo. */
  label: string;
  /** Uma linha dizendo para que serve, para quem nunca anunciou. */
  description: string;
  templateId: string;
}

export const GUIDED_OBJECTIVES: GuidedObjective[] = [
  {
    category: 'promocao',
    label: 'Promoção',
    description: 'Para anunciar um desconto ou uma oferta por tempo limitado.',
    templateId: 'builtin-oferta-em-destaque',
  },
  {
    category: 'lancamento',
    label: 'Lançamento',
    description: 'Para apresentar um produto ou serviço que acabou de chegar.',
    templateId: 'builtin-chegou',
  },
  {
    category: 'prova-social',
    label: 'Prova social',
    description: 'Para mostrar o que um cliente falou sobre você.',
    templateId: 'builtin-depoimento',
  },
  {
    category: 'institucional',
    label: 'Institucional',
    description: 'Para falar da sua marca sem vender nada específico.',
    templateId: 'builtin-equipe',
  },
];

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
