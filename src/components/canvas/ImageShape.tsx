import { Group, Image as KonvaImage, Rect, Text } from 'react-konva';
import type { ImageLayer } from '@/lib/model/types';
import { computeContain, computeCover } from '@/lib/render/coverFrame';
import { useImageAsset } from './useImageAsset';

// Render de uma ImageLayer. Preenchida = imagem em cover/contain não destrutivo.
// Vazia (assetId null) ou ainda carregando = placeholder tracejado com rótulo
// (SPEC §8): o mesmo quadro serve preenchido ou vazio — placeholder não é tipo novo.

export function ImageShape({ layer }: { layer: ImageLayer }) {
  const { image, status } = useImageAsset(layer.assetId);
  const { w, h } = layer.frame;

  if (image && status === 'loaded') {
    const natural = { width: image.naturalWidth, height: image.naturalHeight };
    const box =
      layer.fit === 'contain'
        ? computeContain(layer.frame, natural)
        : computeCover(layer.frame, natural, layer.focalPoint);
    // 'contain' centraliza a imagem dentro do quadro.
    const offsetX = layer.fit === 'contain' ? (w - box.width) / 2 : 0;
    const offsetY = layer.fit === 'contain' ? (h - box.height) / 2 : 0;
    return (
      <Group clipX={0} clipY={0} clipWidth={w} clipHeight={h}>
        <KonvaImage
          image={image}
          x={offsetX}
          y={offsetY}
          width={box.width}
          height={box.height}
          crop={box.crop}
        />
      </Group>
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
        fontFamily="Inter, system-ui, sans-serif"
        fill="#b0b0b0"
        listening={false}
        padding={12}
      />
    </Group>
  );
}
