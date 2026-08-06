import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

// `base` vem por variável de ambiente para que o app funcione tanto na raiz de um
// domínio quanto em subdiretório (GitHub Pages). Padrão: './' (caminho relativo),
// que serve nas duas situações sem acoplar o build a nenhuma plataforma. SPEC §3.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    base: env.VITE_BASE ?? './',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  };
});
