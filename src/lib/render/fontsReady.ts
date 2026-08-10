import type { Project } from '@/lib/model/types';
import { resolveFontNow } from '@/lib/store/brand';

// Regra inviolável do export (SPEC §9): antes de qualquer renderização final,
// `await document.fonts.ready` e confirmação de que TODAS as famílias usadas no
// projeto estão carregadas. Exportar com fonte substituída é o pior bug possível
// deste app — passa despercebido até o anúncio estar no ar.

export interface FontStatus {
  family: string;
  weight: number;
  loaded: boolean;
}

export function collectProjectFonts(project: Project): Map<string, number> {
  const fonts = new Map<string, number>();
  for (const layout of Object.values(project.layouts)) {
    for (const layer of layout.layers) {
      // Token de marca resolve para a família REAL: é ela que precisa estar
      // carregada, e é o nome dela que faz sentido num aviso ao usuário (§9/§10).
      if (layer.type === 'text' && layer.visible) {
        fonts.set(resolveFontNow(layer.fontFamily), layer.fontWeight);
      }
    }
  }
  return fonts;
}

export function isFontLoaded(family: string, weight: number): boolean {
  // Famílias genéricas/de sistema resolvem sempre; document.fonts.check responde
  // pelas registradas (fontsource, FontFace de fonte enviada).
  try {
    return document.fonts.check(`${weight} 16px "${family}"`);
  } catch {
    return false;
  }
}

export async function waitForProjectFonts(project: Project): Promise<FontStatus[]> {
  await document.fonts.ready;
  const out: FontStatus[] = [];
  for (const [family, weight] of collectProjectFonts(project)) {
    out.push({ family, weight, loaded: isFontLoaded(family, weight) });
  }
  return out;
}
