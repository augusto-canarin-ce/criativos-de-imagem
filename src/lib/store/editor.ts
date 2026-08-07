import { create } from 'zustand';
import type { FormatId, Fill, Layer, Project, TextLayer } from '@/lib/model/types';
import {
  type HistoryStacks,
  initHistory,
  commit as hCommit,
  commitLive as hCommitLive,
  undo as hUndo,
  redo as hRedo,
  canRedo,
  canUndo,
} from '@/lib/history/patches';
import { cloneLayer } from '@/lib/model/layers';
import { propagateProject, type AdaptWarning } from '@/lib/layout/adapt';
import { rebaseProject } from '@/lib/layout/rebase';
import { measureTextHeight } from '@/lib/render/measureText';
import type { TextMeasurer } from '@/lib/layout/autoFit';

// Store do editor. O projeto vive numa pilha de histórico (patches do Immer);
// seleção, ferramenta, formato ativo e modo de exibição são estado de UI.
//
// PROPAGAÇÃO (SPEC §7): todo commit reprojeta a base nos formatos conectados,
// DENTRO da mesma receita — a adaptação faz parte do mesmo passo de undo da edição
// que a disparou. Commits "ao vivo" (slider/arraste) NÃO propagam a cada tick; a
// propagação entra no fechamento do grupo (endLive), fundida no mesmo passo — é o
// comportamento do modo comparar exigido pela §16 (derivados atualizam ao
// confirmar, o formato em foco fica em tempo real).
//
// OVERRIDE (SPEC §7): editar uma camada num formato derivado conectado marca
// overriddenIn e a camada para de receber adaptações naquele formato.

export type Tool = 'select' | 'text' | 'rect' | 'image';
export type ViewMode = 'single' | 'compare';

const measure: TextMeasurer = (layer, size) => measureTextHeight(layer, size);

export interface EditorStore {
  history: HistoryStacks<Project> | null;
  activeFormat: FormatId;
  selectedIds: string[];
  tool: Tool;
  editingId: string | null;
  showSafeArea: boolean;
  viewMode: ViewMode;
  warnings: AdaptWarning[];

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
  setViewMode: (mode: ViewMode) => void;

  // camadas (sobre o formato ativo)
  addLayer: (layer: Layer, opts?: { atBottom?: boolean; select?: boolean }) => void;
  updateLayer: (id: string, mutate: (layer: Layer) => void) => void;
  updateLayerLive: (id: string, groupId: string, mutate: (layer: Layer) => void) => void;
  removeLayer: (id: string) => void;
  duplicateLayer: (id: string) => void;
  reorderLayer: (id: string, dir: 'up' | 'down' | 'front' | 'back') => void;
  setBackground: (fill: Fill) => void;

  // multiformato
  revertLayerOverride: (id: string) => void;
  revertAllOverrides: () => void;
  setDetached: (formatId: FormatId, detached: boolean) => void;
  setBaseFormat: (newBase: FormatId) => void;
}

function findLayer(project: Project, format: FormatId, id: string): Layer | undefined {
  return project.layouts[format].layers.find((l) => l.id === id);
}

/** O formato ativo é derivado E conectado? (edições nele viram overrides) */
function isDerivedConnected(project: Project, format: FormatId): boolean {
  return format !== project.baseFormat && !project.layouts[format].detached;
}

function markOverride(layer: Layer, format: FormatId): void {
  if (!layer.overriddenIn.includes(format)) layer.overriddenIn.push(format);
}

