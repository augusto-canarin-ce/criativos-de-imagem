import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, TriangleAlert } from 'lucide-react';
import { useEditor, selectProject } from '@/lib/store/editor';
import { useViewport } from '@/lib/store/viewport';
import { getFormat } from '@/config/formats';
import {
  assetMetaFrom,
  staticChecklist,
  type ChecklistWarning,
} from '@/lib/export/checklist';
import { collectProjectAssets } from '@/lib/export/projectFile';
import { isFontLoaded } from '@/lib/render/fontsReady';
import { cn } from '@/lib/utils';

// Rodapé (§11/§13): contagem de avisos SEMPRE visível, lista ao clicar, nunca
// bloqueia. Junta os avisos da adaptação (safe zone/auto-fit) com o checklist
// estático de pré-export. O contraste (que exige pixels renderizados) entra no
// diálogo de exportação.

export function StatusBar() {
  const project = useEditor(selectProject);
  const activeFormat = useEditor((s) => s.activeFormat);
  const adaptWarnings = useEditor((s) => s.warnings);
  const viewMode = useEditor((s) => s.viewMode);
  const scale = useViewport((s) => s.scale);
  const [checklist, setChecklist] = useState<ChecklistWarning[]>([]);
  const [open, setOpen] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Checklist estático recalculado com debounce a cada mudança no projeto.
  useEffect(() => {
    if (!project) return;
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      void collectProjectAssets(project).then((assets) => {
        setChecklist(staticChecklist(project.layouts, assetMetaFrom(assets), isFontLoaded));
      });
    }, 400);
    return () => clearTimeout(debounce.current);
  }, [project]);

  if (!project) return null;
  const format = getFormat(activeFormat);
  const count = project.layouts[activeFormat].layers.length;

  const messages = [
    ...checklist.map((w) => ({ text: w.message, destaque: w.severity === 'destaque' })),
    ...adaptWarnings.map((w) => ({ text: w.message, destaque: false })),
  ];

  return (
    <div className="relative flex h-7 items-center justify-between border-t border-hairline bg-surface px-3 text-xs text-mute">
      <div className="flex items-center gap-4">
        <span>
          {count} {count === 1 ? 'camada' : 'camadas'}
        </span>
        <button
          className={cn(
            'flex items-center gap-1 rounded px-1 py-0.5 hover:bg-ink/10',
            messages.length > 0 ? 'text-warning-deep' : 'text-mute',
          )}
          onClick={() => setOpen(!open)}
          aria-expanded={open}
        >
          {messages.length > 0 ? (
            <>
              <TriangleAlert className="size-3.5" />
              {messages.length} {messages.length === 1 ? 'aviso' : 'avisos'}
            </>
          ) : (
            <>
              <CheckCircle2 className="size-3.5" /> Sem avisos
            </>
          )}
        </button>
      </div>
      <div className="flex items-center gap-4">
        {viewMode === 'single' && <span className="tabular-nums">Zoom {Math.round(scale * 100)}%</span>}
        <span className="tabular-nums">
          {format.width}×{format.height}
        </span>
      </div>

      {open && messages.length > 0 && (
        <div className="absolute bottom-8 left-2 z-30 max-h-64 w-[26rem] overflow-y-auto rounded-md border border-hairline bg-surface p-2 shadow-lg">
          <ul className="space-y-1.5">
            {messages.map((m, i) => (
              <li
                key={i}
                className={cn('text-xs', m.destaque ? 'font-medium text-danger-deep' : 'text-body')}
              >
                {m.text}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
