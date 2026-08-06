import { describe, it, expect } from 'vitest';
import { createProject, duplicateProject, nextCopyName } from './factory';
import { projectSchema } from './schema';
import { CURRENT_SCHEMA_VERSION } from './migrations';
import { FORMAT_IDS } from '@/config/formats';

describe('createProject', () => {
  it('cria um projeto válido contra o schema zod', () => {
    const p = createProject({ name: 'Teste', now: 1000 });
    expect(() => projectSchema.parse(p)).not.toThrow();
  });

  it('tem os três layouts, um por formato', () => {
    const p = createProject();
    for (const id of FORMAT_IDS) {
      expect(p.layouts[id]).toBeDefined();
      expect(p.layouts[id].formatId).toBe(id);
      expect(p.layouts[id].detached).toBe(false);
      expect(p.layouts[id].background).toEqual({ kind: 'solid', color: '#ffffff' });
    }
  });

  it('carimba a versão de schema atual', () => {
    expect(createProject().schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
  });

  it('usa nome padrão quando vazio e respeita o formato base', () => {
    expect(createProject({ name: '   ' }).name).toBe('Sem título');
    expect(createProject({ baseFormat: '9:16' }).baseFormat).toBe('9:16');
  });

  it('gera ids distintos', () => {
    expect(createProject().id).not.toBe(createProject().id);
  });
});

describe('duplicateProject', () => {
  it('gera novo id e nome de cópia, preservando o conteúdo', () => {
    const original = createProject({ name: 'Promo', now: 1 });
    const copy = duplicateProject(original, { now: 2 });
    expect(copy.id).not.toBe(original.id);
    expect(copy.name).toBe('Promo (cópia)');
    expect(copy.layouts).toEqual(original.layouts);
    expect(copy.createdAt).toBe(2);
  });

  it('clona em profundidade (mutar a cópia não afeta o original)', () => {
    const original = createProject({ name: 'X' });
    const copy = duplicateProject(original);
    copy.layouts['4:5'].detached = true;
    expect(original.layouts['4:5'].detached).toBe(false);
  });
});

describe('nextCopyName', () => {
  it('anexa (cópia) e não empilha o sufixo', () => {
    expect(nextCopyName('Promo')).toBe('Promo (cópia)');
    expect(nextCopyName('Promo (cópia)')).toBe('Promo (cópia)');
    expect(nextCopyName('Promo (cópia 2)')).toBe('Promo (cópia)');
  });
});
