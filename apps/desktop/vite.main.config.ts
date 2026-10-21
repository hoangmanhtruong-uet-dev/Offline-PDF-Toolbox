import { resolve } from 'node:path';

import { defineConfig } from 'vite';

// Main process build. The Forge Vite plugin would emit `index.cjs` by default;
// we pin the name to `main.cjs` and reference it from package.json `main`.
export default defineConfig({
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'src/shared'),
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/main/index.ts'),
      formats: ['cjs'],
      fileName: () => 'main.cjs',
    },
    sourcemap: true,
    rollupOptions: {
      external: ['electron', 'electron/main'],
    },
  },
});
