import { _electron as electron } from 'playwright';
import type { ElectronApplication, Page } from 'playwright';

/**
 * Tiện ích dùng chung cho kiểm thử đầu-cuối.
 *
 * Ứng dụng được chạy từ thư mục dự án nên dùng đúng gói đã build ở
 * `.vite/build/main.cjs`, giống hệt bản phát hành (ngoại trừ việc dùng
 * giao thức `app://` thay cho `file://`).
 */

/** Thư mục ứng dụng điện tử. */
export const APP_ROOT = process.cwd();

/** Mở ứng dụng điện tử và trả về ứng dụng cùng trang đầu tiên. */
export async function launchApp(): Promise<{ app: ElectronApplication; page: Page }> {
  const app = await electron.launch({
    args: [APP_ROOT],
    env: {
      ...process.env,
      // Thư mục dữ liệu riêng cho kiểm thử, không ảnh hưởng cài đặt thật.
      ELECTRON_USER_DATA: `${APP_ROOT}\\.vite\\test-user-data`,
    },
  });

  const page = await app.firstWindow();
  await page.waitForLoadState('domcontentloaded');

  return { app, page };
}

/** Thu thập mọi yêu cầu mạng mà trang giao diện cố gắng gửi đi. */
export function trackNetworkRequests(page: Page): string[] {
  const requests: string[] = [];

  page.on('request', (request) => {
    const url = request.url();
    if (!url.startsWith('app://') && !url.startsWith('blob:') && !url.startsWith('data:')) {
      requests.push(url);
    }
  });

  return requests;
}

/** Đọc nội dung của một tệp kiểm thử. */
export function fixturePath(name: string): string {
  return `${APP_ROOT}\\tests\\fixtures\\${name}`;
}
