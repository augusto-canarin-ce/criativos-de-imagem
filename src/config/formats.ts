import type { FormatDef, FormatId } from '@/lib/model/types';

// Os três formatos da Meta, e SÓ os três. SPEC §7.
//
// Todos têm 1080px de largura — só a altura muda. Isso é a fundação do sistema:
// a adaptação entre formatos é um problema puramente vertical. Não existe tela de
// "novo tamanho", campo de largura/altura ou id dinâmico. `FormatId` é uma união
// literal de três strings e o TypeScript garante que nenhum caminho do código
// precise lidar com um formato que não existe.
export const BUILTIN_FORMATS: FormatDef[] = [
  {
    id: '4:5',
    label: 'Feed Vertical',
    width: 1080,
    height: 1350,
    builtin: true,
    safeArea: { top: 80, right: 60, bottom: 80, left: 60 },
  },
  {
    id: '1:1',
    label: 'Feed Quadrado',
    width: 1080,
    height: 1080,
    builtin: true,
    safeArea: { top: 60, right: 60, bottom: 60, left: 60 },
  },
  {
    id: '9:16',
    label: 'Stories/Reels',
    width: 1080,
    height: 1920,
    builtin: true,
    safeArea: { top: 250, right: 60, bottom: 340, left: 60 },
  },
];

export const FORMAT_IDS: FormatId[] = ['4:5', '1:1', '9:16'];

export const DEFAULT_FORMAT: FormatId = '4:5';

const FORMAT_BY_ID: Record<FormatId, FormatDef> = {
  '4:5': BUILTIN_FORMATS[0],
  '1:1': BUILTIN_FORMATS[1],
  '9:16': BUILTIN_FORMATS[2],
};

export function getFormat(id: FormatId): FormatDef {
  return FORMAT_BY_ID[id];
}

/** Dimensões usadas na nomenclatura de export: "1080x1350". SPEC §11. */
export function formatDimensions(id: FormatId): string {
  const f = getFormat(id);
  return `${f.width}x${f.height}`;
}
