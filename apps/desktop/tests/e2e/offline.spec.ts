import { expect, test } from '@playwright/test';

import { launchApp, trackNetworkRequests } from './helpers';

/**
 * Ca kiểm thử T-09: ngắt mạng rồi chạy lần lượt mọi công cụ.
 *
 * Ứng dụng không được phát sinh bất kỳ yêu cầu mạng nào. Trong Electron,
 * việc chặn mạng được kiểm tra ở tầng tiến trình chính
 * (xem `src/main/services/networkGuard.ts`), nên bài kiểm thử này xác nhận
 * hai điều: không có yêu cầu mạng nào từ giao diện, và mọi thao tác xử lý
 * tài liệu vẫn chạy được.
 */
test.describe('Tính năng chạy hoàn toàn cục bộ (T-09)', () => {
  test('không phát sinh yêu cầu mạng nào khi mở ứng dụng', async () => {
    const { app, page } = await launchApp();
    const requests = trackNetworkRequests(page);

    try {
      await expect(page.getByTestId('tool-grid')).toBeVisible();
      await page.waitForTimeout(1500);

      expect(requests).toEqual([]);
    } finally {
      await app.close();
    }
  });

  test('mọi công cụ vẫn mở được khi không có mạng', async () => {
    const { app, page } = await launchApp();
    const requests = trackNetworkRequests(page);

    try {
      for (const tool of ['merge', 'split', 'compress', 'rotate', 'pages', 'images']) {
        await page.getByTestId(`tool-${tool}`).click();
        // Dấu hiệu offline nằm trên thanh trên của mọi màn hình công cụ.
        await expect(page.getByTestId('offline-badge')).toBeVisible();
        await page.goBack();
        await expect(page.getByTestId('tool-grid')).toBeVisible();
      }

      expect(requests).toEqual([]);
    } finally {
      await app.close();
    }
  });
});
