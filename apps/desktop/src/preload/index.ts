import { contextBridge, ipcRenderer, webUtils } from 'electron';

import { IPC } from '@shared/ipc';

/**
 * Cầu nối giữa renderer và tiến trình chính.
 *
 * Quy tắc: chỉ lộ những hàm thật sự cần thiết. Không lộ `ipcRenderer` thô,
 * không lộ `fs`, không dùng kênh `invoke` chung với tên lệnh động.
 *
 * Lưu ý: preload chạy với `sandbox: true`, nên chỉ có quyền với module
 * `electron`. Bản này được Vite đóng gói thành CommonJS.
 */

const api = {
  files: {
    pick: (accept?: string): Promise<unknown[]> => ipcRenderer.invoke(IPC.filesPick, { accept }),
    pickFolder: (): Promise<string | null> => ipcRenderer.invoke(IPC.filesPickFolder),
    stat: (paths: string[]): Promise<unknown[]> => ipcRenderer.invoke(IPC.filesStat, { paths }),
    readBytes: (path: string): Promise<unknown> => ipcRenderer.invoke(IPC.filesReadBytes, { path }),
    reveal: (path: string): Promise<void> => ipcRenderer.invoke(IPC.filesReveal, { path }),
    open: (path: string): Promise<string> => ipcRenderer.invoke(IPC.filesOpen, { path }),
    imageInfo: (path: string): Promise<unknown> => ipcRenderer.invoke(IPC.filesImageInfo, { path }),
    imageThumbnail: (path: string, rotation: number): Promise<string | null> =>
      ipcRenderer.invoke(IPC.filesImageThumbnail, { path, rotation }),
    /**
     * Lấy đường dẫn thật của một tệp được kéo thả.
     *
     * Từ Electron 32, `File.path` đã bị gỡ; `webUtils.getPathForFile` là cách
     * được hỗ trợ chính thức và là cách duy nhất để lấy đường dẫn trong
     * renderer đã bị sandbox.
     */
    getPathForFile: (file: File): string => webUtils.getPathForFile(file),
  },
  settings: {
    get: (): Promise<unknown> => ipcRenderer.invoke(IPC.settingsGet),
    update: (patch: unknown): Promise<unknown> => ipcRenderer.invoke(IPC.settingsUpdate, { patch }),
  },
  recent: {
    get: (): Promise<unknown[]> => ipcRenderer.invoke(IPC.recentGet),
    clear: (): Promise<void> => ipcRenderer.invoke(IPC.recentClear),
    remove: (path: string): Promise<void> => ipcRenderer.invoke(IPC.recentRemove, { path }),
    touch: (path: string, pageCount: number): Promise<void> =>
      ipcRenderer.invoke(IPC.recentTouch, { path, pageCount }),
  },
  app: {
    info: (): Promise<unknown> => ipcRenderer.invoke(IPC.appInfo),
    license: (): Promise<unknown> => ipcRenderer.invoke(IPC.licenseGet),
  },
  tasks: {
    start: (request: unknown): Promise<string> => ipcRenderer.invoke(IPC.taskStart, request),
    cancel: (taskId: string): Promise<boolean> => ipcRenderer.invoke(IPC.taskCancel, { taskId }),
  },
  compress: {
    estimate: (path: string, level: string): Promise<unknown> =>
      ipcRenderer.invoke(IPC.compressEstimate, { path, level }),
  },
  onTaskProgress: (callback: (progress: unknown) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: unknown): void => callback(payload);
    ipcRenderer.on(IPC.taskProgress, listener);
    return () => ipcRenderer.removeListener(IPC.taskProgress, listener);
  },
  onTaskState: (callback: (result: unknown) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: unknown): void => callback(payload);
    ipcRenderer.on(IPC.taskState, listener);
    return () => ipcRenderer.removeListener(IPC.taskState, listener);
  },
};

export type PreloadApi = typeof api;

contextBridge.exposeInMainWorld('optb', api);
