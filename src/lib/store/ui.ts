import { create } from 'zustand';

// Diálogos globais (configurações e atalhos): abertos de qualquer tela — editor,
// dashboard ou por atalho de teclado. Fora do histórico e da persistência.

interface UiState {
  settingsOpen: boolean;
  shortcutsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  setShortcutsOpen: (open: boolean) => void;
}

export const useUi = create<UiState>((set) => ({
  settingsOpen: false,
  shortcutsOpen: false,
  setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
  setShortcutsOpen: (shortcutsOpen) => set({ shortcutsOpen }),
}));
