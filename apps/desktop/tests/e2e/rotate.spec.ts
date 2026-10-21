import { copyFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { expect, test } from '@playwright/test';
import type { ElectronApplication, Page } from 'playwright';

import { fixturePath, launchApp, readPdfPages } from './helpers';

/**
 * Kiểm thử đầu-cuối cho công cụ Xoay PDF (F-04).
 *
 * Bao phủ ca chấp nhận T-06: chỉ những trang được chọn mới đổi hướng, và
 * xoay hai lần 90 độ cho kết quả giống xoay 180 độ.
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

/**
 * Chuẩn bị một bản sao của tệp nguồn trong thư mục tạm.
 *
 * Tệp đầu ra của thao tác xoay nằm cạnh tệp nguồn, nên dùng bản sao trong
 * thư mục tạm để không làm bẩn thư mục tệp kiểm thử.
 */
async function copySource(name: string, dir: string): Promise<string> {
  const target = join(dir, name);
  await copyFile(fixturePath(name), target);
  return target;
}

/** Mở công cụ Xoay và thêm tệp. */
async function openRotateTool(
  app: ElectronApplication,
  page: Page,
  paths: string[],
): Promise<void> {
  await stubFileDialog(app, paths);
  await page.locator('[data-tool-id="rotate"]').click();
  await expect(page.getByTestId('options-panel')).toBeVisible();
  await page
    .getByTestId('drop-zone')
    .getByRole('button', { name: /Browse files|Select files/i })
    .click();
}

async function outputPathOf(page: Page): Promise<string> {
  const value = await page.getByTestId('result-summary').getAttribute('data-output-path');
  expect(value).toBeTruthy();
  return value as string;
}

test.describe('Xoay PDF (F-04)', () => {
  test('T-06: chỉ trang 3 và 5 đổi hướng', async () => {
    const { app, page } = await launchApp();
    const dir = await mkdtemp(join(tmpdir(), 'optb-rotate-'));

    try {
      const source = await copySource('text-5pages.pdf', dir);
      await openRotateTool(app, page, [source]);
      await expect(page.getByTestId('rotate-file')).toBeVisible();

      // Chọn khoảng trang 3,5 và góc 90 độ.
      await page.getByRole('combobox').first().click();
      await page.getByRole('option', { name: /Page range/i }).click();
      await page.getByTestId('rotate-range').fill('3,5');

      await page.getByTestId('primary-action').click();
      await expect(page.getByTestId('result-summary')).toBeVisible({ timeout: 30_000 });

      const pages = await readPdfPages(await outputPathOf(page));
      expect(pages).toHaveLength(5);
      expect(pages.map((page) => page.rotate)).toEqual([0, 0, 90, 0, 90]);
    } finally {
      await rm(dir, { recursive: true, force: true });
      await app.close();
    }
  });

  test('T-06: xoay tất cả trang thì mọi trang cùng đổi hướng', async () => {
    const { app, page } = await launchApp();
    const dir = await mkdtemp(join(tmpdir(), 'optb-rotate-'));

    try {
      const source = await copySource('text-5pages.pdf', dir);
      await openRotateTool(app, page, [source]);
      await expect(page.getByTestId('rotate-file')).toBeVisible();

      await page.getByTestId('primary-action').click();
      await expect(page.getByTestId('result-summary')).toBeVisible({ timeout: 30_000 });

      const pages = await readPdfPages(await outputPathOf(page));
      expect(pages.map((page) => page.rotate)).toEqual([90, 90, 90, 90, 90]);
    } finally {
      await rm(dir, { recursive: true, force: true });
      await app.close();
    }
  });

  test('T-06: xoay thêm hai lần 90 độ cho kết quả giống xoay 180 độ', async () => {
    const { app, page } = await launchApp();
    const dir = await mkdtemp(join(tmpdir(), 'optb-rotate-'));

    try {
      const source = await copySource('text-5pages.pdf', dir);
      await openRotateTool(app, page, [source]);
      await expect(page.getByTestId('rotate-file')).toBeVisible();

      // Xoay 90 độ lần một.
      await page.getByTestId('primary-action').click();
      await expect(page.getByTestId('result-summary')).toBeVisible({ timeout: 30_000 });
      const once = await outputPathOf(page);

      // Đóng tóm tắt kết quả để trở lại thanh hành động.
      await page.getByRole('button', { name: /Keep working/i }).click();

      // Thay tệp đang xoay bằng chính tệp vừa tạo.
      await page.getByTestId('rotate-file').getByRole('button', { name: /Remove/i }).click();
      await expect(page.getByTestId('drop-zone')).toBeVisible();

      await stubFileDialog(app, [once]);
      await page
        .getByTestId('drop-zone')
        .getByRole('button', { name: /Browse files|Select files/i })
        .click();
      await expect(page.getByTestId('rotate-file')).toBeVisible();

      await page.getByTestId('primary-action').click();
      await expect(page.getByTestId('result-summary')).toBeVisible({ timeout: 30_000 });
      const twice = await outputPathOf(page);

      const pages = await readPdfPages(twice);
      expect(pages.map((page) => page.rotate)).toEqual([180, 180, 180, 180, 180]);
    } finally {
      await rm(dir, { recursive: true, force: true });
      await app.close();
    }
  });

  test('nội dung trang không thay đổi sau khi xoay', async () => {
    const { app, page } = await launchApp();
    const dir = await mkdtemp(join(tmpdir(), 'optb-rotate-'));

    try {
      const source = await copySource('text-5pages.pdf', dir);
      await openRotateTool(app, page, [source]);
      await expect(page.getByTestId('rotate-file')).toBeVisible();

      await page.getByTestId('primary-action').click();
      await expect(page.getByTestId('result-summary')).toBeVisible({ timeout: 30_000 });

      const sourcePages = await readPdfPages(source);
      const output = await readPdfPages(await outputPathOf(page));

      expect(output.map((page) => page.text)).toEqual(sourcePages.map((page) => page.text));
    } finally {
      await rm(dir, { recursive: true, force: true });
      await app.close();
    }
  });
});
