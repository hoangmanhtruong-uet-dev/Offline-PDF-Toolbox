import { expect, test } from '@playwright/test';

import { launchApp } from './helpers';

/**
 * Kiểm thử đầu-cuối cơ bản của màn hình chính S-01.
 */
test.describe('Màn hình chính (S-01)', () => {
  test('mở ứng dụng và hiện đủ sáu ô công cụ', async () => {
    const { app, page } = await launchApp();

    try {
      await expect(page.getByTestId('tool-grid')).toBeVisible();
      await expect(page.getByTestId('tool-merge')).toBeVisible();
      await expect(page.getByTestId('tool-split')).toBeVisible();
      await expect(page.getByTestId('tool-compress')).toBeVisible();
      await expect(page.getByTestId('tool-rotate')).toBeVisible();
      await expect(page.getByTestId('tool-pages')).toBeVisible();
      await expect(page.getByTestId('tool-images')).toBeVisible();
    } finally {
      await app.close();
    }
  });

  test('hiện dấu hiệu "Xử lý trên máy bạn"', async () => {
    const { app, page } = await launchApp();

    try {
      await expect(page.getByTestId('offline-badge')).toBeVisible();
    } finally {
      await app.close();
    }
  });

  test('hiện vùng kéo thả tệp', async () => {
    const { app, page } = await launchApp();

    try {
      await expect(page.getByTestId('drop-zone')).toBeVisible();
    } finally {
      await app.close();
    }
  });

  test('điều hướng tới màn hình công cụ và quay lại được', async () => {
    const { app, page } = await launchApp();

    try {
      await page.getByTestId('tool-merge').click();
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
      await page.getByTestId('tool-merge').click();
      await expect(page.getByTestId('primary-action')).toBeVisible();
      await expect(page.getByTestId('primary-action')).toHaveCount(1);
    } finally {
      await app.close();
    }
  });
});
