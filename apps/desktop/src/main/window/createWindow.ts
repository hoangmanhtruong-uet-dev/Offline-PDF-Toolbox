import { join } from 'node:path';

import { BrowserWindow, shell } from 'electron';

import { APP_INDEX_URL } from '../protocol';

/**
 * Tạo cửa sổ chính.
 *
 * Bốn ràng buộc bảo mật bắt buộc (SECURITY-PRIVACY.md mục 2):
 * 1. `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`.
 * 2. CSP chỉ cho phép tài nguyên cục bộ (đặt trong trang HTML).
 * 3. Bộ lọc chặn mọi yêu cầu mạng ở cấp session (xem networkGuard.ts).
 * 4. Liên kết ngoài mở bằng trình duyệt hệ thống, không mở trong cửa sổ app.
 */

/**
 * URL của máy chủ Vite khi chạy ở chế độ phát triển.
 *
 * Electron Forge Vite plugin thay thế hằng số này lúc build. Kiểm tra bằng
 * `typeof` để an toàn khi biến không tồn tại ở bản đóng gói.
 */
export const DEV_SERVER_URL =
  typeof MAIN_WINDOW_VITE_DEV_SERVER_URL === 'string' &&
  MAIN_WINDOW_VITE_DEV_SERVER_URL.startsWith('http')
    ? MAIN_WINDOW_VITE_DEV_SERVER_URL
    : null;

/** Đang chạy ở chế độ phát triển hay không. */
export const IS_DEV = DEV_SERVER_URL !== null;

/** Thư mục giao diện trong bản đóng gói. */
export const RENDERER_ROOT = join(__dirname, '../renderer/main_window');

export function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1180,
    height: 780,
    minWidth: 900,
    minHeight: 600,
    show: false,
    title: 'Offline PDF Toolbox',
    backgroundColor: '#f4f4f6',
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      spellcheck: false,
    },
  });

  window.once('ready-to-show', () => {
    window.show();
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) {
      void shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  if (DEV_SERVER_URL) {
    void window.loadURL(DEV_SERVER_URL);
  } else {
    void window.loadURL(APP_INDEX_URL);
  }

  return window;
}
