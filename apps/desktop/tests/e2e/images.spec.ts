import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { expect, test } from '@playwright/test';
import type { ElectronApplication, Page } from 'playwright';

import { checkPdf } from '../helpers/pdfCheck';
import { fixturePath, launchApp } from './helpers';

/**
 * Kiểm thử đầu-cuối cho công cụ Ảnh sang PDF (F-06).
 *
 * Bao phủ: nhận ảnh PNG/JPG, sắp xếp thứ tự, chọn khổ giấy và lề, rồi xuất
 * ra tệp PDF với mỗi ảnh một trang.
 */

/** Thay thế hộp thoại chọn tệp. */
async function stubFileDialog(app: ElectronApplication, paths: string[]): Promise<void> {
  await app.evaluate(async ({ dialog }, filePaths) => {
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths });
  }, paths);
}

/** Mở công cụ Ảnh sang PDF và thêm ảnh. */
async function openImagesTool(
  app: ElectronApplication,
  page: Page,
  paths: string[],
): Promise<void> {
  await stubFileDialog(app, paths);
  await page.locator('[data-tool-id="images"]').click();
  await page.getByTestId('options-panel').waitFor();
  await page.getByTestId('drop-zone').getByRole('button', { name: /Browse files/i }).click();
  await page.getByTestId('image-item-1').waitFor({ timeout: 30_000 });
}

/** Kéo một ảnh sang vị trí khác. */
async function dragImage(page: Page, from: number, to: number): Promise<void> {
  await page.evaluate(
    ({ fromIndex, toIndex }) => {
      const source = document.querySelector(`[data-testid="image-item-${fromIndex}"]`);
      const target = document.querySelector(`[data-testid="image-item-${toIndex}"]`);
      if (!source || !target) throw new Error('khong tim thay anh');

      const dataTransfer = new DataTransfer();
      source.dispatchEvent(new DragEvent('dragstart', { dataTransfer, bubbles: true }));
      target.dispatchEvent(new DragEvent('dragover', { dataTransfer, bubbles: true }));
      target.dispatchEvent(new DragEvent('drop', { dataTransfer, bubbles: true }));
      source.dispatchEvent(new DragEvent('dragend', { dataTransfer, bubbles: true }));
    },
    { fromIndex: from, toIndex: to },
  );
}

test.describe('Ảnh sang PDF (F-06)', () => {
  test('nhận ảnh PNG và JPG, mỗi ảnh một trang', async () => {
    const { app, page } = await launchApp();
    const outDir = await mkdtemp(join(tmpdir(), 'optb-images-'));

    try {
      await openImagesTool(app, page, [
        fixturePath('photo-1.png'),
        fixturePath('photo-2.png'),
        fixturePath('photo-3.jpg'),
      ]);

      await expect(page.getByTestId('image-item-1')).toBeVisible();
      await expect(page.getByTestId('image-item-2')).toBeVisible();
      await expect(page.getByTestId('image-item-3')).toBeVisible();

      await page.getByTestId('output-name').fill('anh-cua-toi');
      await page.getByTestId('primary-action').click();
      await expect(page.getByTestId('result-summary')).toBeVisible({ timeout: 60_000 });

      const output = await page.getByTestId('result-summary').getAttribute('data-output-path');
      const result = await checkPdf(output as string, { pageCount: 3 });
      expect(result.ok).toBe(true);
    } finally {
      await rm(outDir, { recursive: true, force: true });
      await app.close();
    }
  });

  test('kéo thả đổi được thứ tự ảnh', async () => {
    const { app, page } = await launchApp();

    try {
      await openImagesTool(app, page, [
        fixturePath('photo-1.png'),
        fixturePath('photo-2.png'),
      ]);

      await dragImage(page, 1, 2);
      await page.waitForTimeout(300);

      await expect(page.getByTestId('image-item-1')).toContainText('photo-2.png');
      await expect(page.getByTestId('image-item-2')).toContainText('photo-1.png');
    } finally {
      await app.close();
    }
  });

  test('xoay được ảnh trước khi ghi', async () => {
    const { app, page } = await launchApp();

    try {
      await openImagesTool(app, page, [fixturePath('photo-1.png')]);

      await page.getByTestId('rotate-image-1').click();
      await page.waitForTimeout(300);

      await expect(page.getByTestId('image-item-1')).toContainText('90°');
    } finally {
      await app.close();
    }
  });

  test('chọn được cỡ giấy và lề', async () => {
    const { app, page } = await launchApp();

    try {
      await openImagesTool(app, page, [fixturePath('photo-1.png')]);

      // Chọn Letter thay vì A4.
      await page.getByRole('combobox').first().click();
      await page.getByRole('option', { name: /^Letter$/ }).click();

      // Chọn lề 0 mm.
      await page.getByRole('combobox').nth(1).click();
      await page.getByRole('option', { name: /No margin/i }).click();

      await page.getByTestId('output-name').fill('letter-khong-le');
      await page.getByTestId('primary-action').click();
      await expect(page.getByTestId('result-summary')).toBeVisible({ timeout: 60_000 });

      const output = await page.getByTestId('result-summary').getAttribute('data-output-path');
      const result = await checkPdf(output as string, { pageCount: 1 });

      expect(result.ok).toBe(true);
      // Khổ Letter: 612 x 792 điểm.
      expect(result.pages[0]?.width).toBe(612);
      expect(result.pages[0]?.height).toBe(792);
    } finally {
      await app.close();
    }
  });

  test('giới hạn Free chặn quá 3 ảnh', async () => {
    const { app, page } = await launchApp();

    try {
      // Thêm bốn ảnh một lượt, vượt giới hạn Free (3 ảnh).
      await openImagesTool(app, page, [
        fixturePath('photo-1.png'),
        fixturePath('photo-2.png'),
        fixturePath('photo-3.jpg'),
        fixturePath('photo-1.png'),
      ]);

      await expect(page.getByTestId('image-item-4')).toBeVisible();

      await page.getByTestId('primary-action').click();
      await expect(page.getByTestId('upsell-banner')).toBeVisible({ timeout: 15_000 });
    } finally {
      await app.close();
    }
  });
});
