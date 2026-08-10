import catalogRaw from './google-catalog.json';

// Busca no Google Fonts (§9) SEM chave de API: o CATÁLOGO (nomes, categoria,
// pesos) é vendorizado no repositório como dado — a busca em si funciona offline.
// A única rede é o CARREGAMENTO da fonte escolhida, via endpoint css2 público
// (fonts.googleapis.com) — exatamente a exceção que a §16 permite. Se falhar
// (offline), o erro é claro e imediato (§3) e a curadoria segue funcionando.

export interface GoogleFontEntry {
  family: string;
  category: string;
  weights: number[];
}

const catalog: GoogleFontEntry[] = (catalogRaw as [string, string, number[]][]).map(
  ([family, category, weights]) => ({ family, category, weights }),
);

/** Fontes do Google carregadas NESTA sessão (nome → pesos carregados). */
const loadedGoogleFonts = new Map<string, number[]>();

export function searchGoogleCatalog(query: string, limit = 30): GoogleFontEntry[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const starts: GoogleFontEntry[] = [];
  const contains: GoogleFontEntry[] = [];
  for (const entry of catalog) {
    const name = entry.family.toLowerCase();
    if (name.startsWith(q)) starts.push(entry);
    else if (name.includes(q)) contains.push(entry);
    if (starts.length >= limit) break;
  }
  return [...starts, ...contains].slice(0, limit);
}

export function googleCatalogEntry(family: string): GoogleFontEntry | undefined {
  return catalog.find((e) => e.family === family);
}

export function isGoogleFontLoaded(family: string): boolean {
  return loadedGoogleFonts.has(family);
}

export function sessionGoogleFonts(): { family: string; weights: number[] }[] {
  return [...loadedGoogleFonts.entries()].map(([family, weights]) => ({ family, weights }));
}

/** Monta a URL css2 pública (sem chave). */
export function css2Url(family: string, weights: number[]): string {
  const fam = family.replace(/ /g, '+');
  const w = [...weights].sort((a, b) => a - b).join(';');
  return `https://fonts.googleapis.com/css2?family=${fam}:wght@${w}&display=swap`;
}

/**
 * Carrega uma família do Google injetando o stylesheet css2 e esperando o
 * FontFaceSet confirmar. Timeout curto com mensagem honesta — nada de spinner
 * eterno quando estiver offline (§3).
 */
export async function loadGoogleFont(
  family: string,
  weights: number[],
  timeoutMs = 8000,
): Promise<void> {
  const already = loadedGoogleFonts.get(family);
  const missing = already ? weights.filter((w) => !already.includes(w)) : weights;
  if (missing.length === 0) return;

  const href = css2Url(family, missing);
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  const cssLoaded = new Promise<void>((resolve, reject) => {
    link.onload = () => resolve();
    link.onerror = () =>
      reject(
        new Error(
          `Não deu para carregar "${family}" do Google Fonts. Sem conexão? A curadoria continua disponível.`,
        ),
      );
  });
  document.head.appendChild(link);

  const timeout = new Promise<never>((_, reject) =>
    setTimeout(
      () =>
        reject(
          new Error(
            `"${family}" demorou demais para responder. Verifique a conexão — a curadoria continua disponível.`,
          ),
        ),
      timeoutMs,
    ),
  );

  try {
    await Promise.race([cssLoaded, timeout]);
    // O css chegou; força o download dos arquivos de fonte e espera ficarem prontos.
    await Promise.race([
      Promise.all(missing.map((w) => document.fonts.load(`${w} 16px "${family}"`))),
      timeout,
    ]);
    loadedGoogleFonts.set(family, [...(already ?? []), ...missing]);
  } catch (err) {
    link.remove();
    throw err;
  }
}
