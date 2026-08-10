import { describe, it, expect } from 'vitest';
import { getFormat } from '@/config/formats';
import { snapFrame } from './snapping';

const F = getFormat('4:5'); // 1080×1350, safe 80/60/80/60
const SAFE = F.safeArea;

describe('snapFrame', () => {
  it('gruda o centro do quadro no centro do canvas', () => {
    // centro do quadro em 536 (x=336+400/2); centro do canvas 540 → Δ=4 ≤ 6
    const out = snapFrame({ x: 336, y: 300, w: 400, h: 200 }, F, SAFE, [], 6);
    expect(out.x).toBe(340); // 540 - 200
    expect(out.guides).toContainEqual({ axis: 'v', at: 540 });
  });

  it('gruda a borda na safe area', () => {
    const out = snapFrame({ x: 63, y: 300, w: 200, h: 100 }, F, SAFE, [], 6);
    expect(out.x).toBe(60); // safe.left
    expect(out.guides).toContainEqual({ axis: 'v', at: 60 });
  });

  it('gruda na borda e no centro de outra camada', () => {
    const other = { x: 500, y: 700, w: 200, h: 100 };
    // borda direita do arrastado (300+204=504) ~ borda esquerda do outro (500)
    const out = snapFrame({ x: 304, y: 300, w: 200, h: 100 }, F, SAFE, [other], 6);
    expect(out.x).toBe(300);
    // eixo Y: topo em 702 ~ topo do outro em 700
    const outY = snapFrame({ x: 100, y: 702, w: 200, h: 100 }, F, SAFE, [other], 6);
    expect(outY.y).toBe(700);
  });

  it('fora da tolerância não gruda nem gera guia', () => {
    const out = snapFrame({ x: 320, y: 300, w: 200, h: 100 }, F, SAFE, [], 6);
    expect(out.x).toBe(320);
    expect(out.guides).toHaveLength(0);
  });

  it('vence o candidato de menor desvio', () => {
    const other = { x: 100, y: 0, w: 10, h: 10 }; // bordas 100/110, centro 105
    // borda esquerda do arrastado em 104: Δ=+1 para o centro (105) < Δ=-4 para 100
    const out = snapFrame({ x: 104, y: 300, w: 50, h: 50 }, F, SAFE, [other], 6);
    expect(out.x).toBe(105);
  });
});
