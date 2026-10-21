import { spawn } from 'node:child_process';
import { join } from 'node:path';

import { AppError } from '@shared/errors';

/**
 * Bọc tiến trình con `qpdf`.
 *
 * Quy tắc bắt buộc (ARCHITECTURE.md mục 6):
 * - Luôn gọi bằng `spawn` với mảng tham số, **không** dùng `shell: true` và
 *   không nối chuỗi lệnh — tránh chuyển chuỗi lệnh và tránh lộ đường dẫn.
 * - Nạp qpdf từ `resources/qpdf/` đóng kèm, không từ PATH.
 * - Mật khẩu truyền bằng `--password-file` (tệp tạm), không truyền trên dòng
 *   lệnh để không bị lộ trong danh sách tiến trình của máy.
 * - Không nạp tệp PDF vào bộ nhớ JavaScript: qpdf làm việc trực tiếp với tệp.
 */

/** Kết quả chạy qpdf. */
export interface QpdfResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

/** Mã thoát của qpdf. */
export const QPDF_EXIT_OK = 0;
export const QPDF_EXIT_ERROR = 2;
export const QPDF_EXIT_WARNING = 3;

export class QpdfRunner {
  constructor(readonly binaryPath: string) {}

  /**
   * Đường dẫn tới qpdf trong gói ứng dụng.
   *
   * Ở chế độ phát triển, `appPath` là thư mục `apps/desktop`; ở bản đóng gói,
   * đó là thư mục chứa tệp thực thi.
   */
  static resolveBinaryPath(appPath: string): string {
    return join(appPath, 'resources', 'qpdf', 'qpdf.exe');
  }

  /** Kiểm tra qpdf có tồn tại không. */
  async isAvailable(): Promise<boolean> {
    const { access } = await import('node:fs/promises');
    try {
      await access(this.binaryPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Chạy qpdf với các tham số đã cho.
   *
   * @param args Mảng tham số, truyền nguyên vẹn cho qpdf.
   * @param options `signal` để hủy giữa chừng.
   */
  async run(args: string[], options: { signal?: AbortSignal } = {}): Promise<QpdfResult> {
    if (options.signal?.aborted) {
      throw new AppError('E_UNKNOWN', 'Tac vu da bi huy truoc khi bat dau');
    }

    return new Promise<QpdfResult>((resolvePromise, rejectPromise) => {
      const child = spawn(this.binaryPath, args, {
        shell: false,
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      child.stdout.setEncoding('utf8');
      child.stdout.on('data', (chunk: string) => {
        stdout += chunk;
      });
      child.stderr.setEncoding('utf8');
      child.stderr.on('data', (chunk: string) => {
        stderr += chunk;
      });

      const onAbort = (): void => {
        child.kill();
      };
      options.signal?.addEventListener('abort', onAbort, { once: true });

      child.on('error', (error) => {
        options.signal?.removeEventListener('abort', onAbort);
        rejectPromise(
          new AppError(
            'E_UNKNOWN',
            'Khong chay duoc qpdf',
            error instanceof Error ? error.message : String(error),
          ),
        );
      });

      child.on('close', (code, signal) => {
        options.signal?.removeEventListener('abort', onAbort);
        if (options.signal?.aborted) {
          rejectPromise(new AppError('E_UNKNOWN', 'Tac vu da bi huy'));
          return;
        }
        resolvePromise({
          exitCode: code ?? (signal ? 1 : 0),
          stdout,
          stderr,
        });
      });
    });
  }

  /** Chạy qpdf và ném lỗi nếu qpdf báo lỗi. */
  async runOrThrow(args: string[], options: { signal?: AbortSignal } = {}): Promise<QpdfResult> {
    const result = await this.run(args, options);

    if (result.exitCode === QPDF_EXIT_OK || result.exitCode === QPDF_EXIT_WARNING) {
      return result;
    }

    throw new AppError(
      'E_STRUCT',
      'qpdf bao loi',
      result.stderr.trim() || result.stdout.trim() || `ma thoat ${result.exitCode}`,
    );
  }

  /** Kiểm tra cấu trúc một tệp PDF. Trả về true nếu không có lỗi. */
  async check(filePath: string, options: { signal?: AbortSignal } = {}): Promise<boolean> {
    const result = await this.run(['--check', filePath], options);
    return result.exitCode === QPDF_EXIT_OK;
  }

  /** Lấy số trang của một tệp PDF. */
  async pageCount(
    filePath: string,
    options: { signal?: AbortSignal; passwordFile?: string } = {},
  ): Promise<number> {
    const args = ['--show-npages'];
    if (options.passwordFile) args.push(`--password-file=${options.passwordFile}`);
    args.push(filePath);

    const result = await this.runOrThrow(args, options);
    const count = Number.parseInt(result.stdout.trim(), 10);
    if (!Number.isFinite(count)) {
      throw new AppError('E_STRUCT', 'Khong doc duoc so trang');
    }
    return count;
  }
}
