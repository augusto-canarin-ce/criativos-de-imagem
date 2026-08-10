import type { Layout } from '@/lib/model/types';
import { createLayout } from '@/lib/model/factory';
import {
  createTextLayer,
  createRectLayer,
  createEllipseLayer,
  createLineLayer,
  createImageLayer,
  createImageElementLayer,
} from '@/lib/model/layers';
import { seedImage } from '@/lib/render/imageCache';

// Projetos-fixture da regressão visual (§16). Cobrem os bugs que NÃO quebram nada:
// fonte substituída, filtro sem re-cache, gradiente recalculado errado — só a
// comparação de pixel os pega. Máscara e fonte enviada pelo usuário entram quando
// as features chegarem (Fases 4/5) — registrado no PROGRESS.
//
// Determinismo: nada de Date/random; a imagem raster é DESENHADA aqui (canvas →
// injetada no imageCache), então não há binário de origem nem decodificação.

export const FIXTURE_ASSET_ID = 'fx-imagem-1';

/** Canvas com conteúdo determinístico servindo de "foto": gradiente + círculo. */
function makeFixtureImage(): HTMLImageElement {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createLinearGradient(0, 0, 800, 600);
  grad.addColorStop(0, '#0e7490');
  grad.addColorStop(1, '#3b0764');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 800, 600);
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(250, 220, 120, 0, Math.PI * 2);
  ctx.fill();
  // O Konva aceita canvas como fonte de imagem; o ImageShape lê naturalWidth/Height.
  const image = canvas as unknown as HTMLImageElement;
  Object.defineProperty(image, 'naturalWidth', { value: 800 });
  Object.defineProperty(image, 'naturalHeight', { value: 600 });
  return image;
}

export function seedFixtureAssets(): void {
  seedImage(FIXTURE_ASSET_ID, makeFixtureImage());
}

// Fonte dos fixtures: genérica de sistema para reduzir variação entre máquinas.
// (Referências são geradas na mesma plataforma; ver nota no PROGRESS.)
const FIXTURE_FONT = 'Arial';

/** Texto com gradiente + contorno + sombra + marca-texto — as armadilhas da §8. */
export function fixtureTextoEstilizado(): Layout {
  const layout = createLayout('4:5');
  layout.background = { kind: 'solid', color: '#f5f0e8' };

  const title = createTextLayer('4:5', 'PROMOÇÃO\nRELÂMPAGO');
  title.fontFamily = FIXTURE_FONT;
  title.fontSize = 110;
  title.frame = { x: 60, y: 200, w: 960, h: 320 };
  title.fill = {
    kind: 'linear',
    stops: [
      { offset: 0, color: '#dc2626' },
      { offset: 1, color: '#7c2d12' },
    ],
    angle: 180,
  };
  title.effects.stroke = { width: 4, color: '#111111', position: 'center' };
  title.effects.shadow = { x: 0, y: 10, blur: 20, color: '#000000', opacity: 0.4 };

  const sub = createTextLayer('4:5', 'só hoje, frete grátis');
  sub.fontFamily = FIXTURE_FONT;
  sub.fontSize = 52;
  sub.frame = { x: 60, y: 620, w: 960, h: 110 };
  sub.fill = { kind: 'solid', color: '#1c1917' };
  sub.highlight = { fill: { kind: 'solid', color: '#fde047' }, padH: 24, padV: 12, radius: 12 };

  layout.layers.push(title, sub);
  return layout;
}

/** Gradiente radial em forma + blend mode multiply + traçados dentro/fora. */
export function fixtureFormasBlend(): Layout {
  const layout = createLayout('4:5');
  layout.background = {
    kind: 'linear',
    stops: [
      { offset: 0, color: '#e0f2fe' },
      { offset: 1, color: '#bae6fd' },
    ],
    angle: 90,
  };

  const base = createRectLayer('4:5');
  base.frame = { x: 140, y: 300, w: 500, h: 500 };
  base.radius = 60;
  base.fill = {
    kind: 'radial',
    stops: [
      { offset: 0, color: '#fb7185' },
      { offset: 1, color: '#9f1239' },
    ],
    cx: 0.5,
    cy: 0.5,
    r: 0.8,
  };
  base.effects.stroke = { width: 12, color: '#0c4a6e', position: 'inside' };

  const over = createRectLayer('4:5');
  over.frame = { x: 440, y: 550, w: 500, h: 500 };
  over.radius = 60;
  over.fill = { kind: 'solid', color: '#38bdf8' };
  over.blendMode = 'multiply';
  over.effects.stroke = { width: 8, color: '#111111', position: 'outside' };

  layout.layers.push(base, over);
  return layout;
}

