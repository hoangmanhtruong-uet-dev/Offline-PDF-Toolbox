import { describe, expect, it } from 'vitest';

import { FREE_LIMITS, FeatureGate, PRO_LIMITS } from '@shared/features';

/**
 * Mỗi giới hạn trong bảng Free phải có ca kiểm thử:
 * - đúng bằng ngưỡng thì cho phép;
 * - vượt ngưỡng thì chặn, kèm thông báo đúng.
 */
describe('FeatureGate — bản Free', () => {
  const gate = FeatureGate.forTier('free');

  it('gộp: cho phép đúng 2 tệp, chặn từ 3 tệp', () => {
    expect(gate.check('merge', { files: FREE_LIMITS.merge.maxFiles })).toEqual({ allowed: true });

    const denied = gate.check('merge', { files: FREE_LIMITS.merge.maxFiles + 1 });
    expect(denied.allowed).toBe(false);
    if (denied.allowed) return;
    expect(denied.reason).toBe('maxFiles');
    expect(denied.limit).toBe(2);
    expect(denied.messageKey).toBe('limits.maxFiles');
  });

  it('tách: cho phép đúng 5 trang, chặn từ 6 trang', () => {
    expect(gate.check('split', { pages: FREE_LIMITS.split.maxPages })).toEqual({ allowed: true });

    const denied = gate.check('split', { pages: FREE_LIMITS.split.maxPages + 1 });
    expect(denied.allowed).toBe(false);
    if (denied.allowed) return;
    expect(denied.reason).toBe('maxPages');
    expect(denied.limit).toBe(5);
  });

  it('nén: cho phép 1 tệp ở mức Nhẹ hoặc Vừa', () => {
    expect(gate.check('compress', { files: 1, level: 'light', inputBytes: 1024 })).toEqual({
      allowed: true,
    });
    expect(gate.check('compress', { files: 1, level: 'medium', inputBytes: 1024 })).toEqual({
      allowed: true,
    });
  });

  it('nén: chặn mức Mạnh', () => {
    const denied = gate.check('compress', { files: 1, level: 'strong', inputBytes: 1024 });
    expect(denied.allowed).toBe(false);
    if (denied.allowed) return;
    expect(denied.reason).toBe('levelNotAllowed');
    expect(denied.messageKey).toBe('limits.compressLevel');
  });

  it('nén: chặn tệp đầu vào quá 20 MB', () => {
    const denied = gate.check('compress', {
      files: 1,
      level: 'medium',
      inputBytes: FREE_LIMITS.compress.maxInputBytes + 1,
    });
    expect(denied.allowed).toBe(false);
    if (denied.allowed) return;
    expect(denied.reason).toBe('maxInputBytes');
    expect(denied.limit).toBe(20 * 1024 * 1024);
  });

  it('nén: chặn nhiều hơn 1 tệp', () => {
    const denied = gate.check('compress', { files: 2, level: 'medium', inputBytes: 1024 });
    expect(denied.allowed).toBe(false);
    if (denied.allowed) return;
    expect(denied.reason).toBe('maxFiles');
  });

  it('xoay: cho phép 1 tệp với tối đa 10 trang', () => {
    expect(gate.check('rotate', { files: 1, pages: 10 })).toEqual({ allowed: true });

    const denied = gate.check('rotate', { files: 1, pages: 11 });
    expect(denied.allowed).toBe(false);
    if (denied.allowed) return;
    expect(denied.reason).toBe('maxPages');
  });

  it('sắp xếp trang: cho phép xuất tối đa 5 trang', () => {
    expect(gate.check('pages', { pages: 5 })).toEqual({ allowed: true });
    expect(gate.check('pages', { pages: 6 }).allowed).toBe(false);
  });

  it('ảnh sang PDF: cho phép tối đa 3 ảnh', () => {
    expect(gate.check('images', { images: 3 })).toEqual({ allowed: true });

    const denied = gate.check('images', { images: 4 });
    expect(denied.allowed).toBe(false);
    if (denied.allowed) return;
    expect(denied.reason).toBe('maxImages');
  });

  it('chặn mật khẩu, hàng loạt và preset', () => {
    for (const feature of ['password', 'batch', 'presets'] as const) {
      const denied = gate.check(feature);
      expect(denied.allowed).toBe(false);
      if (denied.allowed) continue;
      expect(denied.reason).toBe('featureDisabled');
      expect(denied.messageKey).toBe('limits.featureDisabled');
    }
  });
});

describe('FeatureGate — bản Pro', () => {
  const gate = FeatureGate.forTier('pro');

  it('cho phép số lượng không giới hạn', () => {
    expect(gate.check('merge', { files: 500 })).toEqual({ allowed: true });
    expect(gate.check('split', { pages: 100_000 })).toEqual({ allowed: true });
    expect(gate.check('images', { images: 999 })).toEqual({ allowed: true });
  });

  it('cho phép cả ba mức nén', () => {
    for (const level of ['light', 'medium', 'strong'] as const) {
      expect(gate.check('compress', { files: 5, level, inputBytes: 5 * 1024 * 1024 * 1024 })).toEqual({
        allowed: true,
      });
    }
  });

  it('mở khoá mật khẩu, hàng loạt và preset', () => {
    for (const feature of ['password', 'batch', 'presets'] as const) {
      expect(gate.check(feature)).toEqual({ allowed: true });
    }
  });

  it('dùng Infinity thay vì số rất lớn để tránh tràn số', () => {
    expect(PRO_LIMITS.merge.maxFiles).toBe(Number.POSITIVE_INFINITY);
    expect(PRO_LIMITS.split.maxPages).toBe(Number.POSITIVE_INFINITY);
  });
});

describe('FeatureGate.forLicense', () => {
  it('chọn bản giới hạn theo trạng thái giấy phép', () => {
    expect(FeatureGate.forLicense(false).tier).toBe('free');
    expect(FeatureGate.forLicense(true).tier).toBe('pro');
  });
});
