import { useEffect, useMemo, useState } from 'react';
import { Monitor, PencilRuler } from 'lucide-react';
import { useEditor, selectProject } from '@/lib/store/editor';
import { getProject } from '@/lib/db/projects';
import { loadProjectFonts } from '@/lib/fonts/loader';
import { goToDashboard, goToEditor, goToGuided, goToLanding } from '@/lib/router';
import {
  buildScreens,
  clampScreen,
  labelDoContador,
  podeAvancar,
  type GuidedScreen,
} from '@/lib/guided/steps';
import { encerrarFluxo, fecharEdicaoDeTexto, pularImagem } from '@/lib/guided/actions';
import { useAutosave } from '@/components/editor/useAutosave';
import { useActiveBrandKit } from '@/components/editor/useActiveBrandKit';
import { useIsSmallScreen } from '@/components/editor/MobileViewer';
import { Logo } from '@/components/ui/logo';
import { cn } from '@/lib/utils';
import { Avancar, BotaoGrande, Progresso, Voltar } from './GuidedChrome';
import { GuidedPreview } from './GuidedPreview';
import { EscolherModelo } from './steps/EscolherModelo';
import { PedirImagem } from './steps/PedirImagem';
import { PedirTexto } from './steps/PedirTexto';
import { Conferir } from './steps/Conferir';

// Modo guiado "Criativo rápido" (SPEC §18).
//
// Esta é uma CASCA sobre o mesmo store do editor — não um sistema paralelo. Daí
// vêm de graça: salvamento automático, propagação para os três formatos, e sair
// para o editor completo a qualquer momento sem perder nada (é o mesmo estado,
// só troca a moldura).
//
// A casca não sabe fazer nada: ela desenha uma tela por vez e chama as ações que
// já existem.

export function GuidedFlow({ projectId }: { projectId: string | null }) {
  const isSmallScreen = useIsSmallScreen();
  if (isSmallScreen) return <PrecisaDeComputador />;
  if (!projectId) return <Moldura>{<EscolherModelo />}</Moldura>;
  return <FluxoComProjeto projectId={projectId} />;
}

