import { Group, Line, Rect } from 'react-konva';
import type { FormatDef, Layout } from '@/lib/model/types';
import { konvaFillProps } from '@/lib/render/fill';
import { useSnapGuides } from '@/lib/store/snapGuides';
import { LayerNode } from './LayerNode';

// Cena de um formato: fundo, camadas e overlay de safe zone. Compartilhada entre o
// CanvasStage (modo único, com zoom/pan) e o FormatStage (modo comparar) — um único
// caminho de render, sem duplicação.

interface Props {
  format: FormatDef;
  layout: Layout;
  showSafeArea: boolean;
  interactive?: boolean;
  /** Cromo do editor (borda do artboard, sombra do fundo). Desligar no EXPORT —
   *  o arquivo final leva só o criativo. */
  chrome?: boolean;
}

export function StageScene({
  format,
  layout,
  showSafeArea,
  interactive = true,
  chrome = true,
}: Props) {
  const guides = useSnapGuides((s) => s.guides);
  return (
    <>
      <Rect
        name="bg"
        x={0}
        y={0}
        width={format.width}
        height={format.height}
        {...konvaFillProps(layout.background, format.width, format.height)}
        shadowColor={chrome ? '#000' : undefined}
        shadowBlur={chrome ? 24 : 0}
        shadowOpacity={chrome ? 0.4 : 0}
        shadowEnabled={chrome}
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
      {/* Guias de snapping — vermelhas finas, SÓ durante o arraste (§8). */}
      {chrome && interactive && guides.length > 0 && (
        <Group listening={false}>
          {guides.map((g, i) =>
            g.axis === 'v' ? (
              <Line
                key={i}
                points={[g.at, 0, g.at, format.height]}
                stroke="#ef4444"
                strokeWidth={1}
                strokeScaleEnabled={false}
              />
            ) : (
              <Line
                key={i}
                points={[0, g.at, format.width, g.at]}
                stroke="#ef4444"
                strokeWidth={1}
                strokeScaleEnabled={false}
              />
            ),
          )}
        </Group>
      )}
      {/* Borda do artboard: o LIMITE do anúncio, desenhada por cima de todas as
          camadas — uma imagem que sangra além do formato não pode escondê-la.
          strokeScaleEnabled(false) mantém 1px de tela em qualquer zoom. */}
      {chrome && (
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
      )}
    </>
  );
}
