import type { ChecklistWarning } from '@/lib/export/checklist';
import type { FormatId, Layer, Project } from '@/lib/model/types';

// Tradução do checklist (§11) para linguagem de quem não é designer (§18).
//
// A regra é dizer o EFEITO NO ANÚNCIO, nunca o nome da regra. "Texto fora da
// safe zone" não significa nada para quem só quer anunciar; "no Stories o topo
// fica escondido pelos botões do Instagram" significa.
//
// A tradução é EXAUSTIVA por `kind`: o Record abaixo obriga uma entrada para
// cada tipo de aviso, então um aviso novo no checklist quebra a compilação até
// alguém escrever a versão leiga. Sem isso, o jargão volta pela porta dos fundos.

export const NOME_DO_FORMATO: Record<FormatId, string> = {
  '4:5': 'Feed vertical',
  '1:1': 'Feed quadrado',
  '9:16': 'Stories e Reels',
};

export const DICA_DO_FORMATO: Record<FormatId, string> = {
  '4:5': 'É o que ocupa mais espaço no feed — costuma ser o principal.',
  '1:1': 'O quadrado cabe em mais lugares, mas sobra menos altura.',
  '9:16': 'Aqui o topo e a base ficam escondidos pelos botões do Instagram.',
};

/** Como chamar a camada numa frase. O nome interno ("Chamada", "CTA",
 *  "Sombreado") é vocabulário de quem monta o modelo, não de quem usa. */
export function nomeAmigavel(layer: Layer | undefined): string {
  switch (layer?.guide?.role) {
    case 'titulo':
      return 'o título';
    case 'subtitulo':
      return 'o texto de apoio';
    case 'preco':
      return 'o preço';
    case 'selo':
      return 'a etiqueta';
    case 'nome':
      return 'o nome de quem falou';
    case 'cargo':
      return 'o cargo ou a empresa';
    case 'beneficio':
      return 'um item da lista';
    case 'botao':
      return 'o texto do botão';
    case 'foto-principal':
    case 'foto-secundaria':
      return 'a foto';
    case 'logo':
      return 'a sua logo';
    default:
      break;
  }
  if (layer?.type === 'text') return 'um texto';
  if (layer?.type === 'image') return 'uma imagem';
  return 'um elemento';
}

export interface AvisoLeigo {
  id: string;
  kind: ChecklistWarning['kind'];
  /** Formatos em que o mesmo problema aparece. */
  formatos: FormatId[];
  layerId?: string;
  texto: string;
  /** Só quando existe uma correção segura de um clique. */
  acao?: 'escolher-imagem' | 'puxar-para-dentro';
  grave: boolean;
}

type Tradutor = (ctx: {
  nome: string;
  formatos: FormatId[];
  formatosTexto: string;
  warning: ChecklistWarning;
}) => string;

// Uma entrada por `kind` — o Record completo é o que garante a exaustividade.
const TRADUTOR: Record<ChecklistWarning['kind'], Tradutor> = {
  'placeholder-vazio': ({ nome }) =>
    `Falta escolher ${nome}. Sem ela, o anúncio sai com um quadro vazio no lugar.`,

  'fora-da-safe-zone': ({ nome, formatos, formatosTexto }) =>
    formatos.length === 1 && formatos[0] === '9:16'
      ? `No Stories, o topo e a base ficam escondidos pelos botões do Instagram — ${nome} está nessa faixa e pode não aparecer inteiro. Puxe um pouco para o centro.`
      : `${cap(nome)} está muito perto da borda ${formatosTexto} e pode ficar cortado na tela do celular.`,

  contraste: ({ nome, formatosTexto }) =>
    `${cap(nome)} está com uma cor parecida com a do fundo ${formatosTexto} e fica difícil de ler. Trocar a cor resolve.`,

  'fonte-pequena': ({ nome, formatosTexto }) =>
    `${cap(nome)} ficou com a letra pequena ${formatosTexto} e quase não dá para ler no celular.`,

  'imagem-ampliada': ({ nome, formatosTexto }) =>
    `${cap(nome)} é menor do que o espaço em que aparece ${formatosTexto} e vai sair borrada. Uma foto maior resolve.`,

  'fonte-nao-carregada': ({ nome }) =>
    `A letra de ${nome} não carregou e o anúncio pode sair com outra fonte. Confira a internet e abra de novo antes de baixar.`,

  'texto-demais': ({ formatosTexto }) =>
    `Tem bastante texto ${formatosTexto}. A Meta não bloqueia mais por isso, mas anúncio com muito texto costuma ser mostrado para menos gente.`,
};

