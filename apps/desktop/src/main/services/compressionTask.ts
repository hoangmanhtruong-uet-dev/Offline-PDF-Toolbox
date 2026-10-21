import { basename, join } from 'node:path';

import { PDFDict, PDFDocument, PDFName, PDFNumber, PDFRawStream } from 'pdf-lib';

import { AppError } from '@shared/errors';
import type { CompressionEstimate, CompressTaskPayload, TaskDetails } from '@shared/tasks';
import type { CompressionLevel } from '@shared/types';

import { finalizeOutput, verifyOutput } from './outputVerifier';
import { COMPRESSION_PROFILES, MIN_SAVING_RATIO } from './compression/levels';
import { processImage } from './compression/imageProcessor';
import { scanImages } from './compression/imageScanner';
import type { ScannedImage } from './compression/imageScanner';
import { QPDF_EXIT_OK, QPDF_EXIT_WARNING } from './qpdfRunner';
import type { QpdfRunner } from './qpdfRunner';
import { preflight } from './pdfTasks';
import type { TaskContext } from './taskQueue';

/**
 * Quy trình nén PDF (F-03), theo tám bước trong ARCHITECTURE.md mục 7.
 *
 * 1. Kiểm tra đầu vào bằng qpdf.
 * 2. Quét ảnh nhúng.
 * 3. Tính độ phân giải hiệu dụng (đã tính khi quét, nhờ CTM của trang).
 * 4. Quyết định xử lý từng ảnh.
 * 5. Ghi lại ảnh đã thay vào bản sao tệp, giữ nguyên văn bản và vector.
 * 6. Tối ưu cấu trúc bằng qpdf.
 * 7. So sánh dung lượng.
 * 8. Ước lượng trước khi chạy (xem `estimateCompression`).
 */


/**
 * Ước lượng mức giảm dung lượng.
 *
 * Xử lý thử ảnh lớn nhất rồi suy ra tỉ lệ cho toàn bộ ảnh — đúng như đặc tả
 * yêu cầu ở bước 8.
 */
export async function estimateCompression(
  filePath: string,
  level: CompressionLevel,
): Promise<CompressionEstimate> {
  const profile = COMPRESSION_PROFILES[level];
  const bytes = await readFileBytes(filePath);

  const document = await loadDocument(bytes);
  const scan = scanImages(document);

  const candidates = scan.images.filter((image) => image.processable);
  if (candidates.length === 0) {
    return {
      imageBytes: scan.totalImageBytes,
      estimatedImageBytes: scan.totalImageBytes,
      imageRatio: 1,
      processableImages: 0,
      skippedImages: scan.images.length,
    };
  }

  // Thử trên ảnh lớn nhất.
  const largest = candidates.reduce((biggest, image) =>
    image.originalBytes > biggest.originalBytes ? image : biggest,
  );

  const raw = readRawImage(document, largest);
  let imageRatio = 1;

  if (raw) {
    const processed = await processImage(largest, raw, profile);
    if (processed && processed.originalBytes > 0) {
      imageRatio = Math.min(1, processed.newBytes / processed.originalBytes);
    }
  }

  const estimatedImageBytes = Math.round(
    candidates.reduce((sum, image) => sum + image.originalBytes * imageRatio, 0),
  );

  return {
    imageBytes: scan.totalImageBytes,
    estimatedImageBytes,
    imageRatio,
    processableImages: candidates.length,
    skippedImages: scan.images.length - candidates.length,
  };
}

/**
 * Chạy tác vụ nén.
 */
