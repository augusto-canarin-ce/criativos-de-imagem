import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FormatId } from '@/lib/model/types';

// Preferências pequenas: tema, último formato usado, estado dos painéis. É o ÚNICO
// uso permitido de localStorage — dados de projeto vivem no IndexedDB. SPEC §4/§12.

export type Theme = 'dark' | 'light';

interface PreferencesState {
  theme: Theme;
  lastFormat: FormatId;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setLastFormat: (format: FormatId) => void;
}

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      theme: 'dark', // tema escuro é o padrão. SPEC §13.
      lastFormat: '4:5',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
      setLastFormat: (lastFormat) => set({ lastFormat }),
    }),
    { name: 'criativos:prefs' },
  ),
);

/** Aplica a classe .dark no <html> conforme o tema. Chamado no boot e a cada troca. */
export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
}
