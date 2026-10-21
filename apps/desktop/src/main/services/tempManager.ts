import { randomUUID } from 'node:crypto';
import { rm, mkdir, readdir, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * Quản lý thư mục tạm.
 *
 * Quy tắc (ARCHITECTURE.md mục 5):
 * 1. Mỗi tác vụ có thư mục tạm riêng trong thư mục tạm của hệ thống.
 * 2. Xóa khi tác vụ kết thúc.
 * 3. Quét dọn tệp tạm cũ khi ứng dụng khởi động.
 */

/** Thư mục tạm cũ hơn ngưỡng này (tính bằng giờ) sẽ bị dọn khi khởi động. */
const STALE_HOURS = 24;

export class TempManager {
  private readonly root: string;

  constructor(root?: string) {
    this.root = root ?? join(tmpdir(), 'offline-pdf-toolbox');
  }

  /** Đường dẫn thư mục gốc chứa các thư mục tạm theo tác vụ. */
  get rootDir(): string {
    return this.root;
  }

  /** Tạo thư mục gốc và dọn các thư mục tạm cũ. */
  async init(): Promise<void> {
    await mkdir(this.root, { recursive: true });
    await this.cleanupStale();
  }

  /** Tạo thư mục tạm riêng cho một tác vụ. */
  async createTaskDir(taskId: string): Promise<string> {
    const safeId = taskId.replace(/[^a-zA-Z0-9_-]/g, '');
    const dir = join(this.root, `${safeId}-${randomUUID().slice(0, 8)}`);
    await mkdir(dir, { recursive: true });
    return dir;
  }

  /** Xóa thư mục tạm của một tác vụ. Không ném lỗi nếu đã không tồn tại. */
  async removeTaskDir(dir: string): Promise<void> {
    if (!dir) return;
    await rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }

  /** Xóa toàn bộ thư mục tạm. */
  async cleanupAll(): Promise<void> {
    await rm(this.root, { recursive: true, force: true }).catch(() => undefined);
  }

  /** Dọn các thư mục tạm cũ hơn ngưỡng. */
  private async cleanupStale(): Promise<void> {
    let entries: string[];
    try {
      entries = await readdir(this.root);
    } catch {
      return;
    }

    const threshold = Date.now() - STALE_HOURS * 60 * 60 * 1000;

    for (const entry of entries) {
      const target = join(this.root, entry);
      try {
        const info = await stat(target);
        if (info.isDirectory() && info.mtimeMs < threshold) {
          await rm(target, { recursive: true, force: true });
        }
      } catch {
        // Bỏ qua: thư mục đã bị xóa hoặc không truy cập được.
      }
    }
  }
}
