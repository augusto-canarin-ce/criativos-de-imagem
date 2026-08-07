import { create } from 'zustand';
import type { FormatId, Fill, Layer, Project } from '@/lib/model/types';
import {
  type HistoryStacks,
  initHistory,
  commit as hCommit,
  commitLive as hCommitLive,
  endLive as hEndLive,
  undo as hUndo,
  redo as hRedo,
  canRedo,
  canUndo,
} from '@/lib/history/patches';
import { cloneLayer } from '@/lib/model/layers';

// Store do editor. O projeto vive dentro de uma pilha de histórico (patches do
// Immer); seleção, ferramenta e formato ativo são estado de UI, fora do histórico.

export type Tool = 'select' | 'text' | 'rect' | 'image';

export interface EditorStore {
  history: HistoryStacks<Project> | null;
  activeFormat: FormatId;
  selectedIds: string[];
  tool: Tool;
  editingId: string | null; // camada de texto em edição no canvas
  showSafeArea: boolean;

  // ciclo de vida
  load: (project: Project) => void;
  close: () => void;

  // histórico
  commit: (recipe: (p: Project) => void) => void;
  commitLive: (groupId: string, recipe: (p: Project) => void) => void;
  endLive: () => void;
  undo: () => void;
  redo: () => void;

  // UI
  setTool: (tool: Tool) => void;
  select: (ids: string[]) => void;
  toggleSelect: (id: string) => void;
  clearSelection: () => void;
  setActiveFormat: (f: FormatId) => void;
  setEditing: (id: string | null) => void;
  toggleSafeArea: () => void;

  // camadas (sobre o formato ativo)
  addLayer: (layer: Layer, opts?: { atBottom?: boolean; select?: boolean }) => void;
  updateLayer: (id: string, mutate: (layer: Layer) => void) => void;
  updateLayerLive: (id: string, groupId: string, mutate: (layer: Layer) => void) => void;
  removeLayer: (id: string) => void;
  duplicateLayer: (id: string) => void;
  reorderLayer: (id: string, dir: 'up' | 'down' | 'front' | 'back') => void;
  setBackground: (fill: Fill) => void;
}

function findLayer(project: Project, format: FormatId, id: string): Layer | undefined {
  return project.layouts[format].layers.find((l) => l.id === id);
}

export const useEditor = create<EditorStore>((set, get) => ({
  history: null,
  activeFormat: '4:5',
  selectedIds: [],
  tool: 'select',
  editingId: null,
  showSafeArea: true,

  load: (project) =>
    set({
      history: initHistory(project),
      activeFormat: project.baseFormat,
      selectedIds: [],
      tool: 'select',
      editingId: null,
    }),

  close: () => set({ history: null, selectedIds: [], editingId: null }),

  commit: (recipe) => {
    const { history } = get();
    if (!history) return;
    set({ history: hCommit(history, recipe) });
  },
  commitLive: (groupId, recipe) => {
    const { history } = get();
    if (!history) return;
    set({ history: hCommitLive(history, groupId, recipe) });
  },
  endLive: () => {
    const { history } = get();
    if (!history) return;
    set({ history: hEndLive(history) });
  },
  undo: () => {
    const { history } = get();
    if (!history) return;
    set({ history: hUndo(history), editingId: null });
  },
  redo: () => {
    const { history } = get();
    if (!history) return;
    set({ history: hRedo(history), editingId: null });
  },

  setTool: (tool) => set({ tool }),
  select: (ids) => set({ selectedIds: ids }),
  toggleSelect: (id) =>
    set((s) => ({
      selectedIds: s.selectedIds.includes(id)
        ? s.selectedIds.filter((x) => x !== id)
        : [...s.selectedIds, id],
    })),
  clearSelection: () => set({ selectedIds: [] }),
  setActiveFormat: (activeFormat) => set({ activeFormat, selectedIds: [], editingId: null }),
  setEditing: (editingId) => set({ editingId }),
  toggleSafeArea: () => set((s) => ({ showSafeArea: !s.showSafeArea })),

  addLayer: (layer, opts) => {
    const { activeFormat, commit } = get();
    commit((p) => {
      const layers = p.layouts[activeFormat].layers;
      if (opts?.atBottom) layers.unshift(layer);
      else layers.push(layer);
    });
    if (opts?.select !== false) set({ selectedIds: [layer.id] });
  },

  updateLayer: (id, mutate) => {
    const { activeFormat, commit } = get();
    commit((p) => {
      const layer = findLayer(p, activeFormat, id);
      if (layer) mutate(layer);
    });
  },
  updateLayerLive: (id, groupId, mutate) => {
    const { activeFormat, commitLive } = get();
    commitLive(groupId, (p) => {
      const layer = findLayer(p, activeFormat, id);
      if (layer) mutate(layer);
    });
  },

  removeLayer: (id) => {
    const { activeFormat, commit } = get();
    commit((p) => {
      const layout = p.layouts[activeFormat];
      layout.layers = layout.layers.filter((l) => l.id !== id);
    });
    set((s) => ({ selectedIds: s.selectedIds.filter((x) => x !== id) }));
  },

  duplicateLayer: (id) => {
    const { activeFormat, history } = get();
    if (!history) return;
    const source = findLayer(history.present, activeFormat, id);
    if (!source) return;
    const copy = cloneLayer(source);
    get().commit((p) => {
      const layers = p.layouts[activeFormat].layers;
      const idx = layers.findIndex((l) => l.id === id);
      layers.splice(idx + 1, 0, copy);
    });
    set({ selectedIds: [copy.id] });
  },

  reorderLayer: (id, dir) => {
    const { activeFormat, commit } = get();
    commit((p) => {
      const layers = p.layouts[activeFormat].layers;
      const i = layers.findIndex((l) => l.id === id);
      if (i < 0) return;
      const [item] = layers.splice(i, 1);
      if (dir === 'up') layers.splice(Math.min(i + 1, layers.length), 0, item);
      else if (dir === 'down') layers.splice(Math.max(i - 1, 0), 0, item);
      else if (dir === 'front') layers.push(item);
      else layers.unshift(item);
    });
  },

  setBackground: (fill) => {
    const { activeFormat, commit } = get();
    commit((p) => {
      p.layouts[activeFormat].background = fill;
    });
  },
}));

// Seletores derivados, para os componentes não recalcularem à toa.
export const selectProject = (s: EditorStore): Project | null => s.history?.present ?? null;
export const selectCanUndo = (s: EditorStore): boolean => (s.history ? canUndo(s.history) : false);
export const selectCanRedo = (s: EditorStore): boolean => (s.history ? canRedo(s.history) : false);
