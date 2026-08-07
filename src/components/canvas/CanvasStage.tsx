import { useEffect, useRef } from 'react';
import { Stage, Layer as KonvaLayer, Rect, Transformer, Group } from 'react-konva';
import type Konva from 'konva';
import { useEditor, selectProject } from '@/lib/store/editor';
import { useViewport } from '@/lib/store/viewport';
import { getFormat } from '@/config/formats';
import { fillToSolid } from '@/lib/render/fill';
import { createTextLayer, createRectLayer } from '@/lib/model/layers';
import type { TextLayer } from '@/lib/model/types';
import { LayerNode } from './LayerNode';
import { TextEditorOverlay } from './TextEditorOverlay';

// Palco do Konva: UM único Konva.Layer com Groups dentro (SPEC §8/§16). A câmera
// (zoom/pan) mora no viewport store; o conteúdo é desenhado no tamanho real do
// formato (1080px de largura de verdade) e exibido por escala — o mesmo palco que a
// Fase 3 vai usar no export, sem um segundo caminho de render.

export function CanvasStage() {
  const project = useEditor(selectProject);
  const activeFormat = useEditor((s) => s.activeFormat);
  const selectedIds = useEditor((s) => s.selectedIds);
  const tool = useEditor((s) => s.tool);
  const editingId = useEditor((s) => s.editingId);
  const showSafeArea = useEditor((s) => s.showSafeArea);
  const { clearSelection, addLayer, setTool, setEditing } = useEditor.getState();

  const vp = useViewport();
  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const space = useRef(false);
  const pan = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  const format = getFormat(activeFormat);
  const layout = project?.layouts[activeFormat];

  // Tamanho do contêiner → viewport, com ajuste inicial à tela.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      useViewport.getState().setContainer(el.clientWidth, el.clientHeight);
    });
    ro.observe(el);
    useViewport.getState().setContainer(el.clientWidth, el.clientHeight);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    useViewport.getState().setContent(format.width, format.height);
    useViewport.getState().fit();
  }, [format.width, format.height, project?.id]);

  // Barra de espaço ativa o pan por arrasto (SPEC §8).
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isTyping()) {
        space.current = true;
        if (wrapRef.current) wrapRef.current.style.cursor = 'grab';
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        space.current = false;
        if (wrapRef.current) wrapRef.current.style.cursor = '';
      }
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  // Transformer segue a seleção (não aparece durante edição de texto).
  useEffect(() => {
    const tr = trRef.current;
    const stage = stageRef.current;
    if (!tr || !stage) return;
    const nodes = editingId
      ? []
      : selectedIds.map((id) => stage.findOne(`#${id}`)).filter((n): n is Konva.Node => !!n);
    tr.nodes(nodes);
    tr.getLayer()?.batchDraw();
  }, [selectedIds, editingId, project]);

  function toContent(p: { x: number; y: number }) {
    return { x: (p.x - vp.x) / vp.scale, y: (p.y - vp.y) / vp.scale };
  }

  function onStageMouseDown(e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
    if (space.current) return; // pan cuida do arrasto
    const pos = stageRef.current?.getPointerPosition();
    if (!pos) return;
    const c = toContent(pos);
    if (tool === 'text') {
      const layer = createTextLayer(activeFormat, 'Título');
      layer.frame.x = Math.round(c.x - layer.frame.w / 2);
      layer.frame.y = Math.round(c.y - layer.frame.h / 2);
      addLayer(layer);
      setTool('select');
      setEditing(layer.id);
    } else if (tool === 'rect') {
      const layer = createRectLayer(activeFormat);
      layer.frame.x = Math.round(c.x - layer.frame.w / 2);
      layer.frame.y = Math.round(c.y - layer.frame.h / 2);
      addLayer(layer);
      setTool('select');
    } else if (e.target === e.target.getStage() || e.target.name() === 'bg') {
      // Ferramenta de seleção: só limpa ao clicar no vazio/fundo (camadas cancelam
      // o bubble antes de chegar aqui).
      clearSelection();
      if (editingId) setEditing(null);
    }
  }

  function onWheel(e: Konva.KonvaEventObject<WheelEvent>) {
    e.evt.preventDefault();
    const pos = stageRef.current?.getPointerPosition();
    if (e.evt.ctrlKey || e.evt.metaKey) {
      const factor = e.evt.deltaY < 0 ? 1.08 : 1 / 1.08;
      vp.zoomBy(factor, pos ?? undefined);
    } else {
      vp.setPan(vp.x - e.evt.deltaX, vp.y - e.evt.deltaY);
    }
  }

  function onPointerDown(e: React.PointerEvent) {
    if (!space.current) return;
    (e.target as Element).setPointerCapture(e.pointerId);
    pan.current = { x: vp.x, y: vp.y, px: e.clientX, py: e.clientY };
    if (wrapRef.current) wrapRef.current.style.cursor = 'grabbing';
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!pan.current) return;
    useViewport.getState().setPan(pan.current.x + (e.clientX - pan.current.px), pan.current.y + (e.clientY - pan.current.py));
  }
  function onPointerUp() {
    pan.current = null;
    if (wrapRef.current) wrapRef.current.style.cursor = space.current ? 'grab' : '';
  }

  if (!project || !layout) return null;
  const editingLayer =
    editingId && layout.layers.find((l) => l.id === editingId && l.type === 'text');

  return (
    <div
      ref={wrapRef}
      className="relative h-full w-full overflow-hidden bg-[#0f0f0f]"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <Stage
        ref={stageRef}
        width={vp.container.w}
        height={vp.container.h}
        onMouseDown={onStageMouseDown}
        onTouchStart={onStageMouseDown}
        onWheel={onWheel}
      >
        <KonvaLayer x={vp.x} y={vp.y} scaleX={vp.scale} scaleY={vp.scale}>
          <Rect name="bg" x={0} y={0} width={format.width} height={format.height} fill={fillToSolid(layout.background)} shadowColor="#000" shadowBlur={24} shadowOpacity={0.4} />
          {layout.layers.map((l) => (
            <LayerNode key={l.id} layer={l} />
          ))}
          {showSafeArea && (
            <Group listening={false}>
              <Rect
                x={format.safeArea.left}
                y={format.safeArea.top}
                width={format.width - format.safeArea.left - format.safeArea.right}
                height={format.height - format.safeArea.top - format.safeArea.bottom}
                stroke="#4ade80"
                strokeWidth={2}
                dash={[12, 10]}
                opacity={0.5}
              />
            </Group>
          )}
          <Transformer
            ref={trRef}
            rotateEnabled
            keepRatio={false}
            ignoreStroke
            anchorSize={10}
            borderStroke="#3b82f6"
            anchorStroke="#3b82f6"
            anchorCornerRadius={2}
            boundBoxFunc={(oldBox, newBox) => (newBox.width < 8 || newBox.height < 8 ? oldBox : newBox)}
          />
        </KonvaLayer>
      </Stage>

      {editingLayer && (
        <TextEditorOverlay
          layer={editingLayer as TextLayer}
          scale={vp.scale}
          panX={vp.x}
          panY={vp.y}
        />
      )}
    </div>
  );
}

function isTyping(): boolean {
  const el = document.activeElement;
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || (el as HTMLElement).isContentEditable);
}
