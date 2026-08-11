import { useSyncExternalStore } from 'react';

// Roteamento mínimo por hash, sem dependência. Quatro telas:
//   #/            landing pública (§13) — quem chega sem contexto
//   #/projetos    dashboard
//   #/p/:id       editor (o hash faz o reload reabrir o mesmo projeto)
//   #/rapido      modo guiado (§18); #/rapido/:id depois que o projeto existe

export type Route =
  | { name: 'landing' }
  | { name: 'dashboard' }
  | { name: 'editor'; projectId: string }
  | { name: 'guided'; projectId: string | null };

export function parseRoute(hash: string): Route {
  const m = /^#\/p\/([^/]+)$/.exec(hash);
  if (m) return { name: 'editor', projectId: decodeURIComponent(m[1]) };
  const r = /^#\/rapido(?:\/([^/]+))?\/?$/.exec(hash);
  if (r) return { name: 'guided', projectId: r[1] ? decodeURIComponent(r[1]) : null };
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
  return parseRoute(hash);
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

/** Sem id = passo 1 (escolher o modelo), que é antes de o projeto existir. */
export function goToGuided(projectId?: string): void {
  window.location.hash = projectId ? `#/rapido/${encodeURIComponent(projectId)}` : '#/rapido';
}
