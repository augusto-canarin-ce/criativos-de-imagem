import { Rect } from 'react-konva';
import type { ShapeLayer } from '@/lib/model/types';
import { fillToSolid } from '@/lib/render/fill';

// Render de uma ShapeLayer retângulo. Elipse, linha e seta chegam na Fase 4; a Fase
// 1 cobre o retângulo — o "botão" do aceite. Raio de canto é um valor único para os
// quatro cantos (SPEC §8: quatro valores é complexidade sem retorno em anúncio).

export function RectShape({ layer }: { layer: ShapeLayer }) {
  const stroke = layer.effects.stroke;
  return (
    <Rect
      width={layer.frame.w}
      height={layer.frame.h}
      fill={fillToSolid(layer.fill)}
      cornerRadius={layer.radius ?? 0}
      stroke={stroke ? stroke.color : undefined}
      strokeWidth={stroke ? stroke.width : undefined}
    />
  );
}
