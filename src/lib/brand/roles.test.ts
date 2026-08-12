import { describe, expect, it, beforeEach } from 'vitest';
import { claimStandardRoles, rewriteColorTokens, STANDARD_ROLE_IDS } from './roles';
import { migrateBrandKitRoles, saveBrandKit, getBrandKit, createBrandKit } from '@/lib/db/brand';
import { db } from '@/lib/db/dexie';
import { createProject } from '@/lib/model/factory';
import { createTextLayer, createRectLayer } from '@/lib/model/layers';
import type { BrandKit, Project } from '@/lib/model/types';

// A migração dos papéis padrão (2026-08-12). O caso que a motivou é literal: o
// kit "Conversao Extrema" ficou só com `primary` — as outras cores ganharam ids
// aleatórios e todo token de modelo de fábrica caía no cinza de "não resolvido".

/** O kit real que motivou tudo, com o mapeamento pedido pelo usuário:
 *  Esmeralda→primary (já era), Esmeralda claro→accent, Grafite→ink,
 *  Branco→surface, Cinza→secondary. */
function kitConversaoExtrema(): BrandKit {
  return {
    id: 'kit-ce',
    name: 'Conversao Extrema',
    colors: [
      { id: 'primary', name: 'Esmeralda', hex: '#10b981' },
      { id: 'bafea4f2', name: 'Esmeralda claro', hex: '#34d399' },
      { id: '2a8f711f', name: 'Esmeralda escuro', hex: '#059669' },
      { id: '7bb9da8d', name: 'Grafite', hex: '#0a0a0a' },
      { id: '0aeb5246', name: 'Cinza', hex: '#525252' },
      { id: '6c9b7653', name: 'Branco', hex: '#ffffff' },
    ],
    fonts: [
      { role: 'display', family: 'Geist Sans', weights: [700] },
      { role: 'body', family: 'Geist Sans', weights: [400] },
    ],
    logos: [],
    textStyles: {},
  };
}

describe('claimStandardRoles', () => {
  it('o kit "Conversao Extrema" ganha os cinco papéis pelo mapeamento pedido', () => {
    const kit = kitConversaoExtrema();
    const { changed, renames } = claimStandardRoles(kit);
    expect(changed).toBe(true);

    const porPapel = Object.fromEntries(kit.colors.map((c) => [c.id, c]));
    expect(porPapel.primary.name).toBe('Esmeralda');
    expect(porPapel.accent).toMatchObject({ name: 'Esmeralda claro', hex: '#34d399' });
    expect(porPapel.ink).toMatchObject({ name: 'Grafite', hex: '#0a0a0a' });
    expect(porPapel.surface).toMatchObject({ name: 'Branco', hex: '#ffffff' });
    expect(porPapel.secondary).toMatchObject({ name: 'Cinza', hex: '#525252' });

    // "Esmeralda escuro" não foi levada pelo "esmeralda" do primary.
    expect(kit.colors.find((c) => c.name === 'Esmeralda escuro')?.id).toBe('2a8f711f');

    expect(Object.fromEntries(renames)).toEqual({
      bafea4f2: 'accent',
      '7bb9da8d': 'ink',
      '6c9b7653': 'surface',
      '0aeb5246': 'secondary',
    });
  });

  it('kit íntegro é no-op', () => {
    const kit = createBrandKit('Ok');
    const { changed, renames } = claimStandardRoles(kit);
    expect(changed).toBe(false);
    expect(renames.size).toBe(0);
  });

  it('papel sem candidata pelo nome ganha a cor default — token nunca mais cai no cinza', () => {
    const kit: BrandKit = {
      ...kitConversaoExtrema(),
      colors: [{ id: 'x1', name: 'Azul da firma', hex: '#0000ff' }],
    };
    claimStandardRoles(kit);
    for (const papel of STANDARD_ROLE_IDS) {
      expect(kit.colors.some((c) => c.id === papel), papel).toBe(true);
    }
  });

  it('nome e hex nunca mudam — só o id', () => {
    const kit = kitConversaoExtrema();
    const antes = kit.colors.map((c) => `${c.name}:${c.hex}`).sort();
    claimStandardRoles(kit);
    const depois = kit.colors.map((c) => `${c.name}:${c.hex}`).sort();
    expect(depois).toEqual(antes);
  });
});

