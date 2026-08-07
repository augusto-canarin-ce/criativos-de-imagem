import { db } from './dexie';
import type { Asset } from '@/lib/model/types';
import { newId } from '@/lib/model/factory';
import { sanitizeSvg } from '@/lib/assets/svg';

// Armazenamento de assets. SPEC §8: toda imagem vira um Asset no IndexedDB; a camada
// guarda só o assetId. PNG com alfa é guardado como veio (a transparência é do
// próprio blob). SVG entra sanitizado (§12) e é exibido via <img>/Konva.Image.
//
// NOTA DE FASE: o pipeline completo da SPEC §12 (resize 2560px, recodificação,
// dedup por hash SHA-256, miniatura de 320px) entra na fase dedicada a imagens.

async function readImageSize(blob: Blob): Promise<{ width: number; height: number }> {
  const url = URL.createObjectURL(blob);
  try {
    return await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        // SVG sem width/height intrínsecos reporta 0 em alguns navegadores; o
        // fallback 300×150 é o tamanho-padrão de replaced elements do HTML.
        resolve({ width: img.naturalWidth || 300, height: img.naturalHeight || 150 });
      };
      img.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

const RASTER_MIME = /^image\/(png|jpeg|jpg|webp|gif|avif)$/i;
const SVG_MIME = /^image\/svg\+xml$/i;

export async function saveImageAsset(file: File | Blob, name = 'imagem'): Promise<Asset> {
  const mime = file.type || 'image/png';
  const assetName = file instanceof File ? file.name : name;

  let blob: Blob;
  let kind: Asset['kind'];
  if (SVG_MIME.test(mime)) {
    const sanitized = sanitizeSvg(await file.text());
    blob = new Blob([sanitized], { type: 'image/svg+xml' });
    kind = 'svg';
  } else if (RASTER_MIME.test(mime)) {
    blob = file instanceof File ? file.slice(0, file.size, mime) : file;
    kind = 'raster';
  } else {
    throw new Error(`Formato de imagem não suportado: ${mime || 'desconhecido'}.`);
  }

  const { width, height } = await readImageSize(blob);
  const asset: Asset = {
    id: newId(),
    kind,
    blob,
    mime: blob.type,
    width,
    height,
    name: assetName,
  };
  await db.assets.add(asset);
  return asset;
}

export async function getAsset(id: string): Promise<Asset | undefined> {
  return db.assets.get(id);
}
