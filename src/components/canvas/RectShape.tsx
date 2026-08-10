import { useRef } from 'react';
import { Arrow, Ellipse, Group, Line, Rect } from 'react-konva';
import type Konva from 'konva';
import type { Effects, ShapeLayer } from '@/lib/model/types';
import { fillToSolid, konvaFillProps } from '@/lib/render/fill';
import { useNodeBlur } from './useNodeBlur';

// Formas com o estilo unificado: retângulo, elipse, linha e seta (SPEC §8).
// Preenchimento sólido/gradiente, traçado com posição (dentro/centro/fora —
// emulado por geometria, já que o canvas só traça centrado), sombra e blur.

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

/** Elipse inscrita no quadro. Traçado com posição via ajuste dos raios. */
export function EllipseShape({ layer }: { layer: ShapeLayer }) {
  const groupRef = useRef<Konva.Group>(null);
  const { w, h } = layer.frame;
  const stroke = layer.effects.stroke;
  useNodeBlur(groupRef, layer.effects.blur, [layer]);

  const strokeRadius = (r: number, sw: number) =>
    stroke?.position === 'inside' ? Math.max(0, r - sw / 2) : stroke?.position === 'outside' ? r + sw / 2 : r;

  return (
    <Group ref={groupRef}>
      <Ellipse
        x={w / 2}
        y={h / 2}
        radiusX={w / 2}
        radiusY={h / 2}
        {...konvaFillProps(layer.fill, w, h)}
        {...shadowProps(layer.effects)}
      />
      {stroke && stroke.width > 0 && (
        <Ellipse
          x={w / 2}
          y={h / 2}
          radiusX={strokeRadius(w / 2, stroke.width)}
          radiusY={strokeRadius(h / 2, stroke.width)}
          stroke={stroke.color}
          strokeWidth={stroke.width}
          listening={false}
        />
      )}
    </Group>
  );
}

/** Linha/seta: atravessa o quadro na horizontal; a ESPESSURA é a altura do quadro
 *  (girar/redimensionar pelo transformer cobre qualquer ângulo). A cor vem do
 *  preenchimento (sólido; gradiente cai para a primeira parada). */
export function LineShape({ layer }: { layer: ShapeLayer }) {
  const groupRef = useRef<Konva.Group>(null);
  const { w, h } = layer.frame;
  const color = fillToSolid(layer.fill);
  const thickness = Math.max(1, h);
  useNodeBlur(groupRef, layer.effects.blur, [layer]);

  const common = {
    points: [0, h / 2, w, h / 2],
    stroke: color,
    strokeWidth: thickness,
    lineCap: 'round' as const,
    ...shadowProps(layer.effects),
  };

  return (
    <Group ref={groupRef}>
      {layer.shape === 'arrow' ? (
        <Arrow
          {...common}
          fill={color}
          pointerLength={thickness * 2.2}
          pointerWidth={thickness * 2.2}
          pointerAtBeginning={layer.arrowHead === 'both'}
        />
      ) : (
        <Line {...common} />
      )}
    </Group>
  );
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
