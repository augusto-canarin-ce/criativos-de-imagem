import { describe, it, expect } from 'vitest';
import { migrateProject, CURRENT_SCHEMA_VERSION, SchemaMigrationError } from './migrations';
import { createProject } from './factory';

describe('migrateProject', () => {
  it('aceita um projeto da versão atual', () => {
    const p = createProject({ name: 'Ok', now: 1 });
    expect(migrateProject(p)).toEqual(p);
  });

  it('rejeita um objeto que não é projeto', () => {
    expect(() => migrateProject(null)).toThrow(SchemaMigrationError);
    expect(() => migrateProject(42)).toThrow(SchemaMigrationError);
    expect(() => migrateProject({ foo: 'bar' })).toThrow();
  });

  it('rejeita projeto salvo por versão futura do app', () => {
    const p = { ...createProject(), schemaVersion: CURRENT_SCHEMA_VERSION + 1 };
    expect(() => migrateProject(p)).toThrow(/versão mais nova/);
  });
});
