import {
  Image as ImageIcon,
  Maximize,
  MousePointer2,
  Square,
  Type,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useEditor, type Tool } from '@/lib/store/editor';
import { useViewport } from '@/lib/store/viewport';
import { pickImageFiles } from '@/lib/assets/upload';
import { insertImageLayers } from '@/lib/assets/insertImage';
import { cn } from '@/lib/utils';

// Barra de ferramentas do canvas: seleção/texto/retângulo como modos, imagem como
// ação imediata (upload). Zoom e safe zone à direita. Elipse/linha/seta na Fase 4.

const TOOLS: { id: Tool; icon: React.ReactNode; title: string; key: string }[] = [
  { id: 'select', icon: <MousePointer2 className="size-4" />, title: 'Selecionar', key: 'V' },
  { id: 'text', icon: <Type className="size-4" />, title: 'Texto', key: 'T' },
  { id: 'rect', icon: <Square className="size-4" />, title: 'Retângulo', key: 'R' },
];

export function Toolbar() {
  const tool = useEditor((s) => s.tool);
  const setTool = useEditor((s) => s.setTool);
  const showSafeArea = useEditor((s) => s.showSafeArea);
  const toggleSafeArea = useEditor((s) => s.toggleSafeArea);
  const scale = useViewport((s) => s.scale);
  const { fit, reset100, zoomBy } = useViewport();

  async function addImage() {
    const files = await pickImageFiles(true);
    if (files.length) await insertImageLayers(files);
  }

  return (
    <div className="flex items-center gap-1 border-b border-border bg-card px-2 py-1.5">
      {TOOLS.map((t) => (
        <button
          key={t.id}
          title={`${t.title} (${t.key})`}
          aria-pressed={tool === t.id}
          onClick={() => setTool(t.id)}
          className={cn(
            'grid size-8 place-items-center rounded-md transition-colors',
            tool === t.id ? 'bg-primary text-primary-foreground' : 'hover:bg-accent',
          )}
        >
          {t.icon}
        </button>
      ))}
      <button
        title="Imagem (I)"
        onClick={() => void addImage()}
        className="grid size-8 place-items-center rounded-md hover:bg-accent"
      >
        <ImageIcon className="size-4" />
      </button>

      <div className="mx-2 h-5 w-px bg-border" />

      <button
        onClick={toggleSafeArea}
        aria-pressed={showSafeArea}
        title="Safe zones (Shift+S)"
        className={cn(
          'rounded-md px-2 py-1 text-xs transition-colors',
          showSafeArea ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent',
        )}
      >
        Safe zone
      </button>

      <div className="ml-auto flex items-center gap-1">
        <button title="Reduzir" onClick={() => zoomBy(1 / 1.2)} className="grid size-8 place-items-center rounded-md hover:bg-accent">
          <ZoomOut className="size-4" />
        </button>
        <button onClick={reset100} title="100% (Shift+0)" className="w-14 rounded-md py-1 text-center text-xs tabular-nums hover:bg-accent">
          {Math.round(scale * 100)}%
        </button>
        <button title="Ampliar" onClick={() => zoomBy(1.2)} className="grid size-8 place-items-center rounded-md hover:bg-accent">
          <ZoomIn className="size-4" />
        </button>
        <button title="Ajustar à tela (Shift+1)" onClick={fit} className="grid size-8 place-items-center rounded-md hover:bg-accent">
          <Maximize className="size-4" />
        </button>
      </div>
    </div>
  );
}
