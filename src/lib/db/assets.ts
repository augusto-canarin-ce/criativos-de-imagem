import { db } from './dexie';
import type { Asset } from '@/lib/model/types';
import { newId } from '@/lib/model/factory';

// Armazenamento de assets. SPEC §8: toda imagem vira um Asset no IndexedDB; a camada
// guarda só o assetId. A mesma imagem usada em três formatos é um asset só.
//
// NOTA DE FASE: o pipeline completo da SPEC §12 (redimensiona p/ 2560px, recodifica,
// dedup por hash SHA-256 com contador de referências, miniatura de 320px) entra na
// fase dedicada a imagens. Aqui guardamos o blob como veio, com dimensões, o
// suficiente para editar e recarregar. O modelo (`Asset`) já é o final, então essa
// evolução não exige migração.

async function readImageSize(blob: Blob): Promise<{ width: number; height: number }> {
  // createImageBitmap é o caminho rápido e sem DOM; cai para <img> se faltar.
  if (typeof createImageBitmap === 'function') {
    try {
      const bmp = await createImageBitmap(blob);
      const size = { width: bmp.width, height: bmp.height };
      bmp.close();
      return size;
    } catch {
      /* segue para o fallback */
    }
  }
  const url = URL.createObjectURL(blob);
  try {
    return await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

const RASTER_MIME = /^image\/(png|jpeg|jpg|webp|gif|avif)$/i;

export async function saveImageAsset(file: File | Blob, name = 'imagem'): Promise<Asset> {
  const mime = file.type || 'image/png';
  if (!RASTER_MIME.test(mime)) {
    throw new Error(`Formato de imagem não suportado: ${mime || 'desconhecido'}.`);
  }
  const { width, height } = await readImageSize(file);
  const asset: Asset = {
    id: newId(),
    kind: 'raster',
    blob: file instanceof File ? file.slice(0, file.size, mime) : file,
    mime,
    width,
    height,
    name: file instanceof File ? file.name : name,
  };
  await db.assets.add(asset);
  return asset;
}

export async function getAsset(id: string): Promise<Asset | undefined> {
  return db.assets.get(id);
}
