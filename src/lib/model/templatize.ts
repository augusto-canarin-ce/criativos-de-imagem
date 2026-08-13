import type {
  BrandKit,
  Fill,
  FormatId,
  GuideSlot,
  GuideTextRole,
  Layer,
  Layout,
  Project,
} from '@/lib/model/types';
import { COLOR_TOKEN_PREFIX, FONT_BODY_TOKEN, FONT_DISPLAY_TOKEN } from '@/lib/brand/tokens';

// Transforma um PROJETO desenhado à mão num MODELO de fábrica (§10/§18). É o
// caminho inverso da resolução de tokens: onde `resolveBrandColor` leva
// `brand.primary` → hex no render, aqui o hex do desenho volta a ser token, a
// imagem volta a ser placeholder rotulado e o nome da camada vira roteiro.
//
// Existe para o dono do app desenhar os modelos NO PRÓPRIO EDITOR e exportar,
// sem retrabalho manual no JSON. As três conversões:
//
// 1. IMAGEM → PLACEHOLDER. O assetId aponta para o IndexedDB de quem desenhou —
//    na máquina de qualquer outra pessoa seria uma imagem quebrada, não um
//    espaço a preencher.
// 2. COR → TOKEN. Cor que bate com o brand kit ativo vira `brand.<id>`; fonte
//    que bate com os papéis do kit vira `brand.display`/`brand.body`. É o que
//    faz o modelo nascer com as cores e fontes da marca de quem o aplicar.
// 3. NOME DA CAMADA → ROTEIRO. O modo guiado precisa de `guide` para perguntar.
//    A convenção está em NOME_PARA_GUIA abaixo — é o contrato de nomenclatura
//    que quem desenha o modelo precisa seguir.

// ─── 3. roteiro por convenção de nome ───────────────────────────────────────

const HINT_TITULO = 'Frases curtas funcionam melhor — até 5 palavras';
const HINT_BOTAO = 'Duas ou três palavras, como "Comprar agora"';
const HINT_FOTO = 'Quanto maior a foto, melhor: foto pequena sai borrada no anúncio';

type Regra = {
  /** Termo procurado no nome da camada (sem acento, minúsculo). */
  contem: string;
  guide: Omit<GuideSlot, 'order'>;
};

/** A CONVENÇÃO: nomeie a camada com um destes termos e ela vira pergunta.
 *  Camada de texto sem termo reconhecido (ex.: "Estrelas", "Aspas") fica sem
 *  roteiro — é decoração do modelo, não resposta da pessoa. A ordem das regras
 *  importa: a primeira que casar vence.
 *
 *  Exportada para o contrato (convencao.test.ts), que cobra a sincronia com a
 *  tabela da SPEC §18 e com o enum GuideRole. */
export const TEXTO_PARA_GUIA: Regra[] = [
  // "subtitulo" ANTES de "titulo": "Subtítulo".includes('titulo') é verdadeiro,
  // e a primeira regra que casar vence. Termo mais específico vem primeiro.
  { contem: 'subtitulo', guide: { role: 'subtitulo', question: 'Quer acrescentar um texto de apoio?', optional: true } },
  { contem: 'depoimento', guide: { role: 'titulo', question: 'O que o cliente disse?', hint: 'Cole o depoimento como ele foi escrito' } },
  { contem: 'titulo', guide: { role: 'titulo', question: 'Qual é a frase principal do anúncio?', hint: HINT_TITULO } },
  { contem: 'chamada', guide: { role: 'titulo', question: 'Qual é a frase principal do anúncio?', hint: HINT_TITULO } },
  { contem: 'mensagem', guide: { role: 'titulo', question: 'Qual é a frase principal do anúncio?', hint: HINT_TITULO } },
  { contem: 'botao', guide: { role: 'botao', question: 'O que escrever no botão?', hint: HINT_BOTAO } },
  { contem: 'cta', guide: { role: 'botao', question: 'O que escrever no botão?', hint: HINT_BOTAO } },
  // preco/selo viraram papéis próprios em 2026-08-13 (o "Oferta e preço"
  // desenhado à mão os usa); a inferência acompanha.
  { contem: 'preco', guide: { role: 'preco', question: 'Qual é o preço?', hint: 'Só o valor, como R$ 99' } },
  { contem: 'selo', guide: { role: 'selo', question: 'O que escrever no selo?', hint: 'Por exemplo: 40% OFF', optional: true } },
  { contem: 'etiqueta', guide: { role: 'selo', question: 'O que escrever na etiqueta?', hint: 'Por exemplo: 40% OFF', optional: true } },
  // nome/cargo viraram papéis próprios em 2026-08-13 (preparação do
  // "Depoimento" desenhado à mão), como preco/selo.
  { contem: 'cargo', guide: { role: 'cargo', question: 'E o cargo ou a empresa dessa pessoa?', optional: true } },
  { contem: 'empresa', guide: { role: 'cargo', question: 'E o cargo ou a empresa dessa pessoa?', optional: true } },
  { contem: 'nome', guide: { role: 'nome', question: 'Qual é o nome de quem falou?' } },
  { contem: 'apoio', guide: { role: 'subtitulo', question: 'Quer acrescentar um texto de apoio?', optional: true } },
  { contem: 'detalhe', guide: { role: 'subtitulo', question: 'Quer acrescentar um texto de apoio?', optional: true } },
  { contem: 'legenda', guide: { role: 'subtitulo', question: 'Quer acrescentar um texto de apoio?', optional: true } },
  { contem: 'condicao', guide: { role: 'subtitulo', question: 'Quer acrescentar a condição de pagamento?', hint: 'Por exemplo: em 3x sem juros', optional: true } },
];

