import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { FormatId } from '@/lib/model/types';
import { exportFileName, zipFileName } from './naming';

// "Exportar os 3" (SPEC §11): um ZIP com os três formatos.
//   blackfriday-frete_2026-08-06.zip
//     blackfriday-frete_1080x1350_v1.jpg …

export interface ExportEntry {
  formatId: FormatId;
  blob: Blob;
}

export async function downloadZip(
  projectName: string,
  entries: ExportEntry[],
  ext: 'png' | 'jpg',
  version = 1,
): Promise<void> {
  const zip = new JSZip();
  for (const { formatId, blob } of entries) {
    zip.file(exportFileName(projectName, formatId, ext, version), blob);
  }
  const out = await zip.generateAsync({ type: 'blob' });
  saveAs(out, zipFileName(projectName, new Date()));
}

export function downloadBlob(blob: Blob, filename: string): void {
  saveAs(blob, filename);
}
