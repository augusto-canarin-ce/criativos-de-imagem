import { useEffect, useState } from 'react';
import { getAsset } from '@/lib/db/assets';

// Carrega um Asset raster do IndexedDB como HTMLImageElement, pronto para o Konva.
// Gerencia o ciclo de vida do object URL (revoga ao trocar/desmontar).
//
// NOTA DE PERFORMANCE (SPEC §16): na Fase de imagens, a tela deve usar um bitmap
// reduzido e a resolução plena entra só no export. Por ora carregamos o blob como
// está — suficiente para a Fase 1.

export type ImageStatus = 'idle' | 'loading' | 'loaded' | 'error';

interface Result {
  image: HTMLImageElement | undefined;
  status: ImageStatus;
}

export function useImageAsset(assetId: string | null): Result {
  const [image, setImage] = useState<HTMLImageElement>();
  const [status, setStatus] = useState<ImageStatus>(assetId ? 'loading' : 'idle');

  useEffect(() => {
    if (!assetId) {
      setImage(undefined);
      setStatus('idle');
      return;
    }
    let cancelled = false;
    let url: string | undefined;
    setStatus('loading');

    void (async () => {
      try {
        const asset = await getAsset(assetId);
        if (!asset) throw new Error('asset ausente');
        url = URL.createObjectURL(asset.blob);
        const img = new Image();
        img.onload = () => {
          if (cancelled) return;
          setImage(img);
          setStatus('loaded');
        };
        img.onerror = () => {
          if (!cancelled) setStatus('error');
        };
        img.src = url;
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();

    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [assetId]);

  return { image, status };
}
