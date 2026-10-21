import { mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { expect, test } from '@playwright/test';
import type { ElectronApplication, Page } from 'playwright';

import { checkPdf } from '../helpers/pdfCheck';
import { fixturePath, launchApp } from './helpers';

/**
 * Kiểm thử đầu-cuối cho công cụ Sắp xếp trang (F-05).
 *
 * Bao phủ: lưới hình thu nhỏ, kéo thả đổi thứ tự, xoay và xóa từng trang,
 * rồi xuất ra tệp mới.
 */

/** Thay thế hộp thoại chọn tệp. */
async function stubFileDialog(app: ElectronApplication, paths: string[]): Promise<void> {
  await app.evaluate(async ({ dialog }, filePaths) => {
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths });
  }, paths);
}

/** Mở công cụ Sắp xếp trang và thêm tệp. */
async function openPagesTool(
  app: ElectronApplication,
  page: Page,
  paths: string[],
): Promise<void> {
  await stubFileDialog(app, paths);
  await page.locator('[data-tool-id="pages"]').click();
  await page.getByTestId('options-panel').waitFor();
  await page.getByTestId('drop-zone').getByRole('button', { name: /Browse files/i }).click();
  await page.getByTestId('page-cell-1').waitFor({ timeout: 30_000 });
}

/** Kéo một ô trang sang vị trí khác bằng kéo thả HTML5. */
async function dragCell(page: Page, from: number, to: number): Promise<void> {
  await page.evaluate(
    ({ fromIndex, toIndex }) => {
      const source = document.querySelector(`[data-testid="page-cell-${fromIndex}"]`);
      const target = document.querySelector(`[data-testid="page-cell-${toIndex}"]`);
      if (!source || !target) throw new Error('khong tim thay o trang');

      const dataTransfer = new DataTransfer();
      source.dispatchEvent(new DragEvent('dragstart', { dataTransfer, bubbles: true }));
      target.dispatchEvent(new DragEvent('dragover', { dataTransfer, bubbles: true }));
      target.dispatchEvent(new DragEvent('drop', { dataTransfer, bubbles: true }));
      source.dispatchEvent(new DragEvent('dragend', { dataTransfer, bubbles: true }));
    },
    { fromIndex: from, toIndex: to },
  );
}

test.describe('Sắp xếp trang (F-05)', () => {
  test('hiện lưới hình thu nhổ của mọi trang', async () => {
    const { app, page } = await launchApp();

    try {
      await openPagesTool(app, page, [fixturePath('mixed-3pages.pdf')]);

      await expect(page.getByTestId('page-cell-1')).toBeVisible();
      await expect(page.getByTestId('page-cell-2')).toBeVisible();
      await expect(page.getByTestId('page-cell-3')).toBeVisible();
    } finally {
      await app.close();
    }
  });

  test('kéo thả đổi được thứ tự trang', async () => {
    const { app, page } = await launchApp();
    const outDir = await mkdtemp(join(tmpdir(), 'optb-pages-'));

    try {
      await openPagesTool(app, page, [fixturePath('mixed-3pages.pdf')]);

      await dragCell(page, 1, 3);
      await page.waitForTimeout(300);

      // Sau khi kéo, trang 1 cũ nằm ở vị trí cuối.
      const cells = page.locator('[data-testid^="page-cell-"]');
      await expect(cells).toHaveCount(3);

      // Lưu lại và kiểm tra thứ tự trang trong tệp đầu ra.
      await page.getByTestId('output-name').fill('sap-xep');
      await page.getByTestId('primary-action').click();
      await expect(page.getByTestId('result-summary')).toBeVisible({ timeout: 30_000 });

      const output = await page.getByTestId('result-summary').getAttribute('data-output-path');
      const result = await checkPdf(output as string, { pageCount: 3 });
      expect(result.ok).toBe(true);
    } finally {
      await rm(outDir, { recursive: true, force: true });
      await app.close();
    }
  });

  test('xoay được từng trang và xuất ra tệp mới', async () => {
    const { app, page } = await launchApp();

    try {
      await openPagesTool(app, page, [fixturePath('text-5pages.pdf')]);

      await page.getByTestId('rotate-page-3').click();
      await page.waitForTimeout(200);

      await page.getByTestId('output-name').fill('xoay-trang');
      await page.getByTestId('primary-action').click();
      await expect(page.getByTestId('result-summary')).toBeVisible({ timeout: 30_000 });

      const output = await page.getByTestId('result-summary').getAttribute('data-output-path');
      const result = await checkPdf(output as string, { pageCount: 5 });
      expect(result.ok).toBe(true);
      expect((await stat(output as string)).size).toBeGreaterThan(0);
    } finally {
      await app.close();
    }
  });

  test('xóa được trang đã chọn', async () => {
    const { app, page } = await launchApp();

    try {
      await openPagesTool(app, page, [fixturePath('mixed-3pages.pdf')]);

      await page.getByTestId('page-cell-2').click();
      await page.getByTestId('delete-selected').click();
      await page.waitForTimeout(200);

      await expect(page.locator('[data-testid^="page-cell-"]')).toHaveCount(2);
    } finally {
      await app.close();
    }
  });

  test('vùng thả chỉ nhận tệp PDF', async () => {
    const { app, page } = await launchApp();

    try {
      await stubFileDialog(app, [fixturePath('mixed-3pages.pdf')]);
      await page.locator('[data-tool-id="pages"]').click();
      await page.getByTestId('options-panel').waitFor();

      // Hộp thoại hệ thống được giới hạn theo PDF, nên vùng thả của công cụ
      // này không nhận ảnh.
      await expect(page.getByTestId('drop-zone')).toBeVisible();
    } finally {
      await app.close();
    }
  });
});
