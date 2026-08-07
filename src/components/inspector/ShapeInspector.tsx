import type { ShapeLayer } from '@/lib/model/types';
import { useEditor } from '@/lib/store/editor';
import { NumberField, Row, SectionTitle } from './controls';
import { FillControl } from './StyleControls';

// Fase atual cobre só o retângulo — elipse, linha e seta chegam na Fase 4 (o título
// diz "Retângulo" de propósito, para a interface não sugerir formas que não
// existem). Preenchimento/traçado/sombra vêm do estilo unificado.

export function ShapeInspector({ layer }: { layer: ShapeLayer }) {
  const updateLayer = useEditor((s) => s.updateLayer);
  function set(mutate: (l: ShapeLayer) => void) {
    updateLayer(layer.id, (l) => l.type === 'shape' && mutate(l));
  }

  return (
    <div>
      <SectionTitle>Retângulo</SectionTitle>
      <Row label="Raio">
        <NumberField value={layer.radius ?? 0} min={0} suffix="px" onCommit={(v) => set((l) => (l.radius = v))} />
      </Row>
      <FillControl value={layer.fill} onChange={(fill) => set((l) => (l.fill = fill))} />
    </div>
  );
}