export const IMAGEM_PARA_GUIA: Regra[] = [
  { contem: 'logo', guide: { role: 'logo', question: 'Quer colocar a sua logo?', hint: 'Dá para pular — o anúncio funciona sem ela', optional: true } },
  { contem: 'antes', guide: { role: 'foto-principal', question: 'Qual é a foto do ANTES?', hint: HINT_FOTO } },
  { contem: 'depois', guide: { role: 'foto-secundaria', question: 'E a foto do DEPOIS?', hint: HINT_FOTO } },
  { contem: 'pessoa', guide: { role: 'foto-principal', question: 'Tem uma foto da pessoa?', hint: 'Um retrato de rosto funciona melhor' } },
  { contem: 'produto', guide: { role: 'foto-principal', question: 'Qual é a foto do produto?', hint: HINT_FOTO } },
  { contem: 'foto', guide: { role: 'foto-principal', question: 'Qual é a foto principal?', hint: HINT_FOTO } },
  { contem: 'imagem', guide: { role: 'foto-principal', question: 'Qual é a foto principal?', hint: HINT_FOTO } },
];

function semAcento(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function casar(nome: string, regras: Regra[]): Omit<GuideSlot, 'order'> | null {
  const alvo = semAcento(nome);
  for (const r of regras) if (alvo.includes(r.contem)) return { ...r.guide };
  return null;
}

/** Prioridade de ordenação dentro do passo de textos: título antes de apoio,
 *  botão por último — a ordem das perguntas segue a hierarquia do anúncio, não a
 *  posição vertical (o preço num selo fica no topo mas não é a primeira coisa a
 *  perguntar). Empate resolve por posição (y, x).
 *
 *  Record EXAUSTIVO de propósito: papel de texto novo sem prioridade não
 *  compila — sem isso a comparação viraria NaN e a hierarquia degradaria
 *  silenciosamente para posição (aconteceu com preco/selo). */
const PRIORIDADE_TEXTO: Record<GuideTextRole, number> = {
  titulo: 0,
  preco: 1,
  subtitulo: 2,
  selo: 3,
  nome: 4,
  cargo: 5,
  botao: 6,
};

/**
 * Atribui `guide` às camadas do layout BASE pela convenção de nome. Invariantes
 * do contrato dos modelos (templates.test.ts) garantidas aqui:
 * - no máximo UMA foto-principal e UMA logo (excedentes viram foto-secundaria /
 *   perdem o roteiro);
 * - `order` único dentro de cada passo.
 *
 * Camada que JÁ TEM `guide` é intocável. É o que faz o ciclo aplicar → ajustar →
 * re-exportar preservar as perguntas escritas à mão do modelo original — sem
 * isso, cada re-export trocaria o roteiro autoral pelos textos inferidos. A
 * inferência só preenche o que chegou sem roteiro, continuando a numeração de
 * onde o existente parou.
 */
export function inferGuides(layers: Layer[]): void {
  const fotos: { layer: Layer; guide: Omit<GuideSlot, 'order'>; y: number; x: number }[] = [];
  const textos: typeof fotos = [];

  // O que já existe manda: define o ponto de partida das ordens e trava os
  // papéis únicos (logo, foto-principal) que não podem se repetir.
  let logoVista = false;
  let principalVista = false;
  let ordemFoto = 0;
  let ordemTexto = 0;
  for (const layer of layers) {
    const g = layer.guide;
    if (!g) continue;
    if (g.role === 'logo') logoVista = true;
    else if (g.role === 'foto-principal') {
      principalVista = true;
      ordemFoto = Math.max(ordemFoto, g.order);
    } else if (g.role === 'foto-secundaria') ordemFoto = Math.max(ordemFoto, g.order);
    else ordemTexto = Math.max(ordemTexto, g.order);
  }

  for (const layer of layers) {
    if (layer.guide) continue; // roteiro autoral é intocável
    if (layer.type === 'image') {
      // Nome E rótulo juntos: imagem inserida no editor nasce com name "Imagem"
      // e o significado no placeholder.label (o nome do arquivo). Se só o nome
      // fosse consultado, o genérico "imagem" venceria o "Logo" do rótulo — a
      // ordem das regras (logo antes de foto) decide sobre o texto combinado.
      const guide = casar(`${layer.name} ${layer.placeholder.label}`, IMAGEM_PARA_GUIA);
      if (!guide) continue;
      if (guide.role === 'logo') {
        if (logoVista) continue; // segunda logo fica sem roteiro
        logoVista = true;
        layer.guide = { ...guide, order: 1 };
        continue;
      }
      fotos.push({ layer, guide, y: layer.frame.y, x: layer.frame.x });
    } else if (layer.type === 'text') {
      const guide = casar(layer.name, TEXTO_PARA_GUIA);
      if (guide) textos.push({ layer, guide, y: layer.frame.y, x: layer.frame.x });
    }
  }

  // Fotos: ANTES/DEPOIS já vêm com papel; as demais ordenam por posição e só a
  // primeira é a principal — e só se nenhuma principal existia antes.
  fotos.sort((a, b) => {
    const papel = (r: string) => (r === 'foto-principal' ? 0 : 1);
    return papel(a.guide.role) - papel(b.guide.role) || a.y - b.y || a.x - b.x;
  });
  fotos.forEach((f, i) => {
    const role = i === 0 && !principalVista ? f.guide.role : 'foto-secundaria';
    f.layer.guide = { ...f.guide, role, order: ordemFoto + i + 1 };
  });

  textos.sort(
    (a, b) =>
      PRIORIDADE_TEXTO[a.guide.role as GuideTextRole] -
        PRIORIDADE_TEXTO[b.guide.role as GuideTextRole] ||
      a.y - b.y ||
      a.x - b.x,
  );
  textos.forEach((t, i) => {
    t.layer.guide = { ...t.guide, order: ordemTexto + i + 1 };
  });
}

// ─── 1. imagem → placeholder · 2. cor/fonte → token ─────────────────────────

function tokenizeFill(fill: Fill, porHex: Map<string, string>): void {
  if (fill.kind === 'solid') {
    const token = porHex.get(fill.color.toLowerCase());
    if (token) fill.color = token;
    return;
  }
  for (const stop of fill.stops) {
    const token = porHex.get(stop.color.toLowerCase());
    if (token) stop.color = token;
  }
}

function templatizeLayer(layer: Layer, kit: BrandKit | null, porHex: Map<string, string>): void {
  if (layer.type === 'image') {
    // O asset é do IndexedDB de quem desenhou — em qualquer outra máquina seria
    // imagem quebrada. Vira placeholder rotulado; o rótulo herda o nome da
    // camada quando quem desenhou não escreveu um.
    layer.assetId = null;
    if (!layer.placeholder.label.trim()) layer.placeholder.label = layer.name;
    layer.crop = undefined; // px da imagem original, que não existe mais
    layer.focalPoint = { x: 0.5, y: 0.5 };
    layer.adjust = { brightness: 0, contrast: 0, saturation: 0, blur: 0 };
  }

  if (layer.type === 'text') {
    tokenizeFill(layer.fill, porHex);
    if (layer.highlight) tokenizeFill(layer.highlight.fill, porHex);
    if (kit) {
      for (const font of kit.fonts) {
        if (layer.fontFamily === font.family) {
          layer.fontFamily = font.role === 'display' ? FONT_DISPLAY_TOKEN : FONT_BODY_TOKEN;
          break;
        }
      }
    }
  }

  if (layer.type === 'shape') tokenizeFill(layer.fill, porHex);

  if (layer.type === 'group') {
    for (const child of layer.children) templatizeLayer(child, kit, porHex);
  }
}

/**
 * O projeto pronto para virar arquivo de modelo. NÃO muda o projeto aberto:
 * trabalha numa cópia.
 *
 * Os três layouts são preservados — inclusive `overriddenIn`. Quem desenha só o
 * 4:5 exporta derivados que o motor regenera ao aplicar; quem ajustou o 9:16 na
 * mão exporta o ajuste junto.
 */
export function templatizeProject(
  project: Project,
  kit: BrandKit | null,
): Record<FormatId, Layout> {
  const layouts = structuredClone(project.layouts);

  const porHex = new Map<string, string>();
  for (const cor of kit?.colors ?? []) {
    porHex.set(cor.hex.toLowerCase(), `${COLOR_TOKEN_PREFIX}${cor.id}`);
  }

  for (const layout of Object.values(layouts)) {
    tokenizeFill(layout.background, porHex);
    for (const layer of layout.layers) templatizeLayer(layer, kit, porHex);
  }

  // O roteiro é inferido no layout BASE (é dele que o modo guiado deriva as
  // telas) e copiado para as outras cópias da camada PELO ID. Sem essa cópia, o
  // roteiro divergiria entre formatos — e quem consome o guide (fluxo guiado,
  // curadoria do checklist) trataria a mesma camada de dois jeitos.
  inferGuides(layouts[project.baseFormat].layers);

  const guidePorId = new Map<string, GuideSlot>();
  for (const layer of layouts[project.baseFormat].layers) {
    if (layer.guide) guidePorId.set(layer.id, layer.guide);
  }
  for (const [formatId, layout] of Object.entries(layouts) as [FormatId, Layout][]) {
    if (formatId === project.baseFormat) continue;
    for (const layer of layout.layers) {
      const guide = guidePorId.get(layer.id);
      if (guide) layer.guide = structuredClone(guide);
    }
  }

  return layouts;
}
