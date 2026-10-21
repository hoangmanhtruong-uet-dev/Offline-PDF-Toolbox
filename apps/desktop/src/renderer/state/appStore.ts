import { create } from 'zustand';

import type { AppInfo } from '@shared/ipc';
import type { AppSettings, LicenseStatus, SupportedLanguage } from '@shared/types';

/**
 * Trạng thái ứng dụng: cài đặt, thông tin môi trường, giấy phép.
 */

interface AppState {
  settings: AppSettings;
  appInfo: AppInfo | null;
  license: LicenseStatus;
  /** Ngôn ngữ đang dùng, đã tính cả lựa chọn của người dùng lẫn hệ thống. */
  locale: SupportedLanguage;
  initialized: boolean;
  init: () => Promise<void>;
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>;
  refreshLicense: () => Promise<void>;
}

/** Ngôn ngữ hệ thống rút gọn về mã mà ứng dụng hỗ trợ. */
function normalizeSystemLanguage(systemLanguage: string): SupportedLanguage {
  const base = systemLanguage.split('-')[0]?.toLowerCase() ?? 'en';
  if (base === 'vi') return 'vi';
  return 'en';
}

const DEFAULT_SETTINGS: AppSettings = {
  language: 'en',
  theme: 'system',
  outputDirectory: null,
  showRecentFiles: true,
};

export const useAppStore = create<AppState>((set) => ({
  settings: DEFAULT_SETTINGS,
  appInfo: null,
  license: { isPro: false, lastVerifiedAt: null, state: 'unknown' },
  locale: 'en',
  initialized: false,

  init: async () => {
    // Một lệnh IPC hỏng không được làm trắng toàn bộ giao diện: ứng dụng
    // vẫn phải dùng được với cài đặt mặc định.
    const [settings, appInfo, license] = await Promise.all([
      window.optb.settings.get().catch(() => DEFAULT_SETTINGS),
      window.optb.app.info().catch(() => null),
      window.optb.app.license().catch(() => ({
        isPro: false,
        lastVerifiedAt: null,
        state: 'unknown' as const,
      })),
    ]);

    const systemLocale = normalizeSystemLanguage(appInfo?.systemLanguage ?? 'en');
    // Ngôn ngữ đã chọn trong Cài đặt được ưu tiên; nếu người dùng chưa chọn
    // (giá trị mặc định 'en') thì lấy theo ngôn ngữ hệ thống.
    const locale = settings.language === 'en' ? systemLocale : settings.language;

    set({ settings, appInfo, license, locale, initialized: true });
  },

  updateSettings: async (patch) => {
    const settings = await window.optb.settings.update(patch);
    set({ settings, locale: settings.language });
  },

  refreshLicense: async () => {
    const license = await window.optb.app.license();
    set({ license });
  },
}));

/** Chủ đề sáng hay tối sau khi áp dụng lựa chọn của người dùng. */
export function resolveDarkMode(theme: AppSettings['theme'], systemPrefersDark: boolean): boolean {
  if (theme === 'dark') return true;
  if (theme === 'light') return false;
  return systemPrefersDark;
}
