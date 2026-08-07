import { MoreVertical, Copy, FileDown, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { getFormat } from '@/config/formats';
import type { Fill, Project } from '@/lib/model/types';
import { relativeTime } from '@/lib/format-date';

interface Props {
  project: Project;
  onOpen: (p: Project) => void;
  onRename: (p: Project) => void;
  onDuplicate: (p: Project) => void;
  onExportFile: (p: Project) => void;
  onDelete: (p: Project) => void;
}

// CSS de fundo a partir de um Fill. Tokens de marca (brand.*) só resolvem no render
// do canvas (Fase 1+); aqui, sem brand kit, caem para um cinza neutro. SPEC §6.
function fillToCss(fill: Fill): string {
  if (fill.kind === 'solid') {
    return fill.color.startsWith('#') ? fill.color : 'var(--color-elevated)';
  }
  if (fill.kind === 'linear') {
    const stops = fill.stops.map((s) => `${s.color} ${s.offset * 100}%`).join(', ');
    return `linear-gradient(${fill.angle}deg, ${stops})`;
  }
  const stops = fill.stops.map((s) => `${s.color} ${s.offset * 100}%`).join(', ');
  return `radial-gradient(circle, ${stops})`;
}

export function ProjectCard({ project, onOpen, onRename, onDuplicate, onExportFile, onDelete }: Props) {
  const format = getFormat(project.baseFormat);
  const layout = project.layouts[project.baseFormat];

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-lg border border-hairline bg-surface transition-colors hover:border-muted-foreground/40">
      {/* Miniatura: proporção real do formato base, cor de fundo do layout.
          O preview renderizado do criativo chega numa fase posterior. */}
      <button
        onClick={() => onOpen(project)}
        className="flex items-center justify-center bg-elevated/60 p-6 outline-none focus-visible:ring-2 focus-visible:ring-emerald/40"
        title={`Abrir ${project.name}`}
      >
        <div
          className="rounded-sm shadow-sm ring-1 ring-black/10"
          style={{
            width: 96,
            height: (96 * format.height) / format.width,
            background: fillToCss(layout.background),
          }}
          aria-hidden
        />
      </button>

      <div className="flex items-start justify-between gap-2 border-t border-hairline p-3">
        <button className="min-w-0 text-left" onClick={() => onOpen(project)}>
          <p className="truncate text-sm font-medium" title={project.name}>
            {project.name}
          </p>
          <p className="mt-0.5 text-xs text-mute">
            {format.label} · {relativeTime(project.updatedAt)}
          </p>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0"
              aria-label={`Ações de ${project.name}`}
            >
              <MoreVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => onRename(project)}>
              <Pencil /> Renomear
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onDuplicate(project)}>
              <Copy /> Duplicar
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onExportFile(project)}>
              <FileDown /> Exportar arquivo (.criativo)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onSelect={() => onDelete(project)}>
              <Trash2 /> Apagar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
