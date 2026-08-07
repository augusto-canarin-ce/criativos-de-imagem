import JSZip from 'jszip';
import { z } from 'zod';
import type { Asset, Project } from '@/lib/model/types';
import { migrateProject } from '@/lib/model/migrations';
import { newId } from '@/lib/model/factory';
import { db } from '@/lib/db/dexie';

// Arquivo de projeto `.criativo` (SPEC §12): um ZIP com project.json + assets
// binários. Leva o projeto entre máquinas/navegadores e é o formato dos templates
// de fábrica. As imagens vão como estão guardadas — já passaram pelo pipeline na
// importação; recomprimir degradaria sem ganho.

const assetEntrySchema = z.object({
  id: z.string(),
  kind: z.enum(['raster', 'svg', 'font']),
  mime: z.string(),
  width: z.number().optional(),
  height: z.number().optional(),
  name: z.string(),
  file: z.string(), // caminho dentro do zip
});

const manifestSchema = z.object({
  app: z.literal('criativos-de-imagem'),
  fileVersion: z.literal(1),
  assets: z.array(assetEntrySchema),
});

function extFor(mime: string): string {
  if (/png/.test(mime)) return 'png';
  if (/jpe?g/.test(mime)) return 'jpg';
  if (/webp/.test(mime)) return 'webp';
  if (/svg/.test(mime)) return 'svg';
  if (/gif/.test(mime)) return 'gif';
  return 'bin';
}

/** Tamanho estimado do arquivo, mostrado ANTES de gerar (§12). */
export function estimateProjectFileSize(project: Project, assets: Asset[]): number {
  const json = JSON.stringify(project).length;
  return json + assets.reduce((acc, a) => acc + a.blob.size, 0);
}

export async function collectProjectAssets(project: Project): Promise<Asset[]> {
  const ids = new Set<string>();
  for (const layout of Object.values(project.layouts)) {
    for (const layer of layout.layers) {
      if (layer.type === 'image' && layer.assetId) ids.add(layer.assetId);
    }
  }
  const assets = await db.assets.bulkGet([...ids]);
  return assets.filter((a): a is Asset => !!a);
}

export async function buildProjectFile(project: Project, assets: Asset[]): Promise<Blob> {
  const zip = new JSZip();
  const manifest = {
    app: 'criativos-de-imagem' as const,
    fileVersion: 1 as const,
    assets: assets.map((a) => ({
      id: a.id,
      kind: a.kind,
      mime: a.mime,
      width: a.width,
      height: a.height,
      name: a.name,
      file: `assets/${a.id}.${extFor(a.mime)}`,
    })),
  };
  zip.file('project.json', JSON.stringify(project, null, 2));
  zip.file('manifest.json', JSON.stringify(manifest, null, 2));
  for (const a of assets) {
    // ArrayBuffer, não Blob: o JSZip aceita nos dois ambientes (browser e Node —
    // onde a suíte de testes roda).
    zip.file(`assets/${a.id}.${extFor(a.mime)}`, await a.blob.arrayBuffer());
  }
  return zip.generateAsync({ type: 'blob' });
}

/**
 * Importa um `.criativo`: valida com zod + migração (§16: todo dado que cruza
 * fronteira), regenera TODOS os ids (projeto e assets — sem colisão com o que já
 * existe no navegador) e grava projeto + assets no IndexedDB.
 */
export async function importProjectFile(file: Blob): Promise<Project> {
  // ArrayBuffer na entrada: o JSZip lê nos dois ambientes (browser e Node).
  const buffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(buffer).catch(() => {
    throw new Error('Este arquivo não é um .criativo válido.');
  });

  const projectRaw = await zip.file('project.json')?.async('string');
  const manifestRaw = await zip.file('manifest.json')?.async('string');
  if (!projectRaw || !manifestRaw) {
    throw new Error('Arquivo .criativo incompleto: faltam project.json ou manifest.json.');
  }

  const manifest = manifestSchema.parse(JSON.parse(manifestRaw));
  const project = migrateProject(JSON.parse(projectRaw));

  // Regenera ids de assets e regrava blobs.
  const idMap = new Map<string, string>();
  const assets: Asset[] = [];
  for (const entry of manifest.assets) {
    const bin = await zip.file(entry.file)?.async('arraybuffer');
    if (!bin) throw new Error(`Asset "${entry.name}" ausente no arquivo.`);
    const freshId = newId();
    idMap.set(entry.id, freshId);
    assets.push({
      id: freshId,
      kind: entry.kind,
      blob: new Blob([bin], { type: entry.mime }),
      mime: entry.mime,
      width: entry.width,
      height: entry.height,
      name: entry.name,
    });
  }

  const now = Date.now();
  const fresh: Project = {
    ...project,
    id: newId(),
    name: `${project.name} (importado)`,
    assets: project.assets.map((id) => idMap.get(id)).filter((x): x is string => !!x),
    createdAt: now,
    updatedAt: now,
  };
  for (const layout of Object.values(fresh.layouts)) {
    for (const layer of layout.layers) {
      if (layer.type === 'image' && layer.assetId) {
        layer.assetId = idMap.get(layer.assetId) ?? null;
      }
    }
  }

  await db.transaction('rw', db.projects, db.assets, async () => {
    if (assets.length) await db.assets.bulkAdd(assets);
    await db.projects.add(fresh);
  });
  return fresh;
}
