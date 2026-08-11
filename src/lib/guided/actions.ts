import { useEditor } from '@/lib/store/editor';
import { getAsset } from '@/lib/db/assets';
import { replaceImageOnLayer } from '@/lib/assets/insertImage';
import { emptySkippedLogos } from './steps';

// Ações do modo guiado (§18). Todas passam pelo MESMO store do editor: o fluxo é
// uma casca, não um sistema paralelo. Isso dá salvamento automático, propagação
// para os três formatos e "sair para o editor sem perder nada" de graça.

/** Preenche a imagem de uma camada e devolve um aviso em português claro quando
 *  a foto é pequena demais para o tamanho em que vai aparecer.
 *
 *  A validação diz a CONSEQUÊNCIA, nunca o número: "abaixo de 1080px" não
 *  significa nada para quem só quer anunciar. */
export async function preencherImagem(
  layerId: string,
  file: File,
): Promise<{ aviso: string | null }> {
  await replaceImageOnLayer(layerId, file);
  // Pode ter sido escondida por um "pular" anterior: quem volta e escolhe uma
  // imagem espera vê-la aparecer.
  useEditor.getState().updateLayer(layerId, (l) => {
    l.visible = true;
  });

  const project = useEditor.getState().history?.present;
  const layer = project?.layouts[project.baseFormat].layers.find((l) => l.id === layerId);
  if (!layer || layer.type !== 'image' || !layer.assetId) return { aviso: null };

  const asset = await getAsset(layer.assetId);
  if (!asset?.width || !asset.height) return { aviso: null };

  const escala =
    layer.fit === 'cover'
      ? Math.max(layer.frame.w / asset.width, layer.frame.h / asset.height)
      : Math.min(layer.frame.w / asset.width, layer.frame.h / asset.height);

  if (escala > 1.15) {
    return {
      aviso:
        'Essa foto é pequena para o tamanho que vai aparecer e pode sair borrada no anúncio. Se tiver uma versão maior dela, o resultado fica bem melhor.',
    };
  }
  return { aviso: null };
}

/** Pular uma etapa de imagem ESCONDE a camada na hora, em vez de removê-la.
 *
 *  Some do preview no mesmo instante — quem clicou em "pular" não pode continuar
 *  vendo o quadro tracejado —, mas a camada continua no projeto, então "Voltar"
 *  e escolher uma imagem funciona. A remoção definitiva é no fim do fluxo
 *  (`limparLogoNaoUsada`). */
export function pularImagem(layerId: string): void {
  useEditor.getState().updateLayer(layerId, (l) => {
    l.visible = false;
  });
}

/** Escreve o texto de uma camada. Um `commit` por tecla seria um passo de
 *  desfazer por tecla; `commitLive` funde tudo no mesmo passo, e o `endLive`
 *  fecha o grupo quando a pessoa sai do campo. */
export function escreverTexto(layerId: string, conteudo: string): void {
  useEditor.getState().updateLayerLive(layerId, `guiado-texto-${layerId}`, (layer) => {
    if (layer.type === 'text') layer.content = conteudo;
  });
}

export function fecharEdicaoDeTexto(): void {
  useEditor.getState().endLive();
}

/** Fim do fluxo (ou saída para o editor): a logo pulável que continuou vazia sai
 *  do projeto. Ela fica durante o fluxo para a pessoa poder voltar e preencher,
 *  mas não pode sobreviver — placeholder vazio vira aviso no checklist e quadro
 *  tracejado no anúncio publicado. */
export function limparLogoNaoUsada(): void {
  const store = useEditor.getState();
  const project = store.history?.present;
  if (!project) return;
  const ids = emptySkippedLogos(project);
  if (!ids.length) return;
  store.commit((p) => {
    for (const formatId of Object.keys(p.layouts) as (keyof typeof p.layouts)[]) {
      p.layouts[formatId].layers = p.layouts[formatId].layers.filter((l) => !ids.includes(l.id));
    }
  });
}

/** Sair do fluxo: limpa a logo não usada e apaga o estado do guiado, para o
 *  projeto voltar a ser um projeto normal — indistinguível de um feito à mão.
 *
 *  A remoção da logo passa pelo histórico (é edição do documento, e desfazer
 *  deve trazê-la de volta); apagar o estado do fluxo, não. */
export function encerrarFluxo(): void {
  limparLogoNaoUsada();
  useEditor.getState().clearGuided();
}
