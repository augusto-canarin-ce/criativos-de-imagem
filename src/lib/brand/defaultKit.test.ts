import { describe, expect, it, beforeEach } from 'vitest';
import { DEFAULT_BRAND_KIT_ID, defaultBrandKit } from './defaultKit';
import { STANDARD_ROLE_IDS } from './roles';
import { ensureDefaultBrandKit } from '@/lib/db/brand';
import { db } from '@/lib/db/dexie';
import { createProject } from '@/lib/model/factory';
import { brandKitSchema } from '@/lib/model/schema';

// Kit padrão de fábrica (2026-08-13): semente idempotente + estampa única dos
// projetos sem marca. O que protege aqui: kit editado pelo usuário nunca é
// sobrescrito, e "sem marca" escolhido DEPOIS da estampa é respeitado.

describe('kit padrão de fábrica', () => {
  beforeEach(async () => {
    await db.brandKits.clear();
    await db.projects.clear();
    await db.settings.clear();
  });

  it('o kit em código é válido e tem os cinco papéis padrão', () => {
    const kit = defaultBrandKit();
    expect(brandKitSchema.safeParse(kit).success).toBe(true);
    const ids = kit.colors.map((c) => c.id);
    for (const role of STANDARD_ROLE_IDS) expect(ids).toContain(role);
    // Papéis conforme a decisão do usuário (2026-08-13).
    const porPapel = Object.fromEntries(kit.colors.map((c) => [c.id, c.hex]));
    expect(porPapel.primary).toBe('#10b981');
    expect(porPapel.accent).toBe('#34d399');
    expect(porPapel.ink).toBe('#171717');
    expect(porPapel.secondary).toBe('#525252');
    expect(porPapel.surface).toBe('#ffffff');
  });

  it('semeia num banco limpo e não sobrescreve kit editado', async () => {
    const primeira = await ensureDefaultBrandKit();
    expect(primeira.semeado).toBe(true);

    // O usuário edita o kit padrão (troca um hex)…
    const editado = (await db.brandKits.get(DEFAULT_BRAND_KIT_ID))!;
    editado.colors.find((c) => c.id === 'primary')!.hex = '#123456';
    await db.brandKits.put(editado);

    // …e a abertura seguinte NÃO desfaz a edição.
    const segunda = await ensureDefaultBrandKit();
    expect(segunda.semeado).toBe(false);
    const depois = (await db.brandKits.get(DEFAULT_BRAND_KIT_ID))!;
    expect(depois.colors.find((c) => c.id === 'primary')!.hex).toBe('#123456');
  });

  it('kit apagado renasce na abertura seguinte', async () => {
    await ensureDefaultBrandKit();
    await db.brandKits.delete(DEFAULT_BRAND_KIT_ID);
    const { semeado } = await ensureDefaultBrandKit();
    expect(semeado).toBe(true);
    expect(await db.brandKits.get(DEFAULT_BRAND_KIT_ID)).toBeDefined();
  });

  it('estampa projetos sem marca uma vez só — "sem marca" posterior é respeitado', async () => {
    const antigo = { ...createProject({ name: 'Antigo' }), brandKitId: undefined };
    await db.projects.add(antigo);

    const { estampados } = await ensureDefaultBrandKit();
    expect(estampados).toBe(1);
    expect((await db.projects.get(antigo.id))!.brandKitId).toBe(DEFAULT_BRAND_KIT_ID);

    // Depois da estampa, o usuário escolhe "sem marca" de propósito…
    await db.projects.put({ ...antigo, brandKitId: undefined });

    // …e a abertura seguinte não desfaz a escolha.
    const segunda = await ensureDefaultBrandKit();
    expect(segunda.estampados).toBe(0);
    expect((await db.projects.get(antigo.id))!.brandKitId).toBeUndefined();
  });

  it('projeto novo já nasce com a marca padrão', () => {
    expect(createProject().brandKitId).toBe(DEFAULT_BRAND_KIT_ID);
  });
});
