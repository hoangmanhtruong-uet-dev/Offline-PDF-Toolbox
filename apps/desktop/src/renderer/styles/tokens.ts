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
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
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

/** Màu nhấn: tím điện → hồng neon, phong cách Gen Z. */
export const brand = {
  light: {
    foreground: '#6d28d9',
    background: '#7c3aed',
    backgroundHover: '#6d28d9',
    backgroundPressed: '#5b21b6',
    stroke: '#8b5cf6',
    tint: '#f5f3ff',
  },
  dark: {
    foreground: '#c4b5fd',
    background: '#8b5cf6',
    backgroundHover: '#a78bfa',
    backgroundPressed: '#7c3aed',
    stroke: '#a78bfa',
    tint: '#1e1536',
  },
} as const;

/** Gradient nhận diện dùng cho nút chính, tiêu đề và viền phát sáng. */
export const gradients = {
  brand: 'linear-gradient(135deg, #7c3aed 0%, #db2777 60%, #f97316 100%)',
  brandSoft: 'linear-gradient(135deg, rgba(124,58,237,0.14), rgba(236,72,153,0.14))',
  /** Nền aurora phía sau toàn ứng dụng. */
  auroraLight:
    'radial-gradient(60% 50% at 8% 0%, rgba(167,139,250,0.35) 0%, transparent 70%),' +
    'radial-gradient(50% 45% at 100% 5%, rgba(244,114,182,0.28) 0%, transparent 70%),' +
    'radial-gradient(55% 50% at 60% 100%, rgba(251,191,36,0.18) 0%, transparent 70%)',
  auroraDark:
    'radial-gradient(60% 50% at 8% 0%, rgba(124,58,237,0.38) 0%, transparent 70%),' +
    'radial-gradient(50% 45% at 100% 5%, rgba(219,39,119,0.28) 0%, transparent 70%),' +
    'radial-gradient(55% 50% at 60% 100%, rgba(59,130,246,0.18) 0%, transparent 70%)',
} as const;

/** Màu nhận diện riêng cho từng công cụ (gradient cho ô biểu tượng). */
export const toolColors = {
  merge: { bg: '#eff6ff', fg: '#ffffff', border: '#bfdbfe', hoverBg: '#dbeafe', gradient: 'linear-gradient(135deg,#3b82f6,#06b6d4)', glow: 'rgba(59,130,246,0.35)' },
  split: { bg: '#faf5ff', fg: '#ffffff', border: '#e9d5ff', hoverBg: '#f3e8ff', gradient: 'linear-gradient(135deg,#a855f7,#ec4899)', glow: 'rgba(168,85,247,0.35)' },
  compress: { bg: '#fffbeb', fg: '#ffffff', border: '#fde68a', hoverBg: '#fef3c7', gradient: 'linear-gradient(135deg,#f59e0b,#f97316)', glow: 'rgba(249,115,22,0.35)' },
  rotate: { bg: '#f0fdf4', fg: '#ffffff', border: '#bbf7d0', hoverBg: '#dcfce7', gradient: 'linear-gradient(135deg,#10b981,#84cc16)', glow: 'rgba(16,185,129,0.35)' },
  pages: { bg: '#eef2ff', fg: '#ffffff', border: '#c7d2fe', hoverBg: '#e0e7ff', gradient: 'linear-gradient(135deg,#6366f1,#8b5cf6)', glow: 'rgba(99,102,241,0.35)' },
  stamp: { bg: '#ecfeff', fg: '#ffffff', border: '#a5f3fc', hoverBg: '#cffafe', gradient: 'linear-gradient(135deg,#06b6d4,#3b82f6)', glow: 'rgba(6,182,212,0.35)' },
  pdf2img: { bg: '#fff7ed', fg: '#ffffff', border: '#fed7aa', hoverBg: '#ffedd5', gradient: 'linear-gradient(135deg,#f97316,#ef4444)', glow: 'rgba(249,115,22,0.35)' },
  privacy: { bg: '#f0fdfa', fg: '#ffffff', border: '#99f6e4', hoverBg: '#ccfbf1', gradient: 'linear-gradient(135deg,#14b8a6,#22c55e)', glow: 'rgba(20,184,166,0.35)' },
  protect: { bg: '#fef2f2', fg: '#ffffff', border: '#fecaca', hoverBg: '#fee2e2', gradient: 'linear-gradient(135deg,#ef4444,#be185d)', glow: 'rgba(239,68,68,0.35)' },
  batch: { bg: '#f5f3ff', fg: '#ffffff', border: '#ddd6fe', hoverBg: '#ede9fe', gradient: 'linear-gradient(135deg,#7c3aed,#4f46e5)', glow: 'rgba(124,58,237,0.4)' },
  images: { bg: '#fdf2f8', fg: '#ffffff', border: '#fbcfe8', hoverBg: '#fce7f3', gradient: 'linear-gradient(135deg,#ec4899,#f43f5e)', glow: 'rgba(236,72,153,0.35)' },
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
    colorCompoundBrandBackground: accent.background,
    colorCompoundBrandBackgroundHover: accent.backgroundHover,
    colorCompoundBrandBackgroundPressed: accent.backgroundPressed,
    colorCompoundBrandStroke: accent.stroke,
    colorCompoundBrandStrokeHover: accent.backgroundHover,
    colorCompoundBrandStrokePressed: accent.backgroundPressed,
    colorCompoundBrandForeground1: accent.foreground,
    colorNeutralForegroundOnBrand: '#ffffff',
    colorNeutralForeground1: text.primary,
    colorNeutralForeground2: text.secondary,
    colorNeutralForeground3: text.tertiary,
    ...(dark
      ? {
          colorNeutralBackground1: '#17141f',
          colorNeutralBackground2: '#0e0b16',
          colorNeutralBackground3: '#221d30',
          colorNeutralBackground4: '#2c2640',
          colorNeutralStroke1: '#2f2846',
          colorNeutralStroke2: '#3b3358',
        }
      : {
          colorNeutralBackground1: '#ffffff',
          colorNeutralBackground2: '#faf8ff',
          colorNeutralBackground3: '#f3effc',
          colorNeutralBackground4: '#e9e3f7',
          colorNeutralStroke1: '#e7e1f5',
          colorNeutralStroke2: '#d8cff0',
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
  gradients,
  textColor,
  toolColors,
} as const;
