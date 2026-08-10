import { useRef, useState } from 'react';
import type { Effects, Fill, Layer, Stop, TextLayer } from '@/lib/model/types';
import { useEditor } from '@/lib/store/editor';
import { fillToCss } from '@/lib/render/fill';
import { cn } from '@/lib/utils';
import { ColorField, NumberField, Row, SectionTitle, SelectField, SliderField, ToggleGroup } from './controls';

// Estilo unificado: preenchimento sólido/gradiente, traçado, sombra e blur com a
// MESMA cara para texto, forma, imagem e fundo. Editor de gradiente completo (§8):
// paradas ARRASTÁVEIS na barra (clicar no vazio adiciona, duplo clique remove),
// ângulo no linear, centro arrastável + raio no radial.

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

function hexLerp(a: string, b: string, t: number): string {
  const pa = parseInt(a.replace('#', ''), 16);
  const pb = parseInt(b.replace('#', ''), 16);
  if (Number.isNaN(pa) || Number.isNaN(pb)) return a;
  const ch = (sh: number) =>
    Math.round(((pa >> sh) & 255) + (((pb >> sh) & 255) - ((pa >> sh) & 255)) * t);
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, '0')}`;
}

/** Cor interpolada do gradiente num offset (para a parada nova nascer no lugar). */
function colorAt(stops: Stop[], offset: number): string {
  const sorted = [...stops].sort((a, b) => a.offset - b.offset);
  if (offset <= sorted[0].offset) return sorted[0].color;
  const last = sorted[sorted.length - 1];
  if (offset >= last.offset) return last.color;
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (offset >= a.offset && offset <= b.offset) {
      const t = (offset - a.offset) / Math.max(1e-6, b.offset - a.offset);
      return hexLerp(a.color, b.color, t);
    }
  }
  return last.color;
}

/** Barra de paradas arrastáveis (§8): arrastar move, clicar no vazio adiciona no
 *  ponto (com a cor interpolada), duplo clique remove (mínimo de 2). */
function GradientStopsBar({
  fill,
  onChange,
  selected,
  onSelect,
}: {
  fill: Extract<Fill, { kind: 'linear' | 'radial' }>;
  onChange: (stops: Stop[]) => void;
  selected: number;
  onSelect: (i: number) => void;
}) {
  const barRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<number | null>(null);

  function offsetFromEvent(e: React.PointerEvent): number {
    const rect = barRef.current!.getBoundingClientRect();
    return Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
  }

  return (
    <div
      ref={barRef}
      className="relative mt-1 h-6 w-full cursor-copy rounded"
      style={{ background: fillToCss({ ...fill, kind: 'linear', angle: 90 } as Fill) }}
      onPointerDown={(e) => {
        if ((e.target as HTMLElement).dataset.stop) return; // alça cuida de si
        const offset = offsetFromEvent(e);
        const stops = [...fill.stops, { offset, color: colorAt(fill.stops, offset) }].sort(
          (a, b) => a.offset - b.offset,
        );
        onChange(stops);
        onSelect(stops.findIndex((s) => s.offset === offset));
      }}
    >
      {fill.stops.map((stop, i) => (
        <button
          key={i}
          data-stop
          className={cn(
            'absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize rounded-full border-2 shadow',
            i === selected ? 'border-emerald' : 'border-white',
          )}
          style={{ left: `${stop.offset * 100}%`, background: stop.color }}
          title="Arraste para mover · duplo clique remove"
          onPointerDown={(e) => {
            e.stopPropagation();
            dragging.current = i;
            onSelect(i);
            (e.target as Element).setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (dragging.current !== i) return;
            const offset = offsetFromEvent(e);
            const stops = fill.stops.map((s, j) => (j === i ? { ...s, offset } : s));
            onChange(stops);
          }}
          onPointerUp={() => (dragging.current = null)}
          onDoubleClick={() => {
            if (fill.stops.length <= 2) return;
            onChange(fill.stops.filter((_, j) => j !== i));
            onSelect(0);
          }}
        />
      ))}
    </div>
  );
}

/** Alvo arrastável do centro do radial (§8: "alças de centro e raio"). */
function RadialCenterField({
  fill,
  onChange,
}: {
  fill: Extract<Fill, { kind: 'radial' }>;
  onChange: (patch: Partial<Extract<Fill, { kind: 'radial' }>>) => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  function setFromPointer(e: React.PointerEvent) {
    const rect = boxRef.current!.getBoundingClientRect();
    onChange({
      cx: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
      cy: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)),
    });
  }

  return (
    <div
      ref={boxRef}
      className="relative mt-1 h-20 w-full cursor-crosshair touch-none overflow-hidden rounded border border-hairline"
      style={{ background: fillToCss(fill) }}
      onPointerDown={(e) => {
        dragging.current = true;
        (e.target as Element).setPointerCapture(e.pointerId);
        setFromPointer(e);
      }}
      onPointerMove={(e) => dragging.current && setFromPointer(e)}
      onPointerUp={() => (dragging.current = false)}
    >
      <span
        className="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1.5px_rgb(16_185_129)]"
        style={{ left: `${fill.cx * 100}%`, top: `${fill.cy * 100}%` }}
      />
    </div>
  );
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
  const [selectedStop, setSelectedStop] = useState(0);

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
            <GradientStopsBar
              fill={value}
              selected={selectedStop}
              onSelect={setSelectedStop}
              onChange={(stops) => onChange({ ...value, stops })}
            />
            <Row label="Cor da parada">
              <ColorField
                value={value.stops[selectedStop]?.color ?? '#888888'}
                onCommit={(hex) =>
                  onChange({
                    ...value,
                    stops: value.stops.map((s, i) => (i === selectedStop ? { ...s, color: hex } : s)),
                  })
                }
              />
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
              <>
                <RadialCenterField fill={value} onChange={(patch) => onChange({ ...value, ...patch })} />
                <Row label="Raio">
                  <NumberField
                    value={value.r}
                    step={0.05}
                    min={0.05}
                    max={2}
                    onCommit={(r) => onChange({ ...value, r })}
                  />
                </Row>
              </>
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
