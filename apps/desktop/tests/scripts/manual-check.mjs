/**
 * Kiểm thử thủ công sáu luồng công cụ trên ứng dụng thật.
 *
 * Chạy: `node tests/scripts/manual-check.mjs`
 *
 * Mỗi luồng được thao tác qua giao diện thật (chỉ thay thế hộp thoại chọn
 * tệp của hệ điều hành, vì hộp thoại đó không thao tác được tự động), rồi
 * kiểm tra tệp kết quả bằng qpdf.
 */
import { mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { _electron as electron } from 'playwright';

const APP_ROOT = process.cwd();
const QPDF = join(APP_ROOT, 'resources', 'qpdf', 'qpdf.exe');
const FIXTURES = join(APP_ROOT, 'tests', 'fixtures');

/** Kết quả của một luồng. */
const results = [];

/** Ghi kết quả một luồng. */
function report(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'DA' : 'KHONG'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

/** Chạy qpdf để lấy số trang. */
async function pageCount(path) {
  const { execFile } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const run = promisify(execFile);

  try {
    const { stdout } = await run(QPDF, ['--show-npages', path]);
    return Number.parseInt(stdout.trim(), 10);
  } catch {
    return null;
  }
}

/** Thay thế hộp thoại chọn tệp và thư mục. */
async function stubDialogs(app, files) {
  await app.evaluate(async ({ dialog }, filePaths) => {
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths });
  }, files);
}

/** Quay lại màn hình chính. */
async function goHome(page) {
  await page.evaluate(() => {
    window.location.hash = '#/';
  });
  await page.getByTestId('tool-grid').waitFor({ state: 'visible' });
}

/** Mở công cụ theo mã. */
async function openTool(page, toolId) {
  await page.locator(`[data-tool-id="${toolId}"]`).click();
  await page.getByTestId('options-panel').waitFor({ state: 'visible' });
}

