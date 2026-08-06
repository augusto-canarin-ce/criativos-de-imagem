import type { Project } from './types';
import { projectSchema } from './schema';

// Versionamento de schema desde o primeiro commit. SPEC §6/§16.
//
// O app salva o projeto na máquina do usuário; qualquer mudança incompatível no
// formato precisa de uma migração aqui, senão o trabalho dele quebra ao abrir uma
// versão nova. Cada entrada de `migrations` leva um projeto da versão N para N+1.

export const CURRENT_SCHEMA_VERSION = 1;

// Um projeto lido do disco pode estar em qualquer versão anterior; tratamos como
// `unknown` e migramos passo a passo até a atual.
type RawProject = Record<string, unknown>;

// migrations[N] transforma um projeto da versão N na versão N+1.
// Vazio hoje (só existe a v1); a primeira migração real entra quando o schema mudar.
const migrations: Record<number, (p: RawProject) => RawProject> = {
  // 1: (p) => ({ ...p, schemaVersion: 2, /* novo campo */ }),
};

export class SchemaMigrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SchemaMigrationError';
  }
}

/**
 * Recebe um projeto cru (de import ou do IndexedDB), aplica todas as migrações
 * necessárias e valida o resultado contra o schema atual. Lança em dado corrompido
 * ou versão do futuro (arquivo salvo por uma versão mais nova do app).
 */
export function migrateProject(raw: unknown): Project {
  if (typeof raw !== 'object' || raw === null) {
    throw new SchemaMigrationError('Projeto inválido: não é um objeto.');
  }

  let data = { ...(raw as RawProject) };
  let version = typeof data.schemaVersion === 'number' ? data.schemaVersion : 0;

  if (version > CURRENT_SCHEMA_VERSION) {
    throw new SchemaMigrationError(
      `Este projeto foi salvo por uma versão mais nova do app (formato ${version}). ` +
        `Atualize o app para abri-lo.`,
    );
  }

  while (version < CURRENT_SCHEMA_VERSION) {
    const step = migrations[version];
    if (!step) {
      throw new SchemaMigrationError(
        `Não há migração do formato ${version} para ${version + 1}.`,
      );
    }
    data = step(data);
    version = typeof data.schemaVersion === 'number' ? data.schemaVersion : version + 1;
  }

  const parsed = projectSchema.safeParse(data);
  if (!parsed.success) {
    throw new SchemaMigrationError(
      `Projeto não passou na validação após migração: ${parsed.error.message}`,
    );
  }
  return parsed.data;
}
