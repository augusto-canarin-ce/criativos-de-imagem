import { Trash2 } from 'lucide-react';
import { useEditor, selectProject } from '@/lib/store/editor';
import { Button } from '@/components/ui/button';
import { CommonInspector } from './CommonInspector';
import { TextInspector } from './TextInspector';
import { ImageInspector } from './ImageInspector';
import { ShapeInspector } from './ShapeInspector';
import { BackgroundInspector } from './BackgroundInspector';

// Inspector: muda conforme a seleção (SPEC §13). Sem seleção → fundo; uma camada →
// campos comuns + específicos do tipo; múltiplas → ações em lote (mínimo na Fase 1).

export function Inspector() {
  const project = useEditor(selectProject);
  const activeFormat = useEditor((s) => s.activeFormat);
  const selectedIds = useEditor((s) => s.selectedIds);
  const removeLayer = useEditor((s) => s.removeLayer);
  const revertLayerOverride = useEditor((s) => s.revertLayerOverride);
  const commit = useEditor((s) => s.commit);

  if (!project) return null;
  const layers = project.layouts[activeFormat].layers;
  const selected = layers.filter((l) => selectedIds.includes(l.id));

  if (selected.length === 0) return <BackgroundInspector />;

  if (selected.length > 1) {
    return (
      <div className="p-3">
        <p className="mb-3 text-sm">{selected.length} camadas selecionadas</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            commit((p) => {
              const layout = p.layouts[activeFormat];
              layout.layers = layout.layers.filter((l) => !selectedIds.includes(l.id));
            })
          }
        >
          <Trash2 /> Apagar selecionadas
        </Button>
      </div>
    );
  }

  const layer = selected[0];
  const overridden = layer.overriddenIn.includes(activeFormat);
  return (
    <div className="p-3">
      <div className="mb-1 flex items-center justify-between">
        <span className="truncate text-sm font-medium">{layer.name}</span>
        <Button variant="ghost" size="icon" className="size-7" onClick={() => removeLayer(layer.id)} title="Apagar camada">
          <Trash2 />
        </Button>
      </div>
      {/* Override no formato ativo: aviso + reconexão (SPEC §7). */}
      {overridden && (
        <div className="mb-2 flex items-center justify-between gap-2 rounded-md bg-warning-soft px-2 py-1.5 text-xs text-warning-deep">
          <span>Editada neste formato</span>
          <button
            className="font-medium underline underline-offset-2"
            onClick={() => revertLayerOverride(layer.id)}
          >
            Voltar a seguir o {project.baseFormat}
          </button>
        </div>
      )}
      {layer.type === 'text' && <TextInspector layer={layer} />}
      {layer.type === 'image' && <ImageInspector layer={layer} />}
      {layer.type === 'shape' && <ShapeInspector layer={layer} />}
      <CommonInspector layer={layer} />
    </div>
  );
}
