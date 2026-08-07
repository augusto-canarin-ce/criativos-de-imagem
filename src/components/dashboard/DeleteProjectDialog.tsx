import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { deleteProject } from '@/lib/db/projects';
import type { Project } from '@/lib/model/types';

interface Props {
  project: Project | null;
  onOpenChange: (open: boolean) => void;
}

export function DeleteProjectDialog({ project, onOpenChange }: Props) {
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    if (!project) return;
    setBusy(true);
    try {
      await deleteProject(project.id);
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AlertDialog open={project !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Apagar projeto</AlertDialogTitle>
          <AlertDialogDescription>
            Apagar <strong className="text-ink">{project?.name}</strong>? Esta ação
            não pode ser desfeita — o projeto sai deste navegador de vez.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className="bg-danger text-white hover:bg-danger/90"
            disabled={busy}
            onClick={(e) => {
              e.preventDefault();
              void handleDelete();
            }}
          >
            {busy ? 'Apagando…' : 'Apagar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
