import { resolve } from 'node:path';

import { defineConfig } from 'vite';

/**
 * Cấu hình Vite cho các script chạy bằng `vite-node` ngoài kiểm thử.
 *
 * Cần khai báo lại bí danh `@shared` vì `vite-node` không đọc cấu hình của
 * Vitest.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'src/shared'),
    },
  },
});