const ACAO: Partial<Record<ChecklistWarning['kind'], AvisoLeigo['acao']>> = {
  'placeholder-vazio': 'escolher-imagem',
  'fora-da-safe-zone': 'puxar-para-dentro',
};

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function listaDeFormatos(formatos: FormatId[]): string {
  if (formatos.length === 3) return 'nos três formatos';
  // "Stories e Reels" é nome próprio e não vira minúscula no meio da frase; os
  // outros dois são descrições ("feed vertical") e ficam melhor em caixa baixa.
  const nomes = formatos.map(
    (f) => `no ${f === '9:16' ? NOME_DO_FORMATO[f] : NOME_DO_FORMATO[f].toLowerCase()}`,
  );
  if (nomes.length === 1) return nomes[0];
  return `${nomes.slice(0, -1).join(', ')} e ${nomes.at(-1)}`;
}

function acharCamada(project: Project, layerName: string | undefined): Layer | undefined {
  if (!layerName) return undefined;
  for (const formatId of Object.keys(project.layouts) as FormatId[]) {
    const achada = project.layouts[formatId].layers.find((l) => l.name === layerName);
    if (achada) return achada;
  }
  return undefined;
}

/** Avisos sobre uma camada específica que só fazem sentido quando a camada é da
 *  PESSOA (tem roteiro). Numa camada decorativa do modelo — o véu que sangra até
 *  a borda, a etiqueta com letra miúda de propósito — o aviso cobraria dela uma
 *  decisão de quem desenhou o modelo, que ela nem consegue mudar no fluxo. */
const SO_COM_ROTEIRO: ChecklistWarning['kind'][] = [
  'fora-da-safe-zone',
  'fonte-pequena',
  'contraste',
];

/**
 * Filtra e traduz. Duas decisões de curadoria, porque uma lista longa de avisos
 * técnicos assusta exatamente o público que este fluxo existe para atender:
 *
 * 1. Aviso preso a uma camada decorativa do modelo não aparece (SO_COM_ROTEIRO).
 * 2. O mesmo problema nos três formatos vira UMA linha, não três.
 * 3. "Texto demais" não aparece no fluxo (2026-08-17): a quantidade de texto é
 *    do DESENHO do modelo de fábrica ("Motivos para comprar" tem sete camadas
 *    de texto de propósito) — cobraria da pessoa uma decisão de quem desenhou.
 *    No editor completo o aviso continua.
 */
export function avisosParaLeigo(
  warnings: ChecklistWarning[],
  project: Project,
): AvisoLeigo[] {
  const porChave = new Map<string, { warning: ChecklistWarning; formatos: FormatId[] }>();

  for (const w of warnings) {
    if (w.kind === 'texto-demais') continue;
    const layer = acharCamada(project, w.layerName);
    if (SO_COM_ROTEIRO.includes(w.kind) && !layer?.guide) continue;

    const chave = `${w.kind}::${w.layerName ?? ''}`;
    const atual = porChave.get(chave);
    if (atual) atual.formatos.push(w.formatId);
    else porChave.set(chave, { warning: w, formatos: [w.formatId] });
  }

  return [...porChave.entries()].map(([chave, { warning, formatos }]) => {
    const layer = acharCamada(project, warning.layerName);
    const texto = TRADUTOR[warning.kind]({
      nome: nomeAmigavel(layer),
      formatos,
      formatosTexto: listaDeFormatos(formatos),
      warning,
    });
    return {
      id: chave,
      kind: warning.kind,
      formatos,
      layerId: layer?.id,
      texto,
      acao: ACAO[warning.kind],
      grave: warning.severity === 'destaque',
    };
  });
}
