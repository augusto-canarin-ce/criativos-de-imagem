import { useEffect } from 'react';
import { Landing } from '@/components/landing/Landing';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { Editor } from '@/components/editor/Editor';
import { usePreferences, applyTheme } from '@/lib/store/preferences';
import { useRoute } from '@/lib/router';
import { GlobalDialogs } from '@/components/GlobalDialogs';

export function App() {
  const theme = usePreferences((s) => s.theme);
  const route = useRoute();

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    void navigator.storage?.persist?.();
  }, []);

  return (
    <>
      {route.name === 'editor' ? (
        // key força remontar o editor ao trocar de projeto (limpa store/viewport).
        <Editor key={route.projectId} projectId={route.projectId} />
      ) : route.name === 'dashboard' ? (
        <Dashboard />
      ) : (
        <Landing />
      )}
      <GlobalDialogs />
    </>
  );
}
