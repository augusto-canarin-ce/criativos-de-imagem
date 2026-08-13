#!/usr/bin/env node
// Gera os modelos DE FÁBRICA em /public/templates (SPEC §10).
//
// Só o layout 4:5 (base) é descrito: ao aplicar, o motor da Fase 2
// (propagateProject) deriva 1:1 e 9:16 sozinho — mesmo caminho de qualquer
// projeto, sem layout duplicado no arquivo.
//
// Toda cor é TOKEN de marca (brand.*) e toda imagem é PLACEHOLDER ROTULADO: é a
// definição de modelo da §8. Rode com `node scripts/gen-templates.mjs`.
//
// ROTEIRO DO MODO GUIADO (§18): as camadas que viram pergunta carregam `guide`
// — papel, pergunta em português claro, ordem e se dá para pular. Camada sem
// `guide` não vira pergunta, e é por isso que rótulos fixos ("LANÇAMENTO",
// "AVISO", as aspas do depoimento) ficam de fora sem lista negra.
//
// Todo modelo tem um espaço de logo OPCIONAL dentro da área segura. Antes só
// dois dos doze tinham, e o passo do logo não teria onde colocar nos outros.

import { writeFileSync, mkdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

const OUT = new URL('../public/templates/', import.meta.url);

const base = (name, frame, anchor = 'top', guide) => ({
  id: randomUUID(),
  name,
  visible: true,
  locked: false,
  opacity: 1,
  rotation: 0,
  blendMode: 'normal',
  frame,
  anchor: { v: anchor },
  overriddenIn: [],
  effects: {},
  ...(guide ? { guide } : {}),
});

const text = (name, content, frame, opts = {}) => ({
  ...base(name, frame, opts.anchor ?? 'top', opts.guide),
  type: 'text',
  content,
  fontFamily: opts.font ?? 'brand.display',
  fontWeight: opts.weight ?? 800,
  fontSize: opts.size ?? 96,
  lineHeight: opts.lineHeight ?? 1.05,
  letterSpacing: opts.tracking ?? 0,
  align: opts.align ?? 'center',
  vAlign: 'top',
  transform: opts.upper ? 'uppercase' : 'none',
  underline: false,
  bullet: false,
  fill: { kind: 'solid', color: opts.color ?? 'brand.ink' },
  ...(opts.highlight
    ? { highlight: { fill: { kind: 'solid', color: opts.highlight }, padH: 20, padV: 10, radius: 10 } }
    : {}),
  autoFit: { enabled: opts.autoFit ?? false, min: 28, max: opts.size ?? 96 },
});

const rect = (name, frame, color, opts = {}) => ({
  ...base(name, frame, opts.anchor ?? 'top', opts.guide),
  type: 'shape',
  shape: 'rect',
  fill: { kind: 'solid', color },
  radius: opts.radius ?? 16,
  ...(opts.blend ? { blendMode: opts.blend } : {}),
});

const photo = (name, label, frame, opts = {}) => ({
  ...base(name, frame, opts.anchor ?? 'stretch', opts.guide),
  type: 'image',
  assetId: null,
  placeholder: { label },
  fit: opts.fit ?? 'cover',
  focalPoint: { x: 0.5, y: 0.5 },
  adjust: { brightness: 0, contrast: 0, saturation: 0, blur: 0 },
  ...(opts.mask ? { mask: opts.mask } : {}),
});

const veil = (name, frame, color, opacity) => ({
  ...rect(name, frame, color, { radius: 0, anchor: 'stretch' }),
  opacity,
});

/** Espaço de logo padrão: pequeno, dentro da área segura, e sempre pulável.
 *  Pular no fluxo REMOVE a camada — placeholder vazio vira aviso no checklist e
 *  quadro tracejado no anúncio publicado. */
const logoSlot = (frame, anchor = 'top') =>
  photo('Logo', 'Logo da marca', frame, {
    anchor,
    fit: 'contain',
    guide: {
      role: 'logo',
      question: 'Quer colocar a sua logo?',
      hint: 'Dá para pular — o anúncio funciona sem ela',
      order: 1,
      optional: true,
    },
  });

/** Atalhos de pergunta que se repetem, para o texto ficar igual entre modelos.
 *  A dica aparece como frase abaixo da pergunta, em corpo grande — começar em
 *  minúscula fica desleixado. Maiúscula garantida aqui, não na revisão. */
const maiuscula = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const g = (role, question, order, extra = {}) => ({
  role,
  question,
  order,
  ...extra,
  ...(extra.hint ? { hint: maiuscula(extra.hint) } : {}),
});
const HINT_TITULO = 'frases curtas funcionam melhor — até 5 palavras';
const HINT_BOTAO = 'duas ou três palavras, como "Comprar agora"';
const HINT_FOTO = 'quanto maior a foto, melhor: foto pequena sai borrada no anúncio';

const FULL = { x: 0, y: 0, w: 1080, h: 1350 };

/** Cada modelo: só o 4:5; os outros formatos derivam ao aplicar. */
const TEMPLATES = [
  // ───────────────────────── promoção ─────────────────────────
  {
    name: 'Oferta em destaque',
    layers: [
      photo('Foto do produto', 'Foto do produto', FULL, {
        guide: g('foto-principal', 'Qual é a foto do produto?', 1, { hint: HINT_FOTO }),
      }),
      veil('Sombreado', { x: 0, y: 620, w: 1080, h: 730 }, 'brand.secondary', 0.72),
      text('Chamada', 'OFERTA\nDA SEMANA', { x: 80, y: 700, w: 920, h: 240 }, {
        size: 110, upper: true, color: 'brand.surface', autoFit: true,
        guide: g('titulo', 'Qual é a frase principal do anúncio?', 1, { hint: HINT_TITULO }),
      }),
      text('Detalhe', 'até 40% OFF em toda a linha', { x: 80, y: 960, w: 920, h: 70 }, {
        font: 'brand.body', weight: 600, size: 44, color: 'brand.surface',
        guide: g('subtitulo', 'Quer explicar a oferta em uma linha?', 2, {
          hint: 'por exemplo: até 40% de desconto', optional: true,
        }),
      }),
      rect('Botão', { x: 290, y: 1080, w: 500, h: 120 }, 'brand.primary', { radius: 60 }),
      text('CTA', 'Comprar agora', { x: 290, y: 1116, w: 500, h: 60 }, {
        font: 'brand.body', weight: 700, size: 42, color: 'brand.surface',
        guide: g('botao', 'O que escrever no botão?', 3, { hint: HINT_BOTAO }),
      }),
      logoSlot({ x: 80, y: 100, w: 220, h: 80 }),
    ],
  },
  {
    name: 'Preço em selo',
    layers: [
      photo('Foto do produto', 'Foto do produto', FULL, {
        guide: g('foto-principal', 'Qual é a foto do produto?', 1, { hint: HINT_FOTO }),
      }),
      rect('Selo', { x: 620, y: 160, w: 340, h: 340 }, 'brand.accent', { radius: 170 }),
      text('Preço', 'R$ 99', { x: 620, y: 280, w: 340, h: 100 }, {
        size: 92, color: 'brand.secondary', autoFit: true,
        guide: g('subtitulo', 'Qual é o preço?', 2, { hint: 'só o valor, como R$ 99' }),
      }),
      veil('Faixa', { x: 0, y: 1010, w: 1080, h: 340 }, 'brand.secondary', 0.85),
      text('Produto', 'Nome do produto aqui', { x: 80, y: 1070, w: 920, h: 120 }, {
        size: 72, color: 'brand.surface', autoFit: true,
        guide: g('titulo', 'Qual é o nome do produto?', 1, { hint: HINT_TITULO }),
      }),
      text('Condição', 'ou 3x sem juros · frete grátis', { x: 80, y: 1210, w: 920, h: 60 }, {
        font: 'brand.body', weight: 500, size: 36, color: 'brand.surface',
        guide: g('subtitulo', 'Quer acrescentar a condição de pagamento?', 3, {
          hint: 'por exemplo: em 3x sem juros', optional: true,
        }),
      }),
      logoSlot({ x: 80, y: 100, w: 220, h: 80 }),
    ],
  },
  {
    name: 'Cupom',
    layers: [
      rect('Fundo', FULL, 'brand.primary', { radius: 0, anchor: 'stretch' }),
      text('Rótulo', 'CUPOM EXCLUSIVO', { x: 80, y: 200, w: 920, h: 60 }, {
        font: 'brand.body', weight: 700, size: 38, upper: true, tracking: 6, color: 'brand.surface',
      }),
      text('Código', 'PRIMEIRA10', { x: 80, y: 320, w: 920, h: 180 }, {
        size: 130, upper: true, color: 'brand.surface', autoFit: true,
        guide: g('titulo', 'Qual é o código do cupom?', 1, { hint: 'sem espaços, como PRIMEIRA10' }),
      }),
      photo('Foto do produto', 'Foto do produto', { x: 190, y: 560, w: 700, h: 520 }, {
        anchor: 'center', mask: { shape: 'rect', radius: 32 },
        guide: g('foto-principal', 'Qual é a foto do produto?', 1, { hint: HINT_FOTO }),
      }),
      text('Regra', 'válido até domingo no site', { x: 80, y: 1140, w: 920, h: 60 }, {
        font: 'brand.body', weight: 500, size: 38, color: 'brand.surface', anchor: 'bottom',
        guide: g('subtitulo', 'Até quando o cupom vale?', 2, {
          hint: 'por exemplo: válido até domingo', optional: true,
        }),
      }),
      logoSlot({ x: 80, y: 90, w: 220, h: 80 }),
    ],
  },

  // ──────────────────────── lançamento ────────────────────────
  {
    name: 'Chegou',
    layers: [
      photo('Foto do lançamento', 'Foto do lançamento', FULL, {
        guide: g('foto-principal', 'Qual é a foto do lançamento?', 1, { hint: HINT_FOTO }),
      }),
      veil('Sombreado', FULL, 'brand.secondary', 0.45),
      text('Rótulo', 'LANÇAMENTO', { x: 80, y: 200, w: 920, h: 60 }, {
        font: 'brand.body', weight: 700, size: 36, upper: true, tracking: 8,
        color: 'brand.surface',
      }),
      text('Nome', 'O novo\nqueridinho', { x: 80, y: 300, w: 920, h: 300 }, {
        size: 120, color: 'brand.surface', autoFit: true,
        guide: g('titulo', 'Qual é o nome do que está chegando?', 1, { hint: HINT_TITULO }),
      }),
      rect('Botão', { x: 290, y: 1090, w: 500, h: 120 }, 'brand.accent', { radius: 16 }),
      text('CTA', 'Conhecer', { x: 290, y: 1126, w: 500, h: 60 }, {
        font: 'brand.body', weight: 700, size: 42, color: 'brand.secondary',
        guide: g('botao', 'O que escrever no botão?', 2, { hint: HINT_BOTAO }),
      }),
      logoSlot({ x: 80, y: 90, w: 220, h: 80 }),
    ],
  },
  {
    name: 'Contagem regressiva',
    layers: [
      rect('Fundo', FULL, 'brand.secondary', { radius: 0, anchor: 'stretch' }),
      text('Data', '12.09', { x: 80, y: 180, w: 920, h: 200 }, {
        size: 150, color: 'brand.primary', autoFit: true,
        guide: g('titulo', 'Qual é a data?', 1, { hint: 'dia e mês, como 12.09' }),
      }),
      text('Rótulo', 'marque na agenda', { x: 80, y: 400, w: 920, h: 60 }, {
        font: 'brand.body', weight: 500, size: 40, color: 'brand.surface',
        guide: g('subtitulo', 'Quer acrescentar uma chamada curta?', 2, {
          hint: 'por exemplo: marque na agenda', optional: true,
        }),
      }),
      photo('Prévia do produto', 'Prévia do produto', { x: 140, y: 520, w: 800, h: 600 }, {
        anchor: 'center', mask: { shape: 'rect', radius: 24 },
        guide: g('foto-principal', 'Qual é a foto do que vem aí?', 1, { hint: HINT_FOTO }),
      }),
      text('Chamada', 'algo novo está chegando', { x: 80, y: 1180, w: 920, h: 80 }, {
        weight: 700, size: 52, color: 'brand.surface', anchor: 'bottom', autoFit: true,
        guide: g('subtitulo', 'Qual é a frase de baixo?', 3, { optional: true }),
      }),
      logoSlot({ x: 80, y: 85, w: 200, h: 70 }),
    ],
  },

  // ─────────────────────── prova social ───────────────────────
  {
    name: 'Depoimento',
    layers: [
      rect('Fundo', FULL, 'brand.surface', { radius: 0, anchor: 'stretch' }),
      text('Aspas', '“', { x: 80, y: 140, w: 200, h: 200 }, {
        size: 200, align: 'left', color: 'brand.primary',
      }),
      text('Depoimento', 'Mudou completamente a forma como a gente trabalha.',
        { x: 80, y: 320, w: 920, h: 400 }, {
          size: 72, align: 'left', color: 'brand.ink', autoFit: true,
          guide: g('titulo', 'O que o cliente disse?', 1, {
            hint: 'cole o depoimento como ele foi escrito',
          }),
        }),
      photo('Foto da pessoa', 'Foto da pessoa', { x: 80, y: 800, w: 180, h: 180 }, {
        anchor: 'center', mask: { shape: 'ellipse' },
        guide: g('foto-principal', 'Tem uma foto da pessoa?', 1, {
          hint: 'um retrato de rosto funciona melhor no círculo',
        }),
      }),
      text('Nome', 'Nome da pessoa\ncargo, empresa', { x: 300, y: 830, w: 700, h: 130 }, {
        font: 'brand.body', weight: 600, size: 40, align: 'left', lineHeight: 1.3, color: 'brand.ink',
        guide: g('subtitulo', 'Quem falou?', 2, { hint: 'nome na primeira linha, cargo na segunda' }),
      }),
      rect('Barra', { x: 80, y: 1180, w: 920, h: 10 }, 'brand.primary', { radius: 5, anchor: 'bottom' }),
      logoSlot({ x: 80, y: 1030, w: 200, h: 70 }, 'bottom'),
    ],
  },
  {
    name: 'Print de avaliação',
    layers: [
      rect('Fundo', FULL, 'brand.primary', { radius: 0, anchor: 'stretch' }),
      text('Título', 'o que estão\nfalando', { x: 80, y: 150, w: 920, h: 220 }, {
        size: 92, color: 'brand.surface', autoFit: true,
        guide: g('titulo', 'Qual é a frase de cima?', 1, { hint: HINT_TITULO }),
      }),
      photo('Print do depoimento', 'Print do depoimento', { x: 110, y: 420, w: 860, h: 700 }, {
        anchor: 'center', fit: 'contain', mask: { shape: 'rect', radius: 24 },
        guide: g('foto-principal', 'Qual print você quer mostrar?', 1, {
          hint: 'a captura de tela do comentário ou da avaliação',
        }),
      }),
      text('Rodapé', 'avaliação real de cliente', { x: 80, y: 1190, w: 920, h: 60 }, {
        font: 'brand.body', weight: 500, size: 36, color: 'brand.surface', anchor: 'bottom',
        guide: g('subtitulo', 'Quer acrescentar uma linha embaixo?', 2, { optional: true }),
      }),
      logoSlot({ x: 800, y: 80, w: 200, h: 60 }),
    ],
  },
  {
    name: 'Número que impressiona',
    layers: [
      photo('Foto de fundo', 'Foto de fundo', FULL, {
        guide: g('foto-principal', 'Qual foto vai no fundo?', 1, { hint: HINT_FOTO }),
      }),
      veil('Sombreado', FULL, 'brand.secondary', 0.6),
      text('Número', '+2.000', { x: 80, y: 460, w: 920, h: 220 }, {
        size: 180, color: 'brand.accent', autoFit: true, anchor: 'center',
        guide: g('titulo', 'Qual é o número que impressiona?', 1, {
          hint: 'só o número, como +2.000',
        }),
      }),
      text('Legenda', 'clientes atendidos desde 2019', { x: 80, y: 700, w: 920, h: 120 }, {
        font: 'brand.body', weight: 600, size: 48, color: 'brand.surface', anchor: 'center', autoFit: true,
        guide: g('subtitulo', 'O que esse número significa?', 2, {
          hint: 'por exemplo: clientes atendidos desde 2019',
        }),
      }),
      logoSlot({ x: 430, y: 1150, w: 220, h: 80 }, 'bottom'),
    ],
  },

  // ─────────────────────── institucional ──────────────────────
  {
    name: 'Marca em destaque',
    layers: [
      rect('Fundo', FULL, 'brand.secondary', { radius: 0, anchor: 'stretch' }),
      // Aqui a logo NÃO é opcional: ela é o modelo inteiro. Por isso este modelo
      // não é o representante do objetivo no passo 1 do fluxo guiado — quem entra
      // por lá cai no "Equipe", que tem foto.
      photo('Logo', 'Logo da marca', { x: 240, y: 420, w: 600, h: 300 }, {
        anchor: 'center', fit: 'contain',
        guide: g('logo', 'Qual é a sua logo?', 1),
      }),
      text('Assinatura', 'seu slogan aqui', { x: 80, y: 780, w: 920, h: 80 }, {
        font: 'brand.body', weight: 500, size: 44, color: 'brand.surface', anchor: 'center',
        guide: g('titulo', 'Qual é o seu slogan?', 1, { hint: HINT_TITULO }),
      }),
    ],
  },
  {
    name: 'Equipe',
    layers: [
      rect('Fundo', FULL, 'brand.surface', { radius: 0, anchor: 'stretch' }),
      photo('Foto da equipe', 'Foto da equipe', { x: 0, y: 0, w: 1080, h: 760 }, {
        anchor: 'top',
        guide: g('foto-principal', 'Qual é a foto da equipe?', 1, { hint: HINT_FOTO }),
      }),
      text('Título', 'gente que faz\nacontecer', { x: 80, y: 830, w: 920, h: 200 }, {
        size: 84, align: 'left', color: 'brand.ink', autoFit: true,
        guide: g('titulo', 'Qual é a frase principal?', 1, { hint: HINT_TITULO }),
      }),
      text('Texto', 'conheça quem cuida do seu projeto todos os dias',
        { x: 80, y: 1060, w: 920, h: 140 }, {
          font: 'brand.body', weight: 500, size: 40, align: 'left', lineHeight: 1.4,
          color: 'brand.ink', anchor: 'bottom',
          guide: g('subtitulo', 'Quer explicar em uma linha?', 2, { optional: true }),
        }),
      logoSlot({ x: 80, y: 100, w: 200, h: 70 }),
    ],
  },
  {
    name: 'Aviso',
    layers: [
      rect('Fundo', FULL, 'brand.accent', { radius: 0, anchor: 'stretch' }),
      rect('Cartão', { x: 80, y: 300, w: 920, h: 750 }, 'brand.surface', { radius: 32, anchor: 'center' }),
      text('Rótulo', 'AVISO', { x: 140, y: 380, w: 800, h: 60 }, {
        font: 'brand.body', weight: 700, size: 36, upper: true, tracking: 8,
        color: 'brand.primary', anchor: 'center',
      }),
      text('Mensagem', 'Novo horário de\natendimento', { x: 140, y: 470, w: 800, h: 260 }, {
        size: 88, color: 'brand.ink', anchor: 'center', autoFit: true,
        guide: g('titulo', 'Qual é o aviso?', 1, { hint: HINT_TITULO }),
      }),
      text('Detalhe', 'segunda a sexta, 9h às 18h', { x: 140, y: 800, w: 800, h: 80 }, {
        font: 'brand.body', weight: 600, size: 42, color: 'brand.ink', anchor: 'center',
        guide: g('subtitulo', 'Quer dar mais um detalhe?', 2, { optional: true }),
      }),
      photo('Logo', 'Logo da marca', { x: 390, y: 900, w: 300, h: 110 }, {
        anchor: 'center', fit: 'contain',
        guide: g('logo', 'Quer colocar a sua logo?', 1, {
          hint: 'Dá para pular — o anúncio funciona sem ela',
          optional: true,
        }),
      }),
    ],
  },
];

const emptyLayout = (formatId) => ({
  formatId,
  background: { kind: 'solid', color: 'brand.surface' },
  layers: [],
  detached: false,
});

mkdirSync(OUT, { recursive: true });

// Modelos DESENHADOS À MÃO (§18, 2026-08-12): mantidos como arquivo, NUNCA
// gerados — este script não os escreve, só os inclui no index. Adicionar um
// modelo desenhado = colocar o .json em public/templates e uma entrada aqui.
const HANDMADE = [
  {
    id: 'builtin-antes-e-depois',
    name: 'Antes e Depois',
    file: 'antes-e-depois.json',
  },
  {
    id: 'builtin-produto-em-destaque',
    name: 'Produto em destaque',
    file: 'produto-em-destaque.json',
  },
  {
    id: 'builtin-oferta-e-preco',
    name: 'Oferta e preço',
    file: 'oferta-e-preco.json',
  },
  {
    id: 'builtin-lista-de-beneficios',
    name: 'Motivos para comprar',
    file: 'lista-de-beneficios.json',
  },
];

const index = [];
for (const t of TEMPLATES) {
  const slug = t.name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const template = {
    id: `builtin-${slug}`,
    name: t.name,
    builtin: true,
    schemaVersion: 1,
    createdAt: 0,
    project: {
      name: t.name,
      schemaVersion: 1,
      baseFormat: '4:5',
      assets: [],
      layouts: {
        '4:5': {
          formatId: '4:5',
          background: { kind: 'solid', color: 'brand.surface' },
          layers: t.layers,
          detached: false,
        },
        '1:1': emptyLayout('1:1'),
        '9:16': emptyLayout('9:16'),
      },
    },
  };
  writeFileSync(new URL(`${slug}.json`, OUT), JSON.stringify(template, null, 2));
  index.push({ id: template.id, name: t.name, file: `${slug}.json` });
}

index.push(...HANDMADE);
writeFileSync(new URL('index.json', OUT), JSON.stringify(index, null, 2));
console.log(
  `${index.length - HANDMADE.length} modelos gerados + ${HANDMADE.length} desenhados à mão em public/templates/`,
);
