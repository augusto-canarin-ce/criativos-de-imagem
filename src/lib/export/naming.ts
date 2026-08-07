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

export function exportFileName(
  projectName: string,
  formatId: FormatId,
  ext: 'png' | 'jpg',
  version = 1,
): string {
  return `${slugify(projectName)}_${formatDimensions(formatId)}_v${version}.${ext}`;
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
