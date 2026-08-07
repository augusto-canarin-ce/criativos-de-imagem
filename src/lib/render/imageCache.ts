import { getAsset } from '@/lib/db/assets';
import type { Project } from '@/lib/model/types';

// Cache síncrono de HTMLImageElement por assetId.
//
// Duas razões de existir:
// 1. EXPORT (§11): a sequência obrigatória exige "todas as imagens com onload
//    resolvido" ANTES do render final. `preloadProjectImages` resolve tudo; o
//    ExportStage monta com as imagens já disponíveis de forma síncrona.
// 2. PREVIEW: trocar de formato/modo não recarrega blobs do IndexedDB.
//
// A suíte de regressão visual semeia este cache diretamente (`seedImage`), sem
// IndexedDB — a mesma cena React renderiza nos testes.

const cache = new Map<string, HTMLImageElement>();
const objectUrls = new Map<string, string>();

export function getCachedImage(assetId: string): HTMLImageElement | undefined {
  return cache.get(assetId);
}

/** Usado pelos testes de regressão visual para injetar imagens prontas. */
export function seedImage(assetId: string, image: HTMLImageElement): void {
  cache.set(assetId, image);
}

export async function loadImage(assetId: string): Promise<HTMLImageElement> {
  const hit = cache.get(assetId);
  if (hit) return hit;

  const asset = await getAsset(assetId);
  if (!asset) throw new Error(`Asset ${assetId} não encontrado.`);
  const url = URL.createObjectURL(asset.blob);
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Falha ao carregar a imagem "${asset.name}".`));
    img.src = url;
  });
  cache.set(assetId, img);
  objectUrls.set(assetId, url);
  return img;
}

/** Pré-carrega TODAS as imagens usadas em qualquer layout do projeto. Retorna os
 *  ids que falharam (para o checklist reportar, sem bloquear). */
export async function preloadProjectImages(project: Project): Promise<string[]> {
  const ids = new Set<string>();
  for (const layout of Object.values(project.layouts)) {
    for (const layer of layout.layers) {
      if (layer.type === 'image' && layer.assetId) ids.add(layer.assetId);
    }
  }
  const failed: string[] = [];
  await Promise.all(
    [...ids].map((id) =>
      loadImage(id).catch(() => {
        failed.push(id);
      }),
    ),
  );
  return failed;
}

/** Libera os object URLs (ao fechar o editor). O cache de Image fica — barato. */
export function releaseImageCache(): void {
  for (const url of objectUrls.values()) URL.revokeObjectURL(url);
  objectUrls.clear();
  cache.clear();
}
