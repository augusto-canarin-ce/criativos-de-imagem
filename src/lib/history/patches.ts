import { enablePatches, produce, produceWithPatches, applyPatches, type Patch } from 'immer';

// Undo/redo por patches do Immer. SPEC §14/§16: pilha de patches, limite de 100
// passos, e operações contínuas (arrastar, slider) agrupadas em um único passo —
// desfazer um arraste volta tudo, não pixel por pixel.

enablePatches();

export const HISTORY_LIMIT = 100;

export interface HistoryEntry {
  patches: Patch[]; // aplicar em ordem: estado_anterior → estado_novo (redo)
  inverse: Patch[]; // aplicar em ordem: estado_novo → estado_anterior (undo)
}

export interface HistoryStacks<T> {
  present: T;
  undo: HistoryEntry[];
  redo: HistoryEntry[];
  // Grupo "ao vivo" em aberto: enquanto o mesmo groupId chega, as mudanças se
  // fundem no mesmo passo (ex.: um slider sendo arrastado). null = fechado.
  liveGroup: string | null;
}

export function initHistory<T>(present: T): HistoryStacks<T> {
  return { present, undo: [], redo: [], liveGroup: null };
}

function trim(entries: HistoryEntry[]): HistoryEntry[] {
  return entries.length > HISTORY_LIMIT ? entries.slice(entries.length - HISTORY_LIMIT) : entries;
}

/**
 * Passo discreto: aplica a receita, empurra um passo e fecha qualquer grupo ao vivo.
 * Sem mudança efetiva (patches vazios) → nada acontece.
 */
export function commit<T>(state: HistoryStacks<T>, recipe: (draft: T) => void): HistoryStacks<T> {
  // O wrapper ignora o retorno da receita: o Immer proíbe produtor que retorna
  // valor E muta o draft, e receitas arrow (`l => l.x = v`) retornam a atribuição.
  const [next, patches, inverse] = produceWithPatches(state.present, (draft: T) => {
    recipe(draft);
  });
  if (patches.length === 0) return state;
  return {
    present: next,
    undo: trim([...state.undo, { patches, inverse }]),
    redo: [],
    liveGroup: null,
  };
}

/**
 * Passo "ao vivo": funde no passo anterior quando o groupId é o mesmo grupo em
 * aberto; senão abre um novo passo. Feche o grupo com `endLive` no fim da interação
 * (pointerup/blur), para que a próxima edição do mesmo controle vire outro passo.
 */
export function commitLive<T>(
  state: HistoryStacks<T>,
  groupId: string,
  recipe: (draft: T) => void,
): HistoryStacks<T> {
  const [next, patches, inverse] = produceWithPatches(state.present, (draft: T) => {
    recipe(draft);
  });
  if (patches.length === 0) return state;

  if (state.liveGroup === groupId && state.undo.length > 0) {
    const top = state.undo[state.undo.length - 1];
    // Fusão granular: patches acumulam (antigo→novo); inverses empilham na ordem
    // reversa (novo→antigo) — o novo inverse desfaz por último a mudança mais recente.
    const merged: HistoryEntry = {
      patches: [...top.patches, ...patches],
      inverse: [...inverse, ...top.inverse],
    };
    return {
      present: next,
      undo: [...state.undo.slice(0, -1), merged],
      redo: [],
      liveGroup: groupId,
    };
  }

  return {
    present: next,
    undo: trim([...state.undo, { patches, inverse }]),
    redo: [],
    liveGroup: groupId,
  };
}

export function endLive<T>(state: HistoryStacks<T>): HistoryStacks<T> {
  if (state.liveGroup === null) return state;
  return { ...state, liveGroup: null };
}

/**
 * Muda o presente SEM criar passo de desfazer, e sem tocar nas pilhas.
 *
 * Existe para o estado que ACOMPANHA o documento mas não é edição dele: a tela
 * atual do modo guiado (§18) mora no projeto para sobreviver a fechar a aba, e
 * navegar entre telas não é algo que "Desfazer" deva reverter.
 *
 * Seguro em relação ao histórico: nenhum patch gravado toca nesses campos, então
 * um undo posterior não os arrasta de volta.
 */
export function amendPresent<T>(state: HistoryStacks<T>, recipe: (draft: T) => void): HistoryStacks<T> {
  const next = produce(state.present, (draft: T) => {
    recipe(draft);
  });
  return next === state.present ? state : { ...state, present: next };
}

export function canUndo<T>(state: HistoryStacks<T>): boolean {
  return state.undo.length > 0;
}

export function canRedo<T>(state: HistoryStacks<T>): boolean {
  return state.redo.length > 0;
}

export function undo<T>(state: HistoryStacks<T>): HistoryStacks<T> {
  if (state.undo.length === 0) return state;
  const entry = state.undo[state.undo.length - 1];
  return {
    present: applyPatches(state.present as never, entry.inverse) as T,
    undo: state.undo.slice(0, -1),
    redo: [...state.redo, entry],
    liveGroup: null,
  };
}

export function redo<T>(state: HistoryStacks<T>): HistoryStacks<T> {
  if (state.redo.length === 0) return state;
  const entry = state.redo[state.redo.length - 1];
  return {
    present: applyPatches(state.present as never, entry.patches) as T,
    undo: trim([...state.undo, entry]),
    redo: state.redo.slice(0, -1),
    liveGroup: null,
  };
}
