import { mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { expect, test } from '@playwright/test';
import type { ElectronApplication, Page } from 'playwright';

import { checkPdf } from '../helpers/pdfCheck';
import { fixturePath, launchApp, stubFolderDialog } from './helpers';

/**
 * Kiểm thử đầu-cuối cho công cụ Nén PDF (F-03).
 *
 * Bao phủ ca chấp nhận T-04 (nén tệp scan) và T-05 (báo "đã được tối ưu").
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

/** Mở công cụ Nén và thêm tệp. */
async function openCompressTool(
  app: ElectronApplication,
  page: Page,
  paths: string[],
  outputFolder?: string,
): Promise<void> {
  await stubFileDialog(app, paths);
  await page.locator('[data-tool-id="compress"]').click();
  await expect(page.getByTestId('options-panel')).toBeVisible();
  await page
    .getByTestId('drop-zone')
    .getByRole('button', { name: /Browse files|Select files/i })
    .click();
  await expect(page.getByTestId('compress-file')).toBeVisible();

  if (outputFolder) {
    await stubFolderDialog(app, outputFolder);
    await page.getByRole('button', { name: /Choose folder/i }).click();
  }
}

async function outputPathOf(page: Page): Promise<string> {
  const value = await page.getByTestId('result-summary').getAttribute('data-output-path');
  expect(value).toBeTruthy();
  return value as string;
}

test.describe('Nén PDF (F-03)', () => {
  test('T-04: nén tệp scan ở mức Vừa, tệp nhỏ lại đáng kể', async () => {
    const { app, page } = await launchApp();
    const dir = await mkdtemp(join(tmpdir(), 'optb-compress-e2e-'));

    try {
      await openCompressTool(app, page, [fixturePath('scan-jpeg-1page.pdf')], dir);

      // Ứng dụng hiện ước lượng trước khi chạy.
      await expect(page.getByTestId('compress-estimate')).toBeVisible({ timeout: 30_000 });

      await page.getByTestId('primary-action').click();
      await expect(page.getByTestId('result-summary')).toBeVisible({ timeout: 60_000 });

      const output = await outputPathOf(page);
      const before = (await stat(fixturePath('scan-jpeg-1page.pdf'))).size;
      const after = (await stat(output)).size;

      expect(after).toBeLessThan(before);
      // Mục tiêu của đặc tả cho tệp scan ở mức Vừa: giảm từ 50% trở lên.
      expect(1 - after / before).toBeGreaterThanOrEqual(0.5);

      // Tệp đầu ra phải hợp lệ, giữ nguyên số trang.
      const result = await checkPdf(output, { pageCount: 1 });
      expect(result.ok).toBe(true);
    } finally {
      await rm(dir, { recursive: true, force: true });
      await app.close();
    }
  });

  test('T-04: nén ở mức Mạnh cho tệp nhỏ hơn mức Vừa', async () => {
    // Mức Mạnh là tính năng Pro, nên bật giấy phép Pro giả.
    const { app, page } = await launchApp({ pro: true });
    const dir = await mkdtemp(join(tmpdir(), 'optb-compress-e2e-'));

    try {
      await openCompressTool(app, page, [fixturePath('scan-jpeg-1page.pdf')], dir);
      await expect(page.getByTestId('compress-estimate')).toBeVisible({ timeout: 30_000 });

      await page.getByRole('combobox').first().click();
      await page.getByRole('option', { name: /^Strong$/ }).click();

      await page.getByTestId('primary-action').click();
      await expect(page.getByTestId('result-summary')).toBeVisible({ timeout: 60_000 });

      const strong = await outputPathOf(page);
      expect((await stat(strong)).size).toBeLessThan((await stat(fixturePath('scan-jpeg-1page.pdf'))).size);
      expect((await checkPdf(strong, { pageCount: 1 })).ok).toBe(true);
    } finally {
      await rm(dir, { recursive: true, force: true });
      await app.close();
    }
  });

  test('T-05: báo "đã được tối ưu" khi nén lại tệp đã nén', async () => {
    const { app, page } = await launchApp();
    const dir = await mkdtemp(join(tmpdir(), 'optb-compress-e2e-'));

    try {
      await openCompressTool(app, page, [fixturePath('scan-jpeg-1page.pdf')], dir);
      await expect(page.getByTestId('compress-estimate')).toBeVisible({ timeout: 30_000 });

      // Nén lần một.
      await page.getByTestId('primary-action').click();
      await expect(page.getByTestId('result-summary')).toBeVisible({ timeout: 60_000 });
      const once = await outputPathOf(page);

      // Đóng kết quả, nén lại chính tệp vừa tạo.
      await page.getByRole('button', { name: /Keep working/i }).click();
      await page.getByTestId('compress-file').getByRole('button', { name: /Remove/i }).click();
      await expect(page.getByTestId('drop-zone')).toBeVisible();

      await stubFileDialog(app, [once]);
      await page
        .getByTestId('drop-zone')
        .getByRole('button', { name: /Browse files|Select files/i })
        .click();
      await expect(page.getByTestId('compress-file')).toBeVisible();

      await page.getByTestId('primary-action').click();

      const banner = page.getByTestId('task-error');
      await expect(banner).toBeVisible({ timeout: 60_000 });
    } finally {
      await rm(dir, { recursive: true, force: true });
      await app.close();
    }
  });

  test('dung lượng đích: nén cho tới khi tệp vừa yêu cầu', async () => {
    const { app, page } = await launchApp({ pro: true });
    const dir = await mkdtemp(join(tmpdir(), 'optb-compress-e2e-'));

    try {
      await openCompressTool(app, page, [fixturePath('scan-jpeg-1page.pdf')], dir);

      // Bật chế độ dung lượng đích.
      await page.getByTestId('compress-target-toggle').click();
      await page.getByTestId('compress-target-size').fill('0.3');
      await page.getByTestId('compress-target-size').blur();

      await page.getByTestId('primary-action').click();
      await expect(page.getByTestId('result-summary')).toBeVisible({ timeout: 60_000 });

      const output = await outputPathOf(page);
      expect((await stat(output)).size).toBeLessThanOrEqual(0.3 * 1024 * 1024);
    } finally {
      await rm(dir, { recursive: true, force: true });
      await app.close();
    }
  });

  test('bảng kết quả hiện dung lượng trước, sau và phần trăm giảm', async () => {
    const { app, page } = await launchApp();
    const dir = await mkdtemp(join(tmpdir(), 'optb-compress-e2e-'));

    try {
      await openCompressTool(app, page, [fixturePath('scan-jpeg-1page.pdf')], dir);
      await expect(page.getByTestId('compress-estimate')).toBeVisible({ timeout: 30_000 });

      await page.getByTestId('primary-action').click();
      await expect(page.getByTestId('result-summary')).toBeVisible({ timeout: 60_000 });

      const table = page.getByTestId('compress-result-table');
      await expect(table).toBeVisible();
      await expect(table).toContainText('90%');
    } finally {
      await rm(dir, { recursive: true, force: true });
      await app.close();
    }
  });

  test('mức Mạnh là tính năng Pro nên bản Free bị chặn', async () => {
    const { app, page } = await launchApp();
    const dir = await mkdtemp(join(tmpdir(), 'optb-compress-e2e-'));

    try {
      await openCompressTool(app, page, [fixturePath('scan-jpeg-1page.pdf')], dir);
      await expect(page.getByTestId('compress-estimate')).toBeVisible({ timeout: 30_000 });

      await page.getByRole('combobox').first().click();
      await page.getByRole('option', { name: /^Strong$/ }).click();

      await page.getByTestId('primary-action').click();

      // Dải nhắc nâng cấp xuất hiện, tác vụ không chạy.
      await expect(page.getByTestId('upsell-banner')).toBeVisible({ timeout: 15_000 });
      await expect(page.getByTestId('result-summary')).toHaveCount(0);
    } finally {
      await rm(dir, { recursive: true, force: true });
      await app.close();
    }
  });
});