describe('rewriteColorTokens', () => {
  it('reescreve tokens em fill sólido, gradiente, highlight e fundo', () => {
    const p = createProject();
    const texto = createTextLayer('4:5', 'Oi');
    texto.fill = { kind: 'solid', color: 'brand.bafea4f2' };
    texto.highlight = { fill: { kind: 'solid', color: 'brand.7bb9da8d' }, padH: 4, padV: 2, radius: 4 };
    const forma = createRectLayer('4:5');
    forma.fill = {
      kind: 'linear',
      stops: [
        { offset: 0, color: 'brand.6c9b7653' },
        { offset: 1, color: '#123456' },
      ],
      angle: 0,
    };
    p.layouts['4:5'].layers = [texto, forma];
    p.layouts['4:5'].background = { kind: 'solid', color: 'brand.0aeb5246' };

    const mudou = rewriteColorTokens(p, new Map([
      ['bafea4f2', 'accent'],
      ['7bb9da8d', 'ink'],
      ['6c9b7653', 'surface'],
      ['0aeb5246', 'secondary'],
    ]));

    expect(mudou).toBe(true);
    expect(texto.fill).toEqual({ kind: 'solid', color: 'brand.accent' });
    expect(texto.highlight?.fill).toEqual({ kind: 'solid', color: 'brand.ink' });
    expect(forma.fill.kind === 'linear' && forma.fill.stops[0].color).toBe('brand.surface');
    expect(forma.fill.kind === 'linear' && forma.fill.stops[1].color).toBe('#123456');
    expect(p.layouts['4:5'].background).toEqual({ kind: 'solid', color: 'brand.secondary' });
  });

  it('token que não está no mapa e hex ficam intactos', () => {
    const p = createProject();
    const texto = createTextLayer('4:5', 'Oi');
    texto.fill = { kind: 'solid', color: 'brand.primary' };
    p.layouts['4:5'].layers = [texto];
    expect(rewriteColorTokens(p, new Map([['zzz', 'accent']]))).toBe(false);
    expect(texto.fill).toEqual({ kind: 'solid', color: 'brand.primary' });
  });
});

describe('migrateBrandKitRoles — ponta a ponta no IndexedDB', () => {
  beforeEach(async () => {
    await db.brandKits.clear();
    await db.projects.clear();
    await db.templates.clear();
  });

  it('conserta o kit e reescreve os tokens dos projetos que o usam', async () => {
    await saveBrandKit(kitConversaoExtrema());

    const projeto: Project = createProject({ name: 'Com a marca' });
    projeto.brandKitId = 'kit-ce';
    const titulo = createTextLayer('4:5', 'Título');
    titulo.fill = { kind: 'solid', color: 'brand.7bb9da8d' }; // Grafite pelo id antigo
    projeto.layouts['4:5'].layers = [titulo];
    await db.projects.add(projeto);

    // Projeto de OUTRO kit com um token homônimo: não pode ser tocado.
    const alheio: Project = createProject({ name: 'De outro kit' });
    alheio.brandKitId = 'outro-kit';
    const t2 = createTextLayer('4:5', 'x');
    t2.fill = { kind: 'solid', color: 'brand.7bb9da8d' };
    alheio.layouts['4:5'].layers = [t2];
    await db.projects.add(alheio);

    const resumo = await migrateBrandKitRoles();
    expect(resumo).toEqual({ kits: 1, projetos: 1 });

    const kit = await getBrandKit('kit-ce');
    expect(kit?.colors.find((c) => c.id === 'ink')?.name).toBe('Grafite');

    const salvo = await db.projects.get(projeto.id);
    const camada = salvo?.layouts['4:5'].layers[0];
    expect(camada?.type === 'text' && camada.fill).toEqual({ kind: 'solid', color: 'brand.ink' });

    const intocado = await db.projects.get(alheio.id);
    const camada2 = intocado?.layouts['4:5'].layers[0];
    expect(camada2?.type === 'text' && camada2.fill).toEqual({
      kind: 'solid',
      color: 'brand.7bb9da8d',
    });
  });

  it('segunda rodada é no-op', async () => {
    await saveBrandKit(kitConversaoExtrema());
    await migrateBrandKitRoles();
    const resumo = await migrateBrandKitRoles();
    expect(resumo).toEqual({ kits: 0, projetos: 0 });
  });
});
