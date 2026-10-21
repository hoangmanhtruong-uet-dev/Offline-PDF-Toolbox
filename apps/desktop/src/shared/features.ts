import type { CompressionLevel } from './types';

/**
 * Bảng giới hạn Free / Pro và cổng kiểm soát tính năng (FeatureGate).
 *
 * Đây là **nguồn duy nhất** của mọi giới hạn trong ứng dụng. Mô tả trên
 * Microsoft Store phải khớp đúng với bảng này.
 *
 * Nguyên tắc (ADR-007): giới hạn nằm ở **số lượng**, không nằm ở **chất lượng
 * kết quả**. Không bao giờ đóng dấu chìm lên tệp xuất ra.
 */

/** Danh sách tính năng có kiểm soát giới hạn. */
export type FeatureId =
  | 'merge'
  | 'split'
  | 'compress'
  | 'rotate'
  | 'pages'
  | 'images'
  | 'password'
  | 'batch'
  | 'presets';

/** Cấu hình giới hạn của toàn bộ tính năng. */
export interface FeatureLimits {
  merge: { maxFiles: number };
  split: { maxPages: number };
  compress: {
    maxFiles: number;
    maxInputBytes: number;
    levels: CompressionLevel[];
  };
  rotate: { maxFiles: number; maxPages: number };
  pages: { maxPages: number };
  images: { maxImages: number };
  password: { enabled: boolean };
  batch: { enabled: boolean };
  presets: { enabled: boolean };
}

/** Giới hạn của bản Free (dùng thử). */
export const FREE_LIMITS: FeatureLimits = {
  merge: { maxFiles: 2 },
  split: { maxPages: 5 },
  compress: { maxFiles: 1, maxInputBytes: 20 * 1024 * 1024, levels: ['light', 'medium'] },
  rotate: { maxFiles: 1, maxPages: 10 },
  pages: { maxPages: 5 },
  images: { maxImages: 3 },
  password: { enabled: false },
  batch: { enabled: false },
  presets: { enabled: false },
};

/** Giới hạn của bản Pro: không giới hạn số lượng, mở khoá hết tính năng. */
export const PRO_LIMITS: FeatureLimits = {
  merge: { maxFiles: Number.POSITIVE_INFINITY },
  split: { maxPages: Number.POSITIVE_INFINITY },
  compress: {
    maxFiles: Number.POSITIVE_INFINITY,
    maxInputBytes: Number.POSITIVE_INFINITY,
    levels: ['light', 'medium', 'strong'],
  },
  rotate: { maxFiles: Number.POSITIVE_INFINITY, maxPages: Number.POSITIVE_INFINITY },
  pages: { maxPages: Number.POSITIVE_INFINITY },
  images: { maxImages: Number.POSITIVE_INFINITY },
  password: { enabled: true },
  batch: { enabled: true },
  presets: { enabled: true },
};

/** Bậc tính năng. */
export type Tier = 'free' | 'pro';

/** Mức nén được phép. */
export const COMPRESSION_LEVELS: CompressionLevel[] = ['light', 'medium', 'strong'];

/** Lý do bị chặn. */
export type LimitReason =
  | 'maxFiles'
  | 'maxPages'
  | 'maxImages'
  | 'maxInputBytes'
  | 'levelNotAllowed'
  | 'featureDisabled';

/** Kết quả kiểm tra một tính năng. */
export type LimitDecision =
  | { allowed: true }
  | {
      allowed: false;
      reason: LimitReason;
      /** Ngưỡng của giới hạn. */
      limit: number;
      /** Giá trị thực tế người dùng đã dùng. */
      actual: number;
      /** Khoá chuỗi i18n để hiển thị. */
      messageKey: string;
    };

/** Số liệu người dùng đã dùng cho một tính năng. */
export interface FeatureUsage {
  /** Số tệp đã chọn. */
  files?: number;
  /** Số trang được chọn hoặc xuất. */
  pages?: number;
  /** Số ảnh đã chọn. */
  images?: number;
  /** Tổng dung lượng đầu vào tính bằng byte. */
  inputBytes?: number;
  /** Mức nén được yêu cầu. */
  level?: CompressionLevel;
}

