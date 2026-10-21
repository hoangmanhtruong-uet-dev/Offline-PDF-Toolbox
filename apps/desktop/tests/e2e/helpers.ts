import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
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
export async function launchApp(
  options: { pro?: boolean } = {},
): Promise<{ app: ElectronApplication; page: Page }> {
  const app = await electron.launch({
    args: [APP_ROOT],
    env: {
      ...process.env,
      // Thư mục dữ liệu riêng cho kiểm thử, không ảnh hưởng cài đặt thật.
      ELECTRON_USER_DATA: `${APP_ROOT}\\.vite\\test-user-data`,
      // Bật giấy phép Pro giả cho các ca kiểm thử vượt giới hạn Free.
      ...(options.pro ? { OPTB_TEST_PRO: '1' } : {}),
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

/**
 * Thay thế hộp thoại chọn thư mục.
 *
 * Dùng để ghi kết quả ra thư mục tạm, khỏi làm bẩn thư mục tệp kiểm thử.
 */
export async function stubFolderDialog(app: ElectronApplication, folder: string): Promise<void> {
  await app.evaluate(async ({ dialog }, target) => {
    dialog.showOpenDialog = (async () => ({
      canceled: false,
      filePaths: [target],
    })) as typeof dialog.showOpenDialog;
  }, folder);
}

/** Thông tin từng trang của một tệp PDF. */
export interface PageInfo {
  /** Chiều rộng trang theo điểm ảnh. */
  width: number;
  /** Chiều cao trang theo điểm ảnh. */
  height: number;
  /** Góc xoay của trang theo độ. */
  rotate: number;
  /** Văn bản trích xuất được từ trang (rút gọn). */
  text: string;
}

/**
 * Đọc thông tin từng trang của một tệp PDF bằng PDF.js.
 *
 * Dùng để kiểm tra kết quả đầu ra: số trang, khổ giấy, góc xoay và văn bản
 * còn trích xuất được hay không.
 */
export async function readPdfPages(path: string): Promise<PageInfo[]> {
  const data = new Uint8Array(await readFile(path));
  const document = await getDocument({
    data,
    useSystemFonts: false,
    // Bộ phông chuẩn của PDF.js, cần để trích xuất được văn bản.
    standardFontDataUrl: pathToFileURL(
      join(APP_ROOT, 'node_modules', 'pdfjs-dist', 'standard_fonts'),
    ).href + '/',
  }).promise;

  const pages: PageInfo[] = [];
  for (let index = 1; index <= document.numPages; index += 1) {
    const page = await document.getPage(index);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();

    pages.push({
      width: Math.round(viewport.width),
      height: Math.round(viewport.height),
      rotate: page.rotate,
      text: content.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ')
        .trim(),
    });
  }

  await document.cleanup();
  return pages;
}
