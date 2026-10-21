import { resolve } from 'node:path';

import { defineConfig } from 'vite';

// Preload build. Output is pinned to `preload.cjs` (CommonJS) so it keeps
// working with `sandbox: true`, where the preload script has no Node access
// beyond the `electron` module.
export default defineConfig({
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'src/shared'),
    },
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      input: resolve(__dirname, 'src/preload/index.ts'),
      external: ['electron', 'electron/renderer'],
      output: {
        format: 'cjs',
        entryFileNames: 'preload.cjs',
        chunkFileNames: '[name].cjs',
        assetFileNames: '[name].[ext]',
      },
    },
  },
});
