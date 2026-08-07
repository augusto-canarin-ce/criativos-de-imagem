import { useEffect, useRef, useState } from 'react';
import { Stage, Layer as KonvaLayer, Transformer } from 'react-konva';
import type Konva from 'konva';
import type { FormatId, TextLayer } from '@/lib/model/types';
import { useEditor, selectProject } from '@/lib/store/editor';
import { getFormat } from '@/config/formats';
import { StageScene } from './StageScene';
import { useTransformerModifiers } from './useTransformerModifiers';
import { TextEditorOverlay } from './TextEditorOverlay';

// Um formato renderizado em escala fixa de ajuste (sem zoom/pan próprio) — a peça
// do modo comparar. O formato EM FOCO é totalmente editável (seleção, arraste,
// transformer, duplo clique para texto); os outros ficam com listening desligado e
// só se atualizam quando um commit confirma a operação (§16: o arraste não comita
// até soltar, então os derivados não redesenham durante o gesto).

const PAD = 16;

interface Props {
  formatId: FormatId;
  interactive: boolean;
}

export function FormatStage({ formatId, interactive }: Props) {
  const project = useEditor(selectProject);
  const showSafeArea = useEditor((s) => s.showSafeArea);
  const selectedIds = useEditor((s) => s.selectedIds);
  const editingId = useEditor((s) => s.editingId);
  const { clearSelection, setEditing } = useEditor.getState();

  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const trRef = useRef<Konva.Transformer>(null);
  useTransformerModifiers(trRef);
  const [box, setBox] = useState({ w: 1, h: 1 });

  const format = getFormat(formatId);
  const layout = project?.layouts[formatId];

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setBox({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  const scale = Math.min(
    (box.w - PAD * 2) / format.width,
    (box.h - PAD * 2) / format.height,
  );
  const s = Math.max(0.01, scale);
  const ox = (box.w - format.width * s) / 2;
  const oy = (box.h - format.height * s) / 2;

  // Transformer segue a seleção — só no stage em foco.
  useEffect(() => {
    const tr = trRef.current;
    const stage = stageRef.current;
    if (!tr || !stage) return;
    const nodes =
      !interactive || editingId
        ? []
        : selectedIds.map((id) => stage.findOne(`#${id}`)).filter((n): n is Konva.Node => !!n);
    tr.nodes(nodes);
    tr.getLayer()?.batchDraw();
  }, [selectedIds, editingId, interactive, project]);

  if (!project || !layout) return null;

  const editingLayer =
    interactive && editingId
      ? layout.layers.find((l) => l.id === editingId && l.type === 'text')
      : undefined;

  return (
    <div ref={wrapRef} className="relative h-full w-full overflow-hidden">
      <Stage
        ref={stageRef}
        width={box.w}
        height={box.h}
        listening={interactive}
        onMouseDown={(e) => {
          if (!interactive) return;
          if (e.target === e.target.getStage() || e.target.name() === 'bg') {
            clearSelection();
            if (editingId) setEditing(null);
          }
        }}
      >
        <KonvaLayer x={ox} y={oy} scaleX={s} scaleY={s}>
          <StageScene
            format={format}
            layout={layout}
            showSafeArea={showSafeArea}
            interactive={interactive}
          />
          {interactive && (
            <Transformer
              ref={trRef}
              rotateEnabled
              keepRatio={false}
              ignoreStroke
              anchorSize={9}
              borderStroke="#10b981"
              anchorStroke="#10b981"
              anchorCornerRadius={2}
              boundBoxFunc={(oldBox, newBox) =>
                newBox.width < 8 || newBox.height < 8 ? oldBox : newBox
              }
            />
          )}
        </KonvaLayer>
      </Stage>

      {editingLayer && (
        <TextEditorOverlay layer={editingLayer as TextLayer} scale={s} panX={ox} panY={oy} />
      )}
    </div>
  );
}
