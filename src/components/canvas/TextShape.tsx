import { useRef } from 'react';
import { Group, Rect, Text } from 'react-konva';
import type Konva from 'konva';
import type { TextLayer } from '@/lib/model/types';
import { konvaFillProps } from '@/lib/render/fill';
import { fontStack } from '@/lib/fonts/stacks';
import { measureTextHeight } from '@/lib/render/measureText';
import { fontStyleFor, konvaText } from './textMetrics';
import { shadowProps } from './RectShape';
import { useNodeBlur } from './useNodeBlur';

// Texto com estilo unificado: preenchimento sólido OU gradiente (o gradiente é
// recalculado a cada render a partir da caixa — armadilha da SPEC §8 coberta),
// contorno desenhado ANTES do preenchimento (fillAfterStrokeEnabled — segunda
// armadilha da §8), marca-texto atrás do bloco, sombra e blur.

export function TextShape({ layer }: { layer: TextLayer }) {
  const groupRef = useRef<Konva.Group>(null);
  const { w, h } = layer.frame;
  const stroke = layer.effects.stroke;
  useNodeBlur(groupRef, layer.effects.blur, [layer]);

  // Marca-texto: retângulo atrás do BLOCO de texto medido (não da caixa inteira),
  // respeitando o alinhamento vertical.
  let highlightRect: { y: number; h: number } | null = null;
  if (layer.highlight) {
    const textH = Math.min(h, measureTextHeight(layer, layer.fontSize));
    const offsetY =
      layer.vAlign === 'middle' ? (h - textH) / 2 : layer.vAlign === 'bottom' ? h - textH : 0;
    highlightRect = { y: offsetY, h: textH };
  }

  return (
    <Group ref={groupRef}>
      {layer.highlight && highlightRect && (
        <Rect
          x={-layer.highlight.padH}
          y={highlightRect.y - layer.highlight.padV}
          width={w + layer.highlight.padH * 2}
          height={highlightRect.h + layer.highlight.padV * 2}
          cornerRadius={layer.highlight.radius}
          {...konvaFillProps(
            layer.highlight.fill,
            w + layer.highlight.padH * 2,
            highlightRect.h + layer.highlight.padV * 2,
          )}
          listening={false}
        />
      )}
      <Text
        width={w}
        height={h}
        text={konvaText(layer)}
        fontFamily={fontStack(layer.fontFamily)}
        fontSize={layer.fontSize}
        fontStyle={fontStyleFor(layer.fontWeight)}
        lineHeight={layer.lineHeight}
        letterSpacing={layer.letterSpacing}
        align={layer.align}
        verticalAlign={layer.vAlign === 'middle' ? 'middle' : layer.vAlign === 'bottom' ? 'bottom' : 'top'}
        textDecoration={layer.underline ? 'underline' : ''}
        {...konvaFillProps(layer.fill, w, h)}
        {...shadowProps(layer.effects)}
        stroke={stroke && stroke.width > 0 ? stroke.color : undefined}
        strokeWidth={stroke && stroke.width > 0 ? stroke.width : undefined}
        fillAfterStrokeEnabled
        wrap="word"
        listening
      />
    </Group>
  );
}
