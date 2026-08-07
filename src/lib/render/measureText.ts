import Konva from 'konva';
import type { TextLayer } from '@/lib/model/types';
import { fontStack } from '@/lib/fonts/stacks';
import { konvaText } from './textContent';

// Medidor REAL de altura de texto, via um Konva.Text fora de qualquer stage — o
// mesmo motor de quebra de linha do render, então a medida bate com o que aparece
// na tela. Só roda no browser (precisa de canvas 2D); os testes de lib/layout
// injetam um medidor falso (ver TextMeasurer em lib/layout/autoFit).

export function measureTextHeight(layer: TextLayer, fontSize: number): number {
  const node = new Konva.Text({
    text: konvaText(layer),
    width: layer.frame.w,
    fontSize,
    fontFamily: fontStack(layer.fontFamily),
    fontStyle: String(layer.fontWeight),
    lineHeight: layer.lineHeight,
    letterSpacing: layer.letterSpacing,
    wrap: 'word',
  });
  // Sem height explícito, o Konva calcula a altura a partir das linhas quebradas.
  const h = node.height();
  node.destroy();
  return h;
}
