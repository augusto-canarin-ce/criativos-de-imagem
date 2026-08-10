import { useEffect, useMemo, useRef, useState } from 'react';
import { colord } from 'colord';
import { Pipette } from 'lucide-react';
import { useEditor, selectProject } from '@/lib/store/editor';
import { getCachedImage, loadImage } from '@/lib/render/imageCache';
import { extractPalette } from '@/lib/assets/palette';
import { useBrandKit } from '@/lib/store/brand';
import { COLOR_TOKEN_PREFIX, isColorToken } from '@/lib/brand/tokens';
import { cn } from '@/lib/utils';

// Seletor de cor (§8): HSV (área SV + matiz), alfa, campo hex, conta-gotas via
// EyeDropper onde existir (escondido onde não — sem botão que dá erro) e as cores
// dominantes das imagens do criativo como sugestão (extração própria, §8). As
// cores do brand kit entram no topo na Fase 6.

interface EyeDropperResult {
  sRGBHex: string;
}
interface EyeDropperCtor {
  new (): { open: () => Promise<EyeDropperResult> };
}
const eyeDropperCtor: EyeDropperCtor | undefined = (
  window as unknown as { EyeDropper?: EyeDropperCtor }
).EyeDropper;

// ---------- paleta das imagens do criativo (memoizada por asset) ----------

const paletteCache = new Map<string, string[]>();

async function paletteForAsset(assetId: string): Promise<string[]> {
  const hit = paletteCache.get(assetId);
  if (hit) return hit;
  try {
    const img = getCachedImage(assetId) ?? (await loadImage(assetId));
    const canvas = document.createElement('canvas');
    const w = 64;
    const h = Math.max(1, Math.round((img.naturalHeight / img.naturalWidth) * 64) || 64);
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(img, 0, 0, w, h);
    const colors = extractPalette(ctx.getImageData(0, 0, w, h).data, 5, 1).map((c) => c.hex);
    paletteCache.set(assetId, colors);
    return colors;
  } catch {
    return [];
  }
}

function useProjectPalette(): string[] {
  const project = useEditor(selectProject);
  const activeFormat = useEditor((s) => s.activeFormat);
  const [colors, setColors] = useState<string[]>([]);

  const assetIds = useMemo(() => {
    if (!project) return [];
    const ids = new Set<string>();
    for (const layer of project.layouts[activeFormat].layers) {
      if (layer.type === 'image' && layer.assetId) ids.add(layer.assetId);
    }
    return [...ids];
  }, [project, activeFormat]);

  useEffect(() => {
    let cancelled = false;
    void Promise.all(assetIds.map(paletteForAsset)).then((all) => {
      if (cancelled) return;
      // Intercala as paletas das imagens e tira duplicatas, até 10 sugestões.
      const merged: string[] = [];
      for (let i = 0; i < 5; i++) {
        for (const p of all) if (p[i] && !merged.includes(p[i])) merged.push(p[i]);
      }
      setColors(merged.slice(0, 10));
    });
    return () => {
      cancelled = true;
    };
  }, [assetIds]);

  return colors;
}

// ---------- o seletor ----------

export function ColorPicker({
  value,
  onCommit,
}: {
  value: string;
  onCommit: (hex: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const kit = useBrandKit();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!(e.target instanceof Node)) return;
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    window.addEventListener('pointerdown', close);
    return () => window.removeEventListener('pointerdown', close);
  }, [open]);

  // Token de marca: o campo mostra o NOME da cor no kit (não um hex opaco) e o
  // swatch mostra a cor resolvida. Assim dá para ver que a camada segue a marca.
  const token = isColorToken(value);
  const brandColor = kit?.colors.find((c) => `${COLOR_TOKEN_PREFIX}${c.id}` === value);
  const shown = token ? (brandColor?.hex ?? '#888888') : value;
  const parsed = colord(shown.startsWith('#') ? shown : '#888888');
  const c = parsed.isValid() ? parsed : colord('#888888');

  return (
    <div ref={rootRef} className="relative flex items-center gap-1">
      <button
        type="button"
        aria-label="Abrir seletor de cor"
        className={cn(
          'h-8 w-8 shrink-0 rounded-md border bg-[repeating-conic-gradient(#ccc_0_25%,#fff_0_50%)] bg-[length:10px_10px] p-0',
          token ? 'border-emerald' : 'border-hairline-strong/60',
        )}
        title={token ? `Segue a marca: ${brandColor?.name ?? value}` : undefined}
        onClick={() => setOpen(!open)}
      >
        <span className="block h-full w-full rounded-[5px]" style={{ background: shown }} />
      </button>
      <input
        className={cn(
          'h-8 w-24 rounded-md border border-hairline-strong/60 bg-transparent px-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-emerald/40',
          token ? 'text-emerald-deep' : 'font-mono',
        )}
        value={token ? (brandColor?.name ?? value) : value}
        readOnly={token}
        title={token ? 'Cor da marca — mude no painel Marca' : undefined}
        onChange={(e) => onCommit(e.target.value)}
      />
      {open && <PickerPopover color={c.toHex()} onCommit={onCommit} />}
    </div>
  );
}

interface Hsv {
  h: number;
  s: number;
  v: number;
}

