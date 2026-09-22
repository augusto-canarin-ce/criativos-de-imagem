import { useMemo, useRef } from 'react';
import { Group, Rect, Text } from 'react-konva';
import type Konva from 'konva';
import type { TextLayer } from '@/lib/model/types';
import { konvaFillProps, resolveColor } from '@/lib/render/fill';
import { fontStack } from '@/lib/fonts/stacks';
import { measureTextHeight } from '@/lib/render/measureText';
import { layoutRichText } from '@/lib/render/richText';
import { fontStyleFor, konvaText } from './textMetrics';
import { shadowProps } from './RectShape';
import { useNodeBlur } from './useNodeBlur';

// Texto com estilo unificado: preenchimento sólido OU gradiente (o gradiente é
// recalculado a cada render a partir da caixa — armadilha da SPEC §8 coberta),
// contorno desenhado ANTES do preenchimento (fillAfterStrokeEnabled — segunda
// armadilha da §8), marca-texto atrás do bloco, sombra e blur.
//
// TRECHOS COLORIDOS (2026-09-22): com `spans`, a camada vira um nó por trecho
// por linha (lib/render/richText decide as quebras com o próprio Konva). Sem
// `spans`, o caminho é o de sempre — um único Konva.Text.

export function TextShape({ layer }: { layer: TextLayer }) {
  const groupRef = useRef<Konva.Group>(null);
  const { w, h } = layer.frame;
  const stroke = layer.effects.stroke;
  useNodeBlur(groupRef, layer.effects.blur, [layer]);

  // Só quando há trechos; o Konva mede fora da tela, então é barato mas não
  // é de graça — o useMemo segura entre renders da mesma camada.
  const rich = useMemo(() => (layer.spans?.length ? layoutRichText(layer) : null), [layer]);

  // Marca-texto: retângulo atrás do BLOCO de texto medido (não da caixa inteira),
  // respeitando o alinhamento vertical.
  let highlightRect: { y: number; h: number } | null = null;
  if (layer.highlight) {
    const textH = Math.min(h, measureTextHeight(layer, layer.fontSize));
    const offsetY =
      layer.vAlign === 'middle' ? (h - textH) / 2 : layer.vAlign === 'bottom' ? h - textH : 0;
    highlightRect = { y: offsetY, h: textH };
  }

  const comum = {
    fontFamily: fontStack(layer.fontFamily),
    fontSize: layer.fontSize,
    fontStyle: fontStyleFor(layer.fontWeight),
    lineHeight: layer.lineHeight,
    letterSpacing: layer.letterSpacing,
    textDecoration: layer.underline ? 'underline' : '',
    ...shadowProps(layer.effects),
    stroke: stroke && stroke.width > 0 ? stroke.color : undefined,
    strokeWidth: stroke && stroke.width > 0 ? stroke.width : undefined,
    fillAfterStrokeEnabled: true,
  };

  // Mesmo deslocamento vertical que o Konva aplica ao bloco inteiro.
  const richOffsetY = rich
    ? layer.vAlign === 'middle'
      ? (h - rich.totalHeight) / 2
      : layer.vAlign === 'bottom'
        ? h - rich.totalHeight
        : 0
    : 0;

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
      {rich ? (
        // Cada trecho é um nó: mesma linha de base do texto único (altura da
        // linha e alinhamento vertical "top" reproduzem o posicionamento
        // interno do Konva). Todos escutam eventos — é o que permite clicar em
        // qualquer letra para selecionar a camada.
        rich.runs.map((r, i) => (
          <Text
            key={i}
            x={r.x}
            y={richOffsetY + r.y}
            height={rich.lineHeightPx}
            text={r.text}
            align="left"
            verticalAlign="top"
            wrap="none"
            {...comum}
            {...(r.color ? { fill: resolveColor(r.color) } : konvaFillProps(layer.fill, w, h))}
            listening
          />
        ))
      ) : (
        <Text
          width={w}
          height={h}
          text={konvaText(layer)}
          align={layer.align}
          verticalAlign={layer.vAlign === 'middle' ? 'middle' : layer.vAlign === 'bottom' ? 'bottom' : 'top'}
          {...comum}
          {...konvaFillProps(layer.fill, w, h)}
          wrap="word"
          listening
        />
      )}
    </Group>
  );
}
