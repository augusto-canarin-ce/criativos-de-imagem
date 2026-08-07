import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

// Controles pequenos e reaproveitáveis do inspector. Ficam propositalmente enxutos
// (SPEC §1: menos escolhas é a funcionalidade).

export function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex items-center justify-between gap-3 py-1">
      <span className="shrink-0 text-xs text-mute">{label}</span>
      <div className="flex min-w-0 items-center gap-1">{children}</div>
    </label>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-1 mt-3 text-[11px] font-semibold uppercase tracking-wide text-mute">
      {children}
    </h3>
  );
}

const inputCls =
  'h-8 w-full rounded-md border border-hairline-strong/60 bg-transparent px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald/40';

export function NumberField({
  value,
  onCommit,
  step = 1,
  min,
  max,
  suffix,
}: {
  value: number;
  onCommit: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  suffix?: string;
}) {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(Math.round(value * 100) / 100)), [value]);

  function commit() {
    const n = Number(text);
    if (!Number.isFinite(n)) return setText(String(value));
    let v = n;
    if (min !== undefined) v = Math.max(min, v);
    if (max !== undefined) v = Math.min(max, v);
    onCommit(v);
  }

  return (
    <div className="relative w-full">
      <input
        type="number"
        className={cn(inputCls, suffix && 'pr-6')}
        value={text}
        step={step}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
      />
      {suffix && (
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-mute">
          {suffix}
        </span>
      )}
    </div>
  );
}

export function ColorField({ value, onCommit }: { value: string; onCommit: (hex: string) => void }) {
  const isHex = value.startsWith('#');
  return (
    <div className="flex items-center gap-1">
      <input
        type="color"
        className="h-8 w-8 shrink-0 cursor-pointer rounded-md border border-hairline-strong/60 bg-transparent p-0.5"
        value={isHex ? value : '#888888'}
        onChange={(e) => onCommit(e.target.value)}
      />
      <input
        className={cn(inputCls, 'w-24 font-mono text-xs')}
        value={value}
        onChange={(e) => onCommit(e.target.value)}
      />
    </div>
  );
}

export function SelectField<T extends string | number>({
  value,
  options,
  onCommit,
}: {
  value: T;
  options: { value: T; label: string }[];
  onCommit: (v: T) => void;
}) {
  return (
    <select
      className={cn(inputCls, 'cursor-pointer')}
      value={value}
      onChange={(e) => {
        const raw = e.target.value;
        const opt = options.find((o) => String(o.value) === raw);
        if (opt) onCommit(opt.value);
      }}
    >
      {options.map((o) => (
        <option key={String(o.value)} value={String(o.value)}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function SliderField({
  value,
  min,
  max,
  step = 1,
  debounceMs = 0,
  onLive,
  onEnd,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  /** Debounce do onLive — use ~120ms em sliders que invalidam cache (SPEC §16). */
  debounceMs?: number;
  onLive: (v: number) => void;
  onEnd: () => void;
}) {
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [local, setLocal] = useState<number | null>(null);

  function handleLive(v: number) {
    if (debounceMs <= 0) return onLive(v);
    setLocal(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      onLive(v);
      setLocal(null);
    }, debounceMs);
  }

  function handleEnd() {
    clearTimeout(timer.current);
    if (local !== null) {
      onLive(local);
      setLocal(null);
    }
    onEnd();
  }

  const shown = local ?? value;
  return (
    <div className="flex w-full items-center gap-2">
      <input
        type="range"
        className="h-1 w-full cursor-pointer accent-[var(--color-emerald-500)]"
        min={min}
        max={max}
        step={step}
        value={shown}
        onChange={(e) => handleLive(Number(e.target.value))}
        onPointerUp={handleEnd}
        onBlur={handleEnd}
      />
      <span className="w-10 shrink-0 text-right text-xs tabular-nums text-mute">
        {Math.round(shown * 100) / 100}
      </span>
    </div>
  );
}

export function ToggleGroup<T extends string>({
  value,
  options,
  onCommit,
}: {
  value: T;
  options: { value: T; label: React.ReactNode; title?: string }[];
  onCommit: (v: T) => void;
}) {
  return (
    <div className="flex overflow-hidden rounded-md border border-hairline-strong/60">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          title={o.title}
          aria-pressed={value === o.value}
          onClick={() => onCommit(o.value)}
          className={cn(
            'flex h-8 flex-1 items-center justify-center px-2 text-sm transition-colors',
            value === o.value ? 'bg-emerald-soft text-emerald-deep' : 'hover:bg-ink/10',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
