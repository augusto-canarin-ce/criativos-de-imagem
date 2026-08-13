import { useEffect } from 'react';
import { Landing } from '@/components/landing/Landing';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { Editor } from '@/components/editor/Editor';
import { GuidedFlow } from '@/components/guided/GuidedFlow';
import { usePreferences, applyTheme } from '@/lib/store/preferences';
import { useRoute } from '@/lib/router';
import { migrateBrandKitRoles, ensureDefaultBrandKit } from '@/lib/db/brand';
import { GlobalDialogs } from '@/components/GlobalDialogs';

export function App() {
  const theme = usePreferences((s) => s.theme);
  const route = useRoute();

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    void navigator.storage?.persist?.();
    // Migração dos papéis padrão de cor (2026-08-12): kit antigo sem os cinco
    // ids tem as cores renomeadas e os tokens dos projetos reescritos. No-op
    // quando tudo já está íntegro.
    void migrateBrandKitRoles().catch((err) =>
      console.error('Migração dos papéis do brand kit falhou:', err),
    );
    // Kit padrão de fábrica (2026-08-13): semeia o "Conversao Extrema" se não
    // existir e estampa (uma vez só) os projetos antigos sem marca.
    void ensureDefaultBrandKit().catch((err) =>
      console.error('Semente do brand kit padrão falhou:', err),
    );
  }, []);

  return (
    <>
      {route.name === 'editor' ? (
        // key força remontar o editor ao trocar de projeto (limpa store/viewport).
        <Editor key={route.projectId} projectId={route.projectId} />
      ) : route.name === 'guided' ? (
        <GuidedFlow key={route.projectId ?? 'novo'} projectId={route.projectId} />
      ) : route.name === 'dashboard' ? (
        <Dashboard />
      ) : (
        <Landing />
      )}
      <GlobalDialogs />
    </>
  );
}
