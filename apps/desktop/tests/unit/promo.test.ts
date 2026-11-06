import { describe, expect, it } from 'vitest';

import { isPromoActive, withPromo } from '@shared/promo';
import type { LicenseStatus } from '@shared/types';

const free: LicenseStatus = { isPro: false, lastVerifiedAt: null, state: 'unknown' };
const END = Date.UTC(2026, 11, 15);

describe('khuyến mãi Pro', () => {
  it('còn hiệu lực trước ngày kết thúc, hết hiệu lực sau đó', () => {
    expect(isPromoActive(END - 1, END)).toBe(true);
    expect(isPromoActive(END + 1, END)).toBe(false);
    expect(isPromoActive(Date.now(), null)).toBe(false);
  });

  it('mở Pro và đánh dấu ngày kết thúc khi đang khuyến mãi', () => {
    const result = withPromo(free, END - 1000, END);
    expect(result.isPro).toBe(true);
    expect(result.promoUntil).toBe(END);
  });

  it('giữ nguyên bản Free khi hết khuyến mãi', () => {
    expect(withPromo(free, END + 1000, END)).toEqual(free);
  });

  it('không ghi đè người đã mua Pro thật', () => {
    const paid: LicenseStatus = { isPro: true, lastVerifiedAt: 1, state: 'active' };
    expect(withPromo(paid, END - 1000, END)).toEqual(paid);
  });
});
