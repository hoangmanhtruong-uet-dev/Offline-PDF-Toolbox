import { inflateSync } from 'node:zlib';

import sharp from 'sharp';
import type { Sharp } from 'sharp';

import type { ScannedImage } from './imageScanner';
import type { CompressionProfile } from './levels';

/**
 * Giải mã và nén lại ảnh nhúng.
 *
 * Chỉ hai trường hợp được hỗ trợ, đúng như đặc tả:
 * - `DCTDecode`: dữ liệu luồng **là** một tệp JPEG, giải mã trực tiếp.
 * - `FlateDecode`: dữ liệu luồng là các mẫu ảnh thô đã nén zlib.
 *
 * Ảnh có mặt nạ mềm (SMask) chỉ được nén lại **cùng kích thước**, vì mặt nạ
 * phải khớp kích thước với ảnh nền.
 */

/** Kết quả nén một ảnh. */
export interface ProcessedImage {
  /** Dữ liệu JPEG mới. */
  bytes: Uint8Array;
  /** Chiều rộng mới tính bằng pixel. */
  width: number;
  /** Chiều cao mới tính bằng pixel. */
  height: number;
  /** Dung lượng ảnh gốc. */
  originalBytes: number;
  /** Dung lượng ảnh mới. */
  newBytes: number;
}

/** Giải mã dữ liệu ảnh thô theo số kênh màu. */
function decodeRaw(
  bytes: Uint8Array,
  image: ScannedImage,
): { data: Buffer; width: number; height: number; channels: number } | null {
  let raw: Uint8Array;

  if (image.filter === 'FlateDecode') {
    try {
      raw = new Uint8Array(inflateSync(bytes));
    } catch {
      return null;
    }
  } else {
    return null;
  }

  const channels = image.channels;
  const expected = image.pixelWidth * image.pixelHeight * channels;
  if (raw.length < expected) return null;

  return {
    data: Buffer.from(raw.buffer, raw.byteOffset, expected),
    width: image.pixelWidth,
    height: image.pixelHeight,
    channels,
  };
}

/**
 * Tính kích thước đích của ảnh.
 *
 * - Nhẹ: giữ nguyên kích thước pixel.
 * - Các mức khác: giảm theo tỉ lệ giữa độ phân giải hiệu dụng và độ phân
 *   giải đích.
 */
export function targetSize(
  image: ScannedImage,
  profile: CompressionProfile,
): { width: number; height: number } {
  if (profile.targetDpi === null || image.effectiveDpi <= 0) {
    return { width: image.pixelWidth, height: image.pixelHeight };
  }

  // Ảnh có mặt nạ mềm phải giữ nguyên kích thước để mặt nạ còn khớp.
  if (image.hasSoftMask) {
    return { width: image.pixelWidth, height: image.pixelHeight };
  }

  const scale = Math.min(1, profile.targetDpi / image.effectiveDpi);
  return {
    width: Math.max(1, Math.round(image.pixelWidth * scale)),
    height: Math.max(1, Math.round(image.pixelHeight * scale)),
  };
}

/**
 * Nén lại một ảnh nhúng.
 *
 * @returns `null` khi ảnh không thể xử lý (bộ lọc lạ, dữ liệu hỏng...).
 */
export async function processImage(
  image: ScannedImage,
  rawBytes: Uint8Array,
  profile: CompressionProfile,
): Promise<ProcessedImage | null> {
  const size = targetSize(image, profile);
  const grayscale = profile.grayscale && image.channels >= 3;

  try {
    let pipeline: Sharp;

    if (image.filter === 'DCTDecode') {
      pipeline = sharp(Buffer.from(rawBytes), { failOn: 'none' });
    } else {
      const raw = decodeRaw(rawBytes, image);
      if (!raw) return null;
      pipeline = sharp(raw.data, {
        raw: { width: raw.width, height: raw.height, channels: raw.channels as 1 | 2 | 3 | 4 },
      });
    }

    let output = await pipeline
      .resize(size.width, size.height, { fit: 'fill', kernel: 'lanczos3' })
      .jpeg({
        quality: profile.jpegQuality,
        // Bỏ siêu dữ liệu không cần thiết (EXIF, ICC) khi ở mức mạnh.
        ...(profile.stripMetadata ? { keepMetadata: false } : {}),
      })
      .toBuffer();

    // Mức mạnh chuyển ảnh màu thành thang xám, giúp tệp nhỏ hơn nữa.
    if (grayscale) {
      output = await sharp(output)
        .greyscale()
        .jpeg({ quality: profile.jpegQuality })
        .toBuffer();
    } else if (image.channels === 1) {
      // Ảnh gốc là thang xám: giữ thang xám để tệp nhỏ hơn.
      output = await sharp(output).greyscale().jpeg({ quality: profile.jpegQuality }).toBuffer();
    }

    return {
      bytes: new Uint8Array(output),
      width: size.width,
      height: size.height,
      originalBytes: rawBytes.length,
      newBytes: output.length,
    };
  } catch {
    return null;
  }
}
