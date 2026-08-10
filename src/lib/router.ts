import { useSyncExternalStore } from 'react';

// Roteamento mínimo por hash, sem dependência. Três telas:
//   #/            landing pública (§13) — quem chega sem contexto
//   #/projetos    dashboard
//   #/p/:id       editor (o hash faz o reload reabrir o mesmo projeto)

export type Route =
  | { name: 'landing' }
  | { name: 'dashboard' }
  | { name: 'editor'; projectId: string };

function parse(hash: string): Route {
  const m = /^#\/p\/([^/]+)$/.exec(hash);
  if (m) return { name: 'editor', projectId: decodeURIComponent(m[1]) };
  if (/^#\/projetos\/?$/.test(hash)) return { name: 'dashboard' };
  return { name: 'landing' };
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
  window.location.hash = '#/projetos';
}

export function goToLanding(): void {
  window.location.hash = '#/';
}
