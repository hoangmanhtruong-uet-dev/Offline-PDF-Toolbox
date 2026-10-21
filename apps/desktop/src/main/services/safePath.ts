import { access, readdir } from 'node:fs/promises';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';

import { AppError } from '@shared/errors';
import { sanitizeFileName } from '@shared/naming';

/**
 * Làm sạch đường dẫn đầu ra.
 *
 * Vệ tinh bắt buộc cho đường dẫn (SECURITY-PRIVACY.md mục 3):
 * - Chặn `..`, ký tự điều khiển và tên thiết bị đặc biệt của Windows.
 * - Kết quả phải nằm trong thư mục đích.
 * - Không bao giờ ghi đè tệp đã tồn tại.
 */

/** Đường dẫn tuyệt đối nằm trong `dir` hay không. */
export function isInsideDirectory(target: string, dir: string): boolean {
  const rel = relative(resolve(dir), resolve(target));
  if (rel.length === 0) return true;
  if (rel.startsWith('..')) return false;
  return !isAbsolute(rel);
}

/**
 * Dựng đường dẫn đầu ra an toàn trong `dir`.
 *
 * @throws {AppError} với mã `E_PATH` khi đường dẫn không hợp lệ.
 */
export function resolveOutputPath(dir: string, fileName: string): string {
  const safeName = sanitizeFileName(fileName);
  const target = resolve(join(dir, safeName));

  if (!isInsideDirectory(target, dir)) {
    throw new AppError('E_PATH', 'Duong dan ket qua khong nam trong thu muc dich');
  }

  return target;
}

/**
 * Dựng đường dẫn đầu ra không bao giờ ghi đè tệp đã tồn tại.
 *
 * Nếu tên đã có, thêm hậu tố số: `hop-dong.pdf` -> `hop-dong (1).pdf`.
 */
export async function uniqueOutputPath(dir: string, fileName: string): Promise<string> {
  const base = resolveOutputPath(dir, fileName);
  const dot = base.lastIndexOf('.');
  const stem = dot > 0 ? base.slice(0, dot) : base;
  const extension = dot > 0 ? base.slice(dot) : '';

  let candidate = base;
  let counter = 1;

  while (true) {
    if (!(await exists(candidate))) return candidate;
    candidate = `${stem} (${counter})${extension}`;
    counter += 1;
    if (counter > 9999) {
      throw new AppError('E_PATH', 'Khong tim duoc ten tep khong trung');
    }
  }
}

/** Kiểm tra một đường dẫn có tồn tại hay không. */
export async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/** Liệt kê tệp PDF trong một thư mục (không đệ quy). */
export async function listPdfFiles(dir: string): Promise<string[]> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.pdf'))
      .map((entry) => join(dir, entry.name));
  } catch {
    return [];
  }
}

/** Ký tự phân tách đường dẫn của hệ điều hành hiện tại. */
export const pathSeparator = sep;
