import type { AppInfo, ImageInfo } from '@shared/ipc';
import type { CompressionEstimate } from '@shared/tasks';
import type { AppSettings, FileMeta, LicenseStatus, RecentFile } from '@shared/types';

/**
 * Kiểu của API được preload lộ ra trên `window.optb`.
 *
 * Renderer chỉ dùng đúng các hàm ở đây — không có đường nào khác để điều
 * khiển tiến trình chính.
 */
export interface OptbApi {
  files: {
    pick(accept?: 'pdf' | 'image' | 'any'): Promise<FileMeta[]>;
    pickFolder(): Promise<string | null>;
    stat(paths: string[]): Promise<FileMeta[]>;
    readBytes(path: string): Promise<unknown>;
    reveal(path: string): Promise<void>;
    open(path: string): Promise<string>;
    imageInfo(path: string): Promise<ImageInfo | null>;
    imageThumbnail(path: string, rotation: number): Promise<string | null>;
    getPathForFile(file: File): string;
  };
  settings: {
    get(): Promise<AppSettings>;
    update(patch: Partial<AppSettings>): Promise<AppSettings>;
  };
  recent: {
    get(): Promise<RecentFile[]>;
    clear(): Promise<void>;
    remove(path: string): Promise<void>;
    touch(path: string, pageCount: number): Promise<void>;
  };
  app: {
    info(): Promise<AppInfo>;
    license(): Promise<LicenseStatus>;
  };
  tasks: {
    start(request: unknown): Promise<string>;
    cancel(taskId: string): Promise<boolean>;
  };
  compress: {
    estimate(path: string, level: string): Promise<CompressionEstimate | null>;
  };
  onTaskProgress(callback: (progress: unknown) => void): () => void;
  onTaskState(callback: (result: unknown) => void): () => void;
}

declare global {
  interface Window {
    optb: OptbApi;
  }
}
