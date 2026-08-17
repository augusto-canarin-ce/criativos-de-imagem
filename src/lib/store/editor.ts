import { create } from 'zustand';
import { current, isDraft } from 'immer';
import type { FormatId, Fill, Layer, Project, TextLayer } from '@/lib/model/types';
import {
  type HistoryStacks,
  initHistory,
  commit as hCommit,
  commitLive as hCommitLive,
  amendPresent as hAmendPresent,
  undo as hUndo,
  redo as hRedo,
  canRedo,
  canUndo,
} from '@/lib/history/patches';
import { cloneLayer } from '@/lib/model/layers';
import {
  groupLayers,
  ungroupLayer,
  findLayerDeep,
  removeLayerDeep,
  cloneLayerDeep,
} from '@/lib/model/groups';
import { propagateProject, type AdaptWarning } from '@/lib/layout/adapt';
import { rebaseProject } from '@/lib/layout/rebase';
import {
  alignFrames,
  distributeFrames,
  stretchFrames,
  type AlignOp,
} from '@/lib/layout/align';
import { getFormat } from '@/config/formats';
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

export type Tool = 'select' | 'text' | 'rect' | 'ellipse' | 'line' | 'image';
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
  exportOpen: boolean;

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
  setExportOpen: (open: boolean) => void;
  /** Tela atual do modo guiado (§18). NÃO entra no histórico: navegar não é
   *  edição, e "Desfazer" no editor não deve reverter navegação. */
  setGuidedScreen: (screen: number) => void;
  /** Encerra o fluxo guiado: o projeto volta a ser um projeto normal. Também
   *  fora do histórico — desfazer não deve reabrir um fluxo já encerrado. */
  clearGuided: () => void;

  // camadas (sobre o formato ativo)
  addLayer: (layer: Layer, opts?: { atBottom?: boolean; select?: boolean }) => void;
  updateLayer: (id: string, mutate: (layer: Layer) => void) => void;
  updateLayerLive: (id: string, groupId: string, mutate: (layer: Layer) => void) => void;
  removeLayer: (id: string) => void;
  duplicateLayer: (id: string) => void;
  reorderLayer: (id: string, dir: 'up' | 'down' | 'front' | 'back') => void;
  setBackground: (fill: Fill) => void;
  /** Move TODA a seleção num único passo de undo — arrastar uma camada de um
   *  conjunto selecionado leva as companheiras junto, como no Figma. */
  nudgeSelection: (dx: number, dy: number) => void;

  // alinhamento (uma camada = relativo ao canvas; várias = à seleção)
  alignSelection: (op: AlignOp) => void;
  distributeSelection: (axis: 'h' | 'v') => void;
  stretchSelection: (dim: 'width' | 'height') => void;

  // grupos e clipboard
  groupSelection: () => void;
  ungroupSelection: () => void;
  copySelection: () => void;
  pasteClipboard: () => void;
  copyStyle: () => void;
  pasteStyle: () => void;

  // multiformato
  revertLayerOverride: (id: string) => void;
  revertAllOverrides: () => void;
  setDetached: (formatId: FormatId, detached: boolean) => void;
  setBaseFormat: (newBase: FormatId) => void;
}

function findLayer(project: Project, format: FormatId, id: string): Layer | undefined {
  // Recursivo: alcança filhos dentro de grupos (selecionados pelo painel).
  return findLayerDeep(project.layouts[format].layers, id);
}

// Área de transferência interna (Cmd+C/V objeto, Cmd+Alt+C/V estilo). Módulo-level:
// sobrevive à troca de projeto na sessão; não persiste (§4: nada disso em storage).
let layerClipboard: Layer[] = [];
let styleClipboard: Partial<Layer> | null = null;

/** O formato ativo é derivado E conectado? (edições nele viram overrides) */
function isDerivedConnected(project: Project, format: FormatId): boolean {
  return format !== project.baseFormat && !project.layouts[format].detached;
}

function markOverride(layer: Layer, format: FormatId): void {
  if (!layer.overriddenIn.includes(format)) layer.overriddenIn.push(format);
}

function mudouGeometria(layer: Layer, antes: { frame: Layer['frame']; rotation: number }): boolean {
  return (
    layer.rotation !== antes.rotation ||
    layer.frame.x !== antes.frame.x ||
    layer.frame.y !== antes.frame.y ||
    layer.frame.w !== antes.frame.w ||
    layer.frame.h !== antes.frame.h
  );
}

/**
 * Aplica uma edição feita num formato DERIVADO ao layout base também (2026-08-17).
 *
 * Só a parte que não é geometria: a mesma função de mutação roda na base e a
 * caixa/rotação dela é restaurada em seguida. É o que faz "mudei a cor no 9:16"
 * valer nos três — a propagação leva o estilo da base para os outros formatos.
 * Mexer na posição continua sendo local (é para isso que o override existe).
 */
