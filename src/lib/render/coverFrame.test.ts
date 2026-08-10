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

describe('crop não destrutivo', () => {
  it('cover opera dentro do retângulo de crop e devolve coordenadas na imagem original', () => {
    // imagem 400×400, crop no quadrante inferior direito (200,200,200,200)
    const r = computeCover(
      { x: 0, y: 0, w: 100, h: 100 },
      { width: 400, height: 400 },
      { x: 0.5, y: 0.5 },
      { x: 200, y: 200, w: 200, h: 200 },
    );
    // fonte 200×200 cobre quadro 100×100 → corte = crop inteiro, offset preservado
    expect(r.crop).toEqual({ x: 200, y: 200, width: 200, height: 200 });
  });

  it('focal point funciona dentro do crop', () => {
    // crop 200×100 em (100,50); quadro quadrado → fonte visível 100×100
    const left = computeCover(
      { x: 0, y: 0, w: 100, h: 100 },
      { width: 400, height: 400 },
      { x: 0, y: 0.5 },
      { x: 100, y: 50, w: 200, h: 100 },
    );
    expect(left.crop.x).toBe(100); // encostado à esquerda DO CROP
    const right = computeCover(
      { x: 0, y: 0, w: 100, h: 100 },
      { width: 400, height: 400 },
      { x: 1, y: 0.5 },
      { x: 100, y: 50, w: 200, h: 100 },
    );
    expect(right.crop.x).toBe(200); // 100 + (200 - 100)
  });

  it('contain respeita o crop', () => {
    const r = computeContain(
      { x: 0, y: 0, w: 100, h: 100 },
      { width: 400, height: 400 },
      { x: 0, y: 0, w: 200, h: 100 },
    );
    expect(r.width).toBe(100);
    expect(r.height).toBe(50);
    expect(r.crop).toEqual({ x: 0, y: 0, width: 200, height: 100 });
  });
});
