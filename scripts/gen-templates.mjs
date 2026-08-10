#!/usr/bin/env node
// Gera os modelos DE FÁBRICA em /public/templates (SPEC §10).
//
// Só o layout 4:5 (base) é descrito: ao aplicar, o motor da Fase 2
// (propagateProject) deriva 1:1 e 9:16 sozinho — mesmo caminho de qualquer
// projeto, sem layout duplicado no arquivo.
//
// Toda cor é TOKEN de marca (brand.*) e toda imagem é PLACEHOLDER ROTULADO: é a
// definição de modelo da §8. Rode com `node scripts/gen-templates.mjs`.

import { writeFileSync, mkdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

const OUT = new URL('../public/templates/', import.meta.url);

const base = (name, frame, anchor = 'top') => ({
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
});

const text = (name, content, frame, opts = {}) => ({
  ...base(name, frame, opts.anchor ?? 'top'),
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
  ...base(name, frame, opts.anchor ?? 'top'),
  type: 'shape',
  shape: 'rect',
  fill: { kind: 'solid', color },
  radius: opts.radius ?? 16,
  ...(opts.blend ? { blendMode: opts.blend } : {}),
});

const photo = (name, label, frame, opts = {}) => ({
  ...base(name, frame, opts.anchor ?? 'stretch'),
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

const FULL = { x: 0, y: 0, w: 1080, h: 1350 };

/** Cada modelo: só o 4:5; os outros formatos derivam ao aplicar. */
const TEMPLATES = [
  // ───────────────────────── promoção ─────────────────────────
  {
    name: 'Oferta em destaque',
    category: 'promocao',
    layers: [
      photo('Foto do produto', 'Foto do produto', FULL),
      veil('Sombreado', { x: 0, y: 620, w: 1080, h: 730 }, 'brand.secondary', 0.72),
      text('Chamada', 'OFERTA\nDA SEMANA', { x: 80, y: 700, w: 920, h: 240 }, {
        size: 110, upper: true, color: 'brand.surface', autoFit: true,
      }),
      text('Detalhe', 'até 40% OFF em toda a linha', { x: 80, y: 960, w: 920, h: 70 }, {
        font: 'brand.body', weight: 600, size: 44, color: 'brand.surface',
      }),
      rect('Botão', { x: 290, y: 1080, w: 500, h: 120 }, 'brand.primary', { radius: 60 }),
      text('CTA', 'Comprar agora', { x: 290, y: 1116, w: 500, h: 60 }, {
        font: 'brand.body', weight: 700, size: 42, color: 'brand.surface',
      }),
    ],
  },
  {
    name: 'Preço em selo',
    category: 'promocao',
    layers: [
      photo('Foto do produto', 'Foto do produto', FULL),
      rect('Selo', { x: 620, y: 160, w: 340, h: 340 }, 'brand.accent', { radius: 170 }),
      text('Preço', 'R$ 99', { x: 620, y: 280, w: 340, h: 100 }, {
        size: 92, color: 'brand.secondary', autoFit: true,
      }),
      veil('Faixa', { x: 0, y: 1010, w: 1080, h: 340 }, 'brand.secondary', 0.85),
      text('Produto', 'Nome do produto aqui', { x: 80, y: 1070, w: 920, h: 120 }, {
        size: 72, color: 'brand.surface', autoFit: true,
      }),
      text('Condição', 'ou 3x sem juros · frete grátis', { x: 80, y: 1210, w: 920, h: 60 }, {
        font: 'brand.body', weight: 500, size: 36, color: 'brand.surface',
      }),
    ],
  },
  {
    name: 'Cupom',
    category: 'promocao',
    layers: [
      rect('Fundo', FULL, 'brand.primary', { radius: 0, anchor: 'stretch' }),
      text('Rótulo', 'CUPOM EXCLUSIVO', { x: 80, y: 200, w: 920, h: 60 }, {
        font: 'brand.body', weight: 700, size: 38, upper: true, tracking: 6, color: 'brand.surface',
      }),
      text('Código', 'PRIMEIRA10', { x: 80, y: 320, w: 920, h: 180 }, {
        size: 130, upper: true, color: 'brand.surface', autoFit: true,
      }),
      photo('Foto do produto', 'Foto do produto', { x: 190, y: 560, w: 700, h: 520 }, {
        anchor: 'center', mask: { shape: 'rect', radius: 32 },
      }),
      text('Regra', 'válido até domingo no site', { x: 80, y: 1140, w: 920, h: 60 }, {
        font: 'brand.body', weight: 500, size: 38, color: 'brand.surface', anchor: 'bottom',
      }),
    ],
  },

  // ──────────────────────── lançamento ────────────────────────
  {
    name: 'Chegou',
    category: 'lancamento',
    layers: [
      photo('Foto do lançamento', 'Foto do lançamento', FULL),
      veil('Sombreado', FULL, 'brand.secondary', 0.45),
      text('Rótulo', 'LANÇAMENTO', { x: 80, y: 200, w: 920, h: 60 }, {
        font: 'brand.body', weight: 700, size: 36, upper: true, tracking: 8,
        color: 'brand.surface',
      }),
      text('Nome', 'O novo\nqueridinho', { x: 80, y: 300, w: 920, h: 300 }, {
        size: 120, color: 'brand.surface', autoFit: true,
      }),
      rect('Botão', { x: 290, y: 1090, w: 500, h: 120 }, 'brand.accent', { radius: 16 }),
      text('CTA', 'Conhecer', { x: 290, y: 1126, w: 500, h: 60 }, {
        font: 'brand.body', weight: 700, size: 42, color: 'brand.secondary',
      }),
    ],
  },
  {
    name: 'Contagem regressiva',
    category: 'lancamento',
    layers: [
      rect('Fundo', FULL, 'brand.secondary', { radius: 0, anchor: 'stretch' }),
      text('Data', '12.09', { x: 80, y: 180, w: 920, h: 200 }, {
        size: 150, color: 'brand.primary', autoFit: true,
      }),
      text('Rótulo', 'marque na agenda', { x: 80, y: 400, w: 920, h: 60 }, {
        font: 'brand.body', weight: 500, size: 40, color: 'brand.surface',
      }),
      photo('Prévia do produto', 'Prévia do produto', { x: 140, y: 520, w: 800, h: 600 }, {
        anchor: 'center', mask: { shape: 'rect', radius: 24 },
      }),
      text('Chamada', 'algo novo está chegando', { x: 80, y: 1180, w: 920, h: 80 }, {
        weight: 700, size: 52, color: 'brand.surface', anchor: 'bottom', autoFit: true,
      }),
    ],
  },
  {
    name: 'Antes e depois',
    category: 'lancamento',
    layers: [
      rect('Fundo', FULL, 'brand.surface', { radius: 0, anchor: 'stretch' }),
      photo('Antes', 'Foto ANTES', { x: 60, y: 300, w: 460, h: 620 }, {
        anchor: 'center', mask: { shape: 'rect', radius: 20 },
      }),
      photo('Depois', 'Foto DEPOIS', { x: 560, y: 300, w: 460, h: 620 }, {
        anchor: 'center', mask: { shape: 'rect', radius: 20 },
      }),
      text('Título', 'A diferença que\nvocê vê', { x: 80, y: 120, w: 920, h: 160 }, {
        size: 78, color: 'brand.ink', autoFit: true,
      }),
      text('Legenda', 'resultado em 30 dias de uso', { x: 80, y: 980, w: 920, h: 60 }, {
        font: 'brand.body', weight: 500, size: 38, color: 'brand.ink', anchor: 'bottom',
      }),
    ],
  },

  // ─────────────────────── prova social ───────────────────────
  {
    name: 'Depoimento',
    category: 'prova-social',
    layers: [
      rect('Fundo', FULL, 'brand.surface', { radius: 0, anchor: 'stretch' }),
      text('Aspas', '“', { x: 80, y: 140, w: 200, h: 200 }, {
        size: 200, align: 'left', color: 'brand.primary',
      }),
      text('Depoimento', 'Mudou completamente a forma como a gente trabalha.',
        { x: 80, y: 320, w: 920, h: 400 }, { size: 72, align: 'left', color: 'brand.ink', autoFit: true }),
      photo('Foto da pessoa', 'Foto da pessoa', { x: 80, y: 800, w: 180, h: 180 }, {
        anchor: 'center', mask: { shape: 'ellipse' },
      }),
      text('Nome', 'Nome da pessoa\ncargo, empresa', { x: 300, y: 830, w: 700, h: 130 }, {
        font: 'brand.body', weight: 600, size: 40, align: 'left', lineHeight: 1.3, color: 'brand.ink',
      }),
      rect('Barra', { x: 80, y: 1180, w: 920, h: 10 }, 'brand.primary', { radius: 5, anchor: 'bottom' }),
    ],
  },
  {
    name: 'Print de avaliação',
    category: 'prova-social',
    layers: [
      rect('Fundo', FULL, 'brand.primary', { radius: 0, anchor: 'stretch' }),
      text('Título', 'o que estão\nfalando', { x: 80, y: 150, w: 920, h: 220 }, {
        size: 92, color: 'brand.surface', autoFit: true,
      }),
      photo('Print do depoimento', 'Print do depoimento', { x: 110, y: 420, w: 860, h: 700 }, {
        anchor: 'center', fit: 'contain', mask: { shape: 'rect', radius: 24 },
      }),
      text('Rodapé', 'avaliação real de cliente', { x: 80, y: 1190, w: 920, h: 60 }, {
        font: 'brand.body', weight: 500, size: 36, color: 'brand.surface', anchor: 'bottom',
      }),
    ],
  },
  {
    name: 'Número que impressiona',
    category: 'prova-social',
    layers: [
      photo('Foto de fundo', 'Foto de fundo', FULL),
      veil('Sombreado', FULL, 'brand.secondary', 0.6),
      text('Número', '+2.000', { x: 80, y: 460, w: 920, h: 220 }, {
        size: 180, color: 'brand.accent', autoFit: true, anchor: 'center',
      }),
      text('Legenda', 'clientes atendidos desde 2019', { x: 80, y: 700, w: 920, h: 120 }, {
        font: 'brand.body', weight: 600, size: 48, color: 'brand.surface', anchor: 'center', autoFit: true,
      }),
    ],
  },

  // ─────────────────────── institucional ──────────────────────
  {
    name: 'Marca em destaque',
    category: 'institucional',
    layers: [
      rect('Fundo', FULL, 'brand.secondary', { radius: 0, anchor: 'stretch' }),
      photo('Logo', 'Logo da marca', { x: 240, y: 420, w: 600, h: 300 }, {
        anchor: 'center', fit: 'contain',
      }),
      text('Assinatura', 'seu slogan aqui', { x: 80, y: 780, w: 920, h: 80 }, {
        font: 'brand.body', weight: 500, size: 44, color: 'brand.surface', anchor: 'center',
      }),
    ],
  },
  {
    name: 'Equipe',
    category: 'institucional',
    layers: [
      rect('Fundo', FULL, 'brand.surface', { radius: 0, anchor: 'stretch' }),
      photo('Foto da equipe', 'Foto da equipe', { x: 0, y: 0, w: 1080, h: 760 }, { anchor: 'top' }),
      text('Título', 'gente que faz\nacontecer', { x: 80, y: 830, w: 920, h: 200 }, {
        size: 84, align: 'left', color: 'brand.ink', autoFit: true,
      }),
      text('Texto', 'conheça quem cuida do seu projeto todos os dias',
        { x: 80, y: 1060, w: 920, h: 140 }, {
          font: 'brand.body', weight: 500, size: 40, align: 'left', lineHeight: 1.4,
          color: 'brand.ink', anchor: 'bottom',
        }),
    ],
  },
  {
    name: 'Aviso',
    category: 'institucional',
    layers: [
      rect('Fundo', FULL, 'brand.accent', { radius: 0, anchor: 'stretch' }),
      rect('Cartão', { x: 80, y: 300, w: 920, h: 750 }, 'brand.surface', { radius: 32, anchor: 'center' }),
      text('Rótulo', 'AVISO', { x: 140, y: 380, w: 800, h: 60 }, {
        font: 'brand.body', weight: 700, size: 36, upper: true, tracking: 8,
        color: 'brand.primary', anchor: 'center',
      }),
      text('Mensagem', 'Novo horário de\natendimento', { x: 140, y: 470, w: 800, h: 260 }, {
        size: 88, color: 'brand.ink', anchor: 'center', autoFit: true,
      }),
      text('Detalhe', 'segunda a sexta, 9h às 18h', { x: 140, y: 800, w: 800, h: 80 }, {
        font: 'brand.body', weight: 600, size: 42, color: 'brand.ink', anchor: 'center',
      }),
      photo('Logo', 'Logo da marca', { x: 390, y: 900, w: 300, h: 110 }, {
        anchor: 'center', fit: 'contain',
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
    category: t.category,
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
  index.push({ id: template.id, name: t.name, category: t.category, file: `${slug}.json` });
}

writeFileSync(new URL('index.json', OUT), JSON.stringify(index, null, 2));
console.log(`${index.length} modelos de fábrica gerados em public/templates/`);
