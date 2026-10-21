import type { AppSettings, FileMeta, LicenseStatus, RecentFile, TaskProgress, TaskResult } from './types';
import type { MergeTaskPayload, RotateTaskPayload, SplitTaskPayload } from './tasks';

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
  settingsGet: 'settings:get',
  settingsUpdate: 'settings:update',
  recentGet: 'recent:get',
  recentClear: 'recent:clear',
  appInfo: 'app:info',
  licenseGet: 'license:get',
  taskStart: 'task:start',
  taskCancel: 'task:cancel',
  taskProgress: 'task:progress',
  taskState: 'task:state',
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

/** Kết quả đọc nội dung tệp. */
export type ReadBytesResult =
  | { ok: true; bytes: Uint8Array }
  | { ok: false; reason: 'tooLarge' | 'unreadable'; size: number };

/** Kiểu các lệnh được preload lộ ra. */
export interface IpcInvokeMap {
  [IPC.filesPick]: { request: void; response: FileMeta[] };
  [IPC.filesPickFolder]: { request: void; response: string | null };
  [IPC.filesStat]: { request: { paths: string[] }; response: FileMeta[] };
  [IPC.filesReadBytes]: { request: { path: string }; response: ReadBytesResult };
  [IPC.filesReveal]: { request: { path: string }; response: void };
  [IPC.settingsGet]: { request: void; response: AppSettings };
  [IPC.settingsUpdate]: { request: { patch: Partial<AppSettings> }; response: AppSettings };
  [IPC.recentGet]: { request: void; response: RecentFile[] };
  [IPC.recentClear]: { request: void; response: void };
  [IPC.appInfo]: { request: void; response: AppInfo };
  [IPC.licenseGet]: { request: void; response: LicenseStatus };
  [IPC.taskStart]: {
    request:
      | { kind: 'merge'; payload: MergeTaskPayload }
      | { kind: 'rotate'; payload: RotateTaskPayload }
      | { kind: 'split'; payload: SplitTaskPayload };
    response: string;
  };
  [IPC.taskCancel]: { request: { taskId: string }; response: boolean };
}

/** Các kênh main đẩy lên renderer. */
export interface IpcEventMap {
  [IPC.taskProgress]: TaskProgress;
  [IPC.taskState]: TaskResult;
}
