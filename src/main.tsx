import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
// Geist Sans empacotada no bundle (fontsource) — sem requisição externa,
// funciona offline. SPEC §3.
import '@fontsource/geist-sans/400.css';
import '@fontsource/geist-sans/500.css';
import '@fontsource/geist-sans/600.css';
import '@fontsource/geist-sans/700.css';
import './styles/index.css';

const root = document.getElementById('root');
if (!root) throw new Error('Elemento #root não encontrado.');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
