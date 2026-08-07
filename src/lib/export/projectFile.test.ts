import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db/dexie';
import { createProject } from '@/lib/model/factory';
import { createImageLayer, createTextLayer } from '@/lib/model/layers';
import {
  buildProjectFile,
  collectProjectAssets,
  estimateProjectFileSize,
  importProjectFile,
} from './projectFile';
import type { Asset } from '@/lib/model/types';

// Round-trip do .criativo (§12): exporta → importa → projeto equivalente, com ids
// regenerados (sem colisão) e assets regravados.

beforeEach(async () => {
  await db.projects.clear();
  await db.assets.clear();
});

async function seedProject() {
  const project = createProject({ name: 'Campanha X', now: 1000 });
  const asset: Asset = {
    id: 'asset-1',
    kind: 'raster',
    blob: new Blob([new Uint8Array([137, 80, 78, 71, 1, 2, 3, 4])], { type: 'image/png' }),
    mime: 'image/png',
    width: 100,
    height: 80,
    name: 'foto.png',
  };
  await db.assets.add(asset);
  const img = createImageLayer('4:5', 'asset-1', 'foto');
  const txt = createTextLayer('4:5', 'Olá');
  project.layouts['4:5'].layers.push(img, txt);
  project.assets.push('asset-1');
  await db.projects.add(project);
  return { project, asset };
}

describe('.criativo — export e import', () => {
  it('round-trip preserva conteúdo e regenera ids', async () => {
    const { project, asset } = await seedProject();
    const assets = await collectProjectAssets(project);
    expect(assets).toHaveLength(1);

    const file = await buildProjectFile(project, assets);
    expect(file.size).toBeGreaterThan(0);

    const imported = await importProjectFile(file);

    // ids novos, nome marcado, conteúdo igual
    expect(imported.id).not.toBe(project.id);
    expect(imported.name).toBe('Campanha X (importado)');
    expect(imported.layouts['4:5'].layers).toHaveLength(2);

    const importedImg = imported.layouts['4:5'].layers.find((l) => l.type === 'image')!;
    expect(importedImg.type === 'image' && importedImg.assetId).not.toBe('asset-1');

    // asset regravado com blob idêntico
    const newAssetId = importedImg.type === 'image' ? importedImg.assetId! : '';
    const stored = await db.assets.get(newAssetId);
    expect(stored?.mime).toBe('image/png');
    expect(stored?.width).toBe(asset.width);
    expect(new Uint8Array(await stored!.blob.arrayBuffer())).toEqual(
      new Uint8Array(await asset.blob.arrayBuffer()),
    );

    // projeto importado está no banco
    expect(await db.projects.get(imported.id)).toBeTruthy();
  });

  it('estimativa de tamanho soma json + blobs', async () => {
    const { project } = await seedProject();
    const assets = await collectProjectAssets(project);
    const estimate = estimateProjectFileSize(project, assets);
    expect(estimate).toBeGreaterThan(assets[0].blob.size);
  });

  it('arquivo inválido dá erro claro, não meia-importação', async () => {
    await expect(importProjectFile(new Blob(['não é zip']))).rejects.toThrow(/\.criativo válido/);
    expect(await db.projects.count()).toBe(0);
  });
});
