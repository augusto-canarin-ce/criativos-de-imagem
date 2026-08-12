import type { BrandKit, Fill, Layer, Project } from '@/lib/model/types';
import { COLOR_TOKEN_PREFIX } from './tokens';

// Os CINCO PAPÉIS PADRÃO de cor de um brand kit: primary, secondary, accent,
// surface e ink. Eles são o esqueleto do kit — os modelos de fábrica apontam
// para esses ids (§10), e um kit sem eles resolve todo token para a cor de
// "não resolvido": foi assim que as miniaturas do painel de modelos viraram
// blocos cinzas (diagnóstico de 2026-08-12).
//
// Duas defesas:
// 1. `claimStandardRoles` — migração: um kit sem os papéis tem suas cores
//    RENOMEADAS de id para assumi-los, casando pelo nome ("Esmeralda" vira
//    primary sem mudar de cor nem de nome visível).
// 2. O painel de marca não deixa apagar uma cor de papel padrão (a lixeira some
//    para elas) — sem isso a migração seria enxugar gelo.
//
// Renomear id quebra referências: o ColorPicker grava `brand.<id>` nas camadas.
// Por isso a migração devolve o mapa de renomeações, e quem a chama reescreve os
// tokens dos projetos do mesmo kit (`rewriteColorTokens`).

export const STANDARD_ROLE_IDS = ['primary', 'secondary', 'accent', 'surface', 'ink'] as const;
export type StandardRoleId = (typeof STANDARD_ROLE_IDS)[number];

/** Cor acrescentada quando nenhuma existente serve para o papel. Os mesmos
 *  valores do kit de fábrica (`createBrandKit`). */
export const ROLE_DEFAULTS: Record<StandardRoleId, { name: string; hex: string }> = {
  primary: { name: 'Primária', hex: '#10b981' },
  secondary: { name: 'Secundária', hex: '#0f172a' },
  accent: { name: 'Destaque', hex: '#f59e0b' },
  surface: { name: 'Fundo', hex: '#ffffff' },
  ink: { name: 'Texto', hex: '#111111' },
};

function chave(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/** Nomes que reivindicam cada papel. Duas passadas: primeiro igualdade exata
 *  (para "Esmeralda claro" não ser levada pelo "esmeralda" do primary), depois
 *  "contém". Inclui os nomes do kit real que motivou a migração. */
const NOMES_POR_PAPEL: Record<StandardRoleId, string[]> = {
  accent: ['destaque', 'accent', 'esmeralda claro'],
  primary: ['primaria', 'primary', 'principal', 'esmeralda'],
  ink: ['texto', 'ink', 'grafite', 'preto'],
  surface: ['fundo', 'surface', 'branco'],
  secondary: ['secundaria', 'secondary', 'cinza'],
};

export interface RoleClaimResult {
  changed: boolean;
  /** id antigo → id de papel que a cor assumiu (para reescrever tokens). */
  renames: Map<string, StandardRoleId>;
}

/**
 * Garante os cinco papéis no kit, MUTANDO-o. Cores existentes assumem papéis
 * casando pelo nome; papel sem candidata ganha a cor default. Nome visível e
 * hex nunca mudam — só o id.
 */
export function claimStandardRoles(kit: BrandKit): RoleClaimResult {
  const renames = new Map<string, StandardRoleId>();
  const presentes = new Set(kit.colors.map((c) => c.id));
  const faltando = STANDARD_ROLE_IDS.filter((id) => !presentes.has(id));
  if (faltando.length === 0) return { changed: false, renames };

  const reivindicadas = new Set<string>();

  const tentar = (papel: StandardRoleId, exata: boolean): void => {
    for (const nome of NOMES_POR_PAPEL[papel]) {
      const cor = kit.colors.find(
        (c) =>
          !STANDARD_ROLE_IDS.includes(c.id as StandardRoleId) &&
          !reivindicadas.has(c.id) &&
          (exata ? chave(c.name) === nome : chave(c.name).includes(nome)),
      );
      if (cor) {
        reivindicadas.add(cor.id);
        renames.set(cor.id, papel);
        return;
      }
    }
  };

  // A ordem de NOMES_POR_PAPEL importa: accent ("esmeralda claro") reivindica
  // antes de primary ("esmeralda") para a passada por "contém" não roubar.
  const papeis = Object.keys(NOMES_POR_PAPEL) as StandardRoleId[];
  for (const papel of papeis) if (faltando.includes(papel)) tentar(papel, true);
  for (const papel of papeis) {
    if (faltando.includes(papel) && ![...renames.values()].includes(papel)) tentar(papel, false);
  }

  for (const [antigo, papel] of renames) {
    const cor = kit.colors.find((c) => c.id === antigo);
    if (cor) cor.id = papel;
  }

  // Papel que sobrou sem candidata ganha a cor default — o token nunca mais
  // resolve para o cinza de "não resolvido".
  for (const papel of faltando) {
    if (!kit.colors.some((c) => c.id === papel)) {
      kit.colors.push({ id: papel, ...ROLE_DEFAULTS[papel] });
    }
  }

  return { changed: true, renames };
}

// ─── reescrita de tokens nos projetos ───────────────────────────────────────

function rewriteFill(fill: Fill, mapa: Map<string, string>): boolean {
  let mudou = false;
  const troca = (cor: string): string => {
    if (!cor.startsWith(COLOR_TOKEN_PREFIX)) return cor;
    const novo = mapa.get(cor.slice(COLOR_TOKEN_PREFIX.length));
    if (!novo) return cor;
    mudou = true;
    return `${COLOR_TOKEN_PREFIX}${novo}`;
  };
  if (fill.kind === 'solid') fill.color = troca(fill.color);
  else for (const stop of fill.stops) stop.color = troca(stop.color);
  return mudou;
}

function rewriteLayer(layer: Layer, mapa: Map<string, string>): boolean {
  let mudou = false;
  if (layer.type === 'text' || layer.type === 'shape') {
    if (rewriteFill(layer.fill, mapa)) mudou = true;
  }
  if (layer.type === 'text' && layer.highlight) {
    if (rewriteFill(layer.highlight.fill, mapa)) mudou = true;
  }
  if (layer.type === 'group') {
    for (const child of layer.children) if (rewriteLayer(child, mapa)) mudou = true;
  }
  return mudou;
}

/** Reescreve `brand.<antigo>` → `brand.<novo>` em todas as camadas e fundos.
 *  MUTA o projeto; devolve se algo mudou (para só salvar quando preciso). */
export function rewriteColorTokens(project: Project, renames: Map<string, string>): boolean {
  if (renames.size === 0) return false;
  let mudou = false;
  for (const layout of Object.values(project.layouts)) {
    if (rewriteFill(layout.background, renames)) mudou = true;
    for (const layer of layout.layers) if (rewriteLayer(layer, renames)) mudou = true;
  }
  return mudou;
}
