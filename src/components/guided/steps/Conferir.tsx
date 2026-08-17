import { useEffect, useState } from 'react';
import { PencilRuler, TriangleAlert } from 'lucide-react';
import { useEditor, selectProject } from '@/lib/store/editor';
import { FORMAT_IDS } from '@/config/formats';
import { FormatStage } from '@/components/canvas/FormatStage';
import { isFontLoaded } from '@/lib/render/fontsReady';
import { assetMetaFrom, staticChecklist, type ChecklistWarning } from '@/lib/export/checklist';
import { collectProjectAssets } from '@/lib/export/projectFile';
import { avisosParaLeigo, DICA_DO_FORMATO, NOME_DO_FORMATO } from '@/lib/guided/plainLanguage';
import { puxarParaDentro } from '@/lib/guided/actions';
import { BotaoGrande } from '../GuidedChrome';
import { AjustesSimples } from './AjustesSimples';

// PASSO 4 (§18): conferir os três formatos e seguir para os ajustes finais.
//
// Os avisos são os MESMOS do checklist da §11 — o fluxo guiado não inventa
// validação própria —, só que traduzidos para o efeito no anúncio e filtrados
// para o que a pessoa pode resolver.
//
// O fluxo TERMINA em "Fazer ajustes finais", que abre o editor completo
// (decisão de 2026-08-17): os retoques e o download dos três arquivos
// acontecem lá — um lugar só para fechar o trabalho, em vez de duas portas
// concorrentes no fim do fluxo.

interface Props {
  onEditor: () => void;
  onIrParaTela: (indice: number) => void;
  telaDaImagem: (layerId: string) => number | null;
}

export function Conferir({ onEditor, onIrParaTela, telaDaImagem }: Props) {
  const project = useEditor(selectProject);
  const [checklist, setChecklist] = useState<ChecklistWarning[]>([]);

  // Checklist recalculado a cada mudança — os ajustes daqui precisam apagar o
  // aviso que os motivou, senão a pessoa corrige e continua vendo o problema.
  useEffect(() => {
    if (!project) return;
    const t = setTimeout(() => {
      void collectProjectAssets(project).then((assets) => {
        setChecklist(staticChecklist(project.layouts, assetMetaFrom(assets), isFontLoaded));
      });
    }, 300);
    return () => clearTimeout(t);
  }, [project]);

  if (!project) return null;
  const avisos = avisosParaLeigo(checklist, project);

  return (
    <div>
      <h1 className="text-[clamp(1.5rem,3vw,2rem)] font-semibold leading-tight tracking-tight text-ink">
        Veja como ficou nos três
      </h1>
      <p className="mt-3 text-lg leading-relaxed text-mute">
        É o mesmo anúncio adaptado para cada lugar onde ele vai aparecer.
      </p>

      <div className="mt-8 grid grid-cols-3 gap-4">
        {FORMAT_IDS.map((id) => (
          <figure key={id}>
            <div className="h-56 overflow-hidden rounded-lg border border-hairline bg-surface sm:h-72">
              <FormatStage formatId={id} interactive={false} />
            </div>
            <figcaption className="mt-3">
              <span className="block text-base font-medium text-ink">{NOME_DO_FORMATO[id]}</span>
              <span className="mt-1 block text-sm leading-snug text-mute">
                {DICA_DO_FORMATO[id]}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>

      {avisos.length > 0 && (
        <ul className="mt-8 space-y-3">
          {avisos.map((aviso) => (
            <li
              key={aviso.id}
              className="flex flex-wrap items-start gap-3 rounded-xl border border-warning/40 bg-warning-soft px-5 py-4"
            >
              <TriangleAlert className="mt-1 size-5 shrink-0 text-warning-deep" />
              <p className="min-w-[16rem] flex-1 text-base leading-relaxed text-warning-deep">
                {aviso.texto}
              </p>
              {aviso.acao === 'puxar-para-dentro' && aviso.layerId && (
                <button
                  type="button"
                  onClick={() =>
                    aviso.formatos.forEach((f) => puxarParaDentro(aviso.layerId!, f))
                  }
                  className="min-h-11 rounded-lg border border-warning/50 px-4 text-base font-medium text-warning-deep transition-colors hover:bg-warning/10"
                >
                  Puxar para dentro
                </button>
              )}
              {aviso.acao === 'escolher-imagem' && aviso.layerId && (
                <button
                  type="button"
                  onClick={() => {
                    const tela = telaDaImagem(aviso.layerId!);
                    if (tela !== null) onIrParaTela(tela);
                  }}
                  className="min-h-11 rounded-lg border border-warning/50 px-4 text-base font-medium text-warning-deep transition-colors hover:bg-warning/10"
                >
                  Escolher a imagem
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8">
        <AjustesSimples />
      </div>

      <div className="mt-10">
        <BotaoGrande onClick={onEditor}>
          <PencilRuler className="size-5" /> Fazer ajustes finais
        </BotaoGrande>
      </div>

      <p className="mt-6 text-base leading-relaxed text-mute">
        Abre o editor completo com tudo o que você já fez — lá você ajusta os detalhes e baixa os
        três arquivos. O criativo fica salvo; dá para voltar e mudar quando quiser.
      </p>
    </div>
  );
}
