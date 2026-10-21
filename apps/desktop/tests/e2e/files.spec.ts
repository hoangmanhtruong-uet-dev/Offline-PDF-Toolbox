import { expect, test } from '@playwright/test';
import type { ElectronApplication, Page } from 'playwright';

import { fixturePath, launchApp } from './helpers';

/**
 * Kiểm thử luồng đọc tệp và dựng hình thu nhổ.
 *
 * Hộp thoại chọn tệp của hệ thống không thao tác được bằng Playwright, nên
 * bài kiểm thử thay thế `dialog.showOpenDialog` trong tiến trình chính rồi
 * bấm nút thật trong giao diện. Như vậy toàn bộ đường đi thật được kiểm tra:
 * IPC → đọc tệp → worker PDF.js → hình thu nhổ → danh sách.
 */

const FIXTURES = {
  onePage: fixturePath('text-1page.pdf'),
  threePages: fixturePath('mixed-3pages.pdf'),
  notPdf: fixturePath('broken-not-a-pdf.pdf'),
};

/** Thay thế hộp thoại chọn tệp bằng danh sách tệp cố định. */
async function stubFileDialog(app: ElectronApplication, paths: string[]): Promise<void> {
  await app.evaluate(async ({ dialog }, filePaths) => {
    dialog.showOpenDialog = (async () => ({
      canceled: false,
      filePaths,
    })) as typeof dialog.showOpenDialog;
  }, paths);
}

/** Mở công cụ Gộp và bấm nút chọn tệp. */
async function openMergeToolWithFiles(
  app: ElectronApplication,
  page: Page,
  paths: string[],
): Promise<void> {
  await stubFileDialog(app, paths);
  await page.getByTestId('tool-merge').click();
  await expect(page.getByTestId('options-panel')).toBeVisible();
  await page
    .getByTestId('drop-zone')
    .getByRole('button', { name: /Browse files|Select files/i })
    .click();
}

test.describe('Đọc tệp và dựng hình thu nhổ', () => {
  test('đọc số trang và dựng hình thu nhổ cho từng tệp', async () => {
    const { app, page } = await launchApp();

    try {
      await openMergeToolWithFiles(app, page, [FIXTURES.onePage, FIXTURES.threePages]);

      const rows = page.getByTestId('file-row');
      await expect(rows).toHaveCount(2);

      // Tệp một trang.
      await expect(rows.nth(0)).toContainText('text-1page.pdf');
      await expect(rows.nth(0)).toContainText('1 page');

      // Tệp ba trang.
      await expect(rows.nth(1)).toContainText('mixed-3pages.pdf');
      await expect(rows.nth(1)).toContainText('3 pages');

      // Hình thu nhổ trang đầu phải được dựng trong worker.
      const thumbnails = page.locator('[data-testid="file-row"] img');
      await expect(thumbnails).toHaveCount(2);
      await expect(thumbnails.first()).toHaveAttribute('src', /^blob:/);
    } finally {
      await app.close();
    }
  });

  test('báo lỗi rõ ràng khi tệp không phải PDF', async () => {
    const { app, page } = await launchApp();

    try {
      await openMergeToolWithFiles(app, page, [FIXTURES.notPdf]);

      const row = page.getByTestId('file-row').first();
      await expect(row).toContainText('broken-not-a-pdf.pdf');
      await expect(row).toContainText(/not a PDF|is not a PDF/i);
    } finally {
      await app.close();
    }
  });

  test('xóa tệp khỏi danh sách được', async () => {
    const { app, page } = await launchApp();

    try {
      await openMergeToolWithFiles(app, page, [FIXTURES.onePage]);
      await expect(page.getByTestId('file-row')).toHaveCount(1);

      await page.getByTestId('remove-text-1page.pdf').click();
      await expect(page.getByTestId('file-row')).toHaveCount(0);
    } finally {
      await app.close();
    }
  });

  test('đổi thứ tự tệp bằng nút di chuyển', async () => {
    const { app, page } = await launchApp();

    try {
      await openMergeToolWithFiles(app, page, [FIXTURES.onePage, FIXTURES.threePages]);

      const rows = page.getByTestId('file-row');
      await expect(rows.nth(0)).toContainText('text-1page.pdf');

      await rows.nth(1).getByRole('button', { name: /Move up/i }).click();

      await expect(rows.nth(0)).toContainText('mixed-3pages.pdf');
      await expect(rows.nth(1)).toContainText('text-1page.pdf');
    } finally {
      await app.close();
    }
  });
});
