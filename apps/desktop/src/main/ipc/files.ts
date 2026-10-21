import { readFile, stat } from 'node:fs/promises';
import { basename } from 'node:path';

import { BrowserWindow, dialog, ipcMain, shell } from 'electron';

import { IPC } from '@shared/ipc';
import { extensionOf } from '@shared/naming';
import type { FileMeta } from '@shared/types';

/**
 * Giới hạn dung lượng tệp được gửi sang renderer.
 *
 * Renderer chỉ cần nội dung tệp để dựng hình thu nhổ. Tệp quá lớn sẽ bỏ
 * hình thu nhổ thay vì chuyển hàng trăm MB qua IPC.
 */
const MAX_INLINE_BYTES = 64 * 1024 * 1024;

/** Đọc thông tin tệp từ hệ thống tệp. */
async function describe(path: string): Promise<FileMeta | null> {
  try {
    const info = await stat(path);
    if (!info.isFile()) return null;
    return {
      path,
      name: basename(path),
      size: info.size,
      modifiedAt: info.mtimeMs,
      ext: extensionOf(path),
    };
  } catch {
    return null;
  }
}

/** Mô tả nhiều tệp, bỏ qua những tệp không đọc được. */
async function describeMany(paths: string[]): Promise<FileMeta[]> {
  const metas = await Promise.all(paths.map((path) => describe(path)));
  return metas.filter((meta): meta is FileMeta => meta !== null);
}

export interface FileHandlerDeps {
  /** Gọi lại khi người dùng dùng một tệp, để ghi vào danh sách gần đây. */
  onFileUsed?: (file: FileMeta) => void;
}

export function registerFileHandlers(deps: FileHandlerDeps = {}): void {
  ipcMain.handle(IPC.filesPick, async (event): Promise<FileMeta[]> => {
    const window = BrowserWindow.fromWebContents(event.sender);
    const options: Electron.OpenDialogOptions = {
      title: 'Select PDF files',
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    };

    const result = window
      ? await dialog.showOpenDialog(window, options)
      : await dialog.showOpenDialog(options);

    if (result.canceled || result.filePaths.length === 0) return [];

    const metas = await describeMany(result.filePaths);
    for (const meta of metas) deps.onFileUsed?.(meta);
    return metas;
  });

  ipcMain.handle(IPC.filesPickFolder, async (event): Promise<string | null> => {
    const window = BrowserWindow.fromWebContents(event.sender);
    const options: Electron.OpenDialogOptions = {
      title: 'Select a folder',
      properties: ['openDirectory'],
    };

    const result = window
      ? await dialog.showOpenDialog(window, options)
      : await dialog.showOpenDialog(options);

    return result.canceled ? null : (result.filePaths[0] ?? null);
  });

  ipcMain.handle(IPC.filesStat, async (_event, payload: { paths: string[] }): Promise<FileMeta[]> => {
    return describeMany(payload.paths);
  });

  ipcMain.handle(
    IPC.filesReadBytes,
    async (_event, payload: { path: string }): Promise<{ ok: true; bytes: Uint8Array } | { ok: false; reason: 'tooLarge' | 'unreadable'; size: number }> => {
      try {
        const info = await stat(payload.path);
        if (info.size > MAX_INLINE_BYTES) {
          return { ok: false, reason: 'tooLarge', size: info.size };
        }
        const buffer = await readFile(payload.path);
        return { ok: true, bytes: new Uint8Array(buffer) };
      } catch {
        return { ok: false, reason: 'unreadable', size: 0 };
      }
    },
  );

  ipcMain.handle(IPC.filesReveal, async (_event, payload: { path: string }): Promise<void> => {
    shell.showItemInFolder(payload.path);
  });
}
