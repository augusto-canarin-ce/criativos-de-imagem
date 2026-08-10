import { useEffect } from 'react';
import { useEditor } from '@/lib/store/editor';
import { useViewport } from '@/lib/store/viewport';
import { pickImageFiles } from '@/lib/assets/upload';
import { insertImageLayers } from '@/lib/assets/insertImage';

// Atalhos ativos — subconjunto de config/shortcuts.ts (fonte única, padrão Figma
// onde há equivalente). Agrupar, copiar estilo, Cmd+/ etc. chegam nas fases
// seguintes.

function isTyping(): boolean {
  const el = document.activeElement;
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || (el as HTMLElement).isContentEditable);
}

export function useEditorShortcuts() {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const s = useEditor.getState();
      const mod = e.metaKey || e.ctrlKey;

      // Undo/redo funcionam mesmo com foco fora do canvas, exceto digitando.
      if (mod && (e.key === 'z' || e.key === 'Z')) {
        if (isTyping()) return;
        e.preventDefault();
        e.shiftKey ? s.redo() : s.undo();
        return;
      }
      if (mod && (e.key === 'y' || e.key === 'Y')) {
        if (isTyping()) return;
        e.preventDefault();
        s.redo();
        return;
      }

      if (isTyping() || s.editingId) return;

      // Reordenar pilha
      if (mod && e.key === ']') {
        e.preventDefault();
        s.selectedIds.forEach((id) => s.reorderLayer(id, e.shiftKey ? 'front' : 'up'));
        return;
      }
      if (mod && e.key === '[') {
        e.preventDefault();
        s.selectedIds.forEach((id) => s.reorderLayer(id, e.shiftKey ? 'back' : 'down'));
        return;
      }
      // Duplicar
      if (mod && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        s.selectedIds.forEach((id) => s.duplicateLayer(id));
        return;
      }
      // Agrupar / desagrupar
      if (mod && (e.key === 'g' || e.key === 'G')) {
        e.preventDefault();
        e.shiftKey ? s.ungroupSelection() : s.groupSelection();
        return;
      }
      // Copiar/colar objeto e estilo (Cmd+Alt = estilo)
      if (mod && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        e.altKey ? s.copyStyle() : s.copySelection();
        return;
      }
      if (mod && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        e.altKey ? s.pasteStyle() : s.pasteClipboard();
        return;
      }
      // Exportar os 3 — Cmd+Shift+E (padrão Figma)
      if (mod && e.shiftKey && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
        s.setExportOpen(true);
        return;
      }
      // Inserir imagem — Cmd+Shift+K (padrão Figma)
      if (mod && e.shiftKey && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        void pickImageFiles(true).then((files) => {
          if (files.length) void insertImageLayers(files);
        });
        return;
      }
      if (mod) return; // não capturar outros atalhos com modificador

      switch (e.key) {
        case 'v':
        case 'V':
          s.setTool('select');
          break;
        case 't':
        case 'T':
          s.setTool('text');
          break;
        case 'r':
        case 'R':
          s.setTool('rect');
          break;
        case 'o':
        case 'O':
          s.setTool('ellipse');
          break;
        case 'l':
        case 'L':
          s.setTool('line');
          break;
        // 'I' saiu: inserir imagem agora é Cmd+Shift+K (padrão Figma; no Figma o
        // I é o conta-gotas, que chega na Fase 5).
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          [...s.selectedIds].forEach((id) => s.removeLayer(id));
          break;
        case 'Escape':
          s.clearSelection();
          break;
        case 'ArrowUp':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight': {
          if (s.selectedIds.length === 0) break;
          e.preventDefault();
          const d = e.shiftKey ? 10 : 1;
          const dx = e.key === 'ArrowLeft' ? -d : e.key === 'ArrowRight' ? d : 0;
          const dy = e.key === 'ArrowUp' ? -d : e.key === 'ArrowDown' ? d : 0;
          s.selectedIds.forEach((id) =>
            s.updateLayer(id, (l) => {
              l.frame.x += dx;
              l.frame.y += dy;
            }),
          );
          break;
        }
        case 'S':
          if (e.shiftKey) s.toggleSafeArea();
          break;
        case '1':
          if (e.shiftKey) useViewport.getState().fit();
          break;
        case '0':
          if (e.shiftKey) useViewport.getState().reset100();
          break;
      }
    }

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
