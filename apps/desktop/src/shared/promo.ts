import type { LicenseStatus } from './types';

/**
 * Khuyến mãi ra mắt: mở khóa toàn bộ tính năng Pro miễn phí tới một ngày cố định.
 *
 * Để TẮT khuyến mãi: đặt `PRO_PROMO_ENDS_AT` bằng `null` (hoặc một ngày đã qua)
 * rồi phát hành bản cập nhật. Để đổi ngày kết thúc: sửa hằng số này.
 *
 * Khuyến mãi chỉ mở khóa tính năng trong app; không tạo giao dịch nào với Store.
 */
export const PRO_PROMO_ENDS_AT: number | null = Date.UTC(2026, 11, 15, 16, 59, 59); // hết ngày 15/12/2026 (giờ Việt Nam)

/** Khuyến mãi còn hiệu lực tại thời điểm `now` hay không. */
export function isPromoActive(now: number = Date.now(), endsAt: number | null = PRO_PROMO_ENDS_AT): boolean {
  return endsAt !== null && now <= endsAt;
}

/** Áp khuyến mãi lên trạng thái giấy phép: coi như Pro nhưng đánh dấu là khuyến mãi. */
export function withPromo(
  license: LicenseStatus,
  now: number = Date.now(),
  endsAt: number | null = PRO_PROMO_ENDS_AT,
): LicenseStatus {
  if (license.isPro || !isPromoActive(now, endsAt) || endsAt === null) return license;
  return { ...license, isPro: true, promoUntil: endsAt };
}
