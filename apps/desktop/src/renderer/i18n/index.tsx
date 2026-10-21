import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

import { errorMessageKey } from '@shared/errors';
import type { ErrorCode } from '@shared/types';

import de from './de.json';
import en from './en.json';
import es from './es.json';
import fr from './fr.json';
import vi from './vi.json';
import type { SupportedLanguage } from '@shared/types';

/**
 * Bản dịch giao diện.
 *
 * Quy tắc: mọi chuỗi chữ hiển thị phải nằm trong file ngôn ngữ, không viết
 * cứng trong mã (UX.md mục 9). `satisfies` bắt buộc cả 5 ngôn ngữ có đủ
 * cùng một bộ khoá, nên thiếu khoá sẽ báo lỗi ngay khi kiểm tra kiểu.
 */

export type MessageKey = keyof typeof en;

/**
 * Giá trị của một chuỗi dịch.
 *
 * Chuỗi đơn giản dùng cho mọi trường hợp. Khi cần phân biệt số ít và số
 * nhiều, dùng dạng `{ one, other }` và truyền `{ count }`.
 */
export type MessageValue = string | { one: string; other: string };

type MessageTable = Record<MessageKey, MessageValue>;

const MESSAGES = { en, de, fr, es, vi } satisfies Record<SupportedLanguage, MessageTable>;

/**
 * Kiểm tra lúc biên dịch rằng mọi khoá thông báo lỗi đều có trong bảng dịch.
 * Nếu không, `useErrorMessage` sẽ hiển thị sai chuỗi.
 */
type ErrorMessageKey = ReturnType<typeof errorMessageKey>;
const _errorKeysAreTranslatable: Record<ErrorMessageKey, true> = {
  'errors.needsPassword': true,
  'errors.recovered': true,
  'errors.unreadable': true,
  'errors.notPdf': true,
  'errors.signature': true,
  'errors.diskFull': true,
  'errors.noPermission': true,
  'errors.badPath': true,
  'errors.unknown': true,
};
void _errorKeysAreTranslatable;

/** Ngôn ngữ dùng khi chưa có lựa chọn nào. */
export const DEFAULT_LOCALE: SupportedLanguage = 'en';

/** Danh sách ngôn ngữ có thể chọn. */
export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['en', 'de', 'fr', 'es', 'vi'];

/** Tên hiển thị của từng ngôn ngữ, dùng trong Cài đặt. */
export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
  vi: 'Tiếng Việt',
};

export type TranslateVars = Record<string, string | number>;

/** Dịch một khoá, thay thế các biến `{name}`. */
export function translate(
  locale: SupportedLanguage,
  key: MessageKey,
  vars?: TranslateVars,
): string {
  const table = MESSAGES[locale] ?? MESSAGES[DEFAULT_LOCALE];
  const value = table[key] ?? MESSAGES[DEFAULT_LOCALE][key] ?? key;

  let template: string;
  if (typeof value === 'string') {
    template = value;
  } else {
    const count = Number(vars?.count ?? 0);
    template = count === 1 ? value.one : value.other;
  }

  if (!vars) return template;

  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const replacement = vars[name];
    return replacement === undefined ? match : String(replacement);
  });
}

/** Định dạng dung lượng theo vùng. */
export function formatBytes(bytes: number, locale: SupportedLanguage): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const digits = unit === 0 || value >= 100 ? 0 : value >= 10 ? 1 : 2;
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
  return `${formatted} ${units[unit]}`;
}

/** Định dạng số theo vùng. */
export function formatNumber(value: number, locale: SupportedLanguage): string {
  return new Intl.NumberFormat(locale).format(value);
}

/**
 * Định dạng thời gian tương đối, ví dụ "3 phút trước".
 */
export function relativeTime(
  timestamp: number,
  locale: SupportedLanguage,
  now: number = Date.now(),
): string {
  const seconds = Math.round((timestamp - now) / 1000);

  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['second', 60],
    ['minute', 60],
    ['hour', 24],
    ['day', 7],
    ['week', 4.35],
    ['month', 12],
    ['year', Number.POSITIVE_INFINITY],
  ];

  let value = seconds;
  let unit: Intl.RelativeTimeFormatUnit = 'second';

  for (const [candidate, limit] of units) {
    unit = candidate;
    if (Math.abs(value) < limit) break;
    value = Math.round(value / limit);
  }

  return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(value, unit);
}

export interface I18nValue {
  locale: SupportedLanguage;
  t(key: MessageKey, vars?: TranslateVars): string;
  formatBytes(bytes: number): string;
  formatNumber(value: number): string;
  /** Thời gian tương đối, ví dụ "3 phút trước". */
  relativeTime(timestamp: number): string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({
  locale,
  children,
}: {
  locale: SupportedLanguage;
  children: ReactNode;
}): React.JSX.Element {
  const value: I18nValue = {
    locale,
    t: (key, vars) => translate(locale, key, vars),
    formatBytes: (bytes) => formatBytes(bytes, locale),
    formatNumber: (num) => formatNumber(num, locale),
    relativeTime: (timestamp) => relativeTime(timestamp, locale),
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** Hook lấy hàm dịch. */
export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) {
    throw new Error('useI18n phai duoc dung ben trong I18nProvider');
  }
  return value;
}

/**
 * Hook lấy thông báo cho một mã lỗi.
 *
 * Việc ánh xạ mã lỗi sang khoá dịch nằm ở `shared/errors.ts` để dùng được
 * cả trong tiến trình chính; ở đây chỉ chuyển khoá về đúng kiểu `MessageKey`.
 */
export function useErrorMessage(): (code: ErrorCode) => string {
  const { t } = useI18n();
  return (code) => t(errorMessageKey(code) as MessageKey);
}
