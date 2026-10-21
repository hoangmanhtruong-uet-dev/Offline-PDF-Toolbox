import type { Session } from 'electron';

/**
 * Bộ lọc chặn mọi yêu cầu mạng.
 *
 * Đây là một trong bốn điểm kiểm soát offline (xem SECURITY-PRIVACY.md).
 * Ứng dụng không được phép gọi ra mạng khi xử lý tài liệu, nên mọi yêu cầu
 * mạng từ renderer và main đều bị chặn ở cấp session.
 *
 * Ngoại lệ duy nhất trong lúc phát triển: máy chủ Vite chạy trên localhost.
 */

/** Các giao thức nội bộ được phép. */
const ALLOWED_PROTOCOLS = new Set([
  'file:',
  'devtools:',
  'blob:',
  'data:',
  'about:',
  'chrome:',
  // Giao thức nội bộ phục vụ giao diện đóng gói (xem protocol.ts).
  'app:',
]);

/** Máy chủ cục bộ được phép ở chế độ phát triển. */
const DEV_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);

/**
 * Kiểm tra một URL có được phép hay không.
 *
 * @param isRelease `true` ở bản phát hành: mọi kết nối ra mạng đều bị chặn,
 *                  kể cả localhost.
 */
export function isRequestAllowed(url: string, isRelease: boolean): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  if (ALLOWED_PROTOCOLS.has(parsed.protocol)) return true;

  if (!isRelease && (parsed.protocol === 'http:' || parsed.protocol === 'ws:')) {
    return DEV_HOSTS.has(parsed.hostname);
  }

  return false;
}

/**
 * Cài bộ lọc chặn mạng cho một session.
 *
 * @param targetSession Session cần bảo vệ, mặc định là session chính.
 * @param allowLocalhost Cho phép kết nối tới máy chủ phát triển trên máy.
 */
export function installNetworkGuard(
  targetSession: Session,
  allowLocalhost: boolean,
  onBlocked?: (url: string) => void,
): void {
  targetSession.webRequest.onBeforeRequest((details, callback) => {
    const allowed = isRequestAllowed(details.url, !allowLocalhost);
    if (!allowed) onBlocked?.(details.url);
    callback({ cancel: !allowed });
  });
}
