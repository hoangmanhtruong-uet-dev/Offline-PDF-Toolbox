import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';

import { net, protocol } from 'electron';

/**
 * Giao thức nội bộ `app://` để phục vụ giao diện.
 *
 * Vì sao không dùng `file://`:
 * Web Worker (pdf.js dùng worker để phân tích PDF) bị Chromium chặn khi
 * trang được nạp từ `file://`, vì nguồn gốc của trang là "null". Dùng giao
 * thức chuẩn `app://bundle/...` giữ nguyên `webSecurity: true` mà vẫn cho
 * worker, module và tài nguyên cục bộ hoạt động bình thường.
 */

/** Tên giao thức nội bộ. */
export const APP_SCHEME = 'app';

/** Host dùng cho giao diện. */
export const APP_HOST = 'bundle';

/**
 * Phải gọi trước khi ứng dụng sẵn sàng.
 */
export function registerAppScheme(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: APP_SCHEME,
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        corsEnabled: true,
        stream: true,
      },
    },
  ]);
}

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.cjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8',
  '.pdf': 'application/pdf',
};

/**
 * Cài handler phục vụ tài nguyên từ `rootDir`.
 *
 * @param rootDir Thư mục gốc của bản dựng giao diện.
 */
export function registerAppProtocolHandler(rootDir: string): void {
  const root = resolve(rootDir);

  protocol.handle(APP_SCHEME, async (request) => {
    const url = new URL(request.url);
    const relative = decodeURIComponent(url.pathname).replace(/^\/+/, '');
    const target = resolve(join(root, normalize(relative)));

    // Chặn truy cập ra ngoài thư mục gốc.
    if (target !== root && !target.startsWith(root + sep)) {
      return new Response('Not found', { status: 404 });
    }

    try {
      const data = await readFile(target);
      const mime = MIME_TYPES[extname(target).toLowerCase()] ?? 'application/octet-stream';
      return new Response(new Uint8Array(data), {
        status: 200,
        headers: {
          'content-type': mime,
          // Module worker luôn được nạp theo chế độ CORS, nên tài nguyên
          // phải cho phép nguồn gốc khác đọc. Đây vẫn là tài nguyên nội bộ
          // của ứng dụng, không phải tài nguyên mạng.
          'access-control-allow-origin': '*',
        },
      });
    } catch {
      return new Response('Not found', { status: 404 });
    }
  });
}

/** URL của trang giao diện trong bản đóng gói. */
export const APP_INDEX_URL = `${APP_SCHEME}://${APP_HOST}/index.html`;

/** Tải một tài nguyên qua giao thức nội bộ (dùng trong kiểm thử). */
export async function fetchAppResource(path: string): Promise<Response> {
  return net.fetch(`${APP_SCHEME}://${APP_HOST}/${path.replace(/^\/+/, '')}`);
}
