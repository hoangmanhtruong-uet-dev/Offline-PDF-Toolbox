import { webDarkTheme, webLightTheme } from '@fluentui/react-components';
import type { Theme } from '@fluentui/react-components';

/**
 * Design tokens tập trung của ứng dụng.
 *
 * Đây là **nguồn duy nhất** cho màu, khoảng cách, bo góc, cỡ chữ và đổ bóng.
 * Thành phần nào cần một giá trị mới thì thêm vào đây, không hard-code rải
 * rác trong từng component.
 *
 * Màu sắc bắt nguồn từ theme của Fluent UI (đồng nhất với Windows 11), phần
 * nhấn mạnh của ứng dụng được ghi đè ở đây.
 */

/**
 * Thang khoảng cách.
 *
 * Giá trị ghi kèm đơn vị để dùng thẳng trong `makeStyles` của Griffel.
 */
export const spacing = {
  xxs: '2px',
  xs: '4px',
  s: '8px',
  m: '12px',
  l: '16px',
  xl: '24px',
  xxl: '32px',
  xxxl: '48px',
} as const;

/** Bán kính bo góc. */
export const radius = {
  none: '0',
  sm: '4px',
  md: '6px',
  lg: '10px',
  xl: '14px',
  pill: '999px',
} as const;

/** Cỡ chữ. */
export const fontSize = {
  xs: '11px',
  sm: '12px',
  base: '14px',
  md: '16px',
  lg: '20px',
  xl: '26px',
  xxl: '32px',
} as const;

/** Độ đậm chữ. */
export const fontWeight = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

/** Thời gian chuyển động, theo mili giây. */
export const motion = {
  fast: 120,
  normal: 200,
  slow: 300,
} as const;

/** Đổ bóng. */
export const shadow = {
  none: 'none',
  sm: '0 1px 2px rgba(0, 0, 0, 0.14), 0 0 2px rgba(0, 0, 0, 0.12)',
  md: '0 4px 12px rgba(0, 0, 0, 0.16), 0 0 2px rgba(0, 0, 0, 0.12)',
  lg: '0 12px 32px rgba(0, 0, 0, 0.22), 0 0 4px rgba(0, 0, 0, 0.16)',
  /** Đổ bóng cho lớp phủ khi kéo thả. */
  overlay: '0 8px 40px rgba(0, 0, 0, 0.35)',
} as const;

/** Màu nhấn của ứng dụng — đỏ tươi đặc trưng thương hiệu PDF, tràn đầy sức sống. */
export const brand = {
  light: {
    foreground: '#be123c',
    background: '#e11d48',
    backgroundHover: '#be123c',
    backgroundPressed: '#9f1239',
    stroke: '#e11d48',
    tint: '#fff1f2',
  },
  dark: {
    foreground: '#fb7185',
    background: '#e11d48',
    backgroundHover: '#f43f5e',
    backgroundPressed: '#fda4af',
    stroke: '#f43f5e',
    tint: '#381017',
  },
} as const;

/** Màu nhận diện riêng cho từng công cụ trên nền sáng. */
export const toolColors = {
  merge: {
    bg: '#eff6ff',
    fg: '#2563eb',
    border: '#dbeafe',
    hoverBg: '#dbeafe',
  },
  split: {
    bg: '#faf5ff',
    fg: '#9333ea',
    border: '#f3e8ff',
    hoverBg: '#f3e8ff',
  },
  compress: {
    bg: '#fffbeb',
    fg: '#d97706',
    border: '#fef3c7',
    hoverBg: '#fef3c7',
  },
  rotate: {
    bg: '#f0fdf4',
    fg: '#16a34a',
    border: '#dcfce7',
    hoverBg: '#dcfce7',
  },
  pages: {
    bg: '#eef2ff',
    fg: '#4f46e5',
    border: '#e0e7ff',
    hoverBg: '#e0e7ff',
  },
  images: {
    bg: '#fdf2f8',
    fg: '#db2777',
    border: '#fce7f3',
    hoverBg: '#fce7f3',
  },
} as const;

/** Màu chữ phụ, đảm bảo tương phản WCAG AA ở cả hai chủ đề. */
export const textColor = {
  light: {
    primary: '#1a1a1a',
    secondary: '#4a4a4a',
    tertiary: '#5c5c5c',
  },
  dark: {
    primary: '#f2f2f2',
    secondary: '#c4c4c4',
    tertiary: '#b0b0b0',
  },
} as const;

/**
 * Tạo theme Fluent đã ghi đè phần nhấn mạnh của ứng dụng.
 *
 * Giữ nguyên theme gốc để mọi thành phần khác trong ứng dụng không bị ảnh
 * hưởng — chỉ có màu nhấn và màu chữ phụ là thay đổi.
 */
export function buildTheme(dark: boolean): Theme {
  const base = dark ? webDarkTheme : webLightTheme;
  const accent = dark ? brand.dark : brand.light;
  const text = dark ? textColor.dark : textColor.light;

  return {
    ...base,
    colorBrandForeground1: accent.foreground,
    colorBrandForeground2: accent.foreground,
    colorBrandBackground: accent.background,
    colorBrandBackgroundHover: accent.backgroundHover,
    colorBrandBackgroundPressed: accent.backgroundPressed,
    colorBrandBackground2: accent.tint,
    colorBrandStroke1: accent.stroke,
    colorBrandStroke2: accent.stroke,
    colorNeutralForegroundOnBrand: '#ffffff',
    colorNeutralForeground1: text.primary,
    colorNeutralForeground2: text.secondary,
    colorNeutralForeground3: text.tertiary,
    ...(dark
      ? {
          colorNeutralBackground1: '#1e222b',
          colorNeutralBackground2: '#14171f',
          colorNeutralBackground3: '#0f1117',
          colorNeutralStroke1: '#2e3545',
          colorNeutralStroke2: '#3d465c',
        }
      : {
          colorNeutralBackground1: '#ffffff',
          colorNeutralBackground2: '#f8fafc',
          colorNeutralBackground3: '#f1f5f9',
          colorNeutralBackground4: '#e2e8f0',
          colorNeutralStroke1: '#e2e8f0',
          colorNeutralStroke2: '#cbd5e1',
        }),
  };
}

/** Toàn bộ token ứng dụng, gom lại để dùng một chỗ. */
export const appTokens = {
  spacing,
  radius,
  fontSize,
  fontWeight,
  motion,
  shadow,
  brand,
  textColor,
  toolColors,
} as const;
