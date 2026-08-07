import { useSyncExternalStore } from 'react';

// Roteamento mínimo por hash, sem dependência. Duas telas: dashboard e editor.
// Usar hash faz o reload reabrir o mesmo projeto (essencial p/ o aceite da Fase 1).

export type Route = { name: 'dashboard' } | { name: 'editor'; projectId: string };

function parse(hash: string): Route {
  const m = /^#\/p\/([^/]+)$/.exec(hash);
  if (m) return { name: 'editor', projectId: decodeURIComponent(m[1]) };
  return { name: 'dashboard' };
}

function subscribe(cb: () => void): () => void {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
}

export function useRoute(): Route {
  const hash = useSyncExternalStore(
    subscribe,
    () => window.location.hash,
    () => '',
  );
  return parse(hash);
}

export function goToEditor(projectId: string): void {
  window.location.hash = `#/p/${encodeURIComponent(projectId)}`;
}

export function goToDashboard(): void {
  window.location.hash = '#/';
}
