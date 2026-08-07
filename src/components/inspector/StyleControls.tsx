import type { Effects, Fill, Layer, TextLayer } from '@/lib/model/types';
import { useEditor } from '@/lib/store/editor';
import { ColorField, NumberField, Row, SectionTitle, SelectField, SliderField, ToggleGroup } from './controls';

// Estilo unificado (feedback pós-Fase 2): preenchimento sólido/gradiente, traçado,
// sombra e blur com a MESMA cara para texto, forma e imagem. O editor de gradiente
// completo (paradas arrastáveis na barra, alças na tela) chega na Fase 4; aqui, o
// essencial: duas cores + ângulo/raio.

type FillKind = Fill['kind'];

function firstColor(fill: Fill): string {
  return fill.kind === 'solid' ? fill.color : (fill.stops[0]?.color ?? '#888888');
}
function lastColor(fill: Fill): string {
  return fill.kind === 'solid' ? '#ffffff' : (fill.stops[fill.stops.length - 1]?.color ?? '#ffffff');
}

/** Converte o Fill atual para outro tipo preservando as cores. */
export function convertFill(fill: Fill, kind: FillKind): Fill {
  const a = firstColor(fill);
  const b = lastColor(fill);
  if (kind === 'solid') return { kind: 'solid', color: a };
  const stops = [
    { offset: 0, color: a },
    { offset: 1, color: b },
  ];
  if (kind === 'linear') {
    return { kind: 'linear', stops, angle: fill.kind === 'linear' ? fill.angle : 180 };
  }
  return {
    kind: 'radial',
    stops,
    cx: fill.kind === 'radial' ? fill.cx : 0.5,
    cy: fill.kind === 'radial' ? fill.cy : 0.5,
    r: fill.kind === 'radial' ? fill.r : 0.75,
  };
}

