import { saveImageAsset } from '@/lib/db/assets';
import { createImageLayer, createImageElementLayer } from '@/lib/model/layers';
import { useEditor } from '@/lib/store/editor';
import type { FormatId, Layer, Project } from '@/lib/model/types';

/** Mesma regra do store: mexer numa camada de formato derivado conectado marca
 *  override para ela parar de seguir a base naquele formato. */
function markIfDerived(p: Project, format: FormatId, layer: Layer): void {
  if (format !== p.baseFormat && !p.layouts[format].detached) {
    if (!layer.overriddenIn.includes(format)) layer.overriddenIn.push(format);
  }
}

// Inserção de imagens no formato ativo.
//
// Regra (feedback pós-Fase 2):
// - PRIMEIRA imagem do layout: entra como FUNDO — cover, cobrindo o formato,
//   no fundo da pilha (o caso "foto de fundo").
// - Demais imagens: entram como ELEMENTO — contain, proporção natural preservada,
//   tamanho razoável, centralizadas, no TOPO da pilha. Logo sobre foto, ícone
//   sobre logo: cada uma é uma camada independente e editável.

export async function insertImageLayers(files: File[]): Promise<void> {
  const store = useEditor.getState();
  const format = store.activeFormat;
  for (const file of files) {
    try {
      const asset = await saveImageAsset(file);
      const state = useEditor.getState();
      const project = state.history?.present;
      if (!project) return;
      const hasImage = project.layouts[format].layers.some((l) => l.type === 'image');

      const layer = hasImage
        ? createImageElementLayer(
            format,
            asset.id,
            { width: asset.width ?? 300, height: asset.height ?? 150 },
            file.name,
          )
        : createImageLayer(format, asset.id, file.name);

      state.commit((p) => {
        markIfDerived(p, format, layer);
        const layers = p.layouts[format].layers;
        if (hasImage) layers.push(layer);
        else layers.unshift(layer);
        if (!p.assets.includes(asset.id)) p.assets.push(asset.id);
      });
      useEditor.getState().select([layer.id]);
    } catch (err) {
      console.error('Falha ao importar imagem:', err);
    }
  }
}

/**
 * Preenchimento em lote (§8): várias imagens de uma vez preenchem os placeholders
 * VAZIOS na ordem de leitura (de cima para baixo, esquerda→direita no desempate).
 * Sobrando imagens, entram como camadas novas soltas. Retorna quantos preencheu.
 */
export async function fillPlaceholdersInReadingOrder(files: File[]): Promise<number> {
  const store = useEditor.getState();
  const format = store.activeFormat;
  const project = store.history?.present;
  if (!project) return 0;

  const empties = project.layouts[format].layers
    .filter((l) => l.type === 'image' && l.assetId === null && l.visible)
    .sort((a, b) => a.frame.y - b.frame.y || a.frame.x - b.frame.x);

  const pairs = empties.slice(0, files.length).map((layer, i) => ({ layer, file: files[i] }));
  for (const { layer, file } of pairs) {
    await replaceImageOnLayer(layer.id, file);
  }
  const leftovers = files.slice(pairs.length);
  if (leftovers.length) await insertImageLayers(leftovers);
  return pairs.length;
}

/** Substitui só o asset de uma camada de imagem, preservando quadro, máscara,
 *  crop e efeitos (SPEC §8 — a operação mais usada ao produzir variação). */
export async function replaceImageOnLayer(layerId: string, file: File): Promise<void> {
  const store = useEditor.getState();
  const format = store.activeFormat;
  try {
    const asset = await saveImageAsset(file);
    store.commit((p) => {
      const layer = p.layouts[format].layers.find((l) => l.id === layerId);
      if (!layer || layer.type !== 'image') return;
      markIfDerived(p, format, layer);
      layer.assetId = asset.id;
      layer.focalPoint = { x: 0.5, y: 0.5 };
      layer.crop = undefined;
      if (!p.assets.includes(asset.id)) p.assets.push(asset.id);
    });
  } catch (err) {
    console.error('Falha ao substituir imagem:', err);
  }
}
