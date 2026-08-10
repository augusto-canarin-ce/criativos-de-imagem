import { Group } from 'react-konva';
import type Konva from 'konva';
import type { BlendMode, GroupLayer, Layer } from '@/lib/model/types';
import { useEditor, selectProject } from '@/lib/store/editor';
import { getFormat } from '@/config/formats';
import { snapFrame, otherFrames, SNAP_TOLERANCE_SCREEN } from '@/lib/layout/snapping';
import { setSnapGuides, clearSnapGuides } from '@/lib/store/snapGuides';
import { scaleGroupChildren } from '@/lib/model/groups';
import { ImageShape } from './ImageShape';
import { TextShape } from './TextShape';
import { EllipseShape, LineShape, RectShape } from './RectShape';

// Um Group do Konva por camada do projeto, TODOS dentro de um único Konva.Layer
// (requisito dos blend modes e da performance — SPEC §8/§16). O Group carrega
// posição, rotação, opacidade e blend mode; o shape interno desenha em (0,0).
//
// GRUPOS do projeto: recursivos — os filhos rendem em coordenadas relativas e NÃO
// são interativos (clicar num filho seleciona o grupo; seleção de filho individual
// pelo painel de camadas). SNAPPING (§8): calculado durante o arraste, na escala de
// tela, com guias vermelhas transitórias; Alt desativa.

const MIN = 8;

function gco(mode: BlendMode): GlobalCompositeOperation {
  return mode === 'normal' ? 'source-over' : (mode as GlobalCompositeOperation);
}

function shapeFor(layer: Layer, interactive: boolean): React.ReactNode {
  switch (layer.type) {
    case 'image':
      return <ImageShape layer={layer} />;
    case 'text':
      return <TextShape layer={layer} />;
    case 'shape':
      if (layer.shape === 'rect') return <RectShape layer={layer} />;
      if (layer.shape === 'ellipse') return <EllipseShape layer={layer} />;
      return <LineShape layer={layer} />;
    case 'group':
      return (layer as GroupLayer).children.map((child) => (
        // Filhos: sem interação própria (o clique sobe para o grupo) e sem
        // arrasto — mas visíveis normalmente.
        <LayerNode key={child.id} layer={child} interactive={interactive} asGroupChild />
      ));
  }
}

export function LayerNode({
  layer,
  interactive = true,
  asGroupChild = false,
}: {
  layer: Layer;
  interactive?: boolean;
  asGroupChild?: boolean;
}) {
  const tool = useEditor((s) => s.tool);
  const editingId = useEditor((s) => s.editingId);
  const select = useEditor((s) => s.select);
  const toggleSelect = useEditor((s) => s.toggleSelect);
  const setEditing = useEditor((s) => s.setEditing);
  const updateLayer = useEditor((s) => s.updateLayer);

  // `interactive=false` = cópia exibida num stage fora de foco (modo comparar).
  // `asGroupChild` = filho de grupo: desenha, mas não responde a eventos próprios.
  const isEditing = interactive && !asGroupChild && editingId === layer.id;
  const draggable =
    interactive && !asGroupChild && tool === 'select' && !layer.locked && !isEditing;

  function handleSelect(e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
    if (tool !== 'select') return;
    e.cancelBubble = true;
    if (layer.locked) return;
    if (e.evt.shiftKey) toggleSelect(layer.id);
    else select([layer.id]);
  }

  function handleDragMove(e: Konva.KonvaEventObject<DragEvent>) {
    const node = e.target;
    // Alt desativa o snapping temporariamente (§8).
    if (e.evt.altKey) {
      clearSnapGuides();
      return;
    }
    const state = useEditor.getState();
    const project = selectProject(state);
    if (!project) return;
    const format = getFormat(state.activeFormat);
    const layout = project.layouts[state.activeFormat];
    // Tolerância de 6px NA TELA → converte para px de documento pela escala atual.
    const scale = node.getAbsoluteScale().x || 1;
    const tolerance = SNAP_TOLERANCE_SCREEN / scale;
    const frame = { x: node.x(), y: node.y(), w: layer.frame.w, h: layer.frame.h };
    const snapped = snapFrame(
      frame,
      format,
      format.safeArea,
      otherFrames(layout.layers, [layer.id]),
      tolerance,
    );
    node.position({ x: snapped.x, y: snapped.y });
    setSnapGuides(snapped.guides);
  }

  function handleDragEnd(e: Konva.KonvaEventObject<DragEvent>) {
    clearSnapGuides();
    const node = e.target;
    updateLayer(layer.id, (l) => {
      l.frame.x = Math.round(node.x());
      l.frame.y = Math.round(node.y());
    });
  }

  function handleTransformEnd(e: Konva.KonvaEventObject<Event>) {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const w = Math.max(MIN, Math.round(layer.frame.w * scaleX));
    const h = Math.max(MIN, Math.round(layer.frame.h * scaleY));
    const x = Math.round(node.x());
    const y = Math.round(node.y());
    const rotation = node.rotation();
    // Zera a escala imperativa antes do re-render converter escala → w/h.
    node.scaleX(1);
    node.scaleY(1);
    updateLayer(layer.id, (l) => {
      if (l.type === 'group') {
        // Redimensionar grupo escala a geometria dos filhos (Figma-like).
        scaleGroupChildren(l, w / l.frame.w, h / l.frame.h);
      }
      l.frame.w = w;
      l.frame.h = h;
      l.frame.x = x;
      l.frame.y = y;
      l.rotation = rotation;
    });
  }

  return (
    <Group
      id={asGroupChild ? undefined : layer.id}
      name="layer"
      x={layer.frame.x}
      y={layer.frame.y}
      rotation={layer.rotation}
      opacity={layer.opacity}
      globalCompositeOperation={gco(layer.blendMode)}
      visible={layer.visible && !isEditing}
      listening={!asGroupChild && !layer.locked}
      draggable={draggable}
      onMouseDown={asGroupChild ? undefined : handleSelect}
      onClick={asGroupChild ? undefined : handleSelect}
      onTap={asGroupChild ? undefined : handleSelect}
      onDblClick={() => !asGroupChild && layer.type === 'text' && !layer.locked && setEditing(layer.id)}
      onDblTap={() => !asGroupChild && layer.type === 'text' && !layer.locked && setEditing(layer.id)}
      onDragStart={() => select([layer.id])}
      onDragMove={draggable ? handleDragMove : undefined}
      onDragEnd={handleDragEnd}
      onTransformEnd={handleTransformEnd}
    >
      {shapeFor(layer, interactive)}
    </Group>
  );
}
