import { describe, it, expect } from 'vitest';
import { createProject } from '@/lib/model/factory';
import { createTextLayer, createImageLayer, createImageElementLayer } from '@/lib/model/layers';
import { staticChecklist } from './checklist';

// Checklist estático (§11). O contraste (pixels reais) é coberto pela suíte visual.

function baseLayouts() {
  return createProject({ now: 1 }).layouts;
}

const fontsOk = () => true;

describe('staticChecklist', () => {
  it('placeholder vazio é o primeiro da lista, em destaque', () => {
    const layouts = baseLayouts();
    layouts['4:5'].layers.push(createImageLayer('4:5', null, 'Foto do produto'));
    const t = createTextLayer('4:5', 'x');
    t.fontSize = 20; // gera um segundo aviso, de fonte pequena
    t.frame.y = 300;
    layouts['4:5'].layers.push(t);

    const out = staticChecklist(layouts, new Map(), fontsOk);
    expect(out[0].kind).toBe('placeholder-vazio');
    expect(out[0].severity).toBe('destaque');
    expect(out.some((w) => w.kind === 'fonte-pequena')).toBe(true);
  });

  it('texto fora da safe zone avisa; imagem de fundo não', () => {
    const layouts = baseLayouts();
    const t = createTextLayer('4:5', 'x');
    t.frame.y = 10; // safe top do 4:5 = 80
    layouts['4:5'].layers.push(t);
    layouts['4:5'].layers.push(createImageLayer('4:5', 'a1', 'bg')); // cobre tudo

    const out = staticChecklist(layouts, new Map([['a1', { width: 2000, height: 2000 }]]), fontsOk);
    const safe = out.filter((w) => w.kind === 'fora-da-safe-zone');
    expect(safe).toHaveLength(1);
    expect(safe[0].layerName).toBe(t.name);
  });

  it('logo (imagem-elemento) fora da safe zone avisa', () => {
    const layouts = baseLayouts();
    const logo = createImageElementLayer('4:5', 'a1', { width: 400, height: 200 }, 'logo');
    logo.frame.x = 0; // encosta na borda; safe left = 60
    layouts['4:5'].layers.push(logo);
    const out = staticChecklist(layouts, new Map([['a1', { width: 400, height: 200 }]]), fontsOk);
    expect(out.some((w) => w.kind === 'fora-da-safe-zone')).toBe(true);
  });

  it('imagem ampliada acima de 100% avisa', () => {
    const layouts = baseLayouts();
    const img = createImageElementLayer('4:5', 'a1', { width: 100, height: 100 }, 'mini');
    img.frame = { x: 200, y: 200, w: 400, h: 400 }; // 4x
    layouts['4:5'].layers.push(img);
    const out = staticChecklist(layouts, new Map([['a1', { width: 100, height: 100 }]]), fontsOk);
    const w = out.find((x) => x.kind === 'imagem-ampliada');
    expect(w?.message).toContain('400%');
  });

  it('fonte não carregada avisa por formato', () => {
    const layouts = baseLayouts();
    const t = createTextLayer('4:5', 'x');
    t.frame.y = 300;
    layouts['4:5'].layers.push(t);
    const out = staticChecklist(layouts, new Map(), () => false);
    expect(out.filter((w) => w.kind === 'fonte-nao-carregada').length).toBeGreaterThan(0);
  });

  it('texto acima de 20% da área é informativo', () => {
    const layouts = baseLayouts();
    const t = createTextLayer('4:5', 'x');
    t.frame = { x: 60, y: 300, w: 960, h: 400 }; // 384k / 1458k ≈ 26%
    layouts['4:5'].layers.push(t);
    const out = staticChecklist(layouts, new Map(), fontsOk);
    const w = out.find((x) => x.kind === 'texto-demais');
    expect(w?.severity).toBe('info');
  });

  it('camada oculta não gera aviso', () => {
    const layouts = baseLayouts();
    const ph = createImageLayer('4:5', null, 'Vazio');
    ph.visible = false;
    layouts['4:5'].layers.push(ph);
    expect(staticChecklist(layouts, new Map(), fontsOk)).toHaveLength(0);
  });
});