/**
 * Cổng kiểm soát tính năng.
 *
 * Một module duy nhất quyết định mỗi tính năng bị giới hạn thế nào ở Free
 * hay mở hết ở Pro. Mọi nơi trong ứng dụng phải hỏi `FeatureGate` thay vì
 * tự so sánh số.
 */
export class FeatureGate {
  readonly tier: Tier;
  readonly limits: FeatureLimits;

  constructor(tier: Tier, limits: FeatureLimits) {
    this.tier = tier;
    this.limits = limits;
  }

  /** Tạo gate theo bậc. */
  static forTier(tier: Tier): FeatureGate {
    return new FeatureGate(tier, tier === 'pro' ? PRO_LIMITS : FREE_LIMITS);
  }

  /** Tạo gate từ trạng thái giấy phép. */
  static forLicense(isPro: boolean): FeatureGate {
    return FeatureGate.forTier(isPro ? 'pro' : 'free');
  }

  /** Lấy cấu hình giới hạn của một tính năng. */
  limit<K extends FeatureId>(feature: K): FeatureLimits[K] {
    return this.limits[feature];
  }

  /** Kiểm tra một tính năng dựa trên mức sử dụng. */
  check(feature: FeatureId, usage: FeatureUsage = {}): LimitDecision {
    switch (feature) {
      case 'merge': {
        const limit = this.limits.merge.maxFiles;
        const actual = usage.files ?? 0;
        return actual <= limit
          ? { allowed: true }
          : denied('maxFiles', limit, actual, 'limits.maxFiles');
      }
      case 'split': {
        const limit = this.limits.split.maxPages;
        const actual = usage.pages ?? 0;
        return actual <= limit
          ? { allowed: true }
          : denied('maxPages', limit, actual, 'limits.maxPages');
      }
      case 'pages': {
        const limit = this.limits.pages.maxPages;
        const actual = usage.pages ?? 0;
        return actual <= limit
          ? { allowed: true }
          : denied('maxPages', limit, actual, 'limits.maxPages');
      }
      case 'compress': {
        const { maxFiles, maxInputBytes, levels } = this.limits.compress;
        const level = usage.level;
        if (level && !levels.includes(level)) {
          return denied('levelNotAllowed', levels.length, 0, 'limits.compressLevel');
        }
        const files = usage.files ?? 0;
        if (files > maxFiles) {
          return denied('maxFiles', maxFiles, files, 'limits.maxFiles');
        }
        const bytes = usage.inputBytes ?? 0;
        if (bytes > maxInputBytes) {
          return denied('maxInputBytes', maxInputBytes, bytes, 'limits.maxInputBytes');
        }
        return { allowed: true };
      }
      case 'rotate': {
        const { maxFiles, maxPages } = this.limits.rotate;
        const files = usage.files ?? 0;
        if (files > maxFiles) {
          return denied('maxFiles', maxFiles, files, 'limits.maxFiles');
        }
        const pages = usage.pages ?? 0;
        return pages <= maxPages
          ? { allowed: true }
          : denied('maxPages', maxPages, pages, 'limits.maxPages');
      }
      case 'images': {
        const limit = this.limits.images.maxImages;
        const actual = usage.images ?? 0;
        return actual <= limit
          ? { allowed: true }
          : denied('maxImages', limit, actual, 'limits.maxImages');
      }
      case 'password':
        return this.limits.password.enabled
          ? { allowed: true }
          : denied('featureDisabled', 0, 0, 'limits.featureDisabled');
      case 'batch':
        return this.limits.batch.enabled
          ? { allowed: true }
          : denied('featureDisabled', 0, 0, 'limits.featureDisabled');
      case 'presets':
        return this.limits.presets.enabled
          ? { allowed: true }
          : denied('featureDisabled', 0, 0, 'limits.featureDisabled');
      default: {
        const exhaustive: never = feature;
        throw new Error(`Tinh nang khong duoc xu ly: ${String(exhaustive)}`);
      }
    }
  }
}

function denied(
  reason: LimitReason,
  limit: number,
  actual: number,
  messageKey: string,
): LimitDecision {
  return { allowed: false, reason, limit, actual, messageKey };
}
