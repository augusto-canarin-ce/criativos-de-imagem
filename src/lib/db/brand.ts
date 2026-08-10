import JSZip from 'jszip';
import { db } from './dexie';
import type { Asset, BrandKit } from '@/lib/model/types';
import { brandKitSchema } from '@/lib/model/schema';
import { newId } from '@/lib/model/factory';

// Brand kits (SPEC §10): cores nomeadas, fontes por papel, logos e estilos de
// texto. Múltiplos kits, um ativo por projeto (`Project.brandKitId`). Exportável e
// importável como arquivo COM os logos embutidos — é o que permite atender vários
// clientes e levar a marca entre máquinas.

export function createBrandKit(name = 'Nova marca'): BrandKit {
  return {
    id: newId(),
    name,
    colors: [
      { id: 'primary', name: 'Primária', hex: '#10b981' },
      { id: 'secondary', name: 'Secundária', hex: '#0f172a' },
      { id: 'accent', name: 'Destaque', hex: '#f59e0b' },
      { id: 'surface', name: 'Fundo', hex: '#ffffff' },
      { id: 'ink', name: 'Texto', hex: '#111111' },
    ],
    fonts: [
      { role: 'display', family: 'Montserrat', weights: [700, 800, 900] },
      { role: 'body', family: 'Inter', weights: [400, 600, 800] },
    ],
    logos: [],
    textStyles: {},
  };
}

export async function listBrandKits(): Promise<BrandKit[]> {
  const rows = await db.brandKits.toArray();
  const out: BrandKit[] = [];
  for (const row of rows) {
    const parsed = brandKitSchema.safeParse(row);
    if (parsed.success) out.push(row);
    else console.error(`Brand kit ${(row as { id?: string }).id ?? '?'} inválido:`, parsed.error);
  }
  return out;
}

export async function getBrandKit(id: string): Promise<BrandKit | undefined> {
  const row = await db.brandKits.get(id);
  if (!row) return undefined;
  return brandKitSchema.safeParse(row).success ? row : undefined;
}

export async function saveBrandKit(kit: BrandKit): Promise<void> {
  await db.brandKits.put(kit);
}

export async function deleteBrandKit(id: string): Promise<void> {
  await db.transaction('rw', db.brandKits, db.projects, async () => {
    await db.brandKits.delete(id);
    // Projetos que usavam este kit voltam a "sem marca" — os tokens caem no
    // fallback do render, sem quebrar nada.
    const users = await db.projects.filter((p) => p.brandKitId === id).toArray();
    for (const p of users) await db.projects.put({ ...p, brandKitId: undefined });
  });
}

// ---------- arquivo .marca (§10: exportável com os logos embutidos) ----------

interface MarcaManifestAsset {
  id: string;
  mime: string;
  name: string;
  width?: number;
  height?: number;
  file: string;
}

export async function buildBrandFile(kit: BrandKit): Promise<Blob> {
  const zip = new JSZip();
  const logoAssets = (await db.assets.bulkGet(kit.logos.map((l) => l.assetId))).filter(
    (a): a is Asset => !!a,
  );
  const manifest: { app: string; fileVersion: 1; assets: MarcaManifestAsset[] } = {
    app: 'criativos-de-imagem/marca',
    fileVersion: 1,
    assets: logoAssets.map((a) => ({
      id: a.id,
      mime: a.mime,
      name: a.name,
      width: a.width,
      height: a.height,
      file: `logos/${a.id}`,
    })),
  };
  zip.file('brand.json', JSON.stringify(kit, null, 2));
  zip.file('manifest.json', JSON.stringify(manifest, null, 2));
  for (const a of logoAssets) {
    zip.file(`logos/${a.id}`, await a.blob.arrayBuffer());
  }
  return zip.generateAsync({ type: 'blob' });
}

/** Importa um `.marca`: valida com zod, regenera ids (kit e logos) e grava. */
export async function importBrandFile(file: Blob): Promise<BrandKit> {
  const zip = await JSZip.loadAsync(await file.arrayBuffer()).catch(() => {
    throw new Error('Este arquivo não é uma marca válida (.marca).');
  });
  const brandRaw = await zip.file('brand.json')?.async('string');
  const manifestRaw = await zip.file('manifest.json')?.async('string');
  if (!brandRaw || !manifestRaw) {
    throw new Error('Arquivo de marca incompleto: faltam brand.json ou manifest.json.');
  }

  const kit = brandKitSchema.parse(JSON.parse(brandRaw)) as BrandKit;
  const manifest = JSON.parse(manifestRaw) as { assets: MarcaManifestAsset[] };

  const idMap = new Map<string, string>();
  const assets: Asset[] = [];
  for (const entry of manifest.assets ?? []) {
    const bin = await zip.file(entry.file)?.async('arraybuffer');
    if (!bin) continue;
    const freshId = newId();
    idMap.set(entry.id, freshId);
    assets.push({
      id: freshId,
      kind: entry.mime.includes('svg') ? 'svg' : 'raster',
      blob: new Blob([bin], { type: entry.mime }),
      mime: entry.mime,
      width: entry.width,
      height: entry.height,
      name: entry.name,
    });
  }

  const fresh: BrandKit = {
    ...kit,
    id: newId(),
    name: `${kit.name} (importada)`,
    logos: kit.logos
      .map((l) => ({ ...l, id: newId(), assetId: idMap.get(l.assetId) ?? '' }))
      .filter((l) => l.assetId !== ''),
  };

  await db.transaction('rw', db.brandKits, db.assets, async () => {
    if (assets.length) await db.assets.bulkAdd(assets);
    await db.brandKits.add(fresh);
  });
  return fresh;
}
