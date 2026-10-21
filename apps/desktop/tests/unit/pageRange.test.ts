import { describe, expect, it } from 'vitest';

import {
  chunkRanges,
  countPages,
  mergeRanges,
  parsePageRange,
  rangeToQpdfArg,
  rangesFromSelection,
  resolveOpenEndedRanges,
} from '@shared/pageRange';

describe('parsePageRange', () => {
  it('đọc một trang đơn', () => {
    const result = parsePageRange('7');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.ranges).toEqual([{ start: 7, end: 7 }]);
    expect(result.total).toBe(1);
  });

  it('đọc một khoảng trang', () => {
    const result = parsePageRange('1-3');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.ranges).toEqual([{ start: 1, end: 3 }]);
    expect(result.total).toBe(3);
  });

  it('đọc nhiều khoảng lẫn nhau', () => {
    const result = parsePageRange('1-3, 5, 8-10');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.ranges).toEqual([
      { start: 1, end: 3 },
      { start: 5, end: 5 },
      { start: 8, end: 10 },
    ]);
    // 1-3 (3 trang) + 5 (1 trang) + 8-10 (3 trang) = 7 trang.
    expect(result.total).toBe(7);
  });

  it('giữ khoảng mở "10-" để kiểm tra sau', () => {
    const result = parsePageRange('10-');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.ranges).toEqual([{ start: 10, end: 10 }]);
  });

  it('báo lỗi khi chuỗi rỗng', () => {
    const result = parsePageRange('   ');
    expect(result).toEqual({ ok: false, code: 'empty' });
  });

  it('báo lỗi khi có mảnh không hợp lệ', () => {
    expect(parsePageRange('abc')).toMatchObject({ ok: false, code: 'invalid' });
    expect(parsePageRange('1-3,')).toMatchObject({ ok: false, code: 'invalid' });
    expect(parsePageRange('5-2')).toMatchObject({ ok: false, code: 'invalid' });
    expect(parsePageRange('0-3')).toMatchObject({ ok: false, code: 'invalid' });
  });

  it('báo lỗi khi dải vượt quá số trang', () => {
    const result = parsePageRange('1-3, 9', 5);
    expect(result).toMatchObject({ ok: false, code: 'outOfBounds', token: '9', totalPages: 5 });
  });

  it('cho phép dải đúng bằng số trang', () => {
    const result = parsePageRange('1-5', 5);
    expect(result.ok).toBe(true);
  });
});

describe('resolveOpenEndedRanges', () => {
  it('đóng khoảng mở theo tổng số trang', () => {
    expect(resolveOpenEndedRanges([{ start: 10, end: 0 }], 20)).toEqual([{ start: 10, end: 20 }]);
  });

  it('không đụng tới khoảng đã đóng', () => {
    expect(resolveOpenEndedRanges([{ start: 1, end: 3 }], 20)).toEqual([{ start: 1, end: 3 }]);
  });
});

describe('countPages', () => {
  it('cộng tổng số trang của các khoảng', () => {
    expect(
      countPages([
        { start: 1, end: 3 },
        { start: 5, end: 5 },
        { start: 8, end: 10 },
      ]),
    ).toBe(7);
  });

  it('trả về 0 cho danh sách rỗng', () => {
    expect(countPages([])).toBe(0);
  });
});

describe('rangeToQpdfArg', () => {
  it('sinh tham số dải trang cho qpdf', () => {
    expect(
      rangeToQpdfArg([
        { start: 1, end: 3 },
        { start: 7, end: 7 },
      ]),
    ).toBe('1-3,7-7');
  });

  it('giữ dấu gạch ngang cho khoảng mở', () => {
    expect(rangeToQpdfArg([{ start: 10, end: 0 }])).toBe('10-');
  });
});

describe('mergeRanges', () => {
  it('gộp các khoảng liền kề', () => {
    expect(
      mergeRanges([
        { start: 1, end: 3 },
        { start: 4, end: 6 },
      ]),
    ).toEqual([{ start: 1, end: 6 }]);
  });

  it('không gộp các khoảng rời nhau', () => {
    expect(
      mergeRanges([
        { start: 1, end: 3 },
        { start: 8, end: 9 },
      ]),
    ).toEqual([
      { start: 1, end: 3 },
      { start: 8, end: 9 },
    ]);
  });
});

describe('rangesFromSelection', () => {
  it('chuyển danh sách chỉ số thành khoảng liên tục', () => {
    expect(rangesFromSelection([0, 1, 2, 4, 7, 8])).toEqual([
      { start: 1, end: 3 },
      { start: 5, end: 5 },
      { start: 8, end: 9 },
    ]);
  });

  it('bỏ qua chỉ số lặp lại', () => {
    expect(rangesFromSelection([0, 0, 1])).toEqual([{ start: 1, end: 2 }]);
  });

  it('trả về mảng rỗng khi không chọn trang nào', () => {
    expect(rangesFromSelection([])).toEqual([]);
  });
});

describe('chunkRanges', () => {
  it('chia đều thành các phần', () => {
    expect(chunkRanges(25, 10)).toEqual([
      { start: 1, end: 10 },
      { start: 11, end: 20 },
      { start: 21, end: 25 },
    ]);
  });

  it('ném lỗi khi kích thước không hợp lệ', () => {
    expect(() => chunkRanges(10, 0)).toThrow(RangeError);
  });
});
