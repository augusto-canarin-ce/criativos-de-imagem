import type { FormatId } from '@/lib/model/types';
import { formatDimensions } from '@/config/formats';

// Nomenclatura de export (SPEC §11):
//   {projeto}_{formato}_v{n}.jpg  →  blackfriday-frete_1080x1350_v1.jpg
// ZIP dos três: {projeto}_{AAAA-MM-DD}.zip

/** Slug seguro para nome de arquivo: minúsculas, sem acentos, espaços viram
 *  hífen, sem símbolos. "Black Friday — frete grátis" → "black-friday-frete-gratis". */
export function slugify(name: string): string {
  const slug = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove diacríticos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'criativo';
}

/**
 * Nome do arquivo a partir do PADRÃO configurável (§11). Marcadores:
 * `{projeto}` `{formato}` `{n}`. Padrão de fábrica: `{projeto}_{formato}_v{n}`.
 */
export function applyExportPattern(
  pattern: string,
  projectName: string,
  formatId: FormatId,
  version: number,
): string {
  const filled = pattern
    .replaceAll('{projeto}', slugify(projectName))
    .replaceAll('{formato}', formatDimensions(formatId))
    .replaceAll('{n}', String(version));
  // Um padrão vazio ou só com símbolos não pode gerar arquivo sem nome.
  const cleaned = filled.replace(/[/\\:*?"<>|]/g, '-').trim();
  return cleaned || `${slugify(projectName)}_${formatDimensions(formatId)}_v${version}`;
}

export function exportFileName(
  projectName: string,
  formatId: FormatId,
  ext: 'png' | 'jpg',
  version = 1,
  pattern = '{projeto}_{formato}_v{n}',
): string {
  return `${applyExportPattern(pattern, projectName, formatId, version)}.${ext}`;
}

export function zipFileName(projectName: string, date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${slugify(projectName)}_${y}-${m}-${d}.zip`;
}

export function projectFileName(projectName: string): string {
  return `${slugify(projectName)}.criativo`;
}
