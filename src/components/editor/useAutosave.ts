import { useEffect } from 'react';
import { useEditor } from '@/lib/store/editor';
import { saveProject } from '@/lib/db/projects';

// Salvamento automático debounced em 800ms (SPEC §12). Dispara só quando o PROJETO
// muda (não em troca de seleção/ferramenta). Ao desmontar, grava o pendente na hora
// para não perder os últimos ajustes.

export function useAutosave() {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let pending: import('@/lib/model/types').Project | null = null;
    let lastRef = useEditor.getState().history?.present ?? null;

    const flush = () => {
      if (pending) {
        void saveProject(pending);
        pending = null;
      }
    };

    const unsub = useEditor.subscribe((state) => {
      const project = state.history?.present ?? null;
      if (!project || project === lastRef) return;
      lastRef = project;
      pending = project;
      clearTimeout(timer);
      timer = setTimeout(flush, 800);
    });

    return () => {
      clearTimeout(timer);
      flush(); // grava o pendente ao sair do editor
      unsub();
    };
  }, []);
}
