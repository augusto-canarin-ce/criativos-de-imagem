import { db } from './dexie';
import type { Project } from '@/lib/model/types';
import { createProject, duplicateProject, type CreateProjectOptions } from '@/lib/model/factory';
import { migrateProject } from '@/lib/model/migrations';

// CRUD de projetos. SPEC §12/§15 (aceite da Fase 0). Toda leitura do IndexedDB passa
// por migração + validação zod (`migrateProject`), porque dado que cruza fronteira
// nunca é confiável — pode ter sido salvo por outra versão do app. SPEC §16.

export async function createAndSaveProject(opts: CreateProjectOptions = {}): Promise<Project> {
  const project = createProject(opts);
  await db.projects.add(project);
  return project;
}

/** Todos os projetos, do mais recente ao mais antigo (por updatedAt). */
export async function listProjects(): Promise<Project[]> {
  const rows = await db.projects.orderBy('updatedAt').reverse().toArray();
  // Valida/migra cada um; um registro corrompido não derruba a listagem inteira.
  const out: Project[] = [];
  for (const row of rows) {
    try {
      out.push(migrateProject(row));
    } catch (err) {
      console.error(`Projeto ${(row as { id?: string }).id ?? '?'} ignorado:`, err);
    }
  }
  return out;
}

export async function getProject(id: string): Promise<Project | undefined> {
  const row = await db.projects.get(id);
  if (!row) return undefined;
  return migrateProject(row);
}

export async function renameProject(id: string, name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('O nome do projeto não pode ficar vazio.');
  await db.projects.update(id, { name: trimmed, updatedAt: Date.now() });
}

/** Grava o projeto inteiro (usado pelo salvamento automático nas próximas fases). */
export async function saveProject(project: Project): Promise<void> {
  await db.projects.put({ ...project, updatedAt: Date.now() });
}

export async function duplicateAndSaveProject(id: string): Promise<Project> {
  const source = await getProject(id);
  if (!source) throw new Error('Projeto não encontrado para duplicar.');
  const copy = duplicateProject(source);
  await db.projects.add(copy);
  return copy;
}

export async function deleteProject(id: string): Promise<void> {
  // A coleta de lixo de assets órfãos entra na fase de imagens; por ora só o
  // registro do projeto é removido.
  await db.projects.delete(id);
}
