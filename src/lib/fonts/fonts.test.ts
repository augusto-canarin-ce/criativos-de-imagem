import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { CURATED_FONTS } from './curated';
import { searchGoogleCatalog, googleCatalogEntry, css2Url } from './googleFonts';
import { classifyFamily } from './loader';
import { fontFamilyFromFileName } from './userFonts';
import { fontStack } from './stacks';

describe('curadoria (§9)', () => {
  it('tem ~30 famílias divididas em Títulos e Corpo', () => {
    expect(CURATED_FONTS.length).toBeGreaterThanOrEqual(25);
    expect(CURATED_FONTS.some((f) => f.role === 'display')).toBe(true);
    expect(CURATED_FONTS.some((f) => f.role === 'body')).toBe(true);
  });

  it('toda família tem pelo menos um peso pesado (≥700) ou é display de peso único', () => {
    for (const f of CURATED_FONTS) {
      const heavy = f.weights.some((w) => w >= 700);
      const singleDisplay = f.role === 'display' && f.weights.length === 1;
      expect(heavy || singleDisplay, `${f.family} sem peso pesado`).toBe(true);
    }
  });

  it('curated-imports cobre exatamente as famílias+pesos declarados', () => {
    const imports = readFileSync(new URL('./curated-imports.ts', import.meta.url), 'utf8');
    for (const f of CURATED_FONTS) {
      if (f.family === 'Geist Sans') continue; // importada no main.tsx (fonte da UI)
      const pkg = f.family.toLowerCase().replace(/ /g, '-');
      for (const w of f.weights) {
        expect(imports, `falta @fontsource/${pkg}/${w}.css`).toContain(
          `@fontsource/${pkg}/${w}.css`,
        );
      }
    }
  });

  it('serifadas caem em fallback serifado', () => {
    expect(fontStack('Playfair Display')).toMatch(/serif$/);
    expect(fontStack('Playfair Display')).not.toMatch(/sans-serif$/);
    expect(fontStack('Montserrat')).toMatch(/sans-serif$/);
  });
});

describe('catálogo do Google (vendorizado)', () => {
  it('busca por prefixo e por trecho, sem rede', () => {
    const lob = searchGoogleCatalog('lobs');
    expect(lob.some((e) => e.family === 'Lobster')).toBe(true);
    expect(searchGoogleCatalog('x')).toHaveLength(0); // mínimo 2 chars
  });

  it('entrada tem pesos numéricos', () => {
    const m = googleCatalogEntry('Montserrat')!;
    expect(m.weights).toContain(400);
    expect(m.weights).toContain(900);
  });

  it('monta a URL css2 pública sem chave de API', () => {
    const url = css2Url('Playfair Display', [700, 400]);
    expect(url).toBe(
      'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap',
    );
    expect(url).not.toContain('key=');
  });
});

describe('loader — classificação de família', () => {
  const user = new Set(['Minha Fonte Corporativa']);
  it.each([
    ['Montserrat', 'curated'],
    ['Arial', 'system'],
    ['Minha Fonte Corporativa', 'user'],
    ['Lobster', 'google'],
    ['Fonte Inexistente Xyz', 'unknown'],
  ] as const)('%s → %s', (family, expected) => {
    expect(classifyFamily(family, user)).toBe(expected);
  });
});

describe('nome de família a partir do arquivo', () => {
  it.each([
    ['minha-fonte_Bold.ttf', 'Minha Fonte Bold'],
    ['BrandSans.woff2', 'BrandSans'],
    ['  ACME  display.otf', 'ACME Display'],
  ])('%s → %s', (file, expected) => {
    expect(fontFamilyFromFileName(file)).toBe(expected);
  });
});