function PickerPopover({ color, onCommit }: { color: string; onCommit: (hex: string) => void }) {
  // HSV local para a UI não "pular" quando s ou v são 0 (hex degenerado).
  const [hsv, setHsv] = useState<Hsv>(() => {
    const { h, s, v } = colord(color).toHsv();
    return { h, s, v };
  });
  const [alpha, setAlpha] = useState(() => Math.round(colord(color).alpha() * 100));
  const svRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const palette = useProjectPalette();
  const brandKit = useBrandKit();

  function emit(next: { h: number; s: number; v: number }, a = alpha) {
    setHsv(next);
    const base = colord({ h: next.h, s: next.s, v: next.v });
    onCommit(a >= 100 ? base.toHex() : base.alpha(a / 100).toHex());
  }

  function svFromPointer(e: React.PointerEvent) {
    const rect = svRef.current!.getBoundingClientRect();
    const s = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)) * 100;
    const v = (1 - Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height))) * 100;
    emit({ h: hsv.h, s, v });
  }

  async function pick() {
    if (!eyeDropperCtor) return;
    try {
      const result = await new eyeDropperCtor().open();
      const picked = colord(result.sRGBHex);
      { const { h, s, v } = picked.toHsv(); setHsv({ h, s, v }); }
      setAlpha(100);
      onCommit(picked.toHex());
    } catch {
      /* usuário cancelou */
    }
  }

  const hueColor = colord({ h: hsv.h, s: 100, v: 100 }).toHex();

  return (
    <div className="absolute right-0 top-9 z-40 w-56 rounded-lg border border-hairline bg-surface p-2.5 shadow-lg">
      {/* Área SV */}
      <div
        ref={svRef}
        className="relative h-32 w-full cursor-crosshair touch-none rounded-md"
        style={{
          background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${hueColor})`,
        }}
        onPointerDown={(e) => {
          dragging.current = true;
          (e.target as Element).setPointerCapture(e.pointerId);
          svFromPointer(e);
        }}
        onPointerMove={(e) => dragging.current && svFromPointer(e)}
        onPointerUp={() => (dragging.current = false)}
      >
        <span
          className="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
          style={{ left: `${hsv.s}%`, top: `${100 - hsv.v}%` }}
        />
      </div>

      {/* Matiz */}
      <input
        type="range"
        min={0}
        max={360}
        value={Math.round(hsv.h)}
        aria-label="Matiz"
        onChange={(e) => emit({ ...hsv, h: Number(e.target.value) })}
        className="mt-2 h-3 w-full cursor-pointer appearance-none rounded-full"
        style={{
          background:
            'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)',
        }}
      />

      {/* Alfa */}
      <div className="mt-1.5 flex items-center gap-2">
        <input
          type="range"
          min={0}
          max={100}
          value={alpha}
          aria-label="Opacidade da cor"
          onChange={(e) => {
            const a = Number(e.target.value);
            setAlpha(a);
            emit(hsv, a);
          }}
          className="h-3 w-full cursor-pointer appearance-none rounded-full"
          style={{
            background: `repeating-conic-gradient(#ccc 0 25%, #fff 0 50%) 0 0 / 10px 10px, linear-gradient(to right, transparent, ${colord({ h: hsv.h, s: hsv.s, v: hsv.v }).toHex()})`,
          }}
        />
        <span className="w-9 shrink-0 text-right text-[11px] tabular-nums text-mute">{alpha}%</span>
        {eyeDropperCtor && (
          <button
            type="button"
            title="Conta-gotas"
            onClick={() => void pick()}
            className="grid size-7 shrink-0 place-items-center rounded-md text-mute hover:bg-ink/10 hover:text-ink"
          >
            <Pipette className="size-4" />
          </button>
        )}
      </div>

      {/* Cores do brand kit EM DESTAQUE NO TOPO da lista de sugestões (§8).
          Clicar aplica o TOKEN (brand.<id>), não o hex: a camada passa a seguir
          a marca e muda junto quando o kit muda (§6). */}
      {brandKit && brandKit.colors.length > 0 && (
        <div className="mt-2 border-t border-hairline pt-2">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-mute">
            {brandKit.name}
          </p>
          <div className="flex flex-wrap gap-1">
            {brandKit.colors.map((c) => (
              <button
                key={c.id}
                type="button"
                title={`${c.name} — segue a marca`}
                className="size-5 rounded border border-black/10 ring-emerald ring-offset-1 ring-offset-surface hover:ring-2"
                style={{ background: c.hex }}
                onClick={() => onCommit(`${COLOR_TOKEN_PREFIX}${c.id}`)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Sugestões das imagens do criativo (§8) */}
      {palette.length > 0 && (
        <div className="mt-2 border-t border-hairline pt-2">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-mute">
            Das imagens
          </p>
          <div className="flex flex-wrap gap-1">
            {palette.map((hex) => (
              <button
                key={hex}
                type="button"
                title={hex}
                className={cn('size-5 rounded border border-black/10')}
                style={{ background: hex }}
                onClick={() => {
                  const picked = colord(hex);
                  { const { h, s, v } = picked.toHsv(); setHsv({ h, s, v }); }
                  setAlpha(100);
                  onCommit(hex);
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
