import { useEditor, selectProject } from '@/lib/store/editor';
import { useViewport } from '@/lib/store/viewport';
import { getFormat } from '@/config/formats';

// Rodapé de status (SPEC §13). O checklist de avisos (placeholder vazio, contraste,
// safe zone…) chega junto com o export na Fase 3; aqui, zoom, dimensões e contagem
// de camadas.

export function StatusBar() {
  const project = useEditor(selectProject);
  const activeFormat = useEditor((s) => s.activeFormat);
  const scale = useViewport((s) => s.scale);
  if (!project) return null;
  const format = getFormat(activeFormat);
  const count = project.layouts[activeFormat].layers.length;

  return (
    <div className="flex h-7 items-center justify-between border-t border-hairline bg-surface px-3 text-xs text-mute">
      <span>
        {count} {count === 1 ? 'camada' : 'camadas'}
      </span>
      <div className="flex items-center gap-4">
        <span className="tabular-nums">Zoom {Math.round(scale * 100)}%</span>
        <span className="tabular-nums">
          {format.width}×{format.height}
        </span>
      </div>
    </div>
  );
}
