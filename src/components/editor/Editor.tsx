import { useEffect, useState } from 'react';
import { useEditor } from '@/lib/store/editor';
import { getProject } from '@/lib/db/projects';
import { goToDashboard } from '@/lib/router';
import { insertImageLayers } from '@/lib/assets/insertImage';
import { loadProjectFonts } from '@/lib/fonts/loader';
import { EditorHeader } from './EditorHeader';
import { FormatBar } from './FormatBar';
import { StatusBar } from './StatusBar';
import { Toolbar } from '@/components/toolbar/Toolbar';
import { CanvasStage } from '@/components/canvas/CanvasStage';
import { CompareView } from '@/components/canvas/CompareView';
import { LayersPanel } from '@/components/panels/LayersPanel';
import { TemplatesPanel } from '@/components/panels/TemplatesPanel';
import { BrandPanel } from '@/components/panels/BrandPanel';
import { Inspector } from '@/components/inspector/Inspector';
import { ExportDialog } from '@/components/dialogs/ExportDialog';
import { useActiveBrandKit } from './useActiveBrandKit';
import { MobileViewer, useIsSmallScreen } from './MobileViewer';
import { cn } from '@/lib/utils';
import { useEditorShortcuts } from './useEditorShortcuts';
import { useAutosave } from './useAutosave';

type LoadState = 'loading' | 'ready' | 'missing';

export function Editor({ projectId }: { projectId: string }) {
  const load = useEditor((s) => s.load);
  const close = useEditor((s) => s.close);
  const viewMode = useEditor((s) => s.viewMode);
  const [state, setState] = useState<LoadState>('loading');
  const [sidebar, setSidebar] = useState<'layers' | 'templates' | 'brand'>('layers');

  useEditorShortcuts();
  useAutosave();
  useActiveBrandKit();
  const isSmallScreen = useIsSmallScreen();

  useEffect(() => {
    let cancelled = false;
    setState('loading');
    void (async () => {
      const project = await getProject(projectId);
      if (cancelled) return;
      if (!project) {
        setState('missing');
        return;
      }
      // Fontes ANTES do load: fontes enviadas registram FontFace e as do Google
      // usadas no projeto recarregam por nome (§9) — o primeiro render já sai com
      // a família certa, sem "pulo" de fallback.
      await loadProjectFonts(project).catch(() => {});
      if (cancelled) return;
      load(project);
      setState('ready');
    })();
    return () => {
      cancelled = true;
      close();
    };
  }, [projectId, load, close]);

  if (state === 'missing') {
    return (
      <div className="grid h-screen place-items-center text-sm text-mute">
        <div className="text-center">
          <p>Projeto não encontrado.</p>
          <button className="mt-2 text-emerald-deep underline" onClick={goToDashboard}>
            Voltar aos projetos
          </button>
        </div>
      </div>
    );
  }

  // Tela pequena → modo leitura (§13): ver os três formatos e exportar.
  if (isSmallScreen) return <MobileViewer />;

  return (
    // .ds-app: densidade de aplicação do DS — raio, tipografia e campos menores.
    <div className="ds-app flex h-screen flex-col">
      <EditorHeader />
      <div className="flex min-h-0 flex-1">
        <aside className="flex w-60 shrink-0 flex-col border-r border-hairline bg-surface">
          <div className="flex border-b border-hairline">
            {(
              [
                ['layers', 'Camadas'],
                ['templates', 'Modelos'],
                ['brand', 'Marca'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                className={cn(
                  'flex-1 px-2 py-2 text-xs font-medium transition-colors',
                  sidebar === id
                    ? 'border-b-2 border-emerald text-ink'
                    : 'border-b-2 border-transparent text-mute hover:text-ink',
                )}
                onClick={() => setSidebar(id)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {sidebar === 'layers' && <LayersPanel />}
            {sidebar === 'templates' && <TemplatesPanel />}
            {sidebar === 'brand' && <BrandPanel />}
          </div>
        </aside>

        <main
          className="flex min-w-0 flex-1 flex-col"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
            if (files.length) void insertImageLayers(files);
          }}
        >
          <FormatBar />
          <Toolbar />
          <div className="relative min-h-0 flex-1">
            {state === 'ready' && (viewMode === 'compare' ? <CompareView /> : <CanvasStage />)}
          </div>
          <StatusBar />
        </main>

        <aside className="w-72 shrink-0 overflow-y-auto border-l border-hairline bg-surface">
          <Inspector />
        </aside>
      </div>
      <ExportDialog />
    </div>
  );
}
