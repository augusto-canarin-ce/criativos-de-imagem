import type { BlendMode, Layer } from '@/lib/model/types';
import { useEditor } from '@/lib/store/editor';
import { NumberField, Row, SectionTitle, SliderField } from './controls';

// Campos comuns a qualquer camada: posição, tamanho, rotação, opacidade e blend
// mode — conjunto completo, organizado em GRUPOS no seletor (§8), com normal no
// topo fora deles.

const BLEND_GROUPS: { label: string; modes: { value: BlendMode; label: string }[] }[] = [
  {
    label: 'Escurecer',
    modes: [
      { value: 'darken', label: 'Escurecer' },
      { value: 'multiply', label: 'Multiplicar' },
      { value: 'color-burn', label: 'Superexposição de cor' },
    ],
  },
  {
    label: 'Clarear',
    modes: [
      { value: 'lighten', label: 'Clarear' },
      { value: 'screen', label: 'Divisão' },
      { value: 'color-dodge', label: 'Subexposição de cor' },
    ],
  },
  {
    label: 'Contraste',
    modes: [
      { value: 'overlay', label: 'Sobrepor' },
      { value: 'soft-light', label: 'Luz suave' },
      { value: 'hard-light', label: 'Luz forte' },
    ],
  },
  {
    label: 'Comparar',
    modes: [
      { value: 'difference', label: 'Diferença' },
      { value: 'exclusion', label: 'Exclusão' },
    ],
  },
  {
    label: 'Cor',
    modes: [
      { value: 'hue', label: 'Matiz' },
      { value: 'saturation', label: 'Saturação' },
      { value: 'color', label: 'Cor' },
      { value: 'luminosity', label: 'Luminosidade' },
    ],
  },
];

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
      <Row label="Mesclagem">
        <select
          className="h-8 w-full cursor-pointer rounded-md border border-hairline-strong/60 bg-transparent px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald/40"
          value={layer.blendMode}
          onChange={(e) => updateLayer(layer.id, (l) => (l.blendMode = e.target.value as BlendMode))}
        >
          <option value="normal">Normal</option>
          {BLEND_GROUPS.map((g) => (
            <optgroup key={g.label} label={g.label}>
              {g.modes.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </Row>
    </div>
  );
}