export async function runCompress(
  context: TaskContext,
  payload: CompressTaskPayload,
  qpdf: QpdfRunner,
): Promise<{
  outputPaths: string[];
  skipped: { path: string; reason: string }[];
  details?: TaskDetails;
}> {
  const { signal, tempDir } = context;

  context.report(5, 'reading', 'tasks.preparing');

  const check = await preflight([{ path: payload.path, password: payload.password }], qpdf, tempDir, signal);

  if (check.locked.length > 0) {
    throw new AppError('E_AUTH', 'Tep duoc bao ve bang mat khau', undefined, [basename(payload.path)]);
  }

  if (check.broken.length > 0) {
    throw new AppError('E_STRUCT', 'Khong doc duoc tep', check.broken[0]?.message, [basename(payload.path)]);
  }

  const source = check.usable[0]?.path ?? payload.path;
  const originalBytes = await fileSize(source);

  // Tạo sẵn thư mục đích, kể cả khi người dùng chọn thư mục chưa tồn tại.
  await mkdir(payload.outputDirectory);

  context.report(20, 'processing', 'tasks.compressing');

  // Khi người dùng chọn dung lượng đích, thử lần lượt các mức từ Nhẹ đến
  // Mạnh cho tới khi đạt được.
  const levels: CompressionLevel[] = payload.targetBytes
    ? (['light', 'medium', 'strong'] as CompressionLevel[])
    : [payload.level];

  let chosen: CompressionAttempt | null = null;
  let best: CompressionAttempt | null = null;

  for (const level of levels) {
    const attempt = await compressAtLevel(source, level, tempDir, qpdf, signal);
    if (!best || attempt.newBytes < best.newBytes) best = attempt;

    const smaller = attempt.newBytes < attempt.originalBytes;
    const fits = payload.targetBytes ? attempt.newBytes <= payload.targetBytes : true;

    if (smaller && fits) {
      chosen = attempt;
      break;
    }

    if (!payload.targetBytes) break;
  }

  if (!chosen) {
    if (payload.targetBytes) {
      throw new AppError(
        'E_STRUCT',
        'Khong dat duoc dung luong dich',
        `nho nhat dat duoc ${best?.newBytes ?? 0} byte, yeu cau ${payload.targetBytes} byte`,
      );
    }
    throw new AppError(
      'E_STRUCT',
      'Tep nay da duoc toi uu, khong giam them duoc',
      `truoc ${originalBytes} byte, sau ${best?.newBytes ?? 0} byte`,
    );
  }

  context.report(80, 'verifying', 'tasks.verifying');

  const verification = await verifyOutput(chosen.path, chosen.pageCount, async (filePath) => {
    const valid = await qpdf.check(filePath, { signal });
    const count = valid ? await qpdf.pageCount(filePath, { signal }) : null;
    return { valid, pageCount: count };
  });

  if (!verification.ok) {
    throw new AppError('E_STRUCT', 'Tep dau ra khong hop le', verification.reason);
  }

  const finalized = await finalizeOutput(
    chosen.path,
    payload.outputDirectory,
    `${payload.outputName}.pdf`,
  );

  context.report(100, 'writing', 'tasks.done');

  return {
    outputPaths: [finalized.path],
    skipped: [],
    details: {
      originalBytes,
      newBytes: chosen.newBytes,
      pageCount: chosen.pageCount,
      imagesProcessed: chosen.imagesProcessed,
      imagesSkipped: chosen.imagesSkipped.length,
      levelUsed: chosen.level,
    },
  };
}

/** Một lần thử nén ở một mức cụ thể. */
interface CompressionAttempt {
  level: CompressionLevel;
  /** Đường dẫn tệp tạm đã tối ưu. */
  path: string;
  originalBytes: number;
  newBytes: number;
  pageCount: number;
  imagesProcessed: number;
  imagesSkipped: { name: string; reason: string }[];
}

/** Nén tài liệu ở một mức, trả về tệp tạm đã tối ưu. */
async function compressAtLevel(
  source: string,
  level: CompressionLevel,
  tempDir: string,
  qpdf: QpdfRunner,
  signal: AbortSignal | undefined,
): Promise<CompressionAttempt> {
  const profile = COMPRESSION_PROFILES[level];

  const result = await compressDocument(source, profile, signal);

  const compressedPath = join(tempDir, `images-${level}.pdf`);
  await writeFile(compressedPath, result.bytes);

  const optimizedPath = join(tempDir, `compressed-${level}.pdf`);
  const optimize = await qpdf.run(
    [
      '--object-streams=generate',
      '--compress-streams=y',
      '--recompress-flate',
      compressedPath,
      optimizedPath,
    ],
    { signal },
  );

  if (optimize.exitCode !== QPDF_EXIT_OK && optimize.exitCode !== QPDF_EXIT_WARNING) {
    throw new AppError('E_STRUCT', 'Khong toi uu duoc tep', optimize.stderr.trim());
  }

  return {
    level,
    path: optimizedPath,
    originalBytes: await fileSize(source),
    newBytes: await fileSize(optimizedPath),
    pageCount: result.pageCount,
    imagesProcessed: result.imagesProcessed,
    imagesSkipped: result.imagesSkipped,
  };
}

