/**
 * Kiểm tra tương phản WCAG AA cho design token.
 *
 * Chạy: `node tests/scripts/contrast-check.mjs`
 *
 * Tính tỷ lệ tương phản của từng cặp màu chữ/nền mà ứng dụng thực sự
 * dùng, cho cả hai chủ đề. Ngưỡng WCAG AA:
 * - Chữ thường: 4.5:1
 * - Chữ lớn (>= 18.66px đậm hoặc >= 24px): 3:1
 *
 * Giá trị màu đọc thẳng từ `src/renderer/styles/tokens.ts` để không lệch
 * với giao diện thật.
 */
import { appTokens } from '../../src/renderer/styles/tokens';

/** Một cặp màu cần kiểm tra. */
const PAIRS = [
  {
    name: 'chữ chính trên nền chính',
    foreground: 'primary',
    background: 'surface',
    large: false,
  },
  {
    name: 'chữ phụ trên nền chính',
    foreground: 'secondary',
    background: 'surface',
    large: false,
  },
  {
    name: 'chữ phụ trên nền thứ cấp',
    foreground: 'secondary',
    background: 'surfaceAlt',
    large: false,
  },
  {
    name: 'chữ phụ trên nền nhấn mạnh',
    foreground: 'secondary',
    background: 'surfaceAlt',
    large: false,
  },
];

/** Sắc độ nền dùng trong giao diện, lấy từ theme Fluent. */
const SURFACES = {
  light: { surface: '#ffffff', surfaceAlt: '#f3f3f3' },
  dark: { surface: '#202020', surfaceAlt: '#2b2b2b' },
};

/** Chuyển mã hex thành RGB. */
function toRgb(hex) {
  const value = hex.replace('#', '');
  const full =
    value.length === 3
      ? value
          .split('')
          .map((c) => c + c)
          .join('')
      : value;
  return {
    r: Number.parseInt(full.slice(0, 2), 16),
    g: Number.parseInt(full.slice(2, 4), 16),
    b: Number.parseInt(full.slice(4, 6), 16),
  };
}

/** Độ sáng tương đối theo WCAG. */
function relativeLuminance(hex) {
  const { r, g, b } = toRgb(hex);
  const channel = (value) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Tỷ lệ tương phản giữa hai màu. */
function contrastRatio(foreground, background) {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}

const failures = [];
const rows = [];

for (const theme of ['light', 'dark']) {
  const text = theme === 'light' ? appTokens.textColor.light : appTokens.textColor.dark;
  const surfaces = SURFACES[theme];

  for (const pair of PAIRS) {
    const foreground = text[pair.foreground];
    const background = surfaces[pair.background];
    const ratio = contrastRatio(foreground, background);
    const required = pair.large ? 3 : 4.5;
    const ok = ratio >= required;

    rows.push({
      theme,
      name: pair.name,
      foreground,
      background,
      ratio: ratio.toFixed(2),
      required: required.toFixed(1),
      ok,
    });

    if (!ok) {
      failures.push(
        `${theme}: ${pair.name} — ${foreground} tren ${background} = ${ratio.toFixed(2)}:1, can >= ${required}:1`,
      );
    }
  }
}

console.log('chu de'.padEnd(7) + 'cap'.padEnd(34) + 'chu'.padEnd(10) + 'nen'.padEnd(10) + 'ty le'.padStart(8) + '  yeu cau');
console.log('-'.repeat(86));

for (const row of rows) {
  console.log(
    row.theme.padEnd(7) +
      row.name.padEnd(34) +
      row.foreground.padEnd(10) +
      row.background.padEnd(10) +
      `${row.ratio}:1`.padStart(8) +
      `  >= ${row.required}:1 ${row.ok ? 'OK' : 'KHONG'}`,
  );
}

if (failures.length > 0) {
  console.log(`\n${failures.length} cap khong dat WCAG AA:`);
  for (const failure of failures) console.log(`  - ${failure}`);
  process.exitCode = 1;
} else {
  console.log('\nTat ca cap chu deu dat WCAG AA.');
}
