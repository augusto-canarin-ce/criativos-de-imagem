import { describe, it, expect } from 'vitest';
import { extractPalette } from './palette';

// Median cut puro sobre RGBA sintético.

function pixels(colors: [number, number, number, number?][], repeat: number): number[] {
  const out: number[] = [];
  for (const [r, g, b, a = 255] of colors) {
    for (let i = 0; i < repeat; i++) out.push(r, g, b, a);
  }
  return out;
}

describe('extractPalette', () => {
  it('encontra as cores dominantes na ordem de peso', () => {
    const data = [
      ...pixels([[255, 0, 0]], 60), // vermelho dominante
      ...pixels([[0, 0, 255]], 30), // azul
      ...pixels([[0, 255, 0]], 10), // verde minoritário
    ];
    const palette = extractPalette(data, 3, 1);
    expect(palette[0].hex).toBe('#ff0000');
    expect(palette[0].weight).toBeGreaterThan(palette[1].weight);
    expect(palette.map((p) => p.hex)).toContain('#0000ff');
  });

  it('ignora pixels transparentes (logo PNG não polui a paleta com "nada")', () => {
    const data = [
      ...pixels([[255, 255, 255, 0]], 90), // transparente — fora
      ...pixels([[16, 185, 129]], 10),
    ];
    const palette = extractPalette(data, 3, 1);
    expect(palette).toHaveLength(1);
    expect(palette[0].hex).toBe('#10b981');
  });

  it('imagem 100% transparente devolve paleta vazia', () => {
    expect(extractPalette(pixels([[0, 0, 0, 0]], 50), 5, 1)).toHaveLength(0);
  });

  it('pede no máximo N cores e devolve hex válido', () => {
    const data = [
      ...pixels([[10, 10, 10]], 5),
      ...pixels([[200, 50, 50]], 5),
      ...pixels([[50, 200, 50]], 5),
      ...pixels([[50, 50, 200]], 5),
      ...pixels([[240, 240, 10]], 5),
      ...pixels([[10, 240, 240]], 5),
    ];
    const palette = extractPalette(data, 5, 1);
    expect(palette.length).toBeLessThanOrEqual(5);
    for (const c of palette) expect(c.hex).toMatch(/^#[0-9a-f]{6}$/);
  });
});