/** Kết quả nén tài liệu. */
interface DocumentCompressionResult {
  pageCount: number;
  imagesProcessed: number;
  imagesSkipped: { name: string; reason: string }[];
  bytes: Uint8Array;
}

/**
 * Nén các ảnh nhúng trong tài liệu.
 *
 * Dùng pdf-lib để thay nội dung luồng ảnh. Luồng nội dung trang (văn bản và
 * hình vector) **không** bị đụng tới, nên văn bản vẫn chọn và tìm kiếm được.
 */
async function compressDocument(
  source: string,
  profile: (typeof COMPRESSION_PROFILES)[keyof typeof COMPRESSION_PROFILES],
  signal: AbortSignal | undefined,
): Promise<DocumentCompressionResult> {
  const bytes = await readFileBytes(source);
  const document = await loadDocument(bytes);
  const scan = scanImages(document);

  const imagesSkipped: { name: string; reason: string }[] = [];
  let imagesProcessed = 0;

  if (profile.stripMetadata) {
    stripDocumentMetadata(document);
  }

  for (const image of scan.images) {
    if (signal?.aborted) throw new AppError('E_UNKNOWN', 'Tac vu da bi huy');

    if (!image.processable) {
      imagesSkipped.push({ name: image.name, reason: image.skipReason ?? 'khong xu ly duoc' });
      continue;
    }

    const raw = readRawImage(document, image);
    if (!raw) {
      imagesSkipped.push({ name: image.name, reason: 'khong doc duoc du lieu anh' });
      continue;
    }

    const processed = await processImage(image, raw, profile);
    if (!processed) {
      imagesSkipped.push({ name: image.name, reason: 'khong nen lai duoc anh' });
      continue;
    }

    // Chỉ thay khi bản mới nhỏ hơn ít nhất 5%.
    const saving = 1 - processed.newBytes / Math.max(1, processed.originalBytes);
    if (saving < MIN_SAVING_RATIO) {
      imagesSkipped.push({ name: image.name, reason: 'anh moi khong nho hon du' });
      continue;
    }

    if (!replaceImageStream(document, image, processed)) {
      imagesSkipped.push({ name: image.name, reason: 'khong ghi lai duoc anh' });
      continue;
    }

    imagesProcessed += 1;
  }

  const output = await document.save({
    useObjectStreams: false,
    addDefaultPage: false,
    updateFieldAppearances: false,
  });

  return {
    pageCount: document.getPageCount(),
    imagesProcessed,
    imagesSkipped,
    bytes: output,
  };
}

/**
 * Bỏ siêu dữ liệu không cần thiết của tài liệu.
 *
 * Mức Mạnh bỏ thông tin tài liệu (tiêu đề, tác giả, ứng dụng tạo) và
 * siêu dữ liệu XMP. Đây là thông tin có thể chứa thông tin riêng tư của người
 * dùng, nên bỏ đi cũng tốt cho quyền riêng tư.
 */
function stripDocumentMetadata(document: PDFDocument): void {
  document.setTitle('');
  document.setAuthor('');
  document.setSubject('');
  document.setKeywords([]);
  document.setProducer('');
  document.setCreator('');
  document.setCreationDate(new Date(0));
  document.setModificationDate(new Date(0));

  // Siêu dữ liệu XMP nằm trong catalog.
  document.catalog.delete(PDFName.of('Metadata'));
}

