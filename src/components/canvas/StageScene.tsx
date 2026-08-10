import { Group, Line, Rect } from 'react-konva';
import type { FormatDef, Layout } from '@/lib/model/types';
import { konvaFillProps } from '@/lib/render/fill';
import { useSnapGuides } from '@/lib/store/snapGuides';
import { useBrandKit } from '@/lib/store/brand';
import { LayerNode } from './LayerNode';

// Cena de um formato, compartilhada entre CanvasStage (modo único), FormatStage
// (modo comparar) e ExportStage — um único caminho de render.
//
// RECORTE DO ARTBOARD: o conteúdo (fundo + camadas) vive num Group com clip no
// limite exato do formato — o que está fora não é desenhado, como no
// Photoshop/Figma. O CROMO fica fora do clip: sombra do artboard (atrás), safe
// zone, guias de snapping e a borda do formato (na frente). O Transformer mora no
// stage pai, também fora do clip.

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
  useBrandKit(); // fundo com token de marca redesenha ao trocar de kit (§6)
  return (
    <>
      {/* Sombra do artboard: CROMO, desenhada por um retângulo próprio ATRÁS do
          conteúdo (o fundo opaco o cobre por inteiro; só a sombra escapa). */}
      {chrome && (
        <Rect
          x={0}
          y={0}
          width={format.width}
          height={format.height}
          fill="#000"
          shadowColor="#000"
          shadowBlur={24}
          shadowOpacity={0.4}
          listening={false}
        />
      )}
      {/* CONTEÚDO com recorte absoluto no limite do formato (Photoshop/Figma):
          nada além do artboard é desenhado — nem durante arraste/resize. O export
          usa esta mesma cena; o clip no limite não altera os pixels internos. */}
      <Group clipX={0} clipY={0} clipWidth={format.width} clipHeight={format.height}>
        <Rect
          name="bg"
          x={0}
          y={0}
          width={format.width}
          height={format.height}
          {...konvaFillProps(layout.background, format.width, format.height)}
        />
        {layout.layers.map((l) => (
          <LayerNode key={l.id} layer={l} interactive={interactive} />
        ))}
      </Group>
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
