import { useState } from 'react';
import {
  ChevronUp,
  ChevronDown,
  ChevronRight,
  Circle,
  Eye,
  EyeOff,
  Folder,
  Image as ImageIcon,
  Lock,
  Minus,
  MoveRight,
  Square,
  Type,
  Unlock,
} from 'lucide-react';
import type { Layer } from '@/lib/model/types';
import { useEditor, selectProject } from '@/lib/store/editor';
import { cn } from '@/lib/utils';

// Painel de camadas em ÁRVORE (SPEC §8): grupos expandem mostrando os filhos
// (seleção de filho individual acontece por aqui — no canvas, clicar seleciona o
// grupo). Ordem visual: topo da pilha em cima.

function typeIcon(layer: Layer) {
  if (layer.type === 'text') return <Type className="size-3.5" />;
  if (layer.type === 'image') return <ImageIcon className="size-3.5" />;
  if (layer.type === 'group') return <Folder className="size-3.5" />;
  if (layer.shape === 'ellipse') return <Circle className="size-3.5" />;
  if (layer.shape === 'line') return <Minus className="size-3.5" />;
  if (layer.shape === 'arrow') return <MoveRight className="size-3.5" />;
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
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  if (!project) return null;
  const layers = project.layouts[activeFormat].layers;
  const ordered = [...layers].reverse();
  // Em formato derivado conectado a ordem da pilha segue a base (SPEC §7) —
  // reordenar aqui seria desfeito pela propagação no mesmo commit.
  const canReorder =
    activeFormat === project.baseFormat || project.layouts[activeFormat].detached;

  if (layers.length === 0) {
    return <p className="p-3 text-xs text-mute">Nenhuma camada. Use as ferramentas para inserir.</p>;
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function renderLayer(layer: Layer, depth: number): React.ReactNode {
    const selected = selectedIds.includes(layer.id);
    const overridden = layer.overriddenIn.includes(activeFormat);
    const isGroup = layer.type === 'group';
    const isOpen = isGroup && expanded.has(layer.id);
    return (
      <div key={layer.id}>
        {renderRow(layer, depth, selected, overridden, isGroup, isOpen)}
        {isOpen &&
          layer.type === 'group' &&
          [...layer.children].reverse().map((child) => renderLayer(child, depth + 1))}
      </div>
    );
  }

  function renderRow(
    layer: Layer,
    depth: number,
    selected: boolean,
    overridden: boolean,
    isGroup: boolean,
    isOpen: boolean,
  ): React.ReactNode {
    return (
          <li
            key={layer.id}
            style={{ paddingLeft: depth * 16 + 8 }}
            onClick={(e) => (e.shiftKey ? toggleSelect(layer.id) : select([layer.id]))}
            className={cn(
              'group flex items-center gap-1.5 py-1 pr-2 text-sm',
              selected ? 'bg-emerald/15 text-ink' : 'hover:bg-ink/10',
            )}
          >
            {isGroup && (
              <button
                className="text-mute hover:text-ink"
                title={isOpen ? 'Recolher' : 'Expandir'}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(layer.id);
                }}
              >
                <ChevronRight className={cn('size-3.5 transition-transform', isOpen && 'rotate-90')} />
              </button>
            )}
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

            {/* Marcador discreto de override (SPEC §7). */}
            {overridden && (
              <span
                className="size-1.5 shrink-0 rounded-full bg-warning"
                title="Editada neste formato — não segue mais o formato base"
              />
            )}

            {canReorder && depth === 0 && (
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
            )}
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
  }

  return <ul className="py-1">{ordered.map((layer) => renderLayer(layer, 0))}</ul>;
}