/** Đọc dữ liệu thô của một đối tượng ảnh. */
function readRawImage(document: PDFDocument, image: ScannedImage): Uint8Array | null {
  if (!image.ref) return null;
  const object = document.context.lookup(image.ref);
  if (!(object instanceof PDFRawStream)) return null;
  return object.contents;
}

/**
 * Thay nội dung và thông tin của một luồng ảnh.
 *
 * Giữ nguyên mặt nạ SMask và toàn bộ thông tin vị trí trên trang; chỉ thay
 * dữ liệu ảnh nền, kích thước pixel và bộ lọc.
 */
function replaceImageStream(
  document: PDFDocument,
  image: ScannedImage,
  processed: { bytes: Uint8Array; width: number; height: number },
): boolean {
  const ref = image.ref;
  const object = ref
    ? document.context.lookup(ref)
    : (image.parent?.get(PDFName.of(image.name)) as PDFRawStream | undefined);

  if (!(object instanceof PDFRawStream)) return false;

  const dict = object.dict as PDFDict;

  // Ảnh có mặt nạ mềm: giữ nguyên kích thước để mặt nạ còn khớp.
  const keepSize = image.hasSoftMask;

  dict.set(PDFName.of('Filter'), PDFName.of('DCTDecode'));
  dict.set(PDFName.of('Length'), PDFNumber.of(processed.bytes.length));
  dict.set(PDFName.of('Width'), PDFNumber.of(keepSize ? image.pixelWidth : processed.width));
  dict.set(PDFName.of('Height'), PDFNumber.of(keepSize ? image.pixelHeight : processed.height));
  dict.set(PDFName.of('BitsPerComponent'), PDFNumber.of(8));
  dict.delete(PDFName.of('DecodeParms'));
  dict.delete(PDFName.of('Decode'));

  // Không gian màu: giữ thang xám nếu ảnh gốc là thang xám.
  if (image.channels === 1) {
    dict.set(PDFName.of('ColorSpace'), PDFName.of('DeviceGray'));
  } else {
    dict.set(PDFName.of('ColorSpace'), PDFName.of('DeviceRGB'));
  }

  // Nội dung của PDFRawStream là chỉ đọc, nên thay cả đối tượng trong ngữ
  // cảnh thay vì gán lại thuộc tính.
  const replacement = PDFRawStream.of(dict, processed.bytes);

  if (ref) {
    document.context.assign(ref, replacement);
  } else if (image.parent) {
    image.parent.set(PDFName.of(image.name), replacement);
  } else {
    return false;
  }

  return true;
}

/** Nạp tài liệu PDF, bỏ qua mật khẩu. */
async function loadDocument(bytes: Uint8Array): Promise<PDFDocument> {
  try {
    return await PDFDocument.load(bytes, {
      updateMetadata: false,
      ignoreEncryption: true,
      throwOnInvalidObject: false,
    });
  } catch (error) {
    throw new AppError(
      'E_STRUCT',
      'Khong mo duoc tep PDF',
      error instanceof Error ? error.message : String(error),
    );
  }
}

/** Đọc toàn bộ nội dung một tệp. */
async function readFileBytes(path: string): Promise<Uint8Array> {
  const { readFile } = await import('node:fs/promises');
  try {
    return new Uint8Array(await readFile(path));
  } catch (error) {
    throw new AppError(
      'E_PERM',
      'Khong doc duoc tep',
      error instanceof Error ? error.message : String(error),
    );
  }
}

/** Ghi nội dung ra tệp. */
async function writeFile(path: string, bytes: Uint8Array): Promise<void> {
  const { writeFile: write } = await import('node:fs/promises');
  await write(path, bytes);
}

/** Tạo thư mục (kể cả thư mục cha). */
async function mkdir(path: string): Promise<void> {
  const { mkdir: make } = await import('node:fs/promises');
  await make(path, { recursive: true });
}

/** Lấy dung lượng tệp. */
async function fileSize(path: string): Promise<number> {
  const { stat } = await import('node:fs/promises');
  try {
    return (await stat(path)).size;
  } catch {
    return 0;
  }
}

