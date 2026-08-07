import { useEditor, selectProject } from '@/lib/store/editor';
import { FORMAT_IDS, getFormat } from '@/config/formats';
import { cn } from '@/lib/utils';
import { FormatStage } from './FormatStage';

// Modo comparar (SPEC §13): os três formatos lado a lado, ao vivo. O formato em
// foco é editável em tempo real; editar a base propaga na hora para os conectados
// (a propagação acontece no commit, dentro do store). Clicar numa coluna a foca.

export function CompareView() {
  const project = useEditor(selectProject);
  const activeFormat = useEditor((s) => s.activeFormat);
  const setActiveFormat = useEditor((s) => s.setActiveFormat);

  if (!project) return null;

  return (
    <div className="flex h-full w-full gap-2 bg-canvas p-2">
      {FORMAT_IDS.map((id) => {
        const format = getFormat(id);
        const focused = id === activeFormat;
        const layout = project.layouts[id];
        const overrides = layout.layers.filter((l) => l.overriddenIn.includes(id)).length;
        return (
          <section
            key={id}
            onPointerDown={() => {
              if (!focused) setActiveFormat(id);
            }}
            className={cn(
              'flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg border transition-colors',
              focused ? 'border-emerald/60' : 'border-hairline hover:border-hairline-strong',
            )}
            aria-current={focused || undefined}
          >
            <header
              className={cn(
                'flex h-8 shrink-0 items-center gap-2 border-b border-hairline px-2 text-xs',
                focused ? 'bg-emerald-soft/40' : 'bg-surface',
              )}
            >
              <span className={cn('font-medium', focused ? 'text-ink' : 'text-mute')}>
                {format.label}
              </span>
              <span className="text-faint">{id}</span>
              {id === project.baseFormat && (
                <span className="rounded-full bg-emerald-soft px-1.5 py-0.5 text-[10px] font-semibold text-emerald-deep">
                  base
                </span>
              )}
              {layout.detached && (
                <span className="rounded-full bg-elevated px-1.5 py-0.5 text-[10px] text-mute">
                  desconectado
                </span>
              )}
              {overrides > 0 && (
                <span className="ml-auto text-[10px] text-mute">
                  {overrides} {overrides === 1 ? 'camada editada' : 'camadas editadas'}
                </span>
              )}
            </header>
            <div className="min-h-0 flex-1">
              <FormatStage formatId={id} interactive={focused} />
            </div>
          </section>
        );
      })}
    </div>
  );
}
