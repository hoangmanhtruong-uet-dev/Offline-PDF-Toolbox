import { app, ipcMain, nativeTheme, session } from 'electron';

import { IPC } from '@shared/ipc';
import type { AppInfo } from '@shared/ipc';
import type { AppSettings, LicenseStatus } from '@shared/types';

import { registerFileHandlers } from './ipc/files';
import { registerTaskHandlers } from './ipc/tasks';
import { ErrorLog } from './services/errorLog';
import { LicenseService } from './services/licenseService';
import { installNetworkGuard } from './services/networkGuard';
import { QpdfRunner } from './services/qpdfRunner';
import { SettingsStore } from './services/settingsStore';
import { TaskQueue } from './services/taskQueue';
import { TempManager } from './services/tempManager';
import { registerAppProtocolHandler, registerAppScheme } from './protocol';
import { createMainWindow, IS_DEV, RENDERER_ROOT } from './window/createWindow';

/**
 * Điểm khởi động của tiến trình chính.
 *
 * Trách nhiệm: vòng đời ứng dụng, hàng đợi tác vụ, cài đặt, định tuyến lệnh.
 * Không làm việc nặng tuần tự trên luồng này.
 */

const settingsStore = new SettingsStore(app.getPath('userData'));
const tempManager = new TempManager();
const taskQueue = new TaskQueue({ tempManager });
const errorLog = new ErrorLog(app.getPath('userData'));
const qpdf = new QpdfRunner(QpdfRunner.resolveBinaryPath(app.getAppPath()));
const licenseService = new LicenseService({
  userDataDir: app.getPath('userData'),
  storeBridgePath: LicenseService.resolveBinaryPath(app.getAppPath()),
  isPackaged: app.isPackaged,
});

let mainWindow: Electron.BrowserWindow | null = null;

// Phải khai báo giao thức trước khi ứng dụng sẵn sàng.
registerAppScheme();

process.on('uncaughtException', (error) => {
  void errorLog.write('uncaughtException', error);
});

function collectAppInfo(): AppInfo {
  return {
    appVersion: app.getVersion(),
    electronVersion: process.versions.electron ?? 'unknown',
    chromeVersion: process.versions.chrome ?? 'unknown',
    nodeVersion: process.versions.node ?? 'unknown',
    platform: process.platform,
    systemLanguage: app.getLocale(),
    systemPrefersDark: nativeTheme.shouldUseDarkColors,
    isPackaged: app.isPackaged,
  };
}

function registerSettingsHandlers(): void {
  ipcMain.handle(IPC.appInfo, async (): Promise<AppInfo> => collectAppInfo());

  ipcMain.handle(IPC.settingsGet, async (): Promise<AppSettings> => settingsStore.getSettings());

  ipcMain.handle(
    IPC.settingsUpdate,
    async (_event, payload: { patch: Partial<AppSettings> }): Promise<AppSettings> => {
      return settingsStore.updateSettings(payload.patch);
    },
  );

  ipcMain.handle(IPC.recentGet, async () => settingsStore.getRecentFiles());

  ipcMain.handle(IPC.recentClear, async () => {
    await settingsStore.clearRecentFiles();
  });
}

function registerLicenseHandlers(): void {
  ipcMain.handle(IPC.licenseGet, async (): Promise<LicenseStatus> => {
    return licenseService.getStatus();
  });

  ipcMain.handle(IPC.licensePurchase, async () => {
    return licenseService.purchase();
  });

  ipcMain.handle(IPC.licenseRestore, async (): Promise<LicenseStatus> => {
    return licenseService.restore();
  });

  licenseService.on('change', (status: LicenseStatus) => {
    mainWindow?.webContents.send(IPC.licenseChanged, status);
  });
}

function forwardTaskEvents(): void {
  taskQueue.on('progress', (progress) => {
    mainWindow?.webContents.send(IPC.taskProgress, progress);
  });

  taskQueue.on('state', (result) => {
    mainWindow?.webContents.send(IPC.taskState, result);
  });
}

async function bootstrap(): Promise<void> {
  await errorLog.milestone('bat dau bootstrap');
  await settingsStore.load();
  await errorLog.milestone('da nap cai dat');
  await tempManager.init();
  await errorLog.milestone('da khoi tao thu muc tam');

  // Bộ lọc chặn mạng phải được cài trước khi nạp bất kỳ nội dung nào.
  installNetworkGuard(session.defaultSession, IS_DEV, (url) => {
    void errorLog.milestone(`chan yeu cau ${url}`);
  });
  await errorLog.milestone('da cai bo loc mang');

  // Giao diện được phục vụ qua giao thức nội bộ `app://` để worker của
  // pdf.js hoạt động (xem protocol.ts). Ở chế độ phát triển, giao diện do
  // máy chủ Vite phục vụ nên không cần handler này.
  if (!IS_DEV) {
    registerAppProtocolHandler(RENDERER_ROOT);
  }
  await errorLog.milestone('da dang ky giao thuc app');

  registerFileHandlers({
    onFileUsed: (file) => {
      void settingsStore.addRecentFile({
        path: file.path,
        name: file.name,
        size: file.size,
        usedAt: Date.now(),
      });
    },
    removeRecentFile: (path) => settingsStore.removeRecentFile(path),
    touchRecentFile: (path, pageCount) => settingsStore.touchRecentFile(path, pageCount),
  });
  registerSettingsHandlers();
  registerLicenseHandlers();
  registerTaskHandlers(taskQueue, qpdf);
  forwardTaskEvents();

  await licenseService.init();
  await errorLog.milestone('da khoi tao license service');

  mainWindow = createMainWindow();
  await errorLog.milestone('da tao cua so');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  nativeTheme.on('updated', () => {
    mainWindow?.webContents.send(IPC.appInfo, collectAppInfo());
  });
}

void app.whenReady().then(bootstrap).catch((error: unknown) => {
  void errorLog.write('bootstrap', error);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  void tempManager.cleanupAll();
});

app.on('activate', () => {
  if (mainWindow === null) {
    mainWindow = createMainWindow();
  }
});
