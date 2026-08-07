import { describe, it, expect } from 'vitest';
import type { Anchor, Layout, TextLayer } from '@/lib/model/types';
import { getFormat } from '@/config/formats';
import { createProject } from '@/lib/model/factory';
import { createTextLayer, createRectLayer } from '@/lib/model/layers';
import { adaptFrame } from './anchors';
import { safeAreaCorrection } from './safeArea';
import { fitFontSize, type TextMeasurer } from './autoFit';
import { adaptLayout, propagateProject, type AdaptContext } from './adapt';
import { countRebaseEffects, rebaseProject, describeRebase } from './rebase';

// Cobertura real do coração do produto (SPEC §16): cada âncora, override, detached,
// correção de safe zone, auto-fit e troca de formato base.

const F45 = getFormat('4:5'); // 1080×1350
const F11 = getFormat('1:1'); // 1080×1080
const F916 = getFormat('9:16'); // 1080×1920

function ctx(from = F45, to = F916, measure?: TextMeasurer): AdaptContext {
  return { from, to, safeArea: to.safeArea, measure };
}

// Medidor falso determinístico: altura = fontSize × linhas "estimadas" pela largura.
// (40 chars cabem em 1000px a fontSize 50 ⇒ modelo linear simples e monotônico.)
const fakeMeasure: TextMeasurer = (layer, fontSize) => {
  const charsPerLine = Math.max(1, Math.floor((layer.frame.w / fontSize) * 2));
  const lines = Math.max(1, Math.ceil(layer.content.length / charsPerLine));
  return lines * fontSize * layer.lineHeight;
};

describe('adaptFrame — cada âncora (Δ = +570, 4:5 → 9:16)', () => {
  const frame = { x: 100, y: 200, w: 500, h: 300 };
  const delta = F916.height - F45.height; // 570

  it.each<[Anchor['v'], number, number]>([
    ['top', 200, 300],
    ['bottom', 200 + 570, 300],
    ['center', 200 + 285, 300],
    ['stretch', 200, 300 + 570],
  ])('%s', (v, expectedY, expectedH) => {
    const out = adaptFrame(frame, { v }, delta);
    expect(out.y).toBe(expectedY);
    expect(out.h).toBe(expectedH);
    // x e w NUNCA mudam — a adaptação é puramente vertical.
    expect(out.x).toBe(frame.x);
    expect(out.w).toBe(frame.w);
  });

  it('Δ negativo (4:5 → 1:1) move para cima e stretch encolhe', () => {
    const d = F11.height - F45.height; // -270
    expect(adaptFrame(frame, { v: 'bottom' }, d).y).toBe(200 - 270);
    expect(adaptFrame(frame, { v: 'stretch' }, d).h).toBe(300 - 270);
  });
});

describe('safeAreaCorrection', () => {
  it('empurra para dentro pelo caminho mais curto', () => {
    // 9:16: safe top=250. Camada em y=100 invade por cima → empurra para y=250.
    const corr = safeAreaCorrection({ x: 100, y: 100, w: 400, h: 200 }, F916, F916.safeArea);
    expect(corr).toEqual({ dx: 0, dy: 150 });
  });

  it('não mexe em camada já dentro', () => {
    expect(safeAreaCorrection({ x: 100, y: 300, w: 400, h: 200 }, F916, F916.safeArea)).toBeNull();
  });

  it('camada invadindo por baixo sobe', () => {
    // 9:16: safe bottom=340 → maxY = 1920-340-200 = 1380. y=1500 → dy = -120.
    const corr = safeAreaCorrection({ x: 100, y: 1500, w: 400, h: 200 }, F916, F916.safeArea);
    expect(corr).toEqual({ dx: 0, dy: -120 });
  });

  it('camada maior que a área útil encosta no início dela', () => {
    const corr = safeAreaCorrection({ x: 0, y: 0, w: 1080, h: 300 }, F916, F916.safeArea);
    expect(corr?.dx).toBe(F916.safeArea.left);
    expect(corr?.dy).toBe(F916.safeArea.top);
  });
});

