import type { CompressionLevel } from '@shared/types';

/**
 * Tham số của từng mức nén (F-03).
 *
 * | Mức     | Mục đích                    | Ảnh                                  | Cấu trúc tệp                       |
 * | ------- | --------------------------- | ------------------------------------- | ----------------------------------- |
 * | Nhẹ     | Giữ gần như nguyên chất lượng | Giữ độ phân giải, nén lại không mất   | Tối ưu cấu trúc                     |
 * | Vừa     | Gửi email, lưu trữ          | Khoảng 150 dpi, JPEG khoảng 70         | Như trên                             |
 * | Mạnh    | Dung lượng nhỏ nhất         | Khoảng 100 dpi, JPEG khoảng 50, xám    | Như trên, bỏ siêu dữ liệu không cần |
 */
export interface CompressionProfile {
  /** Độ phân giải đích tính bằng dpi. `null` nghĩa là giữ nguyên. */
  targetDpi: number | null;
  /** Chất lượng JPEG (1-100). */
  jpegQuality: number;
  /** Có chuyển ảnh màu thành thang xám hay không. */
  grayscale: boolean;
  /** Có bỏ siêu dữ liệu không cần thiết hay không. */
  stripMetadata: boolean;
}

/** Tham số của từng mức nén. */
export const COMPRESSION_PROFILES: Record<CompressionLevel, CompressionProfile> = {
  light: {
    targetDpi: null,
    jpegQuality: 85,
    grayscale: false,
    stripMetadata: false,
  },
  medium: {
    targetDpi: 150,
    jpegQuality: 70,
    grayscale: false,
    stripMetadata: false,
  },
  strong: {
    targetDpi: 100,
    jpegQuality: 50,
    grayscale: true,
    stripMetadata: true,
  },
};

/**
 * Chỉ thay ảnh khi bản mới nhỏ hơn bản cũ **ít nhất** 5%.
 *
 * Nếu không có ngưỡng này, một số ảnh sẽ bị nén lại to hơn bản gốc.
 */
export const MIN_SAVING_RATIO = 0.05;

/** Ngưỡng bỏ qua ảnh nhỏ. */
export const MIN_IMAGE_BYTES = 50 * 1024;