/** Imagem raster em cover com blur (filtro + cache) + elemento com sombra. */
export function fixtureImagemFiltro(): Layout {
  const layout = createLayout('4:5');
  const bg = createImageLayer('4:5', FIXTURE_ASSET_ID, 'fundo');
  bg.effects.blur = 8; // exige cache() — o bug clássico que só o pixel pega

  const el = createImageElementLayer('4:5', FIXTURE_ASSET_ID, { width: 800, height: 600 }, 'foto');
  el.frame = { x: 290, y: 430, w: 500, h: 375 };
  el.effects.shadow = { x: 0, y: 16, blur: 40, color: '#000000', opacity: 0.5 };
  el.effects.stroke = { width: 10, color: '#ffffff', position: 'inside' };

  layout.layers.push(bg, el);
  return layout;
}

/** Placeholder vazio — o estado tracejado com rótulo também é contrato visual. */
export function fixturePlaceholder(): Layout {
  const layout = createLayout('4:5');
  layout.background = { kind: 'solid', color: '#ffffff' };
  const ph = createImageLayer('4:5', null, 'Foto do produto');
  ph.frame = { x: 140, y: 300, w: 800, h: 700 };
  layout.layers.push(ph);
  return layout;
}

/** Máscara elipse/retângulo-com-raio em imagem + elipse, linha e seta (Fase 4). */
export function fixtureMascaraFormas(): Layout {
  const layout = createLayout('4:5');
  layout.background = { kind: 'solid', color: '#fafaf9' };

  const circular = createImageElementLayer('4:5', FIXTURE_ASSET_ID, { width: 800, height: 600 }, 'avatar');
  circular.frame = { x: 90, y: 160, w: 400, h: 400 };
  circular.fit = 'cover';
  circular.mask = { shape: 'ellipse' };

  const arredondada = createImageElementLayer('4:5', FIXTURE_ASSET_ID, { width: 800, height: 600 }, 'card');
  arredondada.frame = { x: 590, y: 160, w: 400, h: 400 };
  arredondada.fit = 'cover';
  arredondada.mask = { shape: 'rect', radius: 48 };
  // crop não destrutivo: usa só o quadrante superior esquerdo da imagem
  arredondada.crop = { x: 0, y: 0, w: 400, h: 300 };

  const elipse = createEllipseLayer('4:5');
  elipse.frame = { x: 140, y: 700, w: 300, h: 180 };
  elipse.fill = { kind: 'solid', color: '#0e7490' };
  elipse.effects.stroke = { width: 10, color: '#164e63', position: 'outside' };

  const linha = createLineLayer('4:5');
  linha.frame = { x: 140, y: 960, w: 800, h: 10 };
  linha.fill = { kind: 'solid', color: '#404040' };

  const seta = createLineLayer('4:5');
  seta.shape = 'arrow';
  seta.arrowHead = 'both';
  seta.frame = { x: 140, y: 1060, w: 800, h: 14 };
  seta.fill = { kind: 'solid', color: '#b91c1c' };

  layout.layers.push(circular, arredondada, elipse, linha, seta);
  return layout;
}

export const FIXTURES: { name: string; build: () => Layout }[] = [
  { name: 'texto-estilizado', build: fixtureTextoEstilizado },
  { name: 'formas-blend', build: fixtureFormasBlend },
  { name: 'imagem-filtro', build: fixtureImagemFiltro },
  { name: 'placeholder-vazio', build: fixturePlaceholder },
  { name: 'mascara-formas', build: fixtureMascaraFormas },
];
