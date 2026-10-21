import { join } from 'node:path';

import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';

import { AppError } from '@shared/errors';

import { finalizeOutput, verifyOutput } from './outputVerifier';
import { QPDF_EXIT_OK, QPDF_EXIT_WARNING } from './qpdfRunner';
import type { QpdfRunner } from './qpdfRunner';
import type { TaskContext } from './taskQueue';

/**
 * Tác vụ Ảnh sang PDF (F-06).
 *
 * Mỗi ảnh thành một trang, giữ nguyên tỷ lệ, căn theo lề đã chọn.
 */

/** Cỡ giấy được hỗ trợ. */
export type PaperSize = 'fit' | 'a4' | 'letter';

/** Chất lượng ảnh khi ghi vào PDF. */
export type ImageQuality = 'original' | 'compressed';

/** Một ảnh trong danh sách. */
export interface ImageItem {
  path: string;
  /** Góc xoay của ảnh, tính bằng độ. */
  rotation: 0 | 90 | 180 | 270;
}

export interface ImagesTaskPayload {
  images: ImageItem[];
  paperSize: PaperSize;
  /** Lề tính bằng milimét. */
  marginMm: 0 | 10 | 20;
  quality: ImageQuality;
  outputDirectory: string;
  outputName: string;
}

/** Kích thước trang theo điểm ảnh (1 inch = 72 điểm). */
const PAPER_SIZES: Record<Exclude<PaperSize, 'fit'>, { width: number; height: number }> = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612, height: 792 },
};

/** Quy đổi milimét sang điểm ảnh. */
function mmToPoints(mm: number): number {
  return (mm / 25.4) * 72;
}

/**
 * Chạy tác vụ ảnh sang PDF.
 */
export async function runImages(
  context: TaskContext,
  payload: ImagesTaskPayload,
  qpdf: QpdfRunner,
): Promise<{ outputPaths: string[]; skipped: { path: string; reason: string }[] }> {
  const { signal, tempDir } = context;

  context.report(5, 'reading', 'tasks.preparing');

  if (payload.images.length === 0) {
    throw new AppError('E_PATH', 'Chua chon anh nao');
  }

  const document = await PDFDocument.create();
  const margin = mmToPoints(payload.marginMm);
  const skipped: { path: string; reason: string }[] = [];

  for (let index = 0; index < payload.images.length; index += 1) {
    if (signal.aborted) throw new AppError('E_UNKNOWN', 'Tac vu da bi huy');

    const image = payload.images[index] as ImageItem;

    try {
      // Mọi định dạng đưa về PNG hoặc JPEG để nhúng được: PDF chỉ nhúng
      // được JPEG và PNG.
      const pipeline = sharp(image.path, { failOn: 'none' });
      const metadata = await pipeline.metadata();

      const isJpeg = metadata.format === 'jpeg';
      const target = isJpeg && payload.quality === 'original' ? 'jpeg' : 'png';

      let buffer: Buffer;

      if (target === 'jpeg') {
        buffer = await sharp(image.path, { failOn: 'none' })
          .rotate(image.rotation)
          .jpeg({ quality: 90 })
          .toBuffer();
      } else {
        buffer = await sharp(image.path, { failOn: 'none' })
          .rotate(image.rotation)
          .png()
          .toBuffer();
      }

      const embedded = target === 'jpeg' ? await document.embedJpg(buffer) : await document.embedPng(buffer);
      const { width, height } = embedded;

      const pageWidth =
        payload.paperSize === 'fit' ? width + margin * 2 : PAPER_SIZES[payload.paperSize].width;
      const pageHeight =
        payload.paperSize === 'fit' ? height + margin * 2 : PAPER_SIZES[payload.paperSize].height;

      const page = document.addPage([pageWidth, pageHeight]);

      // Giữ nguyên tỷ lệ: ảnh được đặt trong khung trang, canh giữa.
      const availableWidth = Math.max(1, pageWidth - margin * 2);
      const availableHeight = Math.max(1, pageHeight - margin * 2);
      const scale = Math.min(availableWidth / width, availableHeight / height);
      const drawWidth = width * scale;
      const drawHeight = height * scale;

      page.drawImage(embedded, {
        x: (pageWidth - drawWidth) / 2,
        y: (pageHeight - drawHeight) / 2,
        width: drawWidth,
        height: drawHeight,
      });

      context.report(
        10 + Math.round(((index + 1) / payload.images.length) * 70),
        'processing',
        'tasks.converting',
      );
    } catch (error) {
      skipped.push({
        path: image.path,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }

  if (document.getPageCount() === 0) {
    throw new AppError('E_FORMAT', 'Khong tao duoc trang nao tu anh da chon');
  }

  context.report(85, 'writing', 'tasks.verifying');

  const raw = await document.save({ useObjectStreams: true });
  const tempOutput = join(tempDir, 'images.pdf');
  const { writeFile } = await import('node:fs/promises');
  await writeFile(tempOutput, raw);

  // Tối ưu cấu trúc bằng qpdf cho tệp nhỏ hơn.
  const optimized = join(tempDir, 'images-optimized.pdf');
  const result = await qpdf.run(
    ['--object-streams=generate', '--compress-streams=y', tempOutput, optimized],
    { signal },
  );
  const finalPath =
    result.exitCode === QPDF_EXIT_OK || result.exitCode === QPDF_EXIT_WARNING
      ? optimized
      : tempOutput;

  const verification = await verifyOutput(
    finalPath,
    document.getPageCount(),
    async (filePath) => {
      const valid = await qpdf.check(filePath, { signal });
      const count = valid ? await qpdf.pageCount(filePath, { signal }) : null;
      return { valid, pageCount: count };
    },
  );

  if (!verification.ok) {
    throw new AppError('E_STRUCT', 'Tep dau ra khong hop le', verification.reason);
  }

  const finalized = await finalizeOutput(
    finalPath,
    payload.outputDirectory,
    `${payload.outputName}.pdf`,
  );

  context.report(100, 'writing', 'tasks.done');

  return { outputPaths: [finalized.path], skipped };
}

/** Tên tệp mặc định khi không có tên do người dùng đặt. */
export function defaultImagesName(): string {
  return 'Images';
}

/** Cỡ giấy mặc định theo vùng của hệ điều hành. */
export function defaultPaperSize(systemLanguage: string): PaperSize {
  const country = systemLanguage.split('-')[1]?.toUpperCase() ?? '';
  // Hoa Kỳ và Canada dùng Letter, phần còn lại dùng A4.
  return country === 'US' || country === 'CA' ? 'letter' : 'a4';
}
