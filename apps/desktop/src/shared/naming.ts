/**
 * Làm sạch tên tệp và dựng tên tệp đầu ra.
 *
 * Quy tắc bảo mật: tên tệp đầu ra luôn được làm sạch trước khi ghi, để
 * không thể ghi ra ngoài thư mục đích bằng `..` hay tên thiết bị đặc biệt
 * của Windows.
 */

/** Ký tự không hợp lệ trong tên tệp trên Windows. */
const INVALID_CHARS = '<>:"/\\|?*';

/** Tên thiết bị đặc biệt của Windows, kể cả khi kèm phần mở rộng. */
const RESERVED_NAMES = new Set([
  'con',
  'prn',
  'aux',
  'nul',
  'com1',
  'com2',
  'com3',
  'com4',
  'com5',
  'com6',
  'com7',
  'com8',
  'com9',
  'lpt1',
  'lpt2',
  'lpt3',
  'lpt4',
  'lpt5',
  'lpt6',
  'lpt7',
  'lpt8',
  'lpt9',
]);

/** Độ dài tối đa của một thành phần tên tệp trên Windows. */
export const MAX_NAME_LENGTH = 120;

/**
 * Một ký tự có bị loại bỏ khỏi tên tệp hay không.
 *
 * Loại bỏ ký tự điều khiển và ký tự không hợp lệ trên Windows. Dấu cách và
 * dấu gạch ngang là hợp lệ và được giữ nguyên để tên tệp vẫn dễ đọc.
 */
function isInvalidChar(char: string): boolean {
  const code = char.charCodeAt(0);
  if (code < 0x20 || code === 0x7f) return true;
  return INVALID_CHARS.includes(char);
}

/**
 * Làm sạch một thành phần tên tệp.
 *
 * - Thay ký tự không hợp lệ và ký tự điều khiển bằng `_`.
 * - Gộp khoảng trắng liên tiếp.
 * - Vô hiệu hoá chuỗi `..` để không thể truy ngược thư mục.
 * - Bỏ dấu chấm ở đầu và cuối.
 * - Tránh tên thiết bị đặc biệt.
 * - Cắt bớt nếu quá dài.
 */
export function sanitizeFileName(name: string): string {
  let cleaned = Array.from(name)
    .map((char) => (isInvalidChar(char) ? '_' : char))
    .join('');

  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  cleaned = cleaned.replace(/\.{2,}/g, '_');
  cleaned = cleaned.replace(/^\.+/, '').replace(/\.+$/, '');

  // Tên chỉ còn dấu gạch và dấu chấm không mang thông tin gì.
  if (cleaned.length === 0 || cleaned.replace(/[_.]/g, '') === '') {
    cleaned = 'file';
  }

  const stem = cleaned.split('.')[0]?.toLowerCase() ?? '';
  if (RESERVED_NAMES.has(stem)) {
    cleaned = `_${cleaned}`;
  }

  if (cleaned.length > MAX_NAME_LENGTH) {
    const dot = cleaned.lastIndexOf('.');
    const extension = dot > 0 ? cleaned.slice(dot) : '';
    const base = dot > 0 ? cleaned.slice(0, dot) : cleaned;
    cleaned = `${base.slice(0, Math.max(1, MAX_NAME_LENGTH - extension.length))}${extension}`;
  }

  return cleaned;
}

/** Bỏ phần mở rộng của một tên tệp. */
export function stripExtension(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(0, dot) : name;
}

/** Lấy phần mở rộng, chữ thường, không có dấu chấm. */
export function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.');
  if (dot <= 0 || dot === name.length - 1) return '';
  return name.slice(dot + 1).toLowerCase();
}

/** Biến có thể dùng trong mẫu tên tệp đầu ra. */
export interface NameVars {
  /** Tên tệp gốc, không kèm phần mở rộng. */
  name?: string;
  /** Số thứ tự, bắt đầu từ 1. */
  index?: number;
  /** Trang bắt đầu của phần, 1-based. */
  from?: number;
  /** Trang cuối của phần, 1-based. */
  to?: number;
  /** Ngày theo định dạng ISO, ví dụ 2026-10-21. */
  date?: string;
  /** Giờ theo định dạng ISO, ví dụ 14-05-33. */
  time?: string;
}

/**
 * Mẫu tên tệp đầu ra mặc định cho từng thao tác.
 * Người dùng có thể sửa mẫu trong Cài đặt (F-10).
 */
export const OUTPUT_TEMPLATES = {
  merged: 'Merged_{date}',
  split: '{name}_{index}',
  extracted: '{name}_extracted',
  rotated: '{name}_rotated',
  compressed: '{name}_compressed',
  images: 'Images_{date}',
} as const;

/** Khoá của mẫu tên đầu ra. */
export type OutputTemplateKey = keyof typeof OUTPUT_TEMPLATES;

/** Thay thế các biến trong mẫu tên. */
export function applyTemplate(template: string, vars: NameVars): string {
  const replaced = template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = vars[key as keyof NameVars];
    if (value === undefined || value === null) return match;
    return String(value);
  });

  return sanitizeFileName(replaced);
}

/** Dựng tên tệp đầu ra hoàn chỉnh kèm phần mở rộng. */
export function buildOutputName(template: string, vars: NameVars, extension = 'pdf'): string {
  const base = applyTemplate(template, vars);
  const suffix = extension ? `.${extension}` : '';
  return `${base}${suffix}`;
}
