/**
 * Phân tích luồng nội dung trang để tìm vị trí các ảnh nhúng.
 *
 * Mục đích: biết một ảnh nhúng được đặt trên trang rộng bao nhiêu (theo điểm
 * ảnh), để tính **độ phân giải hiệu dụng**. Đây là thông tin không có trong
 * chính đối tượng ảnh — nó nằm ở toán tử `cm` của luồng nội dung.
 *
 * Không cần phân tích đầy đủ: chỉ theo dõi toán tử `q`, `Q`, `cm` và `Do`.
 */

/** Ma trận biến đổi 2D theo quy ước hàng của PDF: [a b c d e f]. */
export type Matrix = [number, number, number, number, number, number];

/** Ma trận đơn vị. */
export const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0];

/** Một lần đặt ảnh trên trang. */
export interface ImagePlacement {
  /** Tên tài nguyên trong trang, ví dụ `Im0`. */
  name: string;
  /** Ma trận biến đổi tại thời điểm đặt ảnh. */
  ctm: Matrix;
  /** Chiều rộng vật lý trên trang, tính bằng điểm ảnh. */
  placedWidth: number;
  /** Chiều cao vật lý trên trang, tính bằng điểm ảnh. */
  placedHeight: number;
}

/** Một token trong luồng nội dung. */
type Token =
  | { kind: 'number'; value: number }
  | { kind: 'name'; value: string }
  | { kind: 'operator'; value: string }
  | { kind: 'other' };

const WHITESPACE = new Set([0x00, 0x09, 0x0a, 0x0c, 0x0d, 0x20]);
const DELIMITERS = new Set([0x28, 0x29, 0x3c, 0x3e, 0x5b, 0x5d, 0x7b, 0x7d, 0x2f, 0x25]);
const isRegular = (code: number): boolean =>
  !WHITESPACE.has(code) && !DELIMITERS.has(code);

/** Tách luồng nội dung thành các token. */
export function tokenizeContent(bytes: Uint8Array): Token[] {
  const tokens: Token[] = [];
  let index = 0;

  while (index < bytes.length) {
    const code = bytes[index] as number;

    if (WHITESPACE.has(code)) {
      index += 1;
      continue;
    }

    // Tên tài nguyên: /Ten
    if (code === 0x2f) {
      index += 1;
      let name = '';
      while (index < bytes.length && isRegular(bytes[index] as number)) {
        name += String.fromCharCode(bytes[index] as number);
        index += 1;
      }
      tokens.push({ kind: 'name', value: name });
      continue;
    }

    // Chuỗi trong ngoặc: (text)
    if (code === 0x28) {
      let depth = 1;
      index += 1;
      while (index < bytes.length && depth > 0) {
        const current = bytes[index] as number;
        if (current === 0x5c) {
          index += 2;
          continue;
        }
        if (current === 0x28) depth += 1;
        if (current === 0x29) depth -= 1;
        index += 1;
      }
      tokens.push({ kind: 'other' });
      continue;
    }

    // Chuỗi hex: <ABCD>
    if (code === 0x3c && bytes[index + 1] !== 0x3c) {
      index += 1;
      while (index < bytes.length && bytes[index] !== 0x3e) index += 1;
      index += 1;
      tokens.push({ kind: 'other' });
      continue;
    }

    // Mảng và từ điển: bỏ qua, chỉ cần biết chúng kết thúc ở đâu.
    if (code === 0x5b || (code === 0x3c && bytes[index + 1] === 0x3c)) {
      const isDict = code === 0x3c;
      let depth = 1;
      index += isDict ? 2 : 1;
      while (index < bytes.length && depth > 0) {
        const current = bytes[index] as number;
        if (isDict && current === 0x3c && bytes[index + 1] === 0x3c) {
          depth += 1;
          index += 2;
          continue;
        }
        if (isDict && current === 0x3e && bytes[index + 1] === 0x3e) {
          depth -= 1;
          index += 2;
          continue;
        }
        if (!isDict && current === 0x5d) {
          depth -= 1;
          index += 1;
          continue;
        }
        index += 1;
      }
      tokens.push({ kind: 'other' });
      continue;
    }

    // Số.
    if (code === 0x2b || code === 0x2d || code === 0x2e || (code >= 0x30 && code <= 0x39)) {
      let text = '';
      while (index < bytes.length && isRegular(bytes[index] as number)) {
        text += String.fromCharCode(bytes[index] as number);
        index += 1;
      }
      const value = Number.parseFloat(text);
      tokens.push(Number.isFinite(value) ? { kind: 'number', value } : { kind: 'other' });
      continue;
    }

    // Toán tử: các chữ cái.
    if ((code >= 0x41 && code <= 0x5a) || (code >= 0x61 && code <= 0x7a)) {
      let text = '';
      while (index < bytes.length && isRegular(bytes[index] as number)) {
        text += String.fromCharCode(bytes[index] as number);
        index += 1;
      }
      tokens.push({ kind: 'operator', value: text });
      continue;
    }

    index += 1;
  }

  return tokens;
}

/**
 * Nhân hai ma trận theo quy ước hàng của PDF: `M1 × M2`.
 */
export function multiply(m1: Matrix, m2: Matrix): Matrix {
  return [
    m1[0] * m2[0] + m1[1] * m2[2],
    m1[0] * m2[1] + m1[1] * m2[3],
    m1[2] * m2[0] + m1[3] * m2[2],
    m1[2] * m2[1] + m1[3] * m2[3],
    m1[4] * m2[0] + m1[5] * m2[2] + m2[4],
    m1[4] * m2[1] + m1[5] * m2[3] + m2[5],
  ];
}

/**
 * Tìm các lần đặt ảnh trong luồng nội dung.
 *
 * Chỉ xét ảnh XObject: toán tử `Do` với tên tài nguyên nằm trong
 * `/Resources /XObject`. Người gọi có trách nhiệm kiểm tra loại tài nguyên.
 */
export function findImagePlacements(bytes: Uint8Array): ImagePlacement[] {
  const tokens = tokenizeContent(bytes);
  const placements: ImagePlacement[] = [];

  const stack: Matrix[] = [];
  let ctm: Matrix = [...IDENTITY];
  let operands: (number | string)[] = [];

  for (const token of tokens) {
    if (token.kind === 'number' || token.kind === 'name') {
      operands.push(token.value);
      if (operands.length > 8) operands.shift();
      continue;
    }

    if (token.kind !== 'operator') {
      operands = [];
      continue;
    }

    switch (token.value) {
      case 'q':
        stack.push([...ctm]);
        operands = [];
        break;

      case 'Q': {
        const restored = stack.pop();
        if (restored) ctm = restored;
        operands = [];
        break;
      }

      case 'cm': {
        if (operands.length >= 6) {
          const values = operands.slice(-6).map((value) => (typeof value === 'number' ? value : 0));
          ctm = multiply(values as Matrix, ctm);
        }
        operands = [];
        break;
      }

      case 'Do': {
        const name = operands[operands.length - 1];
        if (typeof name === 'string') {
          placements.push({
            name,
            ctm: [...ctm],
            placedWidth: Math.hypot(ctm[0], ctm[1]),
            placedHeight: Math.hypot(ctm[2], ctm[3]),
          });
        }
        operands = [];
        break;
      }

      default:
        operands = [];
        break;
    }
  }

  return placements;
}
