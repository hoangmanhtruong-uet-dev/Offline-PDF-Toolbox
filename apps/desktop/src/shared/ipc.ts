import type { AppSettings, FileMeta, LicenseStatus, RecentFile, TaskProgress, TaskResult } from './types';
import type { CompressionLevel } from './types';
import type {
  CompressionEstimate,
  CompressTaskPayload,
  ImagesTaskPayload,
  MergeTaskPayload,
  PagesTaskPayload,
  RotateTaskPayload,
  SplitTaskPayload,
} from './tasks';

/**
 * Tên kênh IPC và kiểu dữ liệu đi qua kênh.
 *
 * Quy tắc: preload chỉ lộ hàm có tên rõ ràng, không dùng kênh `invoke` chung
 * với tên lệnh động (ARCHITECTURE.md mục 12).
 */
export const IPC = {
  filesPick: 'files:pick',
  filesPickFolder: 'files:pickFolder',
  filesStat: 'files:stat',
  filesReadBytes: 'files:readBytes',
  filesReveal: 'files:reveal',
  filesOpen: 'files:open',
  filesImageInfo: 'files:imageInfo',
  filesImageThumbnail: 'files:imageThumbnail',
  settingsGet: 'settings:get',
  settingsUpdate: 'settings:update',
  recentGet: 'recent:get',
  recentClear: 'recent:clear',
  recentRemove: 'recent:remove',
  recentTouch: 'recent:touch',
  appInfo: 'app:info',
  licenseGet: 'license:get',
  licensePurchase: 'license:purchase',
  licenseRestore: 'license:restore',
  licenseChanged: 'license:changed',
  taskStart: 'task:start',
  taskCancel: 'task:cancel',
  taskProgress: 'task:progress',
  taskState: 'task:state',
  compressEstimate: 'compress:estimate',
} as const;

/** Thông tin môi trường của ứng dụng, dùng cho trang Giới thiệu. */
export interface AppInfo {
  appVersion: string;
  electronVersion: string;
  chromeVersion: string;
  nodeVersion: string;
  platform: string;
  /** Ngôn ngữ giao diện theo hệ thống. */
  systemLanguage: string;
  /** Hệ điều hành có đang ở chế độ tối không. */
  systemPrefersDark: boolean;
  isPackaged: boolean;
}

/** Loại tệp mà công cụ nhận. */
export type FileKind = 'pdf' | 'image' | 'any';

/** Kích thước và định dạng của một ảnh. */
export interface ImageInfo {
  width: number;
  height: number;
  format: string;
}

/** Kết quả đọc nội dung tệp. */
export type ReadBytesResult =
  | { ok: true; bytes: Uint8Array }
  | { ok: false; reason: 'tooLarge' | 'unreadable'; size: number };

/** Kiểu các lệnh được preload lộ ra. */
export interface IpcInvokeMap {
  [IPC.filesPick]: { request: { accept?: FileKind }; response: FileMeta[] };
  [IPC.filesPickFolder]: { request: void; response: string | null };
  [IPC.filesStat]: { request: { paths: string[] }; response: FileMeta[] };
  [IPC.filesReadBytes]: { request: { path: string }; response: ReadBytesResult };
  [IPC.filesReveal]: { request: { path: string }; response: void };
  [IPC.filesOpen]: { request: { path: string }; response: string };
  [IPC.filesImageInfo]: { request: { path: string }; response: ImageInfo | null };
  [IPC.filesImageThumbnail]: {
    request: { path: string; rotation: number };
    response: string | null;
  };
  [IPC.settingsGet]: { request: void; response: AppSettings };
  [IPC.settingsUpdate]: { request: { patch: Partial<AppSettings> }; response: AppSettings };
  [IPC.recentGet]: { request: void; response: RecentFile[] };
  [IPC.recentClear]: { request: void; response: void };
  [IPC.recentRemove]: { request: { path: string }; response: void };
  [IPC.recentTouch]: { request: { path: string; pageCount: number }; response: void };
  [IPC.appInfo]: { request: void; response: AppInfo };
  [IPC.licenseGet]: { request: void; response: LicenseStatus };
  [IPC.taskStart]: {
    request:
      | { kind: 'merge'; payload: MergeTaskPayload }
      | { kind: 'rotate'; payload: RotateTaskPayload }
      | { kind: 'split'; payload: SplitTaskPayload }
      | { kind: 'compress'; payload: CompressTaskPayload }
      | { kind: 'pages'; payload: PagesTaskPayload }
      | { kind: 'images'; payload: ImagesTaskPayload };
    response: string;
  };
  [IPC.taskCancel]: { request: { taskId: string }; response: boolean };
  [IPC.compressEstimate]: {
    request: { path: string; level: CompressionLevel };
    response: CompressionEstimate | null;
  };
}

/** Các kênh main đẩy lên renderer. */
export interface IpcEventMap {
  [IPC.taskProgress]: TaskProgress;
  [IPC.taskState]: TaskResult;
}