describe('fitFontSize', () => {
  function textLayer(content: string, fontSize: number, min = 24, max = 200): TextLayer {
    const l = createTextLayer('4:5', content);
    l.fontSize = fontSize;
    l.autoFit = { enabled: true, min, max };
    l.frame = { x: 0, y: 0, w: 960, h: 200 };
    return l;
  }

  it('mantém o tamanho quando cabe', () => {
    const l = textLayer('curto', 96);
    expect(fitFontSize(l, 200, fakeMeasure)).toBe(96);
  });

  it('reduz até caber, sem passar do mínimo', () => {
    const l = textLayer('x'.repeat(400), 96, 24);
    const fitted = fitFontSize(l, 200, fakeMeasure);
    expect(fitted).toBeLessThan(96);
    expect(fitted).toBeGreaterThanOrEqual(24);
    expect(fakeMeasure(l, fitted)).toBeLessThanOrEqual(200);
    expect(fakeMeasure(l, fitted + 1)).toBeGreaterThan(200);
  });

  it('nunca aumenta além do original, mesmo com max maior', () => {
    const l = textLayer('curto', 40, 24, 300);
    expect(fitFontSize(l, 10_000, fakeMeasure)).toBe(40);
  });

  it('retorna o mínimo quando nada cabe', () => {
    const l = textLayer('x'.repeat(10_000), 96, 24);
    expect(fitFontSize(l, 30, fakeMeasure)).toBe(24);
  });
});

function makeLayouts(): { source: Layout; dest: Layout } {
  const project = createProject({ now: 1 });
  return { source: project.layouts['4:5'], dest: project.layouts['9:16'] };
}

describe('adaptLayout', () => {
  it('destino detached fica intacto', () => {
    const { source, dest } = makeLayouts();
    source.layers.push(createTextLayer('4:5', 'Oi'));
    dest.detached = true;
    dest.background = { kind: 'solid', color: '#ff0000' };
    const { layout, warnings } = adaptLayout(source, dest, ctx());
    expect(layout).toBe(dest);
    expect(layout.layers).toHaveLength(0);
    expect(warnings).toHaveLength(0);
  });

  it('fundo é copiado da base', () => {
    const { source, dest } = makeLayouts();
    source.background = { kind: 'solid', color: '#123456' };
    const { layout } = adaptLayout(source, dest, ctx());
    expect(layout.background).toEqual({ kind: 'solid', color: '#123456' });
    expect(layout.background).not.toBe(source.background); // cópia, não referência
  });

  it('camada com override no destino é preservada; as demais re-derivam', () => {
    const { source, dest } = makeLayouts();
    const a = createTextLayer('4:5', 'A');
    a.frame.y = 300;
    const b = createRectLayer('4:5');
    b.frame.y = 800;
    b.anchor = { v: 'bottom' };
    source.layers.push(a, b);

    // usuário editou a cópia de A no 9:16
    const aOverridden = structuredClone(a);
    aOverridden.frame.y = 999;
    aOverridden.fontSize = 44;
    aOverridden.overriddenIn = ['9:16'];
    dest.layers.push(aOverridden);

    const { layout } = adaptLayout(source, dest, ctx());
    const outA = layout.layers.find((l) => l.id === a.id)!;
    const outB = layout.layers.find((l) => l.id === b.id)!;
    expect(outA).toBe(aOverridden); // preservada por referência
    expect(outB.frame.y).toBe(800 + 570); // re-derivada: âncora bottom acompanha Δ
  });

  it('camadas só do destino permanecem no topo; ordem das demais segue a base', () => {
    const { source, dest } = makeLayouts();
    const a = createTextLayer('4:5', 'A');
    const b = createRectLayer('4:5');
    source.layers.push(a, b);
    const extra = createTextLayer('9:16', 'Só aqui');
    extra.overriddenIn = ['9:16'];
    dest.layers.push(extra);

    const { layout } = adaptLayout(source, dest, ctx());
    expect(layout.layers.map((l) => l.id)).toEqual([a.id, b.id, extra.id]);
  });

  it('cópia sem origem na base é tratada como dest-only e mantida (contrato: quem apaga em todos os formatos é o store)', () => {
    const { source, dest } = makeLayouts();
    const a = createTextLayer('4:5', 'A');
    // destino tem cópia de uma camada que não existe (mais) na base
    dest.layers.push(structuredClone(a));
    const { layout } = adaptLayout(source, dest, ctx());
    expect(layout.layers.map((l) => l.id)).toEqual([a.id]);
  });

  it('gera aviso de safe zone ao empurrar camada', () => {
    const { source, dest } = makeLayouts();
    const t = createTextLayer('4:5', 'Alto demais');
    t.anchor = { v: 'top' };
    t.frame.y = 100; // no 9:16 invade o top=250
    source.layers.push(t);
    const { layout, warnings } = adaptLayout(source, dest, ctx());
    expect(warnings).toHaveLength(1);
    expect(warnings[0].kind).toBe('safe-area');
    const out = layout.layers[0];
    expect(out.frame.y).toBe(250);
  });

  it('aplica auto-fit na adaptação quando habilitado', () => {
    const { source } = makeLayouts();
    const t = createTextLayer('4:5', 'x'.repeat(500));
    t.anchor = { v: 'stretch' }; // 4:5→1:1 encolhe a caixa em 270px
    t.frame = { x: 60, y: 300, w: 960, h: 400 };
    t.autoFit = { enabled: true, min: 24, max: 200 };
    t.fontSize = 96;
    source.layers.push(t);
    const to11 = createProject({ now: 1 }).layouts['1:1'];
    const { layout } = adaptLayout(source, to11, ctx(F45, F11, fakeMeasure));
    const out = layout.layers[0] as TextLayer;
    expect(out.frame.h).toBe(130); // 400 - 270
    expect(out.fontSize).toBeLessThan(96);
  });
});

