import { Group, Rect } from 'react-konva';
import type { FormatDef, Layout } from '@/lib/model/types';
import { fillToSolid } from '@/lib/render/fill';
import { LayerNode } from './LayerNode';

// Cena de um formato: fundo, camadas e overlay de safe zone. Compartilhada entre o
// CanvasStage (modo único, com zoom/pan) e o FormatStage (modo comparar) — um único
// caminho de render, sem duplicação.

interface Props {
  format: FormatDef;
  layout: Layout;
  showSafeArea: boolean;
  interactive?: boolean;
}

export function StageScene({ format, layout, showSafeArea, interactive = true }: Props) {
  return (
    <>
      <Rect
        name="bg"
        x={0}
        y={0}
        width={format.width}
        height={format.height}
        fill={fillToSolid(layout.background)}
        shadowColor="#000"
        shadowBlur={24}
        shadowOpacity={0.4}
      />
      {layout.layers.map((l) => (
        <LayerNode key={l.id} layer={l} interactive={interactive} />
      ))}
      {showSafeArea && (
        <Group listening={false}>
          <Rect
            x={format.safeArea.left}
            y={format.safeArea.top}
            width={format.width - format.safeArea.left - format.safeArea.right}
            height={format.height - format.safeArea.top - format.safeArea.bottom}
            stroke="#3b82f6"
            strokeWidth={2}
            dash={[12, 10]}
            opacity={0.5}
          />
        </Group>
      )}
      {/* Borda do artboard: o LIMITE do anúncio, desenhada por cima de todas as
          camadas — uma imagem que sangra além do formato não pode escondê-la.
          strokeScaleEnabled(false) mantém 1px de tela em qualquer zoom. */}
      <Rect
        x={0}
        y={0}
        width={format.width}
        height={format.height}
        stroke="#8a8a8a"
        strokeWidth={1}
        strokeScaleEnabled={false}
        listening={false}
        opacity={0.9}
      />
    </>
  );
}
