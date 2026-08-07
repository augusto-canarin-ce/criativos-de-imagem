import { useState } from 'react';
import { ImageOff, Replace } from 'lucide-react';
import type { ImageLayer } from '@/lib/model/types';
import { useEditor } from '@/lib/store/editor';
import { saveImageAsset } from '@/lib/db/assets';
import { pickImageFiles } from '@/lib/assets/upload';
import { Button } from '@/components/ui/button';
import { Row, SectionTitle, SelectField } from './controls';

// Imagens: fit cover/contain, substituir e esvaziar (SPEC §8). Focal point, crop,
// máscara e ajustes chegam nas Fases 2/4.

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
    </div>
  );
}
