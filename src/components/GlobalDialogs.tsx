import { useEffect } from 'react';
import { useUi } from '@/lib/store/ui';
import { SettingsDialog } from '@/components/dialogs/SettingsDialog';
import { ShortcutsDialog } from '@/components/dialogs/ShortcutsDialog';

// Diálogos disponíveis em qualquer tela + os atalhos que os abrem (§14):
// `?` para atalhos, `Cmd+,` para configurações. Ficam fora do editor porque
// valem também no dashboard.

function isTyping(): boolean {
  const el = document.activeElement;
  return (
    !!el &&
    (el.tagName === 'INPUT' ||
      el.tagName === 'TEXTAREA' ||
      (el as HTMLElement).isContentEditable)
  );
}

export function GlobalDialogs() {
  const { settingsOpen, shortcutsOpen, setSettingsOpen, setShortcutsOpen } = useUi();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === ',') {
        e.preventDefault();
        setSettingsOpen(true);
        return;
      }
      if (!mod && e.key === '?' && !isTyping()) {
        e.preventDefault();
        setShortcutsOpen(true);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setSettingsOpen, setShortcutsOpen]);

  return (
    <>
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </>
  );
}
