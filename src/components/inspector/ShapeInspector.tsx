import type { Fill, ShapeLayer } from '@/lib/model/types';
import { useEditor } from '@/lib/store/editor';
import { ColorField, NumberField, Row, SectionTitle } from './controls';

// Fase 1 cobre o retângulo. Elipse, linha, seta, gradiente e contorno chegam na Fase 4.

export function ShapeInspector({ layer }: { layer: ShapeLayer }) {
  const updateLayer = useEditor((s) => s.updateLayer);
  function set(mutate: (l: ShapeLayer) => void) {
    updateLayer(layer.id, (l) => l.type === 'shape' && mutate(l));
  }
  const solid = layer.fill.kind === 'solid' ? layer.fill.color : '#2563eb';

  return (
    <div>
      <SectionTitle>Forma</SectionTitle>
      <Row label="Cor">
        <ColorField value={solid} onCommit={(hex) => set((l) => (l.fill = { kind: 'solid', color: hex } as Fill))} />
      </Row>
      {layer.shape === 'rect' && (
        <Row label="Raio">
          <NumberField value={layer.radius ?? 0} min={0} suffix="px" onCommit={(v) => set((l) => (l.radius = v))} />
        </Row>
      )}
    </div>
  );
}
