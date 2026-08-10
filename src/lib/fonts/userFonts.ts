import { db } from '@/lib/db/dexie';
import { newId } from '@/lib/model/factory';
import type { Asset } from '@/lib/model/types';

// Fonte enviada pelo usuário (§9): .ttf/.otf/.woff2, guardada como Asset kind
// 'font' e registrada via FontFace. O NOME da família vem do nome do arquivo
// (limpo) — simples, previsível e visível no seletor em "Minhas fontes".

const FONT_EXT = /\.(ttf|otf|woff2?)$/i;

const registered = new Set<string>(); // asset.id já registrados nesta sessão

/** "minha-fonte_Bold.ttf" → "Minha Fonte Bold" */
export function fontFamilyFromFileName(fileName: string): string {
  return fileName
    .replace(FONT_EXT, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function saveFontAsset(file: File): Promise<Asset> {
  if (!FONT_EXT.test(file.name)) {
    throw new Error('Formato de fonte não suportado. Envie .ttf, .otf ou .woff2.');
  }
  const family = fontFamilyFromFileName(file.name);
  const asset: Asset = {
    id: newId(),
    kind: 'font',
    blob: file.slice(0, file.size, file.type || 'font/ttf'),
    mime: file.type || 'font/ttf',
    name: family,
  };
  // Registra ANTES de gravar: se a fonte for inválida, o FontFace.load lança e
  // nada suja o banco.
  await registerFontAsset(asset);
  await db.assets.add(asset);
  return asset;
}

/** Registra um Asset de fonte no document.fonts (idempotente por sessão). */
export async function registerFontAsset(asset: Asset): Promise<void> {
  if (registered.has(asset.id)) return;
  const buffer = await asset.blob.arrayBuffer();
  const face = new FontFace(asset.name, buffer);
  await face.load();
  document.fonts.add(face);
  registered.add(asset.id);
}

/** Todas as fontes enviadas (para o seletor e para o loader do projeto). */
export async function listUserFonts(): Promise<Asset[]> {
  return db.assets.where('kind').equals('font').toArray();
}

/** Registra todas as fontes enviadas — chamado na abertura do editor (§9). */
export async function registerAllUserFonts(): Promise<Asset[]> {
  const fonts = await listUserFonts();
  await Promise.all(
    fonts.map((f) =>
      registerFontAsset(f).catch((err) => console.error(`Fonte "${f.name}" inválida:`, err)),
    ),
  );
  return fonts;
}
