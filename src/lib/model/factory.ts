import type { FormatId, Layout, Project } from './types';
import { FORMAT_IDS, DEFAULT_FORMAT } from '@/config/formats';
import { CURRENT_SCHEMA_VERSION } from './migrations';

// Fábricas puras de criação. Sem I/O, sem Date.now() escondido em lugar nenhum —
// o tempo entra por parâmetro para manter as funções testáveis e determinísticas.

export function newId(): string {
  return crypto.randomUUID();
}

/** Layout padrão de um formato: fundo branco opaco, sem camadas. O background
 *  nunca é transparente (SPEC §6/§11). */
export function createLayout(formatId: FormatId): Layout {
  return {
    formatId,
    background: { kind: 'solid', color: '#ffffff' },
    layers: [],
    detached: false,
  };
}

function createLayouts(): Record<FormatId, Layout> {
  const layouts = {} as Record<FormatId, Layout>;
  for (const id of FORMAT_IDS) {
    layouts[id] = createLayout(id);
  }
  return layouts;
}

export interface CreateProjectOptions {
  name?: string;
  baseFormat?: FormatId;
  now?: number;
  id?: string;
}

/** Projeto novo e vazio, com os três layouts prontos. */
export function createProject(opts: CreateProjectOptions = {}): Project {
  const now = opts.now ?? Date.now();
  return {
    id: opts.id ?? newId(),
    name: opts.name?.trim() || 'Sem título',
    schemaVersion: CURRENT_SCHEMA_VERSION,
    baseFormat: opts.baseFormat ?? DEFAULT_FORMAT,
    layouts: createLayouts(),
    assets: [],
    createdAt: now,
    updatedAt: now,
  };
}

/** Cópia de um projeto como um novo registro independente (ids e nome novos). */
export function duplicateProject(source: Project, opts: { now?: number } = {}): Project {
  const now = opts.now ?? Date.now();
  // Clone profundo do conteúdo; o structuredClone preserva a forma exata do modelo.
  const clone = structuredClone(source);
  return {
    ...clone,
    id: newId(),
    name: nextCopyName(source.name),
    createdAt: now,
    updatedAt: now,
  };
}

/** "Promo" → "Promo (cópia)" → "Promo (cópia 2)"… */
export function nextCopyName(name: string): string {
  const base = name.replace(/ \(cópia(?: \d+)?\)$/, '');
  return `${base} (cópia)`;
}