export function FillControl({
  label = 'Preenchimento',
  value,
  onChange,
}: {
  label?: string;
  value: Fill;
  onChange: (fill: Fill) => void;
}) {
  function setStop(index: 0 | 1, color: string) {
    if (value.kind === 'solid') return onChange({ kind: 'solid', color });
    const stops = value.stops.map((s, i) =>
      (index === 0 ? i === 0 : i === value.stops.length - 1) ? { ...s, color } : s,
    );
    onChange({ ...value, stops });
  }

  return (
    <div>
      <SectionTitle>{label}</SectionTitle>
      <ToggleGroup
        value={value.kind}
        options={[
          { value: 'solid', label: 'Sólida' },
          { value: 'linear', label: 'Linear' },
          { value: 'radial', label: 'Radial' },
        ]}
        onCommit={(kind) => onChange(convertFill(value, kind))}
      />
      <div className="mt-1.5">
        {value.kind === 'solid' ? (
          <Row label="Cor">
            <ColorField value={value.color} onCommit={(hex) => onChange({ kind: 'solid', color: hex })} />
          </Row>
        ) : (
          <>
            <Row label={value.kind === 'linear' ? 'Início' : 'Centro'}>
              <ColorField value={firstColor(value)} onCommit={(hex) => setStop(0, hex)} />
            </Row>
            <Row label={value.kind === 'linear' ? 'Fim' : 'Borda'}>
              <ColorField value={lastColor(value)} onCommit={(hex) => setStop(1, hex)} />
            </Row>
            {value.kind === 'linear' && (
              <Row label="Ângulo">
                <NumberField
                  value={value.angle}
                  suffix="°"
                  onCommit={(angle) => onChange({ ...value, angle })}
                />
              </Row>
            )}
            {value.kind === 'radial' && (
              <Row label="Raio">
                <NumberField
                  value={value.r}
                  step={0.05}
                  min={0.05}
                  max={2}
                  onCommit={(r) => onChange({ ...value, r })}
                />
              </Row>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/** Traçado + sombra + blur — comuns a texto, forma e imagem. Em texto o canvas só
 *  traça centrado no glifo, então a posição fica oculta (SPEC §1: não expor opção
 *  que não faz nada). */
export function EffectsInspector({ layer }: { layer: Layer }) {
  const updateLayer = useEditor((s) => s.updateLayer);
  const updateLayerLive = useEditor((s) => s.updateLayerLive);
  const endLive = useEditor((s) => s.endLive);

  function set(mutate: (e: Effects) => void) {
    updateLayer(layer.id, (l) => mutate(l.effects));
  }

  const stroke = layer.effects.stroke;
  const shadow = layer.effects.shadow;
  const showPosition = layer.type !== 'text';

  return (
    <div>
      <SectionTitle>Traçado</SectionTitle>
      <Row label="Ativo">
        <input
          type="checkbox"
          className="size-4 accent-[var(--color-emerald-500)]"
          checked={!!stroke}
          onChange={(e) =>
            set((ef) => {
              ef.stroke = e.target.checked
                ? { width: 2, color: '#111111', position: 'center' }
                : undefined;
            })
          }
        />
      </Row>
      {stroke && (
        <>
          <div className="grid grid-cols-2 gap-x-3">
            <Row label="Espessura">
              <NumberField
                value={stroke.width}
                min={0}
                suffix="px"
                onCommit={(v) => set((ef) => ef.stroke && (ef.stroke.width = v))}
              />
            </Row>
            <Row label="Cor">
              <ColorField
                value={stroke.color}
                onCommit={(hex) => set((ef) => ef.stroke && (ef.stroke.color = hex))}
              />
            </Row>
          </div>
          {showPosition && (
            <Row label="Posição">
              <SelectField
                value={stroke.position}
                options={[
                  { value: 'inside', label: 'Dentro' },
                  { value: 'center', label: 'Centro' },
                  { value: 'outside', label: 'Fora' },
                ]}
                onCommit={(v) => set((ef) => ef.stroke && (ef.stroke.position = v))}
              />
            </Row>
          )}
        </>
      )}

      <SectionTitle>Sombra</SectionTitle>
      <Row label="Ativa">
        <input
          type="checkbox"
          className="size-4 accent-[var(--color-emerald-500)]"
          checked={!!shadow}
          onChange={(e) =>
            set((ef) => {
              ef.shadow = e.target.checked
                ? { x: 0, y: 8, blur: 24, color: '#000000', opacity: 0.35 }
                : undefined;
            })
          }
        />
      </Row>
      {shadow && (
        <>
          <div className="grid grid-cols-2 gap-x-3">
            <Row label="X">
              <NumberField value={shadow.x} onCommit={(v) => set((ef) => ef.shadow && (ef.shadow.x = v))} />
            </Row>
            <Row label="Y">
              <NumberField value={shadow.y} onCommit={(v) => set((ef) => ef.shadow && (ef.shadow.y = v))} />
            </Row>
            <Row label="Desfoque">
              <NumberField
                value={shadow.blur}
                min={0}
                onCommit={(v) => set((ef) => ef.shadow && (ef.shadow.blur = v))}
              />
            </Row>
            <Row label="Cor">
              <ColorField
                value={shadow.color}
                onCommit={(hex) => set((ef) => ef.shadow && (ef.shadow.color = hex))}
              />
            </Row>
          </div>
          <Row label="Opacidade">
            <SliderField
              value={Math.round(shadow.opacity * 100)}
              min={0}
              max={100}
              onLive={(v) =>
                updateLayerLive(layer.id, `shadow-op:${layer.id}`, (l) => {
                  if (l.effects.shadow) l.effects.shadow.opacity = v / 100;
                })
              }
              onEnd={endLive}
            />
          </Row>
        </>
      )}

      <SectionTitle>Desfoque da camada</SectionTitle>
      <Row label="Blur">
        <SliderField
          value={layer.effects.blur ?? 0}
          min={0}
          max={50}
          debounceMs={120}
          onLive={(v) =>
            updateLayerLive(layer.id, `blur:${layer.id}`, (l) => {
              l.effects.blur = v > 0 ? v : undefined;
            })
          }
          onEnd={endLive}
        />
      </Row>
    </div>
  );
}

/** Marca-texto (só texto): fundo colorido atrás do bloco, com padding e raio —
 *  diferente do preenchimento das letras. */
export function HighlightControl({ layer }: { layer: TextLayer }) {
  const updateLayer = useEditor((s) => s.updateLayer);

  function set(mutate: (l: TextLayer) => void) {
    updateLayer(layer.id, (l) => l.type === 'text' && mutate(l));
  }

  return (
    <div>
      <SectionTitle>Marca-texto</SectionTitle>
      <Row label="Ativa">
        <input
          type="checkbox"
          className="size-4 accent-[var(--color-emerald-500)]"
          checked={!!layer.highlight}
          onChange={(e) =>
            set((l) => {
              l.highlight = e.target.checked
                ? { fill: { kind: 'solid', color: '#fde047' }, padH: 16, padV: 8, radius: 8 }
                : undefined;
            })
          }
        />
      </Row>
      {layer.highlight && (
        <>
          <Row label="Cor">
            <ColorField
              value={layer.highlight.fill.kind === 'solid' ? layer.highlight.fill.color : '#fde047'}
              onCommit={(hex) =>
                set((l) => l.highlight && (l.highlight.fill = { kind: 'solid', color: hex }))
              }
            />
          </Row>
          <div className="grid grid-cols-3 gap-x-2">
            <Row label="↔">
              <NumberField
                value={layer.highlight.padH}
                min={0}
                onCommit={(v) => set((l) => l.highlight && (l.highlight.padH = v))}
              />
            </Row>
            <Row label="↕">
              <NumberField
                value={layer.highlight.padV}
                min={0}
                onCommit={(v) => set((l) => l.highlight && (l.highlight.padV = v))}
              />
            </Row>
            <Row label="Raio">
              <NumberField
                value={layer.highlight.radius}
                min={0}
                onCommit={(v) => set((l) => l.highlight && (l.highlight.radius = v))}
              />
            </Row>
          </div>
        </>
      )}
    </div>
  );
}
