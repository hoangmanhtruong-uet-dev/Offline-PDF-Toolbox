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

/** Màu nhấn của ứng dụng — xanh đậm, gợi sự tin cậy. */
export const brand = {
  light: {
    foreground: '#0b5cab',
    background: '#e8f1fb',
    backgroundHover: '#d6e7f8',
    backgroundPressed: '#c2dcf5',
    stroke: '#0b5cab',
  },
  dark: {
    foreground: '#7fb3f0',
    background: '#12283f',
    backgroundHover: '#17324e',
    backgroundPressed: '#1c3c5c',
    stroke: '#4f8fd6',
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
    colorBrandStroke1: accent.stroke,
    colorBrandStroke2: accent.stroke,
    colorNeutralForeground1: text.primary,
    colorNeutralForeground2: text.secondary,
    colorNeutralForeground3: text.tertiary,
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
} as const;
