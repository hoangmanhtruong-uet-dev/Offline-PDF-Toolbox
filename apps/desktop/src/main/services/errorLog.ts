import { appendFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Nhật ký lỗi cục bộ.
 *
 * Quy tắc bảo mật (SECURITY-PRIVACY.md mục 5):
 * - Chỉ ghi mã lỗi, phiên bản và thông số kỹ thuật.
 * - Không ghi tên tệp, đường dẫn đầy đủ hay nội dung tài liệu.
 * - Không gửi đi đâu cả.
 *
 * Nhật ký nằm trong thư mục dữ liệu ứng dụng và người dùng có thể xóa.
 */
export class ErrorLog {
  private readonly file: string;
  private readonly debug: boolean;

  constructor(dataDir: string) {
    this.file = join(dataDir, 'error.log');
    this.debug = process.env.OPTB_DEBUG === '1';
  }

  /** Đường dẫn tệp nhật ký. */
  get filePath(): string {
    return this.file;
  }

  /**
   * Ghi một mốc giai đoạn khởi động.
   *
   * Chỉ ghi khi bật `OPTB_DEBUG=1`, để bản phát hành không để lại dấu vết
   * thừa trong nhật ký.
   */
  async milestone(message: string): Promise<void> {
    if (!this.debug) return;
    await this.write('milestone', message);
  }

  /** Ghi một lỗi kèm ngữ cảnh tối thiểu. */
  async write(context: string, error: unknown): Promise<void> {
    const detail =
      error instanceof Error
        ? `${error.name}: ${error.message}`
        : typeof error === 'string'
          ? error
          : ' loi khong xac dinh';

    const entry = `[${new Date().toISOString()}] [${context}] ${detail}\n`;

    try {
      await mkdir(join(this.file, '..'), { recursive: true });
      await appendFile(this.file, entry, 'utf8');
    } catch {
      // Không ghi được nhật ký không được làm sập ứng dụng.
    }
  }
}
