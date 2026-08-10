import type { ShapeLayer } from '@/lib/model/types';
import { useEditor } from '@/lib/store/editor';
import { NumberField, Row, SectionTitle, ToggleGroup } from './controls';
import { FillControl } from './StyleControls';

// Formas (§8): retângulo (raio único — quatro valores é complexidade sem retorno
// em anúncio), elipse, linha e seta. Linha/seta usam a ALTURA do quadro como
// espessura; a cor vem do preenchimento.

const TITLES: Record<ShapeLayer['shape'], string> = {
  rect: 'Retângulo',
  ellipse: 'Elipse',
  line: 'Linha',
  arrow: 'Seta',
};

export function ShapeInspector({ layer }: { layer: ShapeLayer }) {
  const updateLayer = useEditor((s) => s.updateLayer);
  function set(mutate: (l: ShapeLayer) => void) {
    updateLayer(layer.id, (l) => l.type === 'shape' && mutate(l));
  }

  const isLinear = layer.shape === 'line' || layer.shape === 'arrow';

  return (
    <div>
      <SectionTitle>{TITLES[layer.shape]}</SectionTitle>
      {layer.shape === 'rect' && (
        <Row label="Raio">
          <NumberField value={layer.radius ?? 0} min={0} suffix="px" onCommit={(v) => set((l) => (l.radius = v))} />
        </Row>
      )}
      {isLinear && (
        <>
          <Row label="Espessura">
            <NumberField
              value={layer.frame.h}
              min={1}
              suffix="px"
              onCommit={(v) => set((l) => (l.frame.h = v))}
            />
          </Row>
          <Row label="Ponta">
            <ToggleGroup
              value={layer.shape === 'arrow' ? (layer.arrowHead ?? 'end') : 'none'}
              options={[
                { value: 'none', label: 'Sem' },
                { value: 'end', label: 'Fim' },
                { value: 'both', label: 'Ambas' },
              ]}
              onCommit={(v) =>
                set((l) => {
                  if (v === 'none') {
                    l.shape = 'line';
                    l.arrowHead = undefined;
                  } else {
                    l.shape = 'arrow';
                    l.arrowHead = v as 'end' | 'both';
                  }
                })
              }
            />
          </Row>
        </>
      )}
      <FillControl label={isLinear ? 'Cor' : 'Preenchimento'} value={layer.fill} onChange={(fill) => set((l) => (l.fill = fill))} />
    </div>
  );
}