export const useEditor = create<EditorStore>((set, get) => {
  /** Commit com propagação embutida (mesmo passo de undo). */
  function commitAndPropagate(recipe: (p: Project) => void): void {
    const { history } = get();
    if (!history) return;
    let warnings: AdaptWarning[] = [];
    const next = hCommit(history, (p) => {
      recipe(p);
      warnings = propagateProject(p, measure);
    });
    set({ history: next, warnings });
  }

  return {
    history: null,
    activeFormat: '4:5',
    selectedIds: [],
    tool: 'select',
    editingId: null,
    showSafeArea: true,
    viewMode: 'single',
    warnings: [],

    load: (project) => {
      // Propagação inicial fora do histórico: um projeto salvo por versão anterior
      // pode estar com derivados defasados; ao abrir, tudo fica consistente.
      const fresh = structuredClone(project);
      const warnings = propagateProject(fresh, measure);
      set({
        history: initHistory(fresh),
        activeFormat: fresh.baseFormat,
        selectedIds: [],
        tool: 'select',
        editingId: null,
        viewMode: 'single',
        warnings,
      });
    },

    close: () => set({ history: null, selectedIds: [], editingId: null, warnings: [] }),

    commit: (recipe) => commitAndPropagate(recipe),

    commitLive: (groupId, recipe) => {
      const { history } = get();
      if (!history) return;
      // Sem propagação a cada tick — derivados atualizam no endLive (§16).
      set({ history: hCommitLive(history, groupId, recipe) });
    },

    endLive: () => {
      const { history } = get();
      if (!history || history.liveGroup === null) return;
      // Propagação fundida no MESMO passo do grupo ao vivo, e então o grupo fecha.
      let warnings: AdaptWarning[] = [];
      const merged = hCommitLive(history, history.liveGroup, (p) => {
        warnings = propagateProject(p, measure);
      });
      set({ history: { ...merged, liveGroup: null }, warnings });
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
    setViewMode: (viewMode) => set({ viewMode, editingId: null }),

    addLayer: (layer, opts) => {
      const { activeFormat, history } = get();
      if (!history) return;
      const derived = isDerivedConnected(history.present, activeFormat);
      commitAndPropagate((p) => {
        // Em formato derivado, a camada nova é "só deste formato" (dest-only).
        if (derived) layer.overriddenIn = [activeFormat];
        const layers = p.layouts[activeFormat].layers;
        if (opts?.atBottom) layers.unshift(layer);
        else layers.push(layer);
      });
      if (opts?.select !== false) set({ selectedIds: [layer.id] });
    },

    updateLayer: (id, mutate) => {
      const { activeFormat } = get();
      commitAndPropagate((p) => {
        const layer = findLayer(p, activeFormat, id);
        if (!layer) return;
        if (isDerivedConnected(p, activeFormat)) markOverride(layer, activeFormat);
        mutate(layer);
      });
    },

    updateLayerLive: (id, groupId, mutate) => {
      const { activeFormat, commitLive } = get();
      commitLive(groupId, (p) => {
        const layer = findLayer(p, activeFormat, id);
        if (!layer) return;
        if (isDerivedConnected(p, activeFormat)) markOverride(layer, activeFormat);
        mutate(layer);
      });
    },

    removeLayer: (id) => {
      const { activeFormat, history } = get();
      if (!history) return;
      const project = history.present;
      if (isDerivedConnected(project, activeFormat)) {
        // Apagar num formato derivado conectado = "sumir DESTE formato": vira
        // override oculto (o modelo não tem tumba para exclusão por formato).
        // "Voltar a seguir o base" restaura. Decisão registrada no PROGRESS.
        commitAndPropagate((p) => {
          const layer = findLayer(p, activeFormat, id);
          if (!layer) return;
          markOverride(layer, activeFormat);
          layer.visible = false;
        });
      } else {
        // Na base (ou num formato desconectado): remove de verdade. Na base,
        // remove também as cópias nos conectados — inclusive as sobrescritas.
        commitAndPropagate((p) => {
          const isBase = activeFormat === p.baseFormat;
          const targets: FormatId[] = isBase
            ? (Object.keys(p.layouts) as FormatId[]).filter((f) => !p.layouts[f].detached)
            : [activeFormat];
          for (const f of targets) {
            const layout = p.layouts[f];
            layout.layers = layout.layers.filter((l) => l.id !== id);
          }
        });
      }
      set((s) => ({ selectedIds: s.selectedIds.filter((x) => x !== id) }));
    },

    duplicateLayer: (id) => {
      const { activeFormat, history } = get();
      if (!history) return;
      const source = findLayer(history.present, activeFormat, id);
      if (!source) return;
      const copy = cloneLayer(source);
      const derived = isDerivedConnected(history.present, activeFormat);
      if (derived) copy.overriddenIn = [activeFormat];
      commitAndPropagate((p) => {
        const layers = p.layouts[activeFormat].layers;
        const idx = layers.findIndex((l) => l.id === id);
        layers.splice(idx + 1, 0, copy);
      });
      set({ selectedIds: [copy.id] });
    },

    reorderLayer: (id, dir) => {
      const { activeFormat, history } = get();
      if (!history) return;
      // Em formato derivado conectado a ordem SEGUE A BASE (a propagação a
      // re-imporia no mesmo commit) — a UI desabilita; aqui é no-op de segurança.
      if (isDerivedConnected(history.present, activeFormat)) return;
      commitAndPropagate((p) => {
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
      const { activeFormat } = get();
      commitAndPropagate((p) => {
        // O fundo não tem override por camada: num formato conectado ele segue a
        // base, então editar o fundo edita a BASE (e propaga). Desconectado tem
        // fundo próprio.
        const target = isDerivedConnected(p, activeFormat) ? p.baseFormat : activeFormat;
        p.layouts[target].background = fill;
      });
    },

    revertLayerOverride: (id) => {
      const { activeFormat } = get();
      commitAndPropagate((p) => {
        const layer = findLayer(p, activeFormat, id);
        if (!layer) return;
        layer.overriddenIn = layer.overriddenIn.filter((f) => f !== activeFormat);
        // A propagação do próprio commit re-deriva a camada a partir da base.
      });
    },

    revertAllOverrides: () => {
      const { activeFormat } = get();
      commitAndPropagate((p) => {
        for (const layer of p.layouts[activeFormat].layers) {
          layer.overriddenIn = layer.overriddenIn.filter((f) => f !== activeFormat);
        }
      });
    },

    setDetached: (formatId, detached) => {
      commitAndPropagate((p) => {
        p.layouts[formatId].detached = detached;
        // Ao reconectar, a propagação deste mesmo commit re-adapta o formato.
      });
    },

    setBaseFormat: (newBase) => {
      // §7: um único passo de undo para a operação inteira.
      const { history } = get();
      if (!history) return;
      let warnings: AdaptWarning[] = [];
      const next = hCommit(history, (p) => {
        warnings = rebaseProject(p, newBase, measure);
      });
      set({ history: next, warnings, activeFormat: newBase, selectedIds: [] });
    },
  };
});

// Seletores derivados.
export const selectProject = (s: EditorStore): Project | null => s.history?.present ?? null;
export const selectCanUndo = (s: EditorStore): boolean => (s.history ? canUndo(s.history) : false);
export const selectCanRedo = (s: EditorStore): boolean => (s.history ? canRedo(s.history) : false);

/** Contagem de camadas sobrescritas no formato ativo (0 quando é a base). */
export const selectOverrideCount = (s: EditorStore): number => {
  const p = s.history?.present;
  if (!p || s.activeFormat === p.baseFormat) return 0;
  return p.layouts[s.activeFormat].layers.filter((l) =>
    l.overriddenIn.includes(s.activeFormat),
  ).length;
};

export type { AdaptWarning, TextLayer };
