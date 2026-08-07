import { saveImageAsset } from '@/lib/db/assets';
import { createImageLayer } from '@/lib/model/layers';
import { useEditor } from '@/lib/store/editor';

// Insere imagens no formato ativo. Fase 1: cada imagem vira uma camada cobrindo o
// quadro inteiro, inserida no FUNDO da pilha — o caso "foto de fundo" do aceite.
// O preenchimento em lote de placeholders na ordem de leitura (SPEC §8) chega na
// Fase 4; aqui o comportamento é o mais simples e previsível.

export async function insertImageLayers(files: File[]): Promise<void> {
  const store = useEditor.getState();
  const format = store.activeFormat;
  for (const file of files) {
    try {
      const asset = await saveImageAsset(file);
      const layer = createImageLayer(format, asset.id, file.name);
      store.commit((p) => {
        p.layouts[format].layers.unshift(layer);
        if (!p.assets.includes(asset.id)) p.assets.push(asset.id);
      });
      useEditor.getState().select([layer.id]);
    } catch (err) {
      console.error('Falha ao importar imagem:', err);
    }
  }
}
