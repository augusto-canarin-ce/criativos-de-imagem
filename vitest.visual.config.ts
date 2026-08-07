import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';

// Suíte de REGRESSÃO VISUAL (SPEC §16): renderiza a MESMA cena React do preview e
// do export (StageScene → LayerNode → shapes) em jsdom + node-canvas, exporta em
// tamanho real e compara pixel a pixel (pixelmatch, tolerância 0.1%) com as
// imagens de referência guardadas no repositório.
//
//   npm run test:visual          → compara com as referências
//   npm run test:visual:update   → regenera as referências (rode e revise o diff)

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/test/visual/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test/visual/setup.ts'],
    testTimeout: 30_000,
  },
});
