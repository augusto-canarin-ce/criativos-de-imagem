import type { Project } from '@/lib/model/types';
import { collectProjectFonts } from '@/lib/render/fontsReady';
import { isCurated } from './curated';
import { SYSTEM_FONT_OPTIONS } from './stacks';
import { googleCatalogEntry, loadGoogleFont } from './googleFonts';
import { registerAllUserFonts } from './userFonts';

// Loader de fontes do PROJETO (§9): na abertura, garante que toda família usada
// esteja disponível — curadoria já está no bundle; fontes enviadas são
// registradas via FontFace; o que sobrar e existir no catálogo do Google é
// carregado por nome. Falhas não bloqueiam (viram fallback + aviso no checklist
// de export, que já checa document.fonts).

const SYSTEM = new Set(SYSTEM_FONT_OPTIONS.map((f) => f.family));

export type FontSource = 'curated' | 'system' | 'user' | 'google' | 'unknown';

export function classifyFamily(family: string, userFamilies: Set<string>): FontSource {
  if (isCurated(family)) return 'curated';
  if (SYSTEM.has(family)) return 'system';
  if (userFamilies.has(family)) return 'user';
  if (googleCatalogEntry(family)) return 'google';
  return 'unknown';
}

/**
 * Garante que um conjunto de famílias esteja disponível (usado pelos papéis do
 * brand kit). Curadas já estão no bundle; do Google carregam por nome; falhas
 * viram aviso no console e depois no checklist de export (§9/§11).
 */
export async function loadFontsForFamilies(families: string[]): Promise<void> {
  const userFonts = await registerAllUserFonts();
  const userFamilies = new Set(userFonts.map((f) => f.name));
  await Promise.all(
    families
      .filter((family) => classifyFamily(family, userFamilies) === 'google')
      .map((family) => {
        const entry = googleCatalogEntry(family)!;
        const weights = [400, 700].filter((w) => entry.weights.includes(w));
        return loadGoogleFont(family, weights.length ? weights : entry.weights.slice(0, 1)).catch(
          (err) => console.warn(err instanceof Error ? err.message : err),
        );
      }),
  );
}

export async function loadProjectFonts(project: Project): Promise<void> {
  const userFonts = await registerAllUserFonts();
  const userFamilies = new Set(userFonts.map((f) => f.name));

  const jobs: Promise<void>[] = [];
  for (const [family, weight] of collectProjectFonts(project)) {
    if (classifyFamily(family, userFamilies) === 'google') {
      const entry = googleCatalogEntry(family)!;
      const weights = [...new Set([400, weight])].filter((w) => entry.weights.includes(w));
      jobs.push(
        loadGoogleFont(family, weights.length ? weights : entry.weights.slice(0, 1)).catch((err) =>
          console.warn(err instanceof Error ? err.message : err),
        ),
      );
    }
  }
  await Promise.all(jobs);
}
