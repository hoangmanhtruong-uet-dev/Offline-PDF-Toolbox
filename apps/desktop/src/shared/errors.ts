import type { ErrorCode, ErrorPayload } from './types';

/**
 * Phân loại lỗi và ánh xạ sang khoá chuỗi i18n.
 *
 * Nguyên tắc: thông báo cho người dùng luôn nói về việc họ cần làm,
 * không phải về hệ thống. Mã lỗi ổn định để đối chiếu khi hỗ trợ.
 */

export const ERROR_CODES = [
  'E_AUTH',
  'E_STRUCT',
  'E_PARSE',
  'E_FORMAT',
  'E_SIGNED',
  'E_DISK',
  'E_PERM',
  'E_PATH',
  'E_UNKNOWN',
] as const satisfies readonly ErrorCode[];

const MESSAGE_KEYS: Record<ErrorCode, string> = {
  E_AUTH: 'errors.needsPassword',
  E_STRUCT: 'errors.recovered',
  E_PARSE: 'errors.unreadable',
  E_FORMAT: 'errors.notPdf',
  E_SIGNED: 'errors.signature',
  E_DISK: 'errors.diskFull',
  E_PERM: 'errors.noPermission',
  E_PATH: 'errors.badPath',
  E_UNKNOWN: 'errors.unknown',
};

/** Lỗi có mã ổn định, dùng nội bộ trong tiến trình chính. */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly detail?: string;

  constructor(code: ErrorCode, message?: string, detail?: string) {
    super(message ?? code);
    this.name = 'AppError';
    this.code = code;
    this.detail = detail;
  }
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && typeof (error as NodeJS.ErrnoException).code === 'string';
}

/** Đoán mã lỗi từ lỗi hệ thống hoặc lỗi không xác định. */
export function classifyError(error: unknown): ErrorCode {
  if (error instanceof AppError) return error.code;

  if (isNodeError(error)) {
    switch (error.code) {
      case 'ENOSPC':
        return 'E_DISK';
      case 'EACCES':
      case 'EPERM':
        return 'E_PERM';
      case 'ENOENT':
      case 'ENAMETOOLONG':
        return 'E_PATH';
      default:
        break;
    }
  }

  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  if (message.includes('password') || message.includes('encrypted')) return 'E_AUTH';
  if (message.includes('signature') || message.includes('signed')) return 'E_SIGNED';
  if (message.includes('no space')) return 'E_DISK';
  if (message.includes('permission') || message.includes('denied')) return 'E_PERM';
  if (message.includes('not a pdf') || message.includes('%pdf')) return 'E_FORMAT';

  return 'E_UNKNOWN';
}

/** Chuyển lỗi bất kỳ thành payload an toàn để gửi sang renderer. */
export function toErrorPayload(error: unknown): ErrorPayload {
  const code = classifyError(error);
  const detail =
    error instanceof AppError
      ? error.detail
      : error instanceof Error
        ? error.message
        : String(error);

  return {
    code,
    messageKey: MESSAGE_KEYS[code],
    detail,
  };
}

/** Khoá chuỗi i18n của một mã lỗi. */
export function errorMessageKey(code: ErrorCode): string {
  return MESSAGE_KEYS[code];
}
