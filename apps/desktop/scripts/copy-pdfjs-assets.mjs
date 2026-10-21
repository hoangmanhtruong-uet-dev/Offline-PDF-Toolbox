/**
 * Sao chép tài nguyên của PDF.js vào thư mục `public` của giao diện.
 *
 * PDF.js cần bộ phông chuẩn để vẽ chữ bằng font 14 chuẩn (Helvetica,
 * Times...). Thiếu bộ phông này, hình thu nhổ sẽ thiếu chữ.
 *
 * Chạy trước khi build: `node scripts/copy-pdfjs-assets.mjs`.
 */
import { cp, mkdir, rm } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(here, '..');
const source = resolve(packageRoot, '..', '..', 'node_modules', 'pdfjs-dist');
const target = join(packageRoot, 'src', 'renderer', 'public');

/** Các thư mục cần sao chép từ gói pdfjs-dist. */
const ASSETS = ['standard_fonts'];

async function main() {
  await mkdir(target, { recursive: true });

  for (const asset of ASSETS) {
    const from = join(source, asset);
    const to = join(target, asset);

    await rm(to, { recursive: true, force: true });
    await cp(from, to, { recursive: true });

    console.log(`da sao chep ${asset} vao ${to}`);
  }
}

void main();
