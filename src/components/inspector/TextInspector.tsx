import type { Fill, TextLayer } from '@/lib/model/types';
import { useEditor } from '@/lib/store/editor';
import { FONT_OPTIONS } from '@/lib/fonts/stacks';
import { ColorField, NumberField, Row, SectionTitle, SelectField, ToggleGroup } from './controls';

// Curadoria completa de fontes chega na Fase 5; aqui, uma lista mínima com cadeia de
// fallback por genérico (ver lib/fonts/stacks).
const WEIGHTS = [300, 400, 500, 600, 700, 800, 900];

export function TextInspector({ layer }: { layer: TextLayer }) {
  const updateLayer = useEditor((s) => s.updateLayer);

  function set(mutate: (l: TextLayer) => void) {
    updateLayer(layer.id, (l) => l.type === 'text' && mutate(l));
  }
  const solid = layer.fill.kind === 'solid' ? layer.fill.color : '#111111';

  return (
    <div>
      <SectionTitle>Texto</SectionTitle>
      <textarea
        className="mb-2 min-h-16 w-full resize-y rounded-md border border-hairline-strong/60 bg-transparent p-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald/40"
        value={layer.content}
        onChange={(e) => set((l) => (l.content = e.target.value))}
        placeholder="Conteúdo do texto"
      />
      <Row label="Fonte">
        <SelectField
          value={layer.fontFamily}
          options={FONT_OPTIONS.map((f) => ({ value: f.family, label: f.label }))}
          onCommit={(v) => set((l) => (l.fontFamily = v))}
        />
      </Row>
      <div className="grid grid-cols-2 gap-x-3">
        <Row label="Peso">
          <SelectField
            value={layer.fontWeight}
            options={WEIGHTS.map((w) => ({ value: w, label: String(w) }))}
            onCommit={(v) => set((l) => (l.fontWeight = v))}
          />
        </Row>
        <Row label="Tam.">
          <NumberField value={layer.fontSize} min={4} onCommit={(v) => set((l) => (l.fontSize = v))} />
        </Row>
        <Row label="Entrelinha">
          <NumberField value={layer.lineHeight} step={0.05} min={0.5} onCommit={(v) => set((l) => (l.lineHeight = v))} />
        </Row>
        <Row label="Tracking">
          <NumberField value={layer.letterSpacing} step={0.5} onCommit={(v) => set((l) => (l.letterSpacing = v))} />
        </Row>
      </div>
      <Row label="Alinhar">
        <ToggleGroup
          value={layer.align}
          options={[
            { value: 'left', label: '⯇', title: 'Esquerda' },
            { value: 'center', label: '≡', title: 'Centro' },
            { value: 'right', label: '⯈', title: 'Direita' },
          ]}
          onCommit={(v) => set((l) => (l.align = v))}
        />
      </Row>
      <Row label="Caixa">
        <ToggleGroup
          value={layer.transform}
          options={[
            { value: 'none', label: 'Ab' },
            { value: 'uppercase', label: 'AB' },
          ]}
          onCommit={(v) => set((l) => (l.transform = v))}
        />
      </Row>
      <Row label="Cor">
        <ColorField
          value={solid}
          onCommit={(hex) => set((l) => (l.fill = { kind: 'solid', color: hex } as Fill))}
        />
      </Row>

      {/* Auto-fit (SPEC §8): por camada, desligado por padrão; o usuário define o
          piso e o teto. Reduz o texto até caber na caixa — nunca aumenta. */}
      <SectionTitle>Auto-ajuste</SectionTitle>
      <Row label="Reduzir p/ caber">
        <input
          type="checkbox"
          className="size-4 accent-[var(--color-emerald-500)]"
          checked={layer.autoFit.enabled}
          onChange={(e) => set((l) => (l.autoFit.enabled = e.target.checked))}
        />
      </Row>
      {layer.autoFit.enabled && (
        <div className="grid grid-cols-2 gap-x-3">
          <Row label="Mín.">
            <NumberField
              value={layer.autoFit.min}
              min={4}
              onCommit={(v) => set((l) => (l.autoFit.min = Math.min(v, l.autoFit.max)))}
            />
          </Row>
          <Row label="Máx.">
            <NumberField
              value={layer.autoFit.max}
              min={4}
              onCommit={(v) => set((l) => (l.autoFit.max = Math.max(v, l.autoFit.min)))}
            />
          </Row>
        </div>
      )}
    </div>
  );
}
