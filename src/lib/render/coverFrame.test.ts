import { describe, it, expect } from 'vitest';
import { computeCover, computeContain } from './coverFrame';

describe('computeCover', () => {
  it('preenche o quadro sem distorcer (imagem mais larga)', () => {
    // quadro 100x100, imagem 200x100 → escala pela altura, corta as laterais
    const r = computeCover({ x: 0, y: 0, w: 100, h: 100 }, { width: 200, height: 100 });
    expect(r.width).toBe(100);
    expect(r.height).toBe(100);
    expect(r.crop.height).toBeCloseTo(100);
    expect(r.crop.width).toBeCloseTo(100); // fonte visível é quadrada
    // centralizado por padrão (focal 0.5)
    expect(r.crop.x).toBeCloseTo(50);
    expect(r.crop.y).toBeCloseTo(0);
  });

  it('o ponto focal desloca o corte', () => {
    const centered = computeCover({ x: 0, y: 0, w: 100, h: 100 }, { width: 200, height: 100 });
    const left = computeCover({ x: 0, y: 0, w: 100, h: 100 }, { width: 200, height: 100 }, { x: 0, y: 0.5 });
    expect(left.crop.x).toBeLessThan(centered.crop.x);
    expect(left.crop.x).toBeCloseTo(0);
  });

  it('mantém o corte dentro dos limites da imagem', () => {
    const r = computeCover({ x: 0, y: 0, w: 100, h: 100 }, { width: 200, height: 100 }, { x: 1, y: 1 });
    expect(r.crop.x).toBeGreaterThanOrEqual(0);
    expect(r.crop.x + r.crop.width).toBeLessThanOrEqual(200 + 1e-6);
  });
});

describe('computeContain', () => {
  it('cabe inteira dentro do quadro, sem corte', () => {
    const r = computeContain({ x: 0, y: 0, w: 100, h: 100 }, { width: 200, height: 100 });
    expect(r.width).toBe(100);
    expect(r.height).toBe(50);
    expect(r.crop).toEqual({ x: 0, y: 0, width: 200, height: 100 });
  });
});
