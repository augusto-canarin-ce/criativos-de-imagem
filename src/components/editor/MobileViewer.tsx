import { useEffect, useState } from 'react';
import { ArrowLeft, Download, Info } from 'lucide-react';
import { useEditor, selectProject } from '@/lib/store/editor';
import { FORMAT_IDS, getFormat, formatDimensions } from '@/config/formats';
import { goToDashboard } from '@/lib/router';
import { Button } from '@/components/ui/button';
import { FormatStage } from '@/components/canvas/FormatStage';
import { ExportDialog } from '@/components/dialogs/ExportDialog';

// Modo LEITURA no celular (§13): "o usuário navega pelos projetos, vê os três
// formatos e exporta. Tentar editar em tela pequena com este conjunto de
// ferramentas produziria uma experiência ruim; melhor não oferecer."
//
// Usa o mesmo FormatStage do modo comparar com `interactive={false}` — sem
// segundo caminho de render e sem risco de edição acidental por toque.

const MOBILE_MAX = 768;

export function useIsSmallScreen(): boolean {
  const [small, setSmall] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < MOBILE_MAX,
  );
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_MAX - 1}px)`);
    const update = () => setSmall(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return small;
}

export function MobileViewer() {
  const project = useEditor(selectProject);
  const setExportOpen = useEditor((s) => s.setExportOpen);
  if (!project) return null;

  return (
    <div className="ds-app flex h-screen flex-col bg-canvas">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-hairline bg-surface px-3">
        <Button variant="ghost" size="sm" onClick={goToDashboard}>
          <ArrowLeft /> Projetos
        </Button>
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{project.name}</span>
        <Button variant="cta" size="sm" onClick={() => setExportOpen(true)}>
          <Download /> Exportar
        </Button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <p className="mb-3 flex items-start gap-2 rounded-lg border border-hairline bg-elevated/60 p-2.5 text-xs leading-relaxed text-mute">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          Modo leitura. Dá para ver os três formatos e exportar; para editar, abra num
          computador — as ferramentas precisam de tela grande e mouse.
        </p>

        <div className="space-y-4">
          {FORMAT_IDS.map((id) => {
            const format = getFormat(id);
            return (
              <section key={id}>
                <div className="mb-1.5 flex items-baseline justify-between">
                  <h2 className="text-sm font-medium">{format.label}</h2>
                  <span className="text-[11px] tabular-nums text-mute">
                    {formatDimensions(id)}
                    {id === project.baseFormat && ' · base'}
                  </span>
                </div>
                <div
                  className="overflow-hidden rounded-lg border border-hairline bg-surface"
                  style={{ height: 360 }}
                >
                  <FormatStage formatId={id} interactive={false} />
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <ExportDialog />
    </div>
  );
}
