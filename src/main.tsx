import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
// Fontes empacotadas no bundle (fontsource) — sem requisição externa, funciona
// offline. SPEC §3/§9. Geist Sans é a fonte da UI; a curadoria de anúncio vem de
// curated-imports (uma linha por família+peso de lib/fonts/curated.ts).
import '@fontsource/geist-sans/400.css';
import '@fontsource/geist-sans/500.css';
import '@fontsource/geist-sans/600.css';
import '@fontsource/geist-sans/700.css';
import '@/lib/fonts/curated-imports';
import './styles/index.css';

const root = document.getElementById('root');
if (!root) throw new Error('Elemento #root não encontrado.');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
