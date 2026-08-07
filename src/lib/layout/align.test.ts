import { describe, it, expect } from 'vitest';
import { alignFrames, distributeFrames, stretchFrames, type FrameRef } from './align';

const CANVAS = { w: 1080, h: 1350 };

function ref(id: string, x: number, y: number, w = 100, h = 50): FrameRef {
  return { id, frame: { x, y, w, h } };
}

describe('alignFrames', () => {
  it('uma camada alinha em relação ao canvas', () => {
    const out = alignFrames([ref('a', 500, 500)], 'left', CANVAS);
    expect(out.get('a')).toEqual({ x: 0 });
    expect(alignFrames([ref('a', 0, 0)], 'hcenter', CANVAS).get('a')).toEqual({ x: 490 });
    expect(alignFrames([ref('a', 0, 0)], 'right', CANVAS).get('a')).toEqual({ x: 980 });
    expect(alignFrames([ref('a', 0, 500)], 'top', CANVAS).get('a')).toEqual({ y: 0 });
    expect(alignFrames([ref('a', 0, 0)], 'vcenter', CANVAS).get('a')).toEqual({ y: 650 });
    expect(alignFrames([ref('a', 0, 0)], 'bottom', CANVAS).get('a')).toEqual({ y: 1300 });
  });

  it('várias camadas alinham em relação à caixa da seleção', () => {
    const frames = [ref('a', 100, 100), ref('b', 300, 400, 200, 100)];
    // caixa: x 100–500, y 100–500
    expect(alignFrames(frames, 'left', CANVAS).get('b')).toEqual({ x: 100 });
    expect(alignFrames(frames, 'right', CANVAS).get('a')).toEqual({ x: 400 });
    expect(alignFrames(frames, 'bottom', CANVAS).get('a')).toEqual({ y: 450 });
  });
});

describe('distributeFrames', () => {
  it('espaça igualmente mantendo primeira e última no lugar', () => {
    const frames = [ref('a', 0, 0), ref('b', 130, 0), ref('c', 500, 0)];
    const out = distributeFrames(frames, 'h');
    // span: 0–600; soma larguras 300; gap = (600-300)/2 = 150
    expect(out.get('a')).toEqual({ x: 0 });
    expect(out.get('b')).toEqual({ x: 250 });
    expect(out.get('c')).toEqual({ x: 500 });
  });

  it('exige pelo menos 3 camadas', () => {
    expect(distributeFrames([ref('a', 0, 0), ref('b', 100, 0)], 'h').size).toBe(0);
  });
});

describe('stretchFrames', () => {
  it('estica para 100% da largura ou altura do formato', () => {
    const out = stretchFrames([ref('a', 200, 300)], 'width', CANVAS);
    expect(out.get('a')).toEqual({ x: 0, w: 1080 });
    const outH = stretchFrames([ref('a', 200, 300)], 'height', CANVAS);
    expect(outH.get('a')).toEqual({ y: 0, h: 1350 });
  });
});
