import { useEffect, useRef, useState } from 'react';
import { Crop, ImageOff, Replace } from 'lucide-react';
import type { ImageLayer } from '@/lib/model/types';
import { useEditor } from '@/lib/store/editor';
import { getAsset, saveImageAsset } from '@/lib/db/assets';
import { pickImageFiles } from '@/lib/assets/upload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NumberField, Row, SectionTitle, SelectField, SliderField } from './controls';
import { CropDialog } from '@/components/dialogs/CropDialog';

// Imagens (§8): substituir/esvaziar, rótulo de placeholder, fit, focal point,
// MÁSCARA por forma, CROP não destrutivo e AJUSTES por filtro (debounce 120ms).

export function ImageInspector({ layer }: { layer: ImageLayer }) {
  const updateLayer = useEditor((s) => s.updateLayer);
  const updateLayerLive = useEditor((s) => s.updateLayerLive);
  const endLive = useEditor((s) => s.endLive);
  const commit = useEditor((s) => s.commit);
  const activeFormat = useEditor((s) => s.activeFormat);
  const [busy, setBusy] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);

  async function replace() {
    const [file] = await pickImageFiles(false);
    if (!file) return;
    setBusy(true);
    try {
      const asset = await saveImageAsset(file);
      commit((p) => {
        const l = p.layouts[activeFormat].layers.find((x) => x.id === layer.id);
        if (l && l.type === 'image') {
          l.assetId = asset.id;
          l.focalPoint = { x: 0.5, y: 0.5 };
          l.crop = undefined;
        }
        if (!p.assets.includes(asset.id)) p.assets.push(asset.id);
      });
    } finally {
      setBusy(false);
    }
  }

  function set(mutate: (l: ImageLayer) => void) {
    updateLayer(layer.id, (l) => l.type === 'image' && mutate(l));
  }

  function empty() {
    // Esvaziar (§8): volta a placeholder mantendo quadro, máscara, efeitos e rótulo.
    set((l) => (l.assetId = null));
  }

  const adjustSlider = (
    label: string,
    key: keyof ImageLayer['adjust'],
    min: number,
    max: number,
  ) => (
    <Row label={label}>
      <SliderField
        value={layer.adjust[key]}
        min={min}
        max={max}
        debounceMs={120}
        onLive={(v) =>
          updateLayerLive(layer.id, `adj-${key}:${layer.id}`, (l) => {
            if (l.type === 'image') l.adjust[key] = v;
          })
        }
        onEnd={endLive}
      />
    </Row>
  );

  return (
    <div>
      <SectionTitle>Imagem</SectionTitle>
      {layer.assetId === null && (
        <Row label="Rótulo">
          <Input
            value={layer.placeholder.label}
            onChange={(e) => set((l) => (l.placeholder.label = e.target.value))}
            placeholder='Ex.: "Foto do produto"'
            className="h-8 text-sm"
          />
        </Row>
      )}
      <div className="mb-2 flex gap-2">
        <Button variant="secondary" size="sm" className="flex-1" onClick={() => void replace()} disabled={busy}>
          <Replace /> {busy ? 'Enviando…' : layer.assetId ? 'Substituir' : 'Escolher imagem'}
        </Button>
        {layer.assetId && (
          <>
            <Button variant="outline" size="sm" onClick={() => setCropOpen(true)} title="Recortar (não destrutivo)">
              <Crop />
            </Button>
            <Button variant="outline" size="sm" onClick={empty} title="Remover imagem (volta a placeholder)">
              <ImageOff />
            </Button>
          </>
        )}
      </div>
      <Row label="Ajuste">
        <SelectField
          value={layer.fit}
          options={[
            { value: 'cover', label: 'Cobrir (cover)' },
            { value: 'contain', label: 'Conter (contain)' },
          ]}
          onCommit={(v) => set((l) => (l.fit = v))}
        />
      </Row>

      <SectionTitle>Máscara</SectionTitle>
      <Row label="Forma">
        <SelectField
          value={layer.mask?.shape ?? 'none'}
          options={[
            { value: 'none', label: 'Sem máscara' },
            { value: 'rect', label: 'Retângulo' },
            { value: 'ellipse', label: 'Elipse' },
          ]}
          onCommit={(v) =>
            set((l) => {
              l.mask = v === 'none' ? undefined : { shape: v as 'rect' | 'ellipse', radius: l.mask?.radius ?? 0 };
            })
          }
        />
      </Row>
      {layer.mask?.shape === 'rect' && (
        <Row label="Raio">
          <NumberField
            value={layer.mask.radius ?? 0}
            min={0}
            suffix="px"
            onCommit={(v) => set((l) => l.mask && (l.mask.radius = v))}
          />
        </Row>
      )}

      {layer.assetId && (
        <>
          <SectionTitle>Ajustes</SectionTitle>
          {adjustSlider('Brilho', 'brightness', -100, 100)}
          {adjustSlider('Contraste', 'contrast', -100, 100)}
          {adjustSlider('Saturação', 'saturation', -100, 100)}
          {adjustSlider('Desfoque', 'blur', 0, 40)}
        </>
      )}

      {layer.assetId && layer.fit === 'cover' && <FocalPointField layer={layer} />}

      {cropOpen && layer.assetId && (
        <CropDialog layer={layer} onClose={() => setCropOpen(false)} />
      )}
    </div>
  );
}

/** Alvo arrastável sobre a miniatura: define o ponto (0–1) que permanece visível
 *  quando a foto é reenquadrada em cada formato. */
function FocalPointField({ layer }: { layer: ImageLayer }) {
  const updateLayerLive = useEditor((s) => s.updateLayerLive);
  const endLive = useEditor((s) => s.endLive);
  const [url, setUrl] = useState<string>();
  const boxRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  useEffect(() => {
    let objectUrl: string | undefined;
    let cancelled = false;
    void (async () => {
      if (!layer.assetId) return;
      const asset = await getAsset(layer.assetId);
      if (!asset || cancelled) return;
      objectUrl = URL.createObjectURL(asset.blob);
      setUrl(objectUrl);
    })();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [layer.assetId]);

  function setFromPointer(e: React.PointerEvent) {
    const box = boxRef.current;
    if (!box) return;
    const rect = box.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
    updateLayerLive(layer.id, `focal:${layer.id}`, (l) => {
      if (l.type === 'image') l.focalPoint = { x, y };
    });
  }

  if (!url) return null;

  return (
    <div className="mt-2">
      <SectionTitle>Ponto focal</SectionTitle>
      <div
        ref={boxRef}
        className="relative w-full cursor-crosshair touch-none overflow-hidden rounded-md border border-hairline"
        onPointerDown={(e) => {
          dragging.current = true;
          (e.target as Element).setPointerCapture(e.pointerId);
          setFromPointer(e);
        }}
        onPointerMove={(e) => dragging.current && setFromPointer(e)}
        onPointerUp={() => {
          dragging.current = false;
          endLive();
        }}
      >
        <img src={url} alt="" className="block max-h-40 w-full object-contain" draggable={false} />
        <span
          className="pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1.5px_rgb(16_185_129)]"
          style={{
            left: `${layer.focalPoint.x * 100}%`,
            top: `${layer.focalPoint.y * 100}%`,
          }}
        />
      </div>
      <p className="mt-1.5 text-[11px] leading-snug text-mute">
        O ponto focal fica sempre visível quando a foto é reenquadrada nos três formatos.
      </p>
    </div>
  );
}
