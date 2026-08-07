import { useEffect, useRef, useState } from 'react';
import { ImageOff, Replace } from 'lucide-react';
import type { ImageLayer } from '@/lib/model/types';
import { useEditor } from '@/lib/store/editor';
import { getAsset, saveImageAsset } from '@/lib/db/assets';
import { pickImageFiles } from '@/lib/assets/upload';
import { Button } from '@/components/ui/button';
import { Row, SectionTitle, SelectField } from './controls';

// Imagens: fit, substituir, esvaziar e o FOCAL POINT (SPEC §8) — o alvo arrastável
// que guia o reenquadre entre formatos. É a funcionalidade menos óbvia e mais
// valiosa do app; a linha de explicação abaixo do controle é exigência da SPEC.

export function ImageInspector({ layer }: { layer: ImageLayer }) {
  const updateLayer = useEditor((s) => s.updateLayer);
  const commit = useEditor((s) => s.commit);
  const activeFormat = useEditor((s) => s.activeFormat);
  const [busy, setBusy] = useState(false);

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
        }
        if (!p.assets.includes(asset.id)) p.assets.push(asset.id);
      });
    } finally {
      setBusy(false);
    }
  }

  function empty() {
    // Esvaziar: volta a placeholder mantendo quadro, máscara, efeitos e rótulo.
    updateLayer(layer.id, (l) => l.type === 'image' && (l.assetId = null));
  }

  return (
    <div>
      <SectionTitle>Imagem</SectionTitle>
      <div className="mb-2 flex gap-2">
        <Button variant="secondary" size="sm" className="flex-1" onClick={() => void replace()} disabled={busy}>
          <Replace /> {busy ? 'Enviando…' : layer.assetId ? 'Substituir' : 'Escolher'}
        </Button>
        {layer.assetId && (
          <Button variant="outline" size="sm" onClick={empty} title="Remover imagem (volta a placeholder)">
            <ImageOff />
          </Button>
        )}
      </div>
      <Row label="Ajuste">
        <SelectField
          value={layer.fit}
          options={[
            { value: 'cover', label: 'Cobrir (cover)' },
            { value: 'contain', label: 'Conter (contain)' },
          ]}
          onCommit={(v) => updateLayer(layer.id, (l) => l.type === 'image' && (l.fit = v))}
        />
      </Row>

      {layer.assetId && layer.fit === 'cover' && <FocalPointField layer={layer} />}
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
