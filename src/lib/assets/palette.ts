// Extração de paleta (§8): as 5 cores dominantes de uma imagem, por quantização
// própria (median cut) — sem dependência. Puro sobre pixels RGBA; o chamador
// amostra o canvas. "Adicionar ao brand kit" com um clique chega na Fase 6; por
// ora as cores aparecem no seletor de cor como sugestão.

export interface PaletteColor {
  hex: string;
  /** fração de pixels da caixa que gerou a cor (peso relativo) */
  weight: number;
}

type Pixel = [number, number, number];

function hex(p: Pixel): string {
  return `#${((p[0] << 16) | (p[1] << 8) | p[2]).toString(16).padStart(6, '0')}`;
}

/** Canal com maior amplitude na caixa (o eixo do corte do median cut). */
function widestChannel(pixels: Pixel[]): 0 | 1 | 2 {
  const min: Pixel = [255, 255, 255];
  const max: Pixel = [0, 0, 0];
  for (const p of pixels) {
    for (let c = 0; c < 3; c++) {
      if (p[c] < min[c]) min[c] = p[c];
      if (p[c] > max[c]) max[c] = p[c];
    }
  }
  const ranges = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];
  return ranges.indexOf(Math.max(...ranges)) as 0 | 1 | 2;
}

function average(pixels: Pixel[]): Pixel {
  let r = 0;
  let g = 0;
  let b = 0;
  for (const p of pixels) {
    r += p[0];
    g += p[1];
    b += p[2];
  }
  const n = Math.max(1, pixels.length);
  return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
}

/**
 * Median cut sobre dados RGBA (ex.: ImageData.data). Pixels transparentes
 * (alfa < 128) ficam de fora — a paleta de um logo PNG não deve conter o "nada".
 * `sampleStep` pula pixels para performance (1 = todos).
 */
export function extractPalette(
  data: Uint8ClampedArray | number[],
  count = 5,
  sampleStep = 4,
): PaletteColor[] {
  const pixels: Pixel[] = [];
  const stride = 4 * sampleStep;
  for (let i = 0; i + 3 < data.length; i += stride) {
    if (data[i + 3] < 128) continue;
    pixels.push([data[i], data[i + 1], data[i + 2]]);
  }
  if (pixels.length === 0) return [];

  let boxes: Pixel[][] = [pixels];
  while (boxes.length < count) {
    // corta a maior caixa que ainda tem variação
    boxes.sort((a, b) => b.length - a.length);
    const box = boxes.shift()!;
    if (box.length < 2) {
      boxes.push(box);
      break;
    }
    const ch = widestChannel(box);
    const sorted = [...box].sort((a, b) => a[ch] - b[ch]);
    const mid = Math.floor(sorted.length / 2);
    boxes.push(sorted.slice(0, mid), sorted.slice(mid));
  }

  const total = pixels.length;
  // Caixas que convergem para a MESMA cor média se fundem (imagem chapada não
  // vira 3 entradas idênticas).
  const merged = new Map<string, number>();
  for (const b of boxes) {
    if (b.length === 0) continue;
    const h = hex(average(b));
    merged.set(h, (merged.get(h) ?? 0) + b.length / total);
  }
  return [...merged.entries()]
    .map(([h, weight]) => ({ hex: h, weight }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, count);
}
