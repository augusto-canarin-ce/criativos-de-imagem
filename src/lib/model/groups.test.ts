import { describe, it, expect } from 'vitest';
import { createTextLayer, createRectLayer } from './layers';
import {
  groupLayers,
  ungroupLayer,
  scaleGroupChildren,
  findLayerDeep,
  removeLayerDeep,
  cloneLayerDeep,
} from './groups';
import type { TextLayer } from './types';

function pair() {
  const a = createRectLayer('4:5');
  a.frame = { x: 100, y: 200, w: 300, h: 100 };
  const b = createTextLayer('4:5', 'Oi');
  b.frame = { x: 200, y: 400, w: 400, h: 150 };
  return { a, b };
}

describe('groupLayers / ungroupLayer', () => {
  it('grupo pega a caixa envolvente e filhos ficam relativos', () => {
    const { a, b } = pair();
    const g = groupLayers([a, b]);
    expect(g.frame).toEqual({ x: 100, y: 200, w: 500, h: 350 });
    expect(g.children[0].frame).toEqual({ x: 0, y: 0, w: 300, h: 100 });
    expect(g.children[1].frame).toEqual({ x: 100, y: 200, w: 400, h: 150 });
  });

  it('desagrupar restaura frames absolutos (round-trip sem rotação)', () => {
    const { a, b } = pair();
    const out = ungroupLayer(groupLayers([a, b]));
    expect(out[0].frame).toEqual(a.frame);
    expect(out[1].frame).toEqual(b.frame);
  });

  it('desagrupar grupo rotacionado soma rotação e gira posições', () => {
    const { a, b } = pair();
    const g = groupLayers([a, b]);
    g.rotation = 90;
    const out = ungroupLayer(g);
    expect(out[0].rotation).toBe(90);
    // filho em (0,0) relativo fica na origem do grupo
    expect(out[0].frame.x).toBe(100);
    expect(out[0].frame.y).toBe(200);
    // filho em (100,200) relativo, girado 90°: (x·cos−y·sin, x·sin+y·cos) = (−200, 100)
    expect(out[1].frame.x).toBe(100 - 200);
    expect(out[1].frame.y).toBe(200 + 100);
  });

  it('redimensionar escala filhos e fontSize', () => {
    const { a, b } = pair();
    const g = groupLayers([a, b]);
    const fontBefore = (g.children[1] as TextLayer).fontSize;
    scaleGroupChildren(g, 2, 2);
    expect(g.children[0].frame.w).toBe(600);
    expect((g.children[1] as TextLayer).fontSize).toBe(fontBefore * 2);
  });
});

describe('helpers profundos', () => {
  it('encontra, remove e clona dentro de grupos com ids novos', () => {
    const { a, b } = pair();
    const g = groupLayers([a, b]);
    const layers = [g as ReturnType<typeof groupLayers>];

    expect(findLayerDeep(layers, g.children[1].id)?.type).toBe('text');

    const clone = cloneLayerDeep(g);
    expect(clone.id).not.toBe(g.id);
    expect(clone.type === 'group' && clone.children[0].id).not.toBe(g.children[0].id);

    expect(removeLayerDeep(layers, g.children[0].id)).toBe(true);
    expect(g.children).toHaveLength(1);
  });
});
