import { expect, test } from '@playwright/test';

import { launchApp } from './helpers';

/**
 * Kiểm thử đầu-cuối của màn hình chính S-01 sau khi thiết kế lại.
 */
test.describe('Màn hình chính (S-01)', () => {
  test('hiện lưới 3x2 gồm sáu thẻ công cụ, không hiện mã tính năng', async () => {
    const { app, page } = await launchApp();

    try {
      await expect(page.getByTestId('tool-grid')).toBeVisible();

      const cards = page.getByTestId('tool-card');
      await expect(cards).toHaveCount(6);

      // Ba cột trên mỗi hàng.
      const grid = page.getByTestId('tool-grid');
      const columns = await grid.evaluate(
        (element) => getComputedStyle(element).gridTemplateColumns.split(' ').length,
      );
      expect(columns).toBe(3);

      // Mã tính năng F-01 … F-06 không được lộ ra giao diện.
      await expect(page.getByText('F-01')).toHaveCount(0);
      await expect(page.getByText('F-06')).toHaveCount(0);

      // Mỗi thẻ có tên và mô tả.
      await expect(cards.first()).toContainText('Merge PDF');
      await expect(cards.first()).toContainText('Combine several PDFs into one file');
    } finally {
      await app.close();
    }
  });

  test('mỗi thẻ công cụ có thể kích hoạt bằng bàn phím', async () => {
    const { app, page } = await launchApp();

    try {
      const first = page.getByTestId('tool-card').first();
      await first.focus();
      await expect(first).toBeFocused();

      await page.keyboard.press('Enter');
      await expect(page.getByTestId('options-panel')).toBeVisible();
    } finally {
      await app.close();
    }
  });

  test('hiện dấu hiệu "Xử lý trên máy bạn" cạnh tiêu đề', async () => {
    const { app, page } = await launchApp();

    try {
      await expect(page.getByTestId('offline-badge')).toBeVisible();

      const badge = page.getByTestId('offline-badge');
      const heading = page.getByRole('heading', { level: 1 });

      // Dấu hiệu nằm cùng hàng với tiêu đề.
      const badgeBox = await badge.boundingBox();
      const headingBox = await heading.boundingBox();
      expect(badgeBox).not.toBeNull();
      expect(headingBox).not.toBeNull();

      const badgeCenter = (badgeBox?.y ?? 0) + (badgeBox?.height ?? 0) / 2;
      const headingCenter = (headingBox?.y ?? 0) + (headingBox?.height ?? 0) / 2;
      expect(Math.abs(badgeCenter - headingCenter)).toBeLessThan(12);
    } finally {
      await app.close();
    }
  });

  test('phím tắt Ctrl+1 mở công cụ đầu tiên', async () => {
    const { app, page } = await launchApp();

    try {
      await expect(page.getByTestId('tool-grid')).toBeVisible();
      await page.keyboard.press('Control+1');
      await expect(page.getByTestId('options-panel')).toBeVisible();

      await page.goBack();
      await page.keyboard.press('Control+4');
      await expect(page.getByTestId('options-panel')).toBeVisible();
    } finally {
      await app.close();
    }
  });

  test('phím tắt Ctrl+, mở màn hình Cài đặt', async () => {
    const { app, page } = await launchApp();

    try {
      await expect(page.getByTestId('tool-grid')).toBeVisible();
      await page.keyboard.press('Control+,');
      await expect(page.getByRole('heading', { name: /Settings|Cài đặt/i })).toBeVisible();
    } finally {
      await app.close();
    }
  });

  test('danh sách tệp gần đây luôn hiện, có trạng thái rỗng khi chưa có tệp', async () => {
    const { app, page } = await launchApp();

    try {
      await expect(page.getByTestId('recent-files')).toBeVisible();

      // Nếu danh sách rỗng thì phải có thông báo trạng thái rỗng.
      const rows = page.locator('[data-testid^="recent-row-"]');
      if ((await rows.count()) === 0) {
        await expect(page.getByTestId('recent-empty')).toBeVisible();
      }
    } finally {
      await app.close();
    }
  });

  test('điều hướng tới màn hình công cụ và quay lại được', async () => {
    const { app, page } = await launchApp();

    try {
      await page.getByTestId('tool-card').first().click();
      await expect(page.getByTestId('options-panel')).toBeVisible();
      await expect(page.getByTestId('offline-badge')).toBeVisible();

      await page.goBack();
      await expect(page.getByTestId('tool-grid')).toBeVisible();
    } finally {
      await app.close();
    }
  });

  test('màn hình công cụ có đúng một nút hành động chính', async () => {
    const { app, page } = await launchApp();

    try {
      await page.getByTestId('tool-card').first().click();
      await expect(page.getByTestId('primary-action')).toBeVisible();
      await expect(page.getByTestId('primary-action')).toHaveCount(1);
    } finally {
      await app.close();
    }
  });
});
