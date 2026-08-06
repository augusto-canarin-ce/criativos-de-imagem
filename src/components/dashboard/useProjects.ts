import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/dexie';
import { migrateProject } from '@/lib/model/migrations';
import type { Project } from '@/lib/model/types';

// Listagem reativa dos projetos via Dexie live query: qualquer escrita no IndexedDB
// (criar, renomear, duplicar, apagar) atualiza o dashboard sozinha, sem recarregar.

export interface ProjectsResult {
  projects: Project[] | undefined; // undefined = ainda carregando
}

export function useProjects(): ProjectsResult {
  const projects = useLiveQuery(async () => {
    const rows = await db.projects.orderBy('updatedAt').reverse().toArray();
    const out: Project[] = [];
    for (const row of rows) {
      try {
        out.push(migrateProject(row));
      } catch (err) {
        console.error(`Projeto ${(row as { id?: string }).id ?? '?'} ignorado:`, err);
      }
    }
    return out;
  }, []);

  return { projects };
}
