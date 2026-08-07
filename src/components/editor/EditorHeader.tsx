import { ArrowLeft, Download, Redo2, Undo2 } from 'lucide-react';
import { useEditor, selectProject, selectCanRedo, selectCanUndo } from '@/lib/store/editor';
import { goToDashboard } from '@/lib/router';
import { Button } from '@/components/ui/button';

export function EditorHeader() {
  const project = useEditor(selectProject);
  const canUndo = useEditor(selectCanUndo);
  const canRedo = useEditor(selectCanRedo);
  const undo = useEditor((s) => s.undo);
  const redo = useEditor((s) => s.redo);

  return (
    <header className="flex h-12 items-center gap-2 border-b border-hairline bg-surface px-3">
      <Button variant="ghost" size="sm" onClick={goToDashboard} title="Voltar aos projetos">
        <ArrowLeft /> Projetos
      </Button>
      <span className="truncate text-sm font-medium">{project?.name ?? '…'}</span>

      <div className="ml-4 flex items-center gap-0.5">
        <Button variant="ghost" size="icon" className="size-8" onClick={undo} disabled={!canUndo} title="Desfazer (Cmd+Z)">
          <Undo2 />
        </Button>
        <Button variant="ghost" size="icon" className="size-8" onClick={redo} disabled={!canRedo} title="Refazer (Cmd+Shift+Z)">
          <Redo2 />
        </Button>
      </div>

      <div className="ml-auto">
        <Button
          variant="cta"
          size="sm"
          onClick={() => useEditor.getState().setExportOpen(true)}
          title="Exportar (Cmd+Shift+E)"
        >
          <Download /> Exportar os 3
        </Button>
      </div>
    </header>
  );
}
