import { useRef } from 'react';
import { Group, Rect } from 'react-konva';
import type Konva from 'konva';
import type { Effects, ShapeLayer } from '@/lib/model/types';
import { konvaFillProps } from '@/lib/render/fill';
import { useNodeBlur } from './useNodeBlur';

// Retângulo com o estilo unificado: preenchimento sólido/gradiente, traçado com
// posição (dentro/centro/fora — emulado por geometria, já que o canvas só traça
// centrado), sombra e blur. Elipse/linha/seta chegam na Fase 4.

export function shadowProps(effects: Effects): Record<string, unknown> {
  const s = effects.shadow;
  if (!s) return {};
  return {
    shadowColor: s.color,
    shadowOffsetX: s.x,
    shadowOffsetY: s.y,
    shadowBlur: s.blur,
    shadowOpacity: s.opacity,
  };
}

/** Geometria do traçado conforme a posição. O stroke do canvas é sempre centrado
 *  no caminho; dentro/fora entram deslocando o retângulo do traçado. */
export function strokeRectGeometry(
  w: number,
  h: number,
  radius: number,
  stroke: NonNullable<Effects['stroke']>,
): { x: number; y: number; w: number; h: number; radius: number } {
  const sw = stroke.width;
  if (stroke.position === 'inside') {
    return { x: sw / 2, y: sw / 2, w: w - sw, h: h - sw, radius: Math.max(0, radius - sw / 2) };
  }
  if (stroke.position === 'outside') {
    return { x: -sw / 2, y: -sw / 2, w: w + sw, h: h + sw, radius: radius + sw / 2 };
  }
  return { x: 0, y: 0, w, h, radius };
}

export function RectShape({ layer }: { layer: ShapeLayer }) {
  const groupRef = useRef<Konva.Group>(null);
  const { w, h } = layer.frame;
  const radius = layer.radius ?? 0;
  const stroke = layer.effects.stroke;
  useNodeBlur(groupRef, layer.effects.blur, [layer]);

  return (
    <Group ref={groupRef}>
      <Rect
        width={w}
        height={h}
        cornerRadius={radius}
        {...konvaFillProps(layer.fill, w, h)}
        {...shadowProps(layer.effects)}
      />
      {stroke && stroke.width > 0 && (
        <Rect
          {...(() => {
            const g = strokeRectGeometry(w, h, radius, stroke);
            return { x: g.x, y: g.y, width: g.w, height: g.h, cornerRadius: g.radius };
          })()}
          stroke={stroke.color}
          strokeWidth={stroke.width}
          listening={false}
        />
      )}
    </Group>
  );
}
