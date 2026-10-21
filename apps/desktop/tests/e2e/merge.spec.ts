import { copyFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { expect, test } from '@playwright/test';
import type { ElectronApplication, Page } from 'playwright';

import { fixturePath, launchApp, readPdfPages, stubFolderDialog } from './helpers';

/**
 * Kiểm thử đầu-cuối cho công cụ Gộp PDF (F-01).
 *
 * Bao phủ các ca chấp nhận: T-01 (đúng thứ tự và khổ giấy), T-02 (tệp hỏng),
 * T-07 (hủy tác vụ) và T-12 (tên tệp tiếng Việt).
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

/** Mở công cụ Gộp và thêm các tệp đã cho. */
async function openMergeTool(
  app: ElectronApplication,
  page: Page,
  paths: string[],
  outputFolder?: string,
): Promise<void> {
  await stubFileDialog(app, paths);
  await page.getByTestId('tool-merge').click();
  await expect(page.getByTestId('options-panel')).toBeVisible();
  await page
    .getByTestId('drop-zone')
    .getByRole('button', { name: /Browse files|Select files/i })
    .click();

  if (outputFolder) {
    await stubFolderDialog(app, outputFolder);
    await page.getByRole('button', { name: /Choose folder/i }).click();
  }
}

/** Đọc đường dẫn tệp đầu ra từ dải tóm tắt kết quả. */
async function outputPathOf(page: Page): Promise<string> {
  const value = await page.getByTestId('result-summary').getAttribute('data-output-path');
  expect(value).toBeTruthy();
  return value as string;
}

test.describe('Gộp PDF (F-01)', () => {
  test('T-01: gộp ba tệp khác khổ giấy theo đúng thứ tự đã sắp', async () => {
    // Gộp ba tệp vượt giới hạn Free (2 tệp), nên bật giấy phép Pro giả.
    const { app, page } = await launchApp({ pro: true });
    const outputDir = await mkdtemp(join(tmpdir(), 'optb-merge-out-'));

    try {
      await openMergeTool(
        app,
        page,
        [
          fixturePath('page-size-letter.pdf'),
          fixturePath('page-size-a4.pdf'),
          fixturePath('page-size-a3.pdf'),
        ],
        outputDir,
      );

      await expect(page.getByTestId('file-row')).toHaveCount(3);

      await page.getByTestId('primary-action').click();
      await expect(page.getByTestId('result-summary')).toBeVisible({ timeout: 30_000 });

      const output = await outputPathOf(page);
      const pages = await readPdfPages(output);

      expect(pages).toHaveLength(3);
      // Khổ giấy của từng trang phải khớp với tệp nguồn, theo thứ tự đã sắp.
      expect(pages[0]?.width).toBe(612);
      expect(pages[0]?.height).toBe(792);
      expect(pages[1]?.width).toBe(595);
      expect(pages[1]?.height).toBe(842);
      expect(pages[2]?.width).toBe(842);
      expect(pages[2]?.height).toBe(1191);
    } finally {
      await rm(outputDir, { recursive: true, force: true });
      await app.close();
    }
  });

  test('T-01: đổi thứ tự bằng nút di chuyển thay đổi thứ tự trang', async () => {
    const { app, page } = await launchApp();
    const outputDir = await mkdtemp(join(tmpdir(), 'optb-merge-out-'));

    try {
      await openMergeTool(
        app,
        page,
        [fixturePath('page-size-letter.pdf'), fixturePath('page-size-a4.pdf')],
        outputDir,
      );

      const rows = page.getByTestId('file-row');
      await expect(rows).toHaveCount(2);
      await expect(rows.nth(0)).toContainText('page-size-letter.pdf');

      await rows.nth(1).getByRole('button', { name: /Move up/i }).click();
      await expect(rows.nth(0)).toContainText('page-size-a4.pdf');

      await page.getByTestId('primary-action').click();
      await expect(page.getByTestId('result-summary')).toBeVisible({ timeout: 30_000 });

      const pages = await readPdfPages(await outputPathOf(page));
      expect(pages[0]?.width).toBe(595);
      expect(pages[1]?.width).toBe(612);
    } finally {
      await rm(outputDir, { recursive: true, force: true });
      await app.close();
    }
  });

  test('T-01: chỉ lấy các trang được chọn trong dải trang', async () => {
    const { app, page } = await launchApp();
    const outputDir = await mkdtemp(join(tmpdir(), 'optb-merge-out-'));

    try {
      await openMergeTool(app, page, [fixturePath('mixed-3pages.pdf')], outputDir);
      await expect(page.getByTestId('file-row')).toHaveCount(1);

      await page.getByTestId('range-mixed-3pages.pdf').fill('1-2');

      await page.getByTestId('primary-action').click();
      await expect(page.getByTestId('result-summary')).toBeVisible({ timeout: 30_000 });

      const pages = await readPdfPages(await outputPathOf(page));
      expect(pages).toHaveLength(2);
    } finally {
      await rm(outputDir, { recursive: true, force: true });
      await app.close();
    }
  });

  test('T-02: báo tệp hỏng và nêu đúng tên tệp', async () => {
    const { app, page } = await launchApp();
    const outputDir = await mkdtemp(join(tmpdir(), 'optb-merge-out-'));

    try {
      await openMergeTool(
        app,
        page,
        [fixturePath('text-1page.pdf'), fixturePath('broken-not-a-pdf.pdf')],
        outputDir,
      );

      await page.getByTestId('primary-action').click();

      const banner = page.getByTestId('task-error');
      await expect(banner).toBeVisible({ timeout: 30_000 });
      await expect(banner).toContainText('broken-not-a-pdf.pdf');
    } finally {
      await rm(outputDir, { recursive: true, force: true });
      await app.close();
    }
  });

  test('T-02: bỏ qua tệp hỏng thì vẫn gộp được các tệp còn lại', async () => {
    const { app, page } = await launchApp();
    const outputDir = await mkdtemp(join(tmpdir(), 'optb-merge-out-'));

    try {
      await openMergeTool(
        app,
        page,
        [fixturePath('text-1page.pdf'), fixturePath('broken-not-a-pdf.pdf')],
        outputDir,
      );

      await page.getByLabel(/Skip damaged files/i).check();
      await page.getByTestId('primary-action').click();

      await expect(page.getByTestId('result-summary')).toBeVisible({ timeout: 30_000 });

      const pages = await readPdfPages(await outputPathOf(page));
      expect(pages).toHaveLength(1);
    } finally {
      await rm(outputDir, { recursive: true, force: true });
      await app.close();
    }
  });

  test('T-12: đọc và ghi được tệp có tên tiếng Việt', async () => {
    const { app, page } = await launchApp();
    const outputDir = await mkdtemp(join(tmpdir(), 'optb-merge-out-'));

    try {
      await openMergeTool(app, page, [fixturePath('unicode-tiếng-việt.pdf')], outputDir);

      await expect(page.getByTestId('file-row').first()).toContainText('unicode');

      await page.getByTestId('primary-action').click();
      await expect(page.getByTestId('result-summary')).toBeVisible({ timeout: 30_000 });

      const pages = await readPdfPages(await outputPathOf(page));
      expect(pages).toHaveLength(1);
      expect(pages[0]?.text).toContain('Hop dong hop nhat');
    } finally {
      await rm(outputDir, { recursive: true, force: true });
      await app.close();
    }
  });

  test('giới hạn Free chặn gộp quá 2 tệp và nhắc nâng cấp', async () => {
    const { app, page } = await launchApp();
    const outputDir = await mkdtemp(join(tmpdir(), 'optb-merge-out-'));

    try {
      await openMergeTool(
        app,
        page,
        [
          fixturePath('text-1page.pdf'),
          fixturePath('text-5pages.pdf'),
          fixturePath('mixed-3pages.pdf'),
        ],
        outputDir,
      );

      await page.getByTestId('primary-action').click();

      // Dải nhắc nâng cấp xuất hiện, tác vụ không chạy.
      await expect(page.getByTestId('upsell-banner')).toBeVisible({ timeout: 15_000 });
      await expect(page.getByTestId('result-summary')).toHaveCount(0);

      // Danh sách tệp người dùng đã chọn không bị mất.
      await expect(page.getByTestId('file-row')).toHaveCount(3);
    } finally {
      await rm(outputDir, { recursive: true, force: true });
      await app.close();
    }
  });

  test('T-07: hủy tác vụ đang chạy thì dừng và không để lại tệp tạm', async () => {
    const { app, page } = await launchApp({ pro: true });
    const workDir = await mkdtemp(join(tmpdir(), 'optb-cancel-'));
    const outputDir = await mkdtemp(join(tmpdir(), 'optb-merge-out-'));

    // Tạo nhiều bản sao để thao tác gộp đủ lâu để kịp bấm Hủy.
    const copies: string[] = [];
    for (let index = 0; index < 25; index += 1) {
      const target = join(workDir, `ban-sao-${index}.pdf`);
      await copyFile(fixturePath('text-5pages.pdf'), target);
      copies.push(target);
    }

    try {
      await openMergeTool(app, page, copies, outputDir);
      await expect(page.getByTestId('file-row')).toHaveCount(25);

      await page.getByTestId('primary-action').click();
      await page.getByRole('button', { name: /Cancel/i }).click();

      // Ứng dụng phải trở lại trạng thái sẵn sàng và không treo.
      await expect(page.getByTestId('primary-action')).toBeEnabled({ timeout: 30_000 });

      // Thư mục tạm của tác vụ phải được dọn sạch.
      const { readdir } = await import('node:fs/promises');
      const tempRoot = join(tmpdir(), 'offline-pdf-toolbox');
      const leftovers = await readdir(tempRoot).catch(() => [] as string[]);
      expect(leftovers).toHaveLength(0);
    } finally {
      await rm(workDir, { recursive: true, force: true });
      await rm(outputDir, { recursive: true, force: true });
      await app.close();
    }
  });
});
