import { useEffect, useState } from 'react';
import { useEditor } from '@/lib/store/editor';
import { getProject } from '@/lib/db/projects';
import { goToDashboard } from '@/lib/router';
import { insertImageLayers } from '@/lib/assets/insertImage';
import { EditorHeader } from './EditorHeader';
import { StatusBar } from './StatusBar';
import { Toolbar } from '@/components/toolbar/Toolbar';
import { CanvasStage } from '@/components/canvas/CanvasStage';
import { LayersPanel } from '@/components/panels/LayersPanel';
import { Inspector } from '@/components/inspector/Inspector';
import { useEditorShortcuts } from './useEditorShortcuts';
import { useAutosave } from './useAutosave';

type LoadState = 'loading' | 'ready' | 'missing';

export function Editor({ projectId }: { projectId: string }) {
  const load = useEditor((s) => s.load);
  const close = useEditor((s) => s.close);
  const [state, setState] = useState<LoadState>('loading');

  useEditorShortcuts();
  useAutosave();

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
      <div className="grid h-full place-items-center text-sm text-mute">
        <div className="text-center">
          <p>Projeto não encontrado.</p>
          <button className="mt-2 text-emerald-deep underline" onClick={goToDashboard}>
            Voltar aos projetos
          </button>
        </div>
      </div>
    );
  }

  return (
    // .ds-app: densidade de aplicação do DS — raio, tipografia e campos menores.
    <div className="ds-app flex h-full flex-col">
      <EditorHeader />
      <div className="flex min-h-0 flex-1">
        <aside className="flex w-60 shrink-0 flex-col border-r border-hairline bg-surface">
          <div className="border-b border-hairline px-3 py-2 text-xs font-semibold uppercase tracking-wide text-mute">
            Camadas
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <LayersPanel />
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
          <Toolbar />
          <div className="relative min-h-0 flex-1">
            {state === 'ready' && <CanvasStage />}
          </div>
          <StatusBar />
        </main>

        <aside className="w-72 shrink-0 overflow-y-auto border-l border-hairline bg-surface">
          <Inspector />
        </aside>
      </div>
    </div>
  );
}
