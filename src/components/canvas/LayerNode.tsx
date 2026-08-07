import { Group } from 'react-konva';
import type Konva from 'konva';
import type { BlendMode, Layer } from '@/lib/model/types';
import { useEditor } from '@/lib/store/editor';
import { ImageShape } from './ImageShape';
import { TextShape } from './TextShape';
import { RectShape } from './RectShape';

// Um Group do Konva por camada do projeto, TODOS dentro de um único Konva.Layer
// (requisito dos blend modes e da performance — SPEC §8/§16). O Group carrega
// posição, rotação, opacidade e blend mode; o shape interno desenha em (0,0).

const MIN = 8;

function gco(mode: BlendMode): GlobalCompositeOperation {
  return mode === 'normal' ? 'source-over' : (mode as GlobalCompositeOperation);
}

export function LayerNode({ layer }: { layer: Layer }) {
  const tool = useEditor((s) => s.tool);
  const editingId = useEditor((s) => s.editingId);
  const select = useEditor((s) => s.select);
  const toggleSelect = useEditor((s) => s.toggleSelect);
  const setEditing = useEditor((s) => s.setEditing);
  const updateLayer = useEditor((s) => s.updateLayer);

  const isEditing = editingId === layer.id;
  const draggable = tool === 'select' && !layer.locked && !isEditing;

  function handleSelect(e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
    // Com uma ferramenta de inserção ativa, deixa o evento borbulhar até o stage
    // (que insere no ponto), mesmo por cima de uma camada — ferramenta tem
    // prioridade sobre seleção.
    if (tool !== 'select') return;
    e.cancelBubble = true;
    if (layer.locked) return;
    if (e.evt.shiftKey) toggleSelect(layer.id);
    else select([layer.id]);
  }

  function handleDragEnd(e: Konva.KonvaEventObject<DragEvent>) {
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
      l.frame.w = w;
      l.frame.h = h;
      l.frame.x = x;
      l.frame.y = y;
      l.rotation = rotation;
    });
  }

  return (
    <Group
      id={layer.id}
      name="layer"
      x={layer.frame.x}
      y={layer.frame.y}
      rotation={layer.rotation}
      opacity={layer.opacity}
      globalCompositeOperation={gco(layer.blendMode)}
      visible={layer.visible && !isEditing}
      listening={!layer.locked}
      draggable={draggable}
      onMouseDown={handleSelect}
      onClick={handleSelect}
      onTap={handleSelect}
      onDblClick={() => layer.type === 'text' && !layer.locked && setEditing(layer.id)}
      onDblTap={() => layer.type === 'text' && !layer.locked && setEditing(layer.id)}
      onDragStart={() => select([layer.id])}
      onDragEnd={handleDragEnd}
      onTransformEnd={handleTransformEnd}
    >
      {layer.type === 'image' && <ImageShape layer={layer} />}
      {layer.type === 'text' && <TextShape layer={layer} />}
      {layer.type === 'shape' && layer.shape === 'rect' && <RectShape layer={layer} />}
    </Group>
  );
}
