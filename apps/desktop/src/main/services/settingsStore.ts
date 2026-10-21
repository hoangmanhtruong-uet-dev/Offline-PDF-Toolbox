import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import type { AppSettings, RecentFile, SupportedLanguage, ThemePreference } from '@shared/types';

/**
 * Lưu cài đặt và danh sách tệp gần đây.
 *
 * Chỉ lưu cài đặt và **đường dẫn** tệp gần đây. Không bao giờ lưu nội dung
 * tài liệu hay mật khẩu (SECURITY-PRIVACY.md mục 4).
 */

/** Số tệp gần đây tối đa được giữ lại. */
const MAX_RECENT_FILES = 12;

const DEFAULT_SETTINGS: AppSettings = {
  language: 'en',
  theme: 'system',
  outputDirectory: null,
  showRecentFiles: true,
};

export class SettingsStore {
  private readonly settingsPath: string;
  private readonly recentPath: string;
  private settings: AppSettings = { ...DEFAULT_SETTINGS };
  private recent: RecentFile[] = [];

  constructor(dataDir: string) {
    this.settingsPath = join(dataDir, 'settings.json');
    this.recentPath = join(dataDir, 'recent.json');
  }

  /** Nạp cài đặt từ đĩa. Nếu hỏng thì dùng giá trị mặc định. */
  async load(): Promise<void> {
    await mkdir(dirname(this.settingsPath), { recursive: true });
    this.settings = {
      ...DEFAULT_SETTINGS,
      ...(await readJson<Partial<AppSettings>>(this.settingsPath, {})),
    };
    this.recent = await readJson<RecentFile[]>(this.recentPath, []);
  }

  /** Cài đặt hiện tại. */
  getSettings(): AppSettings {
    return { ...this.settings };
  }

  /** Cập nhật cài đặt và ghi xuống đĩa. */
  async updateSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
    const next: AppSettings = { ...this.settings, ...patch };

    if (next.language !== undefined && !isSupportedLanguage(next.language)) {
      next.language = DEFAULT_SETTINGS.language;
    }
    if (next.theme !== undefined && !isThemePreference(next.theme)) {
      next.theme = DEFAULT_SETTINGS.theme;
    }

    this.settings = next;
    await writeJson(this.settingsPath, this.settings);
    return this.getSettings();
  }

  /** Danh sách tệp gần đây, mới nhất trước. */
  getRecentFiles(): RecentFile[] {
    return [...this.recent];
  }

  /** Ghi nhận một tệp vừa dùng. */
  async addRecentFile(file: RecentFile): Promise<void> {
    this.recent = [file, ...this.recent.filter((item) => item.path !== file.path)].slice(
      0,
      MAX_RECENT_FILES,
    );
    await writeJson(this.recentPath, this.recent);
  }

  /** Xóa toàn bộ danh sách tệp gần đây. */
  async clearRecentFiles(): Promise<void> {
    this.recent = [];
    await writeJson(this.recentPath, this.recent);
  }
}

function isSupportedLanguage(value: string): value is SupportedLanguage {
  return ['en', 'de', 'fr', 'es', 'vi'].includes(value);
}

function isThemePreference(value: string): value is ThemePreference {
  return ['system', 'light', 'dark'].includes(value);
}

async function readJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const raw = await readFile(path, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(path: string, value: unknown): Promise<void> {
  try {
    await writeFile(path, JSON.stringify(value, null, 2), 'utf8');
  } catch {
    // Không ghi được cài đặt không được làm sập ứng dụng.
  }
}
