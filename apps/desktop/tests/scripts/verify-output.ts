/**
 * Kiểm tra kết quả đầu ra bằng tay.
 *
 * Dùng khi cần kiểm tra một tệp PDF cụ thể mà không chạy toàn bộ kiểm thử:
 *
 *   node tests/scripts/verify-output.ts <tep.pdf> [so-trang]
 *
 * Kiểm tra: tệp mở được, số trang, hướng trang và văn bản còn trích xuất
 * được hay không.
 */
import { basename } from 'node:path';

import { checkPdf } from '../helpers/pdfCheck';

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('dung: node tests/scripts/verify-output.ts <tep.pdf> [so-trang]');
    process.exitCode = 1;
    return;
  }

  const files = args.filter((arg) => !/^\d+$/.test(arg));
  const pageCountArg = args.find((arg) => /^\d+$/.test(arg));

  const expectations = pageCountArg
    ? { pageCount: Number.parseInt(pageCountArg, 10) }
    : {};

  let failed = 0;

  for (const file of files) {
    const result = await checkPdf(file, expectations);

    console.log(`\n${basename(file)}`);
    console.log(`  so trang: ${result.pageCount}`);
    console.log(`  dung luong: ${(result.sizeBytes / 1024).toFixed(1)} KB`);

    if (result.pages.length > 0) {
      const sizes = [...new Set(result.pages.map((page) => `${page.width}x${page.height}`))];
      console.log(`  kho giay: ${sizes.join(', ')}`);
      const rotations = [...new Set(result.pages.map((page) => page.rotate))];
      console.log(`  goc xoay: ${rotations.join(', ')}`);
      const withText = result.pages.filter((page) => page.text.length > 0).length;
      console.log(`  trang co van ban: ${withText}/${result.pages.length}`);
    }

    if (result.ok) {
      console.log('  -> dat');
    } else {
      failed += 1;
      console.log('  -> KHONG dat:');
      for (const problem of result.problems) console.log(`     - ${problem}`);
    }
  }

  process.exitCode = failed > 0 ? 1 : 0;
}

void main();
