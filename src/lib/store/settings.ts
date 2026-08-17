import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FormatId, SafeArea } from '@/lib/model/types';
import { getFormat } from '@/config/formats';
import { SAFE_AREA_PROFILES } from '@/config/safeAreas';

// Configurações do app. Preferências pequenas → localStorage (§4: o ÚNICO uso
// permitido; projeto vive no IndexedDB).
//
// SAFE ZONES EDITÁVEIS (§7): "a Meta muda a interface dos apps com frequência;
// tratar esses números como verdade eterna envelhece mal". O usuário ajusta e o
// motor de adaptação, o overlay e o checklist passam a usar os valores dele.

export interface SettingsState {
  /** Overrides por formato; ausente = valor de fábrica. */
  safeAreas: Partial<Record<FormatId, SafeArea>>;
  /** Nomenclatura do export (§11), com {projeto} {formato} {v}. */
  exportPattern: string;
  /** Qualidade JPG padrão (0–100); o diálogo continua podendo sobrescrever. */
  jpgQuality: number;

  setSafeArea: (formatId: FormatId, safeArea: SafeArea | null) => void;
  applyReelsProfile: () => void;
  setExportPattern: (pattern: string) => void;
  setJpgQuality: (q: number) => void;
  resetAll: () => void;
}

export const DEFAULT_EXPORT_PATTERN = '{projeto}_{formato}_v{n}';

/** Qualidade JPG de fábrica. Neste valor o export usa a escada de fallback do
 *  `encodeJpg` (que só desce se o arquivo passar dos 30MB da Meta); qualquer
 *  outro valor é escolha explícita do usuário e vale como está. */
export const DEFAULT_JPG_QUALITY = 95;

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      safeAreas: {},
      exportPattern: DEFAULT_EXPORT_PATTERN,
      jpgQuality: DEFAULT_JPG_QUALITY,

      setSafeArea: (formatId, safeArea) =>
        set((s) => {
          const next = { ...s.safeAreas };
          if (safeArea) next[formatId] = safeArea;
          else delete next[formatId];
          return { safeAreas: next };
        }),

      applyReelsProfile: () =>
        set((s) => {
          const profile = SAFE_AREA_PROFILES.find((p) => p.id === '9:16-reels');
          if (!profile) return s;
          return { safeAreas: { ...s.safeAreas, [profile.appliesTo]: profile.safeArea } };
        }),

      setExportPattern: (exportPattern) => set({ exportPattern }),
      setJpgQuality: (jpgQuality) => set({ jpgQuality }),
      resetAll: () =>
        set({ safeAreas: {}, exportPattern: DEFAULT_EXPORT_PATTERN, jpgQuality: DEFAULT_JPG_QUALITY }),
    }),
    { name: 'criativos:settings' },
  ),
);

/**
 * Safe area EFETIVA de um formato — override do usuário ou valor de fábrica.
 * Versão não reativa: o motor de adaptação e o checklist rodam fora do React.
 */
export function effectiveSafeArea(formatId: FormatId): SafeArea {
  return useSettings.getState().safeAreas[formatId] ?? getFormat(formatId).safeArea;
}

/** Formato com a safe area efetiva aplicada — o que o render e o motor usam. */
export function formatWithSafeArea(formatId: FormatId) {
  const format = getFormat(formatId);
  const safeArea = effectiveSafeArea(formatId);
  return safeArea === format.safeArea ? format : { ...format, safeArea };
}