describe('propagateProject', () => {
  it('propaga a base para os conectados e pula detached', () => {
    const project = createProject({ now: 1 });
    const t = createTextLayer('4:5', 'Olá');
    t.frame.y = 400;
    project.layouts['4:5'].layers.push(t);
    project.layouts['1:1'].detached = true;

    propagateProject(project);
    expect(project.layouts['9:16'].layers).toHaveLength(1);
    expect(project.layouts['1:1'].layers).toHaveLength(0); // detached intacto
  });

  it('é idempotente para camadas sem override', () => {
    const project = createProject({ now: 1 });
    const t = createTextLayer('4:5', 'Olá');
    project.layouts['4:5'].layers.push(t);
    propagateProject(project);
    const first = structuredClone(project.layouts['9:16']);
    propagateProject(project);
    expect(project.layouts['9:16']).toEqual(first);
  });
});

describe('troca de formato base (rebase)', () => {
  function projectWithOverrides() {
    const project = createProject({ now: 1 });
    const t = createTextLayer('4:5', 'Título');
    const r = createRectLayer('4:5');
    project.layouts['4:5'].layers.push(t, r);
    propagateProject(project);
    // duas camadas sobrescritas no 9:16
    for (const layer of project.layouts['9:16'].layers) {
      layer.overriddenIn = ['9:16'];
      layer.frame.y += 7;
    }
    // 1:1 desconectado
    project.layouts['1:1'].detached = true;
    return project;
  }

  it('conta os efeitos com número exato', () => {
    const effects = countRebaseEffects(projectWithOverrides(), '9:16');
    expect(effects.overridesLost).toEqual([]); // 9:16 é a própria nova base
    expect(effects.detachedUntouched).toEqual(['1:1']);

    const effects45 = countRebaseEffects(projectWithOverrides(), '4:5');
    expect(effects45.overridesLost).toEqual([{ formatId: '9:16', count: 2 }]);
  });

  it('descreve a troca em texto', () => {
    const text = describeRebase(projectWithOverrides(), '9:16');
    expect(text).toContain('Stories/Reels');
    expect(text).toContain('não será afetado');
  });

  it('nova base preservada integralmente; conectados reprojetados; detached intacto', () => {
    const project = projectWithOverrides();
    const snapshot916 = structuredClone(project.layouts['9:16']);
    const snapshot11 = structuredClone(project.layouts['1:1']);

    rebaseProject(project, '9:16');

    expect(project.baseFormat).toBe('9:16');
    // nova base: layout preservado (inclusive os frames com y+7)
    expect(project.layouts['9:16'].layers.map((l) => l.frame.y)).toEqual(
      snapshot916.layers.map((l) => l.frame.y),
    );
    // 4:5 reprojetado a partir do 9:16: overrides limpos, âncoras aplicadas
    for (const layer of project.layouts['4:5'].layers) {
      expect(layer.overriddenIn).toEqual([]);
    }
    // detached não foi tocado
    expect(project.layouts['1:1']).toEqual(snapshot11);
  });

  it('a operação é reversível pelos dados (overrides limpos, sem lixo)', () => {
    const project = projectWithOverrides();
    rebaseProject(project, '9:16');
    rebaseProject(project, '4:5');
    expect(project.baseFormat).toBe('4:5');
    for (const layer of project.layouts['9:16'].layers) {
      expect(layer.overriddenIn).toEqual([]);
    }
  });
});
