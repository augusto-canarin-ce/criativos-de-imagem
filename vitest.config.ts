import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    // A suíte visual roda à parte (vitest.visual.config.ts): precisa de jsdom +
    // node-canvas e compara imagens de referência.
    exclude: ['**/node_modules/**', 'src/test/visual/**'],
  },
});
