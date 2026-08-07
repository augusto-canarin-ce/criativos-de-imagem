import { describe, it, expect } from 'vitest';
import { createTextLayer, createRectLayer, createImageLayer, cloneLayer } from './layers';
import { textLayerSchema, imageLayerSchema, shapeLayerSchema } from './schema';
import { getFormat } from '@/config/formats';

describe('fábricas de camada', () => {
  it('texto é válido e nasce dentro da largura útil', () => {
    const t = createTextLayer('4:5', 'Oi');
    expect(() => textLayerSchema.parse(t)).not.toThrow();
    expect(t.content).toBe('Oi');
    expect(t.frame.x).toBeGreaterThanOrEqual(0);
  });

  it('retângulo é válido', () => {
    expect(() => shapeLayerSchema.parse(createRectLayer('1:1'))).not.toThrow();
  });

  it('imagem sem asset é placeholder cobrindo o formato inteiro', () => {
    const img = createImageLayer('9:16', null, 'Foto do produto');
    expect(() => imageLayerSchema.parse(img)).not.toThrow();
    expect(img.assetId).toBeNull();
    expect(img.placeholder.label).toBe('Foto do produto');
    const f = getFormat('9:16');
    expect(img.frame).toEqual({ x: 0, y: 0, w: f.width, h: f.height });
    expect(img.anchor.v).toBe('stretch');
  });

  it('cloneLayer gera id novo e desloca, sem afetar o original', () => {
    const t = createTextLayer('4:5', 'A');
    const c = cloneLayer(t);
    expect(c.id).not.toBe(t.id);
    expect(c.frame.x).toBe(t.frame.x + 24);
    expect(c.overriddenIn).toEqual([]);
    expect(t.frame.x).not.toBe(c.frame.x);
  });
});
