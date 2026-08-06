import { describe, it, expect, beforeEach } from 'vitest';
import { db } from './dexie';
import {
  createAndSaveProject,
  listProjects,
  getProject,
  renameProject,
  duplicateAndSaveProject,
  deleteProject,
} from './projects';

// Aceite da Fase 0 (SPEC §15): criar, renomear, duplicar e apagar projetos; e a
// persistência sobrevive — aqui garantida por gravação/leitura reais no IndexedDB
// (fake-indexeddb em memória, ver test/setup.ts).

beforeEach(async () => {
  await db.projects.clear();
});

describe('CRUD de projetos', () => {
  it('cria e relê do banco', async () => {
    const created = await createAndSaveProject({ name: 'Projeto A' });
    const fetched = await getProject(created.id);
    expect(fetched?.name).toBe('Projeto A');
  });

  it('lista do mais recente ao mais antigo', async () => {
    const a = await createAndSaveProject({ name: 'A', now: 100 });
    const b = await createAndSaveProject({ name: 'B', now: 200 });
    const list = await listProjects();
    expect(list.map((p) => p.id)).toEqual([b.id, a.id]);
  });

  it('renomeia', async () => {
    const p = await createAndSaveProject({ name: 'Antigo' });
    await renameProject(p.id, '  Novo nome  ');
    expect((await getProject(p.id))?.name).toBe('Novo nome');
  });

  it('recusa nome vazio ao renomear', async () => {
    const p = await createAndSaveProject({ name: 'X' });
    await expect(renameProject(p.id, '   ')).rejects.toThrow();
  });

  it('duplica como registro independente', async () => {
    const p = await createAndSaveProject({ name: 'Original' });
    const copy = await duplicateAndSaveProject(p.id);
    expect(copy.id).not.toBe(p.id);
    expect(copy.name).toBe('Original (cópia)');
    expect(await db.projects.count()).toBe(2);
  });

  it('apaga', async () => {
    const p = await createAndSaveProject({ name: 'Some' });
    await deleteProject(p.id);
    expect(await getProject(p.id)).toBeUndefined();
    expect(await db.projects.count()).toBe(0);
  });
});
