import { useEffect, useState } from 'react';
import { getCachedImage, loadImage } from '@/lib/render/imageCache';

// Carrega um Asset raster/svg como HTMLImageElement, pronto para o Konva.
// Cache-first (lib/render/imageCache): se a imagem já foi carregada — pelo
// preload do export, por outro formato ou pela suíte de regressão visual — o
// primeiro render já nasce com ela, de forma síncrona.

export type ImageStatus = 'idle' | 'loading' | 'loaded' | 'error';

interface Result {
  image: HTMLImageElement | undefined;
  status: ImageStatus;
}

export function useImageAsset(assetId: string | null): Result {
  const cached = assetId ? getCachedImage(assetId) : undefined;
  const [image, setImage] = useState<HTMLImageElement | undefined>(cached);
  const [status, setStatus] = useState<ImageStatus>(
    cached ? 'loaded' : assetId ? 'loading' : 'idle',
  );

  useEffect(() => {
    if (!assetId) {
      setImage(undefined);
      setStatus('idle');
      return;
    }
    const hit = getCachedImage(assetId);
    if (hit) {
      setImage(hit);
      setStatus('loaded');
      return;
    }
    let cancelled = false;
    setStatus('loading');
    loadImage(assetId)
      .then((img) => {
        if (cancelled) return;
        setImage(img);
        setStatus('loaded');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [assetId]);

  return { image, status };
}