function FluxoComProjeto({ projectId }: { projectId: string }) {
  const load = useEditor((s) => s.load);
  const close = useEditor((s) => s.close);
  const setGuidedScreen = useEditor((s) => s.setGuidedScreen);
  const project = useEditor(selectProject);
  const [estado, setEstado] = useState<'carregando' | 'pronto' | 'sumiu'>('carregando');

  useAutosave();
  useActiveBrandKit();

  useEffect(() => {
    let cancelado = false;
    setEstado('carregando');
    void (async () => {
      const encontrado = await getProject(projectId);
      if (cancelado) return;
      if (!encontrado) {
        setEstado('sumiu');
        return;
      }
      await loadProjectFonts(encontrado).catch(() => {});
      if (cancelado) return;
      load(encontrado);
      setEstado('pronto');
    })();
    return () => {
      cancelado = true;
      close();
    };
  }, [projectId, load, close]);

  const screens = useMemo<GuidedScreen[]>(() => (project ? buildScreens(project) : []), [project]);

  if (estado === 'carregando') {
    return <Moldura>{<p className="text-lg text-mute">Abrindo…</p>}</Moldura>;
  }
  if (estado === 'sumiu' || !project) {
    return (
      <Moldura>
        <div>
          <p className="mb-6 text-lg text-mute">Não encontrei este criativo.</p>
          <BotaoGrande onClick={goToDashboard}>Ver meus criativos</BotaoGrande>
        </div>
      </Moldura>
    );
  }

  // Projeto sem fluxo em andamento (já concluído ou aberto direto): o lugar dele
  // é o editor completo.
  if (!project.guided) {
    goToEditor(project.id);
    return null;
  }

  const indice = clampScreen(project.guided.screen, screens);
  const screen = screens[indice];
  const primeira = indice === 0;
  const liberado = podeAvancar(screen, project);

  const alvo = project.layouts[project.baseFormat].layers.find((l) => l.id === screen.layerId);
  const respondida =
    alvo?.type === 'image'
      ? alvo.assetId !== null
      : alvo?.type === 'text'
        ? alvo.content.trim().length > 0
        : false;
  const puladaPendente = !!screen.guide?.optional && !respondida;

  const conferindo = screen.kind === 'conferir';

  const irPara = (n: number) => {
    // Trocar de tela SEMPRE encerra a edição ao vivo do texto: o blur do campo
    // cobre o clique em Continuar, mas navegação por outros caminhos não pode
    // deixar o commit (e a propagação para os três formatos) pendurado.
    fecharEdicaoDeTexto();
    setGuidedScreen(clampScreen(n, screens));
  };

  const sairParaOEditor = () => {
    encerrarFluxo();
    goToEditor(project.id);
  };

  return (
    <div className="flex h-screen flex-col bg-canvas">
      {/* Header SEMPRE preto (2026-08-17), nos dois temas: a classe `dark` no
          próprio header re-escopa os tokens, então o conteúdo se ajusta sozinho.
          A logo é o caminho de volta para a página inicial — sempre. */}
      <header className="dark flex shrink-0 items-center justify-between gap-4 border-b border-white/10 bg-black px-6 py-4">
        <button type="button" onClick={goToLanding} title="Página inicial" className="flex items-center">
          <Logo className="h-6 w-auto text-ink" />
        </button>
        <button
          type="button"
          onClick={sairParaOEditor}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg px-4 text-base text-mute transition-colors hover:bg-ink/5 hover:text-ink"
          title="Abre o editor completo com tudo o que você já fez"
        >
          <PencilRuler className="size-4" /> Editar por conta própria
        </button>
      </header>

      {/* No passo 5 o preview lateral sai: os três formatos já estão na tela, e
          repetir o 4:5 ao lado seria a quarta cópia da mesma imagem. */}
      <div
        className={cn(
          'grid min-h-0 flex-1',
          conferindo ? '' : 'lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]',
        )}
      >
        {/* Coluna da pergunta */}
        <div className="flex min-h-0 flex-col overflow-y-auto px-6 py-8 lg:px-12 lg:py-12">
          <div className={cn('mx-auto flex w-full flex-1 flex-col', conferindo ? 'max-w-4xl' : 'max-w-xl')}>
            <div className="mb-10">
              <Progresso passo={screen.passo} label={labelDoContador(screen)} />
            </div>

            <div className="flex-1">
              {screen.kind === 'foto' || screen.kind === 'logo' ? (
                <PedirImagem key={screen.layerId} screen={screen} />
              ) : screen.kind === 'texto' ? (
                <PedirTexto key={screen.layerId} screen={screen} />
              ) : (
                <Conferir
                  onEditor={sairParaOEditor}
                  onIrParaTela={irPara}
                  telaDaImagem={(layerId) => {
                    const i = screens.findIndex((s) => s.layerId === layerId);
                    return i >= 0 ? i : null;
                  }}
                />
              )}
            </div>

            {screen.kind !== 'conferir' && (
              <div className="mt-10 flex flex-wrap items-center gap-3">
                {/* Enquanto a etapa opcional está sem resposta, os dois botões têm
                    o MESMO peso visual: pular não pode parecer a escolha menor
                    (§18). Assim que a pessoa responde, "Continuar" vira o
                    principal e pular deixa de fazer sentido. */}
                <Avancar
                  onClick={() => irPara(indice + 1)}
                  disabled={!liberado}
                  motivo={!liberado ? 'Escreva o texto para continuar.' : undefined}
                  tom={puladaPendente ? 'igual' : 'principal'}
                />
                {puladaPendente && (
                  <BotaoGrande
                    tom="igual"
                    onClick={() => {
                      if (alvo?.type === 'image' && screen.layerId) pularImagem(screen.layerId);
                      irPara(indice + 1);
                    }}
                  >
                    Pular esta etapa
                  </BotaoGrande>
                )}
              </div>
            )}

            <div className="mt-8 pt-2">
              <Voltar onClick={() => (primeira ? goToGuided() : irPara(indice - 1))} />
            </div>
          </div>
        </div>

        {/* Coluna do preview ao vivo */}
        <aside
          className={cn(
            'hidden min-h-0 border-l border-hairline bg-surface/40 p-8',
            conferindo ? '' : 'lg:block',
          )}
        >
          <p className="mb-4 text-center text-sm font-medium uppercase tracking-wide text-mute">
            Seu criativo até aqui
          </p>
          <div className="h-[calc(100%-3rem)]">
            <GuidedPreview />
          </div>
        </aside>
      </div>
    </div>
  );
}

function Moldura({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="dark flex shrink-0 items-center justify-between gap-4 border-b border-white/10 bg-black px-6 py-4">
        <button type="button" onClick={goToLanding} title="Página inicial" className="flex items-center">
          <Logo className="h-6 w-auto text-ink" />
        </button>
        <button
          type="button"
          onClick={goToDashboard}
          className="inline-flex min-h-11 items-center rounded-lg px-4 text-base text-mute transition-colors hover:bg-ink/5 hover:text-ink"
        >
          Meus criativos
        </button>
      </header>
      <div className="flex flex-1 items-center justify-center px-6 py-12">{children}</div>
    </div>
  );
}

/** O fluxo é de computador, pela mesma regra do editor (§13/§18). A landing abre
 *  no celular, então esta tela precisa existir — sem ela o botão de lá levaria a
 *  um fluxo quebrado. */
function PrecisaDeComputador() {
  return (
    <Moldura>
      <div className="max-w-md text-center">
        <Monitor className="mx-auto mb-5 size-10 text-mute" />
        <h1 className="text-2xl font-semibold text-ink">Isto aqui pede um computador</h1>
        <p className="mt-3 text-lg leading-relaxed text-mute">
          Montar o criativo precisa de tela grande. No celular dá para ver os criativos que você
          já fez e baixar os arquivos.
        </p>
        <div className="mt-8 flex justify-center">
          <BotaoGrande onClick={goToDashboard}>Ver meus criativos</BotaoGrande>
        </div>
      </div>
    </Moldura>
  );
}
