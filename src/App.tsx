import { useEffect } from 'react';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { Editor } from '@/components/editor/Editor';
import { usePreferences, applyTheme } from '@/lib/store/preferences';
import { useRoute } from '@/lib/router';

export function App() {
  const theme = usePreferences((s) => s.theme);
  const route = useRoute();

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    void navigator.storage?.persist?.();
  }, []);

  if (route.name === 'editor') {
    // key força remontar o editor ao trocar de projeto (limpa store/viewport).
    return <Editor key={route.projectId} projectId={route.projectId} />;
  }
  return <Dashboard />;
}
