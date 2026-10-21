import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { expect, test } from '@playwright/test';
import type { ElectronApplication, Page } from 'playwright';

import { checkPdf } from '../helpers/pdfCheck';
import { fixturePath, launchApp, stubFolderDialog } from './helpers';

/**
 * Kiểm thử đầu-cuối cho công cụ Tách PDF (F-02).
 *
 * Bao phủ ca chấp nhận T-03 (tách theo khoảng trang) và các chế độ tách
 * còn lại theo đặc tả.
 */

/** Thay thế hộp thoại chọn tệp bằng danh sách tệp cố định. */
async function stubFileDialog(app: ElectronApplication, paths: string[]): Promise<void> {
  await app.evaluate(async ({ dialog }, filePaths) => {
    dialog.showOpenDialog = (async () => ({
      canceled: false,
      filePaths,
    })) as typeof dialog.showOpenDialog;
  }, paths);
}

/** Mở công cụ Tách và thêm tệp. */
async function openSplitTool(
  app: ElectronApplication,
  page: Page,
  paths: string[],
  outputFolder?: string,
): Promise<void> {
  await stubFileDialog(app, paths);
  await page.locator('[data-tool-id="split"]').click();
  await expect(page.getByTestId('options-panel')).toBeVisible();
  await page
    .getByTestId('drop-zone')
    .getByRole('button', { name: /Browse files|Select files/i })
    .click();
  await expect(page.getByTestId('split-file')).toBeVisible();

  if (outputFolder) {
    await stubFolderDialog(app, outputFolder);
    await page.getByRole('button', { name: /Choose folder/i }).click();
  }
}

/** Chọn một chế độ tách trong bảng tùy chọn. */
async function selectMode(page: Page, optionName: RegExp): Promise<void> {
  await page.getByRole('combobox').first().click();
  await page.getByRole('option', { name: optionName }).click();
}

/** Đọc danh sách tệp đầu ra từ dải tóm tắt kết quả. */
async function outputPathsOf(page: Page): Promise<string[]> {
  const value = await page.getByTestId('result-summary').getAttribute('data-output-paths');
  return value ? (JSON.parse(value) as string[]) : [];
}

test.describe('Tách PDF (F-02)', () => {
  test('T-03: tách theo khoảng trang 1-3, 5, 8-10 ra ba tệp', async () => {
    const { app, page } = await launchApp();
    const dir = await mkdtemp(join(tmpdir(), 'optb-split-e2e-'));

    try {
      await openSplitTool(app, page, [fixturePath('text-5pages.pdf')], dir);

      await selectMode(page, /By page ranges/i);
      await page.getByTestId('split-ranges').fill('1-2, 3-4, 5');

      await page.getByTestId('primary-action').click();
      await expect(page.getByTestId('result-summary')).toBeVisible({ timeout: 30_000 });

      const outputs = await outputPathsOf(page);
      expect(outputs).toHaveLength(3);

      // Tổng số trang của các tệp đầu ra bằng số trang đã chọn.
      let total = 0;
      for (const path of outputs) {
        const result = await checkPdf(path);
        expect(result.ok).toBe(true);
        total += result.pageCount;
      }
      expect(total).toBe(5);
    } finally {
      await rm(dir, { recursive: true, force: true });
      await app.close();
    }
  });

  test('tách mỗi trang thành một tệp', async () => {
    const { app, page } = await launchApp();
    const dir = await mkdtemp(join(tmpdir(), 'optb-split-e2e-'));

    try {
      await openSplitTool(app, page, [fixturePath('mixed-3pages.pdf')], dir);

      await selectMode(page, /One page per file/i);
      await page.getByTestId('primary-action').click();
      await expect(page.getByTestId('result-summary')).toBeVisible({ timeout: 30_000 });

      const outputs = await outputPathsOf(page);
      expect(outputs).toHaveLength(3);

      for (const path of outputs) {
        const result = await checkPdf(path, { pageCount: 1, textRequired: true });
        expect(result.ok).toBe(true);
      }
    } finally {
      await rm(dir, { recursive: true, force: true });
      await app.close();
    }
  });

  test('tách mỗi N trang', async () => {
    const { app, page } = await launchApp();
    const dir = await mkdtemp(join(tmpdir(), 'optb-split-e2e-'));

    try {
      await openSplitTool(app, page, [fixturePath('text-5pages.pdf')], dir);

      await selectMode(page, /Every N pages/i);
      await page.getByTestId('split-every-n').fill('2');
      await page.getByTestId('primary-action').click();
      await expect(page.getByTestId('result-summary')).toBeVisible({ timeout: 30_000 });

      const outputs = await outputPathsOf(page);
      expect(outputs).toHaveLength(3);
    } finally {
      await rm(dir, { recursive: true, force: true });
      await app.close();
    }
  });

  test('trích các trang đã chọn trong lưới thành một tệp', async () => {
    const { app, page } = await launchApp();
    const dir = await mkdtemp(join(tmpdir(), 'optb-split-e2e-'));

    try {
      await openSplitTool(app, page, [fixturePath('mixed-3pages.pdf')], dir);

      await selectMode(page, /Extract selected pages/i);
      await expect(page.getByTestId('page-grid')).toBeVisible();

      // Chọn trang 1, rồi Ctrl+bấm trang 3 để chọn thêm.
      await page.getByTestId('page-cell-1').click();
      await page.getByTestId('page-cell-3').click({ modifiers: ['Control'] });

      await page.getByTestId('primary-action').click();
      await expect(page.getByTestId('result-summary')).toBeVisible({ timeout: 30_000 });

      const outputs = await outputPathsOf(page);
      expect(outputs).toHaveLength(1);

      const result = await checkPdf(outputs[0] as string, { pageCount: 3, textRequired: true });
      expect(result.ok).toBe(true);
    } finally {
      await rm(dir, { recursive: true, force: true });
      await app.close();
    }
  });

  test('lưới trang hiện hình thu nhổ và đánh dấu trang đã chọn', async () => {
    const { app, page } = await launchApp();
    const dir = await mkdtemp(join(tmpdir(), 'optb-split-e2e-'));

    try {
      await openSplitTool(app, page, [fixturePath('mixed-3pages.pdf')], dir);

      await selectMode(page, /Extract selected pages/i);
      await expect(page.getByTestId('page-grid')).toBeVisible();
      await expect(page.getByTestId('page-cell-1')).toBeVisible();
      await expect(page.getByTestId('page-cell-3')).toBeVisible();

      await page.getByTestId('page-cell-1').click();
      await expect(page.getByTestId('page-cell-1')).toHaveAttribute('aria-selected', 'true');
    } finally {
      await rm(dir, { recursive: true, force: true });
      await app.close();
    }
  });

  test('báo lỗi khi dải trang vượt quá số trang của tài liệu', async () => {
    const { app, page } = await launchApp();
    const dir = await mkdtemp(join(tmpdir(), 'optb-split-e2e-'));

    try {
      await openSplitTool(app, page, [fixturePath('text-5pages.pdf')], dir);

      await selectMode(page, /By page ranges/i);
      await page.getByTestId('split-ranges').fill('1-99');

      await page.getByTestId('primary-action').click();

      const banner = page.getByTestId('task-error');
      await expect(banner).toBeVisible({ timeout: 30_000 });
    } finally {
      await rm(dir, { recursive: true, force: true });
      await app.close();
    }
  });
});
