import { resolve } from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Renderer build. The Electron Forge Vite plugin sets `root` to the project
// directory and `outDir` to `.vite/renderer/main_window`.
//
// We override both so that `index.html` ends up at the root of the renderer
// bundle (next to `assets/`). The packaged app serves this folder over the
// internal `app://` protocol, and the main process loads `app://bundle/index.html`.
export default defineConfig({
  root: resolve(__dirname, 'src/renderer'),
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'src/shared'),
      '@renderer': resolve(__dirname, 'src/renderer'),
    },
  },
  build: {
    outDir: resolve(__dirname, '.vite/renderer/main_window'),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'src/renderer/index.html'),
    },
  },
});
