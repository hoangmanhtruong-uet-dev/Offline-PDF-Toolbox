import { readFile } from 'node:fs/promises';

import sharp from 'sharp';

/**
 * Xử lý ảnh ở tiến trình chính.
 *
 * `sharp` là module native của Node, không thể đóng gói vào giao diện. Vì vậy
 * mọi thao tác đọc ảnh đều đi qua IPC xuống đây.
 */

/** Kích thước và định dạng của một ảnh. */
export interface ImageInfo {
  width: number;
  height: number;
  format: string;
}

/** Đọc kích thước và định dạng của một tệp ảnh. */
export async function readImageInfo(path: string): Promise<ImageInfo | null> {
  try {
    const buffer = await readFile(path);
    const metadata = await sharp(buffer, { failOn: 'none' }).metadata();
    return {
      width: metadata.width ?? 0,
      height: metadata.height ?? 0,
      format: metadata.format ?? 'unknown',
    };
  } catch {
    return null;
  }
}

/**
 * Tạo hình thu nhỏ của một ảnh, đã xoay theo góc cho trước.
 *
 * @returns Ảnh PNG dạng data URL, hoặc null nếu không đọc được.
 */
export async function makeThumbnail(
  path: string,
  rotation: number,
  width = 120,
  height = 160,
): Promise<string | null> {
  try {
    const buffer = await readFile(path);
    const output = await sharp(buffer, { failOn: 'none' })
      .rotate(rotation)
      .resize(width, height, { fit: 'inside' })
      .png()
      .toBuffer();

    return `data:image/png;base64,${output.toString('base64')}`;
  } catch {
    return null;
  }
}
