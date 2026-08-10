import { useRef } from 'react';
import { Group, Image as KonvaImage, Rect, Text } from 'react-konva';
import type Konva from 'konva';
import type { ImageLayer } from '@/lib/model/types';
import { computeContain, computeCover } from '@/lib/render/coverFrame';
import { fontStack } from '@/lib/fonts/stacks';
import { useImageAsset } from './useImageAsset';
import { shadowProps, strokeRectGeometry } from './RectShape';
import { useNodeBlur } from './useNodeBlur';
import { useImageFilters } from './useImageFilters';

// Render de uma ImageLayer. Preenchida = cover/contain não destrutivos, com CROP
// (recorte na imagem original), MÁSCARA por forma (clipFunc do grupo — §8),
// ajustes por filtro e o estilo unificado (traçado/sombra/blur). Vazia = o
// placeholder tracejado com rótulo — mesmo quadro, mesmo comportamento (§8).

function maskClip(layer: ImageLayer): ((ctx: Konva.Context) => void) | undefined {
  const mask = layer.mask;
  if (!mask) return undefined;
  const { w, h } = layer.frame;
  if (mask.shape === 'ellipse') {
    return (ctx) => {
      ctx.beginPath();
      ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2, false);
      ctx.closePath();
    };
  }
  const r = Math.min(mask.radius ?? 0, w / 2, h / 2);
  return (ctx) => {
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.arcTo(w, 0, w, h, r);
    ctx.arcTo(w, h, 0, h, r);
    ctx.arcTo(0, h, 0, 0, r);
    ctx.arcTo(0, 0, w, 0, r);
    ctx.closePath();
  };
}

export function ImageShape({ layer }: { layer: ImageLayer }) {
  const { image, status } = useImageAsset(layer.assetId);
  const groupRef = useRef<Konva.Group>(null);
  const imageRef = useRef<Konva.Image>(null);
  const { w, h } = layer.frame;
  const stroke = layer.effects.stroke;
  useNodeBlur(groupRef, layer.effects.blur, [layer, image]);
  useImageFilters(imageRef, layer, [image, layer.assetId, layer.crop, layer.frame.w, layer.frame.h]);

  if (image && status === 'loaded') {
    const natural = { width: image.naturalWidth, height: image.naturalHeight };
    const box =
      layer.fit === 'contain'
        ? computeContain(layer.frame, natural, layer.crop)
        : computeCover(layer.frame, natural, layer.focalPoint, layer.crop);
    const offsetX = layer.fit === 'contain' ? (w - box.width) / 2 : 0;
    const offsetY = layer.fit === 'contain' ? (h - box.height) / 2 : 0;
    const clip = maskClip(layer);
    return (
      <>
        <Group
          ref={groupRef}
          clipFunc={clip}
          clipX={clip ? undefined : 0}
          clipY={clip ? undefined : 0}
          clipWidth={clip ? undefined : w}
          clipHeight={clip ? undefined : h}
        >
          <KonvaImage
            ref={imageRef}
            image={image}
            x={offsetX}
            y={offsetY}
            width={box.width}
            height={box.height}
            crop={box.crop}
            {...shadowProps(layer.effects)}
          />
        </Group>
        {stroke && stroke.width > 0 && layer.mask?.shape !== 'ellipse' && (
          <Rect
            {...(() => {
              const g = strokeRectGeometry(w, h, layer.mask?.radius ?? 0, stroke);
              return { x: g.x, y: g.y, width: g.w, height: g.h, cornerRadius: g.radius };
            })()}
            stroke={stroke.color}
            strokeWidth={stroke.width}
            listening={false}
          />
        )}
      </>
    );
  }

  return <PlaceholderBox layer={layer} error={status === 'error'} />;
}

function PlaceholderBox({ layer, error }: { layer: ImageLayer; error: boolean }) {
  const { w, h } = layer.frame;
  const label = error ? 'Imagem indisponível' : layer.placeholder.label || 'Imagem';
  return (
    <Group listening>
      <Rect
        width={w}
        height={h}
        fill="#2a2a2a"
        stroke="#6b6b6b"
        strokeWidth={2}
        dash={[10, 8]}
        cornerRadius={layer.mask?.shape === 'ellipse' ? Math.min(w, h) / 2 : (layer.mask?.radius ?? 0)}
      />
      <Text
        width={w}
        height={h}
        text={label}
        align="center"
        verticalAlign="middle"
        fontSize={Math.max(18, Math.min(w, h) * 0.06)}
        fontFamily={fontStack('Geist Sans')}
        fill="#b0b0b0"
        listening={false}
        padding={12}
      />
    </Group>
  );
}
