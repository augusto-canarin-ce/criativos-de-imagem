import { useEffect } from 'react';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { usePreferences, applyTheme } from '@/lib/store/preferences';

export function App() {
  const theme = usePreferences((s) => s.theme);

  // Aplica o tema salvo no boot e pede persistência do armazenamento — não garante
  // nada, mas reduz a chance de o navegador limpar os dados sozinho. SPEC §12.
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    void navigator.storage?.persist?.();
  }, []);

  return <Dashboard />;
}
