import { TriangleAlert } from 'lucide-react';
import { useEditor, selectProject } from '@/lib/store/editor';
import { useViewport } from '@/lib/store/viewport';
import { getFormat } from '@/config/formats';

// Rodapé de status (SPEC §13): avisos não bloqueantes, zoom e dimensões. O
// checklist completo de pré-export chega na Fase 3; aqui, os avisos da adaptação
// (safe zone, auto-fit no mínimo) do formato ativo.

export function StatusBar() {
  const project = useEditor(selectProject);
  const activeFormat = useEditor((s) => s.activeFormat);
  const warnings = useEditor((s) => s.warnings);
  const viewMode = useEditor((s) => s.viewMode);
  const scale = useViewport((s) => s.scale);
  if (!project) return null;
  const format = getFormat(activeFormat);
  const count = project.layouts[activeFormat].layers.length;
  const formatWarnings = warnings.filter((w) => w.formatId === activeFormat);

  return (
    <div className="flex h-7 items-center justify-between border-t border-hairline bg-surface px-3 text-xs text-mute">
      <div className="flex items-center gap-4">
        <span>
          {count} {count === 1 ? 'camada' : 'camadas'}
        </span>
        {formatWarnings.length > 0 && (
          <span
            className="flex items-center gap-1 text-warning-deep"
            title={formatWarnings.map((w) => w.message).join('\n')}
          >
            <TriangleAlert className="size-3.5" />
            {formatWarnings.length} {formatWarnings.length === 1 ? 'aviso' : 'avisos'}
          </span>
        )}
      </div>
      <div className="flex items-center gap-4">
        {viewMode === 'single' && <span className="tabular-nums">Zoom {Math.round(scale * 100)}%</span>}
        <span className="tabular-nums">
          {format.width}×{format.height}
        </span>
      </div>
    </div>
  );
}
