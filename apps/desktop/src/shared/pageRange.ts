/**
 * Phân tích dải trang.
 *
 * Đây là nguồn duy nhất cho mọi nơi nhập dải trang (ô dải trang của F-01,
 * chế độ tách theo khoảng của F-02). Định dạng được hỗ trợ: `1-3, 7, 10-`.
 *
 * Quy ước: số trang bắt đầu từ 1, khoảng luôn inclusive hai đầu.
 */

/** Một khoảng trang, 1-based và inclusive. */
export interface PageRange {
  start: number;
  end: number;
}

/** Lý do phân tích thất bại. */
export type PageRangeErrorCode = 'empty' | 'invalid' | 'outOfBounds';

/** Kết quả phân tích dải trang. */
export type PageRangeParseResult =
  | { ok: true; ranges: PageRange[]; total: number }
  | { ok: false; code: PageRangeErrorCode; token?: string; totalPages?: number };

const RANGE_PATTERN = /^(\d+)?\s*(?:-\s*(\d+)?)?$/;

/**
 * Phân tích chuỗi dải trang.
 *
 * @param input Chuỗi do người dùng nhập, ví dụ `1-3, 7, 10-`.
 * @param totalPages Tổng số trang của tệp. Khi có, dải vượt quá sẽ báo lỗi.
 */
export function parsePageRange(input: string, totalPages?: number): PageRangeParseResult {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return { ok: false, code: 'empty' };
  }

  const ranges: PageRange[] = [];

  for (const rawToken of trimmed.split(',')) {
    const token = rawToken.trim();
    if (token.length === 0) {
      return { ok: false, code: 'invalid', token };
    }

    const match = RANGE_PATTERN.exec(token);
    if (!match) {
      return { ok: false, code: 'invalid', token };
    }

    const startText = match[1];
    const endText = match[2];

    // `10` -> một trang đơn. `10-` -> từ trang 10 đến hết (cần totalPages).
    const start = startText ? Number.parseInt(startText, 10) : 1;
    const hasExplicitEnd = Boolean(endText);
    const end = hasExplicitEnd ? Number.parseInt(endText, 10) : start;

    if (start < 1 || end < 1) {
      return { ok: false, code: 'invalid', token };
    }
    if (end < start) {
      return { ok: false, code: 'invalid', token };
    }

    ranges.push({ start, end });
  }

  if (totalPages !== undefined) {
    for (const range of ranges) {
      if (range.start > totalPages) {
        return { ok: false, code: 'outOfBounds', token: String(range.start), totalPages };
      }
      if (range.end > totalPages) {
        return { ok: false, code: 'outOfBounds', token: String(range.end), totalPages };
      }
    }
  }

  // Khoảng mở ("10-") chỉ có nghĩa khi biết tổng số trang.
  const resolved = ranges.map((range) =>
    hasOpenEnded(range) ? range : range,
  );

  return { ok: true, ranges: resolved, total: countPages(resolved) };
}

/**
 * Khoảng mở được ký hiệu bằng cách `end` bằng 0 nội bộ? Không — ở đây
 * khoảng mở đã được chuẩn hoá khi có `totalPages`.
 */
function hasOpenEnded(range: PageRange): boolean {
  return range.end === 0;
}

/**
 * Chuẩn hoá khoảng mở (`10-`) thành khoảng cụ thể khi biết tổng số trang.
 * Nếu tổng số trang chưa biết, khoảng mở được giữ nguyên để kiểm tra sau.
 */
export function resolveOpenEndedRanges(ranges: PageRange[], totalPages: number): PageRange[] {
  return ranges.map((range) =>
    range.end === 0 ? { start: range.start, end: totalPages } : range,
  );
}

/** Tổng số trang được chọn. */
export function countPages(ranges: PageRange[]): number {
  return ranges.reduce((sum, range) => sum + (range.end - range.start + 1), 0);
}

/** Chuyển danh sách khoảng thành tham số dải trang của qpdf, ví dụ `1-3,7-`. */
export function rangeToQpdfArg(ranges: PageRange[]): string {
  return ranges
    .map((range) => (range.end === 0 ? `${range.start}-` : `${range.start}-${range.end}`))
    .join(',');
}

/** Gộp các khoảng liền kề hoặc chồng lấn thành các khoảng tối thiểu. */
export function mergeRanges(ranges: PageRange[]): PageRange[] {
  if (ranges.length === 0) return [];

  const sorted = [...ranges].sort((a, b) => a.start - b.start || a.end - b.end);
  const merged: PageRange[] = [];

  for (const range of sorted) {
    const last = merged[merged.length - 1];
    if (last && range.start <= last.end + 1) {
      last.end = Math.max(last.end, range.end);
    } else {
      merged.push({ ...range });
    }
  }

  return merged;
}

/** Chuyển danh sách chỉ số trang (0-based) thành các khoảng. */
export function rangesFromSelection(indices: number[]): PageRange[] {
  const pages = [...new Set(indices)].map((index) => index + 1).sort((a, b) => a - b);
  if (pages.length === 0) return [];

  const ranges: PageRange[] = [];
  let start = pages[0];
  let end = pages[0];

  for (let i = 1; i < pages.length; i += 1) {
    const page = pages[i];
    if (page === end + 1) {
      end = page;
    } else {
      ranges.push({ start, end });
      start = page;
      end = page;
    }
  }
  ranges.push({ start, end });

  return ranges;
}

/** Chia tệp thành các phần, mỗi phần tối đa `size` trang. */
export function chunkRanges(totalPages: number, size: number): PageRange[] {
  if (size < 1) throw new RangeError('size phai lon hon 0');
  const ranges: PageRange[] = [];
  for (let start = 1; start <= totalPages; start += size) {
    ranges.push({ start, end: Math.min(start + size - 1, totalPages) });
  }
  return ranges;
}
