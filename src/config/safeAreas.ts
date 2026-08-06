import type { FormatId, SafeArea } from '@/lib/model/types';
import { getFormat } from './formats';

// Safe zones. SPEC §7.
//
// A Meta muda a interface dos apps com frequência; tratar esses números como
// verdade eterna envelhece mal. Por isso as safe zones são editáveis nas
// configurações — os valores de fábrica ficam aqui como ponto de partida, e um
// segundo perfil do 9:16 atende quem anuncia sobretudo em Reels (a interface cobre
// bem mais da base e da lateral direita).

export type SafeAreaProfileId = 'default' | '9:16-reels';

export interface SafeAreaProfile {
  id: SafeAreaProfileId;
  label: string;
  appliesTo: FormatId;
  safeArea: SafeArea;
}

/** Perfil alternativo do 9:16 para quem foca em Reels. SPEC §7. */
export const SAFE_AREA_PROFILES: SafeAreaProfile[] = [
  {
    id: '9:16-reels',
    label: 'Stories/Reels — perfil Reels',
    appliesTo: '9:16',
    safeArea: { top: 280, right: 140, bottom: 500, left: 60 },
  },
];

/**
 * Safe area efetiva de um formato. Recebe os overrides do usuário (guardados em
 * settings) e cai para o valor de fábrica quando não há override.
 */
export function resolveSafeArea(
  formatId: FormatId,
  overrides?: Partial<Record<FormatId, SafeArea>>,
): SafeArea {
  return overrides?.[formatId] ?? getFormat(formatId).safeArea;
}