function espelharEstiloNaBase(project: Project, id: string, mutate: (l: Layer) => void): void {
  const base = findLayer(project, project.baseFormat, id);
  if (!base) return;
  const geo = { frame: { ...base.frame }, rotation: base.rotation };
  mutate(base);
  base.frame = geo.frame;
  base.rotation = geo.rotation;
}

/** Corpo comum de updateLayer/updateLayerLive: aplica no formato ativo, marca
 *  override só quando a GEOMETRIA muda, e espelha o estilo na base. */
function editarCamada(
  project: Project,
  format: FormatId,
  id: string,
  mutate: (l: Layer) => void,
): void {
  const layer = findLayer(project, format, id);
  if (!layer) return;
  const derivado = isDerivedConnected(project, format);
  const antes = { frame: { ...layer.frame }, rotation: layer.rotation };
  mutate(layer);
  if (!derivado) return;
  if (mudouGeometria(layer, antes)) markOverride(layer, format);
  espelharEstiloNaBase(project, id, mutate);
}

/** structuredClone não aceita draft do Immer (mesma armadilha da Fase 2). */
function deepClone<T>(value: T): T {
  return structuredClone(isDraft(value) ? current(value) : value);
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

  /** Aplica novas posições/tamanhos às camadas selecionadas em UM commit,
   *  marcando override em formato derivado. Camadas travadas ficam de fora. */
  function applyFramePatches(
    compute: (
      frames: { id: string; frame: Layer['frame'] }[],
      canvas: { w: number; h: number },
    ) => Map<string, Partial<Layer['frame']>>,
  ): void {
    const { activeFormat, selectedIds } = get();
    if (selectedIds.length === 0) return;
    const format = getFormat(activeFormat);
    commitAndPropagate((p) => {
      const layout = p.layouts[activeFormat];
      const frames = layout.layers
        .filter((l) => selectedIds.includes(l.id) && !l.locked)
        .map((l) => ({ id: l.id, frame: { ...l.frame } }));
      const patches = compute(frames, { w: format.width, h: format.height });
      for (const layer of layout.layers) {
        const patch = patches.get(layer.id);
        if (!patch) continue;
        if (isDerivedConnected(p, activeFormat)) markOverride(layer, activeFormat);
        Object.assign(layer.frame, patch);
      }
    });
  }

  return {
    history: null,
    activeFormat: '4:5',
    selectedIds: [],
    tool: 'select',
    editingId: null,
    showSafeArea: true,
    viewMode: 'single',
    exportOpen: false,
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
    setExportOpen: (exportOpen) => set({ exportOpen }),

    setGuidedScreen: (screen) => {
      const { history } = get();
      if (!history?.present.guided) return;
      set({ history: hAmendPresent(history, (p) => {
        if (p.guided) p.guided.screen = screen;
      }) });
    },

    clearGuided: () => {
      const { history } = get();
      if (!history?.present.guided) return;
      set({ history: hAmendPresent(history, (p) => {
        delete p.guided;
      }) });
    },

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
      commitAndPropagate((p) => editarCamada(p, activeFormat, id, mutate));
    },

    updateLayerLive: (id, groupId, mutate) => {
      const { activeFormat, commitLive } = get();
      commitLive(groupId, (p) => editarCamada(p, activeFormat, id, mutate));
    },

    nudgeSelection: (dx, dy) => {
      if (dx === 0 && dy === 0) return;
      applyFramePatches((frames) => {
        const patches = new Map<string, Partial<Layer['frame']>>();
        for (const f of frames) {
          patches.set(f.id, { x: Math.round(f.frame.x + dx), y: Math.round(f.frame.y + dy) });
        }
        return patches;
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
            removeLayerDeep(p.layouts[f].layers, id);
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
      // cloneLayerDeep renova ids também dentro de grupos.
      const copy = source.type === 'group' ? cloneLayerDeep(source) : cloneLayer(source);
      copy.name = `${source.name} cópia`;
      copy.frame = { ...copy.frame, x: copy.frame.x + 24, y: copy.frame.y + 24 };
      const derived = isDerivedConnected(history.present, activeFormat);
      copy.overriddenIn = derived ? [activeFormat] : [];
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

    groupSelection: () => {
      const { activeFormat, selectedIds, history } = get();
      if (!history || selectedIds.length < 2) return;
      const derived = isDerivedConnected(history.present, activeFormat);
      let groupId: string | null = null;
      commitAndPropagate((p) => {
        const layout = p.layouts[activeFormat];
        // Só agrupa camadas do TOPO da pilha (não filhos de outros grupos).
        const members = layout.layers.filter((l) => selectedIds.includes(l.id));
        if (members.length < 2) return;
        const group = groupLayers(members.map((m) => deepClone(m)));
        if (derived) group.overriddenIn = [activeFormat];
        const topIndex = Math.max(...members.map((m) => layout.layers.indexOf(m)));
        layout.layers = layout.layers.filter((l) => !selectedIds.includes(l.id));
        layout.layers.splice(Math.min(topIndex - members.length + 1, layout.layers.length), 0, group);
        groupId = group.id;
      });
      if (groupId) set({ selectedIds: [groupId] });
    },

    ungroupSelection: () => {
      const { activeFormat, selectedIds, history } = get();
      if (!history) return;
      let childIds: string[] = [];
      commitAndPropagate((p) => {
        const layout = p.layouts[activeFormat];
        for (const id of selectedIds) {
          const idx = layout.layers.findIndex((l) => l.id === id && l.type === 'group');
          if (idx < 0) continue;
          const group = layout.layers[idx];
          if (group.type !== 'group') continue;
          const children = ungroupLayer(deepClone(group));
          if (isDerivedConnected(p, activeFormat)) {
            for (const c of children) markOverride(c, activeFormat);
          }
          layout.layers.splice(idx, 1, ...children);
          childIds.push(...children.map((c) => c.id));
        }
      });
      if (childIds.length) set({ selectedIds: childIds });
    },

    copySelection: () => {
      const { activeFormat, selectedIds, history } = get();
      if (!history) return;
      const layout = history.present.layouts[activeFormat];
      const picked = layout.layers.filter((l) => selectedIds.includes(l.id));
      if (picked.length) layerClipboard = structuredClone(picked);
    },

    pasteClipboard: () => {
      const { activeFormat } = get();
      if (layerClipboard.length === 0) return;
      const derived = isDerivedConnected(get().history!.present, activeFormat);
      const copies = layerClipboard.map((l) => {
        const copy = cloneLayerDeep(l);
        copy.frame.x += 24;
        copy.frame.y += 24;
        copy.overriddenIn = derived ? [activeFormat] : [];
        return copy;
      });
      commitAndPropagate((p) => {
        p.layouts[activeFormat].layers.push(...copies);
      });
      set({ selectedIds: copies.map((c) => c.id) });
    },

    copyStyle: () => {
      const { activeFormat, selectedIds, history } = get();
      if (!history || selectedIds.length !== 1) return;
      const layer = findLayer(history.present, activeFormat, selectedIds[0]);
      if (!layer) return;
      // Estilo = aparência, nunca geometria/conteúdo (§14).
      const style: Partial<Layer> = {
        opacity: layer.opacity,
        blendMode: layer.blendMode,
        effects: structuredClone(layer.effects),
      };
      if (layer.type === 'text') {
        Object.assign(style, {
          fontFamily: layer.fontFamily,
          fontWeight: layer.fontWeight,
          fontSize: layer.fontSize,
          lineHeight: layer.lineHeight,
          letterSpacing: layer.letterSpacing,
          transform: layer.transform,
          underline: layer.underline,
          fill: structuredClone(layer.fill),
          highlight: structuredClone(layer.highlight),
        });
      } else if (layer.type === 'shape') {
        Object.assign(style, {
          fill: structuredClone(layer.fill),
          radius: layer.radius,
        });
      }
      styleClipboard = style;
    },

    pasteStyle: () => {
      const { activeFormat, selectedIds } = get();
      if (!styleClipboard || selectedIds.length === 0) return;
      const style = styleClipboard;
      commitAndPropagate((p) => {
        for (const id of selectedIds) {
          const layer = findLayer(p, activeFormat, id);
          if (!layer) continue;
          if (isDerivedConnected(p, activeFormat)) markOverride(layer, activeFormat);
          layer.opacity = style.opacity ?? layer.opacity;
          layer.blendMode = style.blendMode ?? layer.blendMode;
          if (style.effects) layer.effects = structuredClone(style.effects);
          if (layer.type === 'text') {
            const s = style as Partial<import('@/lib/model/types').TextLayer>;
            if (s.fontFamily) layer.fontFamily = s.fontFamily;
            if (s.fontWeight) layer.fontWeight = s.fontWeight;
            if (s.fontSize) layer.fontSize = s.fontSize;
            if (s.lineHeight) layer.lineHeight = s.lineHeight;
            if (s.letterSpacing !== undefined) layer.letterSpacing = s.letterSpacing;
            if (s.transform) layer.transform = s.transform;
            if (s.underline !== undefined) layer.underline = s.underline;
            if (s.fill) layer.fill = structuredClone(s.fill);
            if (s.highlight !== undefined) layer.highlight = structuredClone(s.highlight);
          } else if (layer.type === 'shape') {
            const s = style as Partial<import('@/lib/model/types').ShapeLayer>;
            if (s.fill) layer.fill = structuredClone(s.fill);
            if (s.radius !== undefined) layer.radius = s.radius;
          }
        }
      });
    },

    alignSelection: (op) => {
      applyFramePatches((frames, canvas) => alignFrames(frames, op, canvas));
    },
    distributeSelection: (axis) => {
      applyFramePatches((frames) => distributeFrames(frames, axis));
    },
    stretchSelection: (dim) => {
      applyFramePatches((frames, canvas) => stretchFrames(frames, dim, canvas));
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
