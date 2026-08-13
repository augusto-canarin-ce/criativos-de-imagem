import Dexie, { type EntityTable } from 'dexie';
import type { Asset, BrandKit, Project, Template } from '@/lib/model/types';

// Persistência local via Dexie (IndexedDB). SPEC §12.
//
// Projetos em JSON, imagens como Blob. Nada de projeto vai para localStorage —
// isso é reservado só a preferências pequenas (ver lib/store). Tabelas conforme a
// SPEC: projects, assets, brandKits, templates, settings.

// Registro de preferências/configurações (chave-valor). O modelo detalhado de
// settings evolui nas próximas fases; aqui é só o contêiner persistido.
export interface SettingsRecord {
  key: string;
  value: unknown;
}

// Contador de referências de asset, para coleta de lixo (SPEC §12). Populado a
// partir da Fase de imagens; declarado agora para não exigir bump de versão depois.
export interface AssetRefRecord {
  assetId: string;
  refCount: number;
}

export class CriativosDB extends Dexie {
  projects!: EntityTable<Project, 'id'>;
  assets!: EntityTable<Asset, 'id'>;
  brandKits!: EntityTable<BrandKit, 'id'>;
  templates!: EntityTable<Template, 'id'>;
  settings!: EntityTable<SettingsRecord, 'key'>;
  assetRefs!: EntityTable<AssetRefRecord, 'assetId'>;

  constructor() {
    super('criativos-de-imagem');
    // Só campos indexáveis vão no schema do Dexie; o resto do objeto é guardado
    // inteiro. `updatedAt` indexado para ordenar o dashboard por mais recente.
    this.version(1).stores({
      projects: 'id, name, updatedAt, createdAt',
      assets: 'id, kind, name',
      brandKits: 'id, name',
      templates: 'id, category, name',
      settings: 'key',
      assetRefs: 'assetId, refCount',
    });
    // v2: modelos perderam o campo `category` (índice nunca foi consultado).
    // Registros existentes ficam; só o índice morto é removido.
    this.version(2).stores({
      templates: 'id, name',
    });
  }
}

export const db = new CriativosDB();