async function main() {
  const workDir = await mkdtemp(join(tmpdir(), 'optb-manual-'));

  const app = await electron.launch({
    args: [APP_ROOT],
    env: { ...process.env, OPTB_TEST_PRO: '1' },
  });

  const page = await app.firstWindow();
  page.on('pageerror', (e) => console.log('PAGEERROR:', e.message.slice(0, 300)));
  page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE:', m.text().slice(0, 300)); });
  await page.waitForLoadState('domcontentloaded');
  await page.getByTestId('tool-grid').waitFor({ state: 'visible' });

  try {
    // --- 1. Gop ---
    {
      await stubDialogs(app, [
        join(FIXTURES, 'page-size-letter.pdf'),
        join(FIXTURES, 'page-size-a4.pdf'),
      ]);
      await openTool(page, 'merge');
      await page.getByTestId('drop-zone').getByRole('button', { name: /Browse files/i }).click();
      await page.getByTestId('file-row').first().waitFor();
      await page.getByTestId('primary-action').click();
      await page.getByTestId('result-summary').waitFor({ state: 'visible', timeout: 30_000 });

      const output = await page.getByTestId('result-summary').getAttribute('data-output-path');
      const pages = await pageCount(output);
      report('Gop PDF', pages === 2, `2 trang, kich thuoc ${((await stat(output)).size / 1024).toFixed(1)} KB`);
    }

    // --- 2. Tach ---
    {
      await goHome(page);
      await stubDialogs(app, [join(FIXTURES, 'text-5pages.pdf')]);
      await openTool(page, 'split');
      await page.getByTestId('drop-zone').getByRole('button', { name: /Browse files/i }).click();
      await page.getByTestId('split-file').waitFor();
      await page.getByTestId('split-ranges').fill('1-2, 4-5');
      await page.getByTestId('primary-action').click();
      await page.getByTestId('result-summary').waitFor({ state: 'visible', timeout: 30_000 });

      const output = await page.getByTestId('result-summary').getAttribute('data-output-paths');
      const list = JSON.parse(output ?? '[]');
      const pages = await Promise.all(list.map((file) => pageCount(file)));
      report(
        'Tach PDF',
        list.length === 2 && pages.every((p) => p === 2),
        `${list.length} tep, so trang ${pages.join(' + ')}`,
      );
    }

    // --- 3. Nen ---
    {
      await goHome(page);
      await stubDialogs(app, [join(FIXTURES, 'scan-jpeg-1page.pdf')]);
      await openTool(page, 'compress');
      await page.getByTestId('drop-zone').getByRole('button', { name: /Browse files/i }).click();
      await page.getByTestId('compress-file').waitFor();
      await page.getByTestId('compress-estimate').waitFor({ timeout: 30_000 });
      await page.getByTestId('primary-action').click();
      await page.getByTestId('result-summary').waitFor({ state: 'visible', timeout: 60_000 });

      const output = await page.getByTestId('result-summary').getAttribute('data-output-path');
      const before = (await stat(join(FIXTURES, 'scan-jpeg-1page.pdf'))).size;
      const after = (await stat(output)).size;
      const pages = await pageCount(output);
      report(
        'Nen PDF',
        after < before && pages === 1,
        `giam ${Math.round((1 - after / before) * 100)}%, van ${pages} trang`,
      );
    }

    // --- 4. Xoay ---
    {
      await goHome(page);
      await stubDialogs(app, [join(FIXTURES, 'text-5pages.pdf')]);
      await openTool(page, 'rotate');
      await page.getByTestId('drop-zone').getByRole('button', { name: /Browse files/i }).click();
      await page.getByTestId('rotate-file').waitFor();
      await page.getByRole('combobox').first().click();
      await page.getByRole('option', { name: /Page range/i }).click();
      await page.getByTestId('rotate-range').fill('3');
      await page.getByTestId('primary-action').click();
      await page.getByTestId('result-summary').waitFor({ state: 'visible', timeout: 30_000 });

      const output = await page.getByTestId('result-summary').getAttribute('data-output-path');
      const pages = await pageCount(output);
      report('Xoay PDF', pages === 5, `${pages} trang`);
    }

    // --- 5. Sap xep trang ---
    {
      await goHome(page);
      await stubDialogs(app, [join(FIXTURES, 'text-5pages.pdf')]);
      await page.locator('[data-tool-id="pages"]').click();
      const notice = await page.getByText(/arrives in the next update|sap co/i).count();
      const hasAction = await page.getByTestId('primary-action').count();
      report(
        'Sap xep trang',
        notice > 0 && hasAction === 0,
        notice > 0 ? 'hien thong bao "sap co" (chua trien khai o F-05)' : 'khong mong doi',
      );
    }

    // --- 6. Anh sang PDF ---
    {
      await goHome(page);
      await stubDialogs(app, [join(FIXTURES, 'text-5pages.pdf')]);
      await page.locator('[data-tool-id="images"]').click();
      const notice = await page.getByText(/arrives in the next update|sap co/i).count();
      const hasAction = await page.getByTestId('primary-action').count();
      report(
        'Anh sang PDF',
        notice > 0 && hasAction === 0,
        notice > 0 ? 'hien thong bao "sap co" (chua trien khai o F-06)' : 'khong mong doi',
      );
    }

    // --- 7. Cai dat ---
    {
      await page.goto(`${page.url().split('#')[0]}#/settings`);
      await page.getByRole('heading', { name: /Settings|Cài đặt/i }).waitFor({ timeout: 10_000 });
      const hasFolder = await page.getByText(/Default output folder|Thư mục lưu mặc định/i).count();
      const hasClear = await page.getByTestId('clear-history').count();
      report('Cai dat', hasFolder > 0 && hasClear > 0, 'co thu muc luu mac dinh va xoa lich su');
    }
  } finally {
    await app.close();
    await rm(workDir, { recursive: true, force: true });
  }

  const failed = results.filter((result) => !result.ok);
  console.log(`\n${results.length - failed.length}/${results.length} luong chay dung`);
  if (failed.length > 0) process.exitCode = 1;
}

await main();
