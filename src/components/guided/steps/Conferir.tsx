import { useCallback, useEffect, useState } from 'react';
import type Konva from 'konva';
import { Check, Download, Loader2, PencilRuler, TriangleAlert } from 'lucide-react';
import { useEditor, selectProject } from '@/lib/store/editor';
import { FORMAT_IDS } from '@/config/formats';
import type { FormatId } from '@/lib/model/types';
import { FormatStage } from '@/components/canvas/FormatStage';
import { ExportStage } from '@/components/canvas/ExportStage';
import { preloadProjectImages } from '@/lib/render/imageCache';
import { waitForProjectFonts, isFontLoaded } from '@/lib/render/fontsReady';
import { encodeJpg } from '@/lib/export/encode';
import { downloadZip } from '@/lib/export/zip';
import { assetMetaFrom, staticChecklist, type ChecklistWarning } from '@/lib/export/checklist';
import { collectProjectAssets } from '@/lib/export/projectFile';
import { useSettings } from '@/lib/store/settings';
import { avisosParaLeigo, DICA_DO_FORMATO, NOME_DO_FORMATO } from '@/lib/guided/plainLanguage';
import { puxarParaDentro } from '@/lib/guided/actions';
import { BotaoGrande } from '../GuidedChrome';
import { AjustesSimples } from './AjustesSimples';

// PASSO 5 (§18): conferir os três formatos e baixar.
//
// Os avisos são os MESMOS do checklist da §11 — o fluxo guiado não inventa
// validação própria —, só que traduzidos para o efeito no anúncio e filtrados
// para o que a pessoa pode resolver.
//
// O download reusa o caminho de export do editor (ExportStage → toCanvas → ZIP),
// que é o mesmo caminho coberto pela regressão visual. Sem opções: JPG na
// qualidade padrão, os três num arquivo. Escolher formato de arquivo é decisão de
// quem já sabe o que vai fazer com ela — quem está aqui quer os arquivos.

interface Props {
  onEditor: () => void;
  onIrParaTela: (indice: number) => void;
  telaDaImagem: (layerId: string) => number | null;
}

export function Conferir({ onEditor, onIrParaTela, telaDaImagem }: Props) {
  const project = useEditor(selectProject);
  const settings = useSettings();
  const [checklist, setChecklist] = useState<ChecklistWarning[]>([]);
  const [baixando, setBaixando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pronto, setPronto] = useState(false);

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

      {erro && (
        <p className="mt-6 rounded-lg bg-danger-soft px-5 py-4 text-base text-danger-deep">{erro}</p>
      )}

      <div className="mt-10 flex flex-wrap items-center gap-3">
        <BotaoGrande onClick={() => void baixar()} disabled={baixando}>
          {baixando ? <Loader2 className="size-5 animate-spin" /> : <Download className="size-5" />}
          {baixando ? 'Preparando os arquivos…' : 'Baixar os três'}
        </BotaoGrande>
        <BotaoGrande tom="igual" onClick={onEditor}>
          <PencilRuler className="size-5" /> Abrir no editor completo
        </BotaoGrande>
      </div>

      {pronto && (
        <p className="mt-4 flex items-center gap-2 text-base text-emerald-deep">
          <Check className="size-4 shrink-0" /> Pronto! Os três arquivos foram para a sua pasta de
          downloads.
        </p>
      )}

      <p className="mt-6 text-base leading-relaxed text-mute">
        Depois de baixar, o criativo continua salvo aqui — dá para voltar e mudar quando quiser.
      </p>

      <Exportador
        ativo={baixando}
        onErro={(m) => {
          setErro(m);
          setBaixando(false);
        }}
        onPronto={async (canvases) => {
          try {
            const entradas = [];
            for (const id of FORMAT_IDS) {
              entradas.push({
                formatId: id,
                blob: await encodeJpg(
                  canvases[id]!,
                  settings.jpgQuality === 92 ? undefined : settings.jpgQuality / 100,
                ),
              });
            }
            await downloadZip(project.name, entradas, 'jpg', 1, settings.exportPattern);
            setPronto(true);
          } catch (err) {
            setErro(err instanceof Error ? err.message : 'Não consegui gerar os arquivos.');
          } finally {
            setBaixando(false);
          }
        }}
      />
    </div>
  );

  function baixar() {
    setErro(null);
    setPronto(false);
    setBaixando(true);
  }
}

/** Monta os três palcos de export fora da tela e avisa quando os três estiverem
 *  prontos. Só existe enquanto `ativo` — não vale manter três canvases em tamanho
 *  real vivos o tempo todo. */
function Exportador({
  ativo,
  onPronto,
  onErro,
}: {
  ativo: boolean;
  onPronto: (canvases: Partial<Record<FormatId, HTMLCanvasElement>>) => void | Promise<void>;
  onErro: (msg: string) => void;
}) {
  const project = useEditor(selectProject);
  const [preparado, setPreparado] = useState(false);
  const [canvases, setCanvases] = useState<Partial<Record<FormatId, HTMLCanvasElement>>>({});

  useEffect(() => {
    if (!ativo || !project) {
      setPreparado(false);
      setCanvases({});
      return;
    }
    let cancelado = false;
    void (async () => {
      try {
        await preloadProjectImages(project);
        await waitForProjectFonts(project);
        if (!cancelado) setPreparado(true);
      } catch (err) {
        if (!cancelado) onErro(err instanceof Error ? err.message : 'Falha ao preparar os arquivos.');
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [ativo, project, onErro]);

  const onStageReady = useCallback((formatId: FormatId, stage: Konva.Stage) => {
    const canvas = stage.toCanvas({ pixelRatio: 1 });
    setCanvases((prev) => ({ ...prev, [formatId]: canvas }));
  }, []);

  useEffect(() => {
    if (!ativo || !preparado) return;
    if (FORMAT_IDS.some((id) => !canvases[id])) return;
    void onPronto(canvases);
    // Uma vez por preparo — depois disso o Exportador some (ativo = false).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ativo, preparado, canvases]);

  if (!ativo || !preparado || !project) return null;
  return (
    <>
      {FORMAT_IDS.map((id) => (
        <ExportStage key={id} formatId={id} layout={project.layouts[id]} onReady={onStageReady} />
      ))}
    </>
  );
}
