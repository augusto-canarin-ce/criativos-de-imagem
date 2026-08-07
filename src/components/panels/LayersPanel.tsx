import { useState } from 'react';
import {
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Lock,
  Square,
  Type,
  Unlock,
} from 'lucide-react';
import type { Layer } from '@/lib/model/types';
import { useEditor, selectProject } from '@/lib/store/editor';
import { cn } from '@/lib/utils';

// Painel de camadas em árvore (SPEC §8). Ordem visual: topo da pilha em cima. Grupos
// e miniatura renderizada chegam na Fase 4; aqui, ícone por tipo, visibilidade,
// cadeado, renomear (duplo clique) e reordenar.

function typeIcon(layer: Layer) {
  if (layer.type === 'text') return <Type className="size-3.5" />;
  if (layer.type === 'image') return <ImageIcon className="size-3.5" />;
  return <Square className="size-3.5" />;
}

export function LayersPanel() {
  const project = useEditor(selectProject);
  const activeFormat = useEditor((s) => s.activeFormat);
  const selectedIds = useEditor((s) => s.selectedIds);
  const select = useEditor((s) => s.select);
  const toggleSelect = useEditor((s) => s.toggleSelect);
  const updateLayer = useEditor((s) => s.updateLayer);
  const reorderLayer = useEditor((s) => s.reorderLayer);
  const [renaming, setRenaming] = useState<string | null>(null);

  if (!project) return null;
  const layers = project.layouts[activeFormat].layers;
  const ordered = [...layers].reverse();

  if (layers.length === 0) {
    return <p className="p-3 text-xs text-mute">Nenhuma camada. Use as ferramentas para inserir.</p>;
  }

  return (
    <ul className="py-1">
      {ordered.map((layer) => {
        const selected = selectedIds.includes(layer.id);
        return (
          <li
            key={layer.id}
            onClick={(e) => (e.shiftKey ? toggleSelect(layer.id) : select([layer.id]))}
            className={cn(
              'group flex items-center gap-1.5 px-2 py-1 text-sm',
              selected ? 'bg-emerald/15 text-ink' : 'hover:bg-ink/10',
            )}
          >
            <button
              className="text-mute hover:text-ink"
              title={layer.visible ? 'Ocultar' : 'Mostrar'}
              onClick={(e) => {
                e.stopPropagation();
                updateLayer(layer.id, (l) => (l.visible = !l.visible));
              }}
            >
              {layer.visible ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
            </button>
            <span className="text-mute">{typeIcon(layer)}</span>

            {renaming === layer.id ? (
              <input
                autoFocus
                defaultValue={layer.name}
                className="h-6 min-w-0 flex-1 rounded border border-hairline-strong/60 bg-transparent px-1 text-sm outline-none"
                onClick={(e) => e.stopPropagation()}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v) updateLayer(layer.id, (l) => (l.name = v));
                  setRenaming(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                  if (e.key === 'Escape') setRenaming(null);
                }}
              />
            ) : (
              <span
                className="min-w-0 flex-1 truncate"
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setRenaming(layer.id);
                }}
              >
                {layer.name}
              </span>
            )}

            <span className="flex items-center opacity-0 group-hover:opacity-100">
              <button
                className="px-0.5 text-mute hover:text-ink"
                title="Mover para cima"
                onClick={(e) => {
                  e.stopPropagation();
                  reorderLayer(layer.id, 'up');
                }}
              >
                <ChevronUp className="size-3.5" />
              </button>
              <button
                className="px-0.5 text-mute hover:text-ink"
                title="Mover para baixo"
                onClick={(e) => {
                  e.stopPropagation();
                  reorderLayer(layer.id, 'down');
                }}
              >
                <ChevronDown className="size-3.5" />
              </button>
            </span>
            <button
              className="text-mute hover:text-ink"
              title={layer.locked ? 'Destravar' : 'Travar'}
              onClick={(e) => {
                e.stopPropagation();
                updateLayer(layer.id, (l) => (l.locked = !l.locked));
              }}
            >
              {layer.locked ? <Lock className="size-3.5" /> : <Unlock className="size-3.5 opacity-40 group-hover:opacity-100" />}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
