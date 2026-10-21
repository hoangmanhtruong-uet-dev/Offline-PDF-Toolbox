import { copyFile, rename, unlink } from 'node:fs/promises';

import { AppError } from '@shared/errors';

import { uniqueOutputPath } from './safePath';

/**
 * Ghi tệp đầu ra an toàn.
 *
 * Quy tắc bắt buộc (ARCHITECTURE.md mục 5, bước 2):
 * 1. Tác vụ ghi ra tệp tạm trong thư mục tạm của tác vụ.
 * 2. Kiểm tra lại tệp đầu ra.
 * 3. Chỉ khi đạt mới di chuyển vào thư mục đích.
 * 4. Không bao giờ ghi đè tệp đã tồn tại — thêm hậu tố số nếu trùng tên.
 */

/** Kết quả di chuyển tệp đầu ra. */
export interface FinalizeResult {
  /** Đường dẫn cuối cùng trong thư mục đích. */
  path: string;
  /** Đường dẫn tệp tạm đã dùng. */
  tempPath: string;
}

/**
 * Di chuyển tệp tạm sang thư mục đích với tên không trùng.
 *
 * `rename` không hoạt động khi hai tệp nằm trên hai ổ đĩa khác nhau, nên có
 * fallback sao chép rồi xoá.
 */
export async function finalizeOutput(
  tempPath: string,
  outputDirectory: string,
  fileName: string,
): Promise<FinalizeResult> {
  const target = await uniqueOutputPath(outputDirectory, fileName);

  try {
    await rename(tempPath, target);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== 'EXDEV') {
      throw new AppError(
        'E_PERM',
        'Khong ghi duoc tep dau ra',
        error instanceof Error ? error.message : String(error),
      );
    }

    try {
      await copyFile(tempPath, target);
    } catch (copyError) {
      throw new AppError(
        'E_PERM',
        'Khong ghi duoc tep dau ra',
        copyError instanceof Error ? copyError.message : String(copyError),
      );
    }
    await unlink(tempPath).catch(() => undefined);
  }

  return { path: target, tempPath };
}

/**
 * Kiểm tra tệp đầu ra trước khi giao cho người dùng.
 *
 * Bốn kiểm tra theo TESTING.md mục 5:
 * 1. Tệp mở được (qpdf --check).
 * 2. Đúng số trang mong đợi.
 * 3. Văn bản còn chọn được (kiểm tra ở lớp kiểm thử, không phải ở đây).
 * 4. Hình vẽ ra đúng (kiểm tra ở lớp kiểm thử).
 */
export interface VerificationResult {
  ok: boolean;
  pageCount: number | null;
  /** Lý do thất bại, không chứa nội dung tài liệu. */
  reason?: string;
}

/** Hàm kiểm tra cấu trúc và đếm trang của tệp PDF. */
export type PdfInspector = (filePath: string) => Promise<{ valid: boolean; pageCount: number | null; reason?: string }>;

/**
 * Kiểm tra tệp đầu ra.
 *
 * @param expectedPages Số trang mong đợi, null nếu không biết trước.
 */
export async function verifyOutput(
  filePath: string,
  expectedPages: number | null,
  inspect: PdfInspector,
): Promise<VerificationResult> {
  const result = await inspect(filePath);

  if (!result.valid) {
    return { ok: false, pageCount: result.pageCount, reason: result.reason };
  }

  if (expectedPages !== null && result.pageCount !== null && result.pageCount !== expectedPages) {
    return {
      ok: false,
      pageCount: result.pageCount,
      reason: `So trang khong dung: mong doi ${expectedPages}, nhan duoc ${result.pageCount}`,
    };
  }

  return { ok: true, pageCount: result.pageCount };
}
