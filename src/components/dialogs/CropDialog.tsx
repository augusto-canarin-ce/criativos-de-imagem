import { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Frame, ImageLayer } from '@/lib/model/types';
import { useEditor } from '@/lib/store/editor';
import { getAsset } from '@/lib/db/assets';
import { cn } from '@/lib/utils';

// Crop NÃO destrutivo (§8): guarda o retângulo em px da imagem original; o
// original fica intacto no asset. Proporção livre ou travada, com atalhos para as
// três proporções da Meta. Arraste move; a alça do canto redimensiona.

type Ratio = 'livre' | '4:5' | '1:1' | '9:16';
const RATIOS: { id: Ratio; value: number | null }[] = [
  { id: 'livre', value: null },
  { id: '4:5', value: 4 / 5 },
  { id: '1:1', value: 1 },
  { id: '9:16', value: 9 / 16 },
];

interface Props {
  layer: ImageLayer;
  onClose: () => void;
}

export function CropDialog({ layer, onClose }: Props) {
  const updateLayer = useEditor((s) => s.updateLayer);
  const [url, setUrl] = useState<string>();
  const [natural, setNatural] = useState({ w: 1, h: 1 });
  const [crop, setCrop] = useState<Frame | null>(layer.crop ?? null);
  const [ratio, setRatio] = useState<Ratio>('livre');
  const boxRef = useRef<HTMLDivElement>(null);
  const gesture = useRef<{ kind: 'move' | 'resize'; startX: number; startY: number; start: Frame } | null>(null);

  useEffect(() => {
    let objectUrl: string | undefined;
    let cancelled = false;
    void (async () => {
      if (!layer.assetId) return;
      const asset = await getAsset(layer.assetId);
      if (!asset || cancelled) return;
      objectUrl = URL.createObjectURL(asset.blob);
      setUrl(objectUrl);
      setNatural({ w: asset.width ?? 1, h: asset.height ?? 1 });
      setCrop(layer.crop ?? { x: 0, y: 0, w: asset.width ?? 1, h: asset.height ?? 1 });
    })();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layer.assetId]);

  /** escala tela→imagem (a prévia é limitada a 420×320) */
  function scale(): number {
    const box = boxRef.current;
    if (!box) return 1;
    return natural.w / box.clientWidth;
  }

  function clampCrop(c: Frame): Frame {
    const w = Math.min(c.w, natural.w);
    const h = Math.min(c.h, natural.h);
    return {
      x: Math.min(Math.max(0, c.x), natural.w - w),
      y: Math.min(Math.max(0, c.y), natural.h - h),
      w,
      h,
    };
  }

  function applyRatio(r: Ratio, base: Frame): Frame {
    const target = RATIOS.find((x) => x.id === r)?.value;
    if (!target) return base;
    // Mantém o centro; encolhe o lado que sobra.
    let w = base.w;
    let h = w / target;
    if (h > natural.h) {
      h = natural.h;
      w = h * target;
    }
    if (w > natural.w) {
      w = natural.w;
      h = w / target;
    }
    return clampCrop({ x: base.x + (base.w - w) / 2, y: base.y + (base.h - h) / 2, w, h });
  }

  function onPointerDown(e: React.PointerEvent, kind: 'move' | 'resize') {
    if (!crop) return;
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    gesture.current = { kind, startX: e.clientX, startY: e.clientY, start: { ...crop } };
  }

  function onPointerMove(e: React.PointerEvent) {
    const g = gesture.current;
    if (!g || !crop) return;
    const s = scale();
    const dx = (e.clientX - g.startX) * s;
    const dy = (e.clientY - g.startY) * s;
    if (g.kind === 'move') {
      setCrop(clampCrop({ ...g.start, x: g.start.x + dx, y: g.start.y + dy }));
    } else {
      let w = Math.max(32, g.start.w + dx);
      let h = Math.max(32, g.start.h + dy);
      const target = RATIOS.find((x) => x.id === ratio)?.value;
      if (target) h = w / target;
      setCrop(clampCrop({ ...g.start, w, h }));
    }
  }

  function confirm() {
    if (!crop) return;
    const full = crop.x === 0 && crop.y === 0 && crop.w >= natural.w && crop.h >= natural.h;
    updateLayer(layer.id, (l) => {
      if (l.type !== 'image') return;
      l.crop = full ? undefined : {
        x: Math.round(crop.x),
        y: Math.round(crop.y),
        w: Math.round(crop.w),
        h: Math.round(crop.h),
      };
    });
    onClose();
  }

  const pct = (v: number, total: number) => `${(v / total) * 100}%`;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Recortar imagem</DialogTitle>
          <DialogDescription>
            Não destrutivo: o original fica guardado — dá para reenquadrar quando quiser.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-1.5">
          {RATIOS.map((r) => (
            <button
              key={r.id}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs transition-colors',
                ratio === r.id ? 'bg-emerald-soft text-emerald-deep' : 'text-mute hover:bg-ink/10',
              )}
              onClick={() => {
                setRatio(r.id);
                if (crop) setCrop(applyRatio(r.id, crop));
              }}
            >
              {r.id}
            </button>
          ))}
          <button
            className="ml-auto text-xs text-mute underline-offset-2 hover:underline"
            onClick={() => setCrop({ x: 0, y: 0, w: natural.w, h: natural.h })}
          >
            Limpar recorte
          </button>
        </div>

        {url && crop && (
          <div
            ref={boxRef}
            className="relative mx-auto w-full max-w-[420px] touch-none select-none overflow-hidden rounded-md border border-hairline"
            onPointerMove={onPointerMove}
            onPointerUp={() => (gesture.current = null)}
          >
            <img src={url} alt="" className="block w-full" draggable={false} />
            {/* véu fora do recorte */}
            <div className="pointer-events-none absolute inset-0 bg-black/55" />
            <div
              className="absolute cursor-move border-2 border-emerald bg-transparent"
              style={{
                left: pct(crop.x, natural.w),
                top: pct(crop.y, natural.h),
                width: pct(crop.w, natural.w),
                height: pct(crop.h, natural.h),
                boxShadow: '0 0 0 9999px rgb(0 0 0 / 0)',
              }}
              onPointerDown={(e) => onPointerDown(e, 'move')}
            >
              <img
                src={url}
                alt=""
                draggable={false}
                className="pointer-events-none absolute max-w-none"
                style={{
                  width: `${(natural.w / crop.w) * 100}%`,
                  left: `-${(crop.x / crop.w) * 100}%`,
                  top: `-${(crop.y / crop.h) * 100}%`,
                }}
              />
              <span
                className="absolute -bottom-1.5 -right-1.5 size-4 cursor-nwse-resize rounded-sm border-2 border-white bg-emerald shadow"
                onPointerDown={(e) => onPointerDown(e, 'resize')}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={confirm}>Recortar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
