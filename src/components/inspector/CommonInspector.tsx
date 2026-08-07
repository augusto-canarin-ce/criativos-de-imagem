import type { Layer } from '@/lib/model/types';
import { useEditor } from '@/lib/store/editor';
import { NumberField, Row, SectionTitle, SliderField } from './controls';

// Campos comuns a qualquer camada: posição, tamanho, rotação e opacidade.

export function CommonInspector({ layer }: { layer: Layer }) {
  const updateLayer = useEditor((s) => s.updateLayer);
  const updateLayerLive = useEditor((s) => s.updateLayerLive);
  const endLive = useEditor((s) => s.endLive);

  return (
    <div>
      <SectionTitle>Transformar</SectionTitle>
      <div className="grid grid-cols-2 gap-x-3">
        <Row label="X">
          <NumberField value={layer.frame.x} onCommit={(v) => updateLayer(layer.id, (l) => (l.frame.x = v))} />
        </Row>
        <Row label="Y">
          <NumberField value={layer.frame.y} onCommit={(v) => updateLayer(layer.id, (l) => (l.frame.y = v))} />
        </Row>
        <Row label="L">
          <NumberField value={layer.frame.w} min={1} onCommit={(v) => updateLayer(layer.id, (l) => (l.frame.w = v))} />
        </Row>
        <Row label="A">
          <NumberField value={layer.frame.h} min={1} onCommit={(v) => updateLayer(layer.id, (l) => (l.frame.h = v))} />
        </Row>
      </div>
      <Row label="Rotação">
        <NumberField value={layer.rotation} suffix="°" onCommit={(v) => updateLayer(layer.id, (l) => (l.rotation = v))} />
      </Row>
      <Row label="Opacidade">
        <SliderField
          value={Math.round(layer.opacity * 100)}
          min={0}
          max={100}
          onLive={(v) => updateLayerLive(layer.id, `opacity:${layer.id}`, (l) => (l.opacity = v / 100))}
          onEnd={endLive}
        />
      </Row>
    </div>
  );
}
