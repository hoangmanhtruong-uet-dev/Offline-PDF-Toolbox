import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';

import { PDFDict, PDFDocument, PDFName, StandardFonts, degrees, rgb } from 'pdf-lib';

import { AppError, toErrorPayload } from '@shared/errors';
import { OUTPUT_TEMPLATES, stripExtension } from '@shared/naming';
import type {
  BatchTaskPayload,
  PrivacyTaskPayload,
  ProtectTaskPayload,
  StampTaskPayload,
} from '@shared/tasks';

import { finalizeOutput, verifyOutput } from './outputVerifier';
import { preflight } from './pdfTasks';
import { runCompress } from './compressionTask';
import { runRotate } from './pdfTasks';
import type { QpdfRunner } from './qpdfRunner';
import type { TaskContext } from './taskQueue';

/**
 * Các tác vụ bổ sung: đóng dấu và đánh số trang, đặt hoặc gỡ mật khẩu, xóa
 * siêu dữ liệu và xử lý hàng loạt.
 *
 * Mọi tác vụ theo cùng trình tự với các tác vụ gốc: ghi ra tệp tạm, kiểm tra
 * lại bằng qpdf, rồi mới di chuyển vào thư mục đích với tên không trùng.
 */

type TaskOutput = { outputPaths: string[]; skipped: { path: string; reason: string }[] };

/** Kiểm tra cấu trúc tệp đầu ra và đếm trang bằng qpdf. */
function inspector(qpdf: QpdfRunner, signal: AbortSignal, passwordFile?: string) {
  return async (filePath: string): Promise<{ valid: boolean; pageCount: number | null }> => {
    const checkArgs = passwordFile
      ? ['--check', `--password-file=${passwordFile}`, filePath]
      : ['--check', filePath];
    const check = await qpdf.run(checkArgs, { signal });
    const valid = check.exitCode === 0 || check.exitCode === 3;
    const pageCount = valid ? await qpdf.pageCount(filePath, { signal, passwordFile }) : null;
    return { valid, pageCount };
  };
}

/**
 * Bỏ dấu tiếng Việt để font chuẩn của PDF (WinAnsi) vẽ được chữ.
 *
 * Font chuẩn không có chữ có dấu tiếng Việt; thay vì báo lỗi, ứng dụng vẽ
 * phiên bản không dấu của đoạn chữ.
 */
export function toLatinText(text: string): string {
  return text
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\x20-\x7e]/g, '?');
}

/** Đọc tệp PDF bằng pdf-lib, đổi lỗi mật khẩu và hỏng thành AppError. */
async function loadPdf(path: string): Promise<PDFDocument> {
  const bytes = await readFile(path);
  try {
    return await PDFDocument.load(bytes, { updateMetadata: false });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/encrypted/i.test(message)) {
      throw new AppError('E_AUTH', 'Tep duoc bao ve bang mat khau', undefined, [basename(path)]);
    }
    throw new AppError('E_STRUCT', 'Khong doc duoc tep', message, [basename(path)]);
  }
}

/** Ghi tài liệu ra tệp tạm, kiểm tra rồi chuyển vào thư mục đích. */
async function saveAndFinalize(
  context: TaskContext,
  qpdf: QpdfRunner,
  doc: PDFDocument,
  outputDirectory: string,
  outputName: string,
  expectedPages: number,
): Promise<TaskOutput> {
  const { signal, tempDir } = context;
  const tempOutput = join(tempDir, 'output.pdf');
  await writeFile(tempOutput, await doc.save());

  context.report(85, 'verifying', 'tasks.verifying');
  const verification = await verifyOutput(tempOutput, expectedPages, inspector(qpdf, signal));
  if (!verification.ok) {
    throw new AppError('E_STRUCT', 'Tep dau ra khong hop le', verification.reason);
  }

  const finalized = await finalizeOutput(tempOutput, outputDirectory, `${outputName}.pdf`);
  context.report(100, 'writing', 'tasks.done');
  return { outputPaths: [finalized.path], skipped: [] };
}

/**
 * Đóng dấu chữ chìm và đánh số trang.
 *
 * Dấu chìm vẽ chéo 45 độ giữa trang, mờ vừa phải để không che nội dung.
 */
export async function runStamp(
  context: TaskContext,
  payload: StampTaskPayload,
  qpdf: QpdfRunner,
): Promise<TaskOutput> {
  context.report(5, 'reading', 'tasks.preparing');

  const watermark = toLatinText(payload.watermarkText.trim());
  if (!watermark && payload.pageNumbers === 'none') {
    throw new AppError('E_PATH', 'Chua chon dong dau hoac danh so trang');
  }

  const doc = await loadPdf(payload.path);
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const pages = doc.getPages();
  const total = pages.length;

  context.report(30, 'processing', 'tasks.stamping');

  pages.forEach((page, index) => {
    const { width, height } = page.getSize();

    if (watermark) {
      // Cỡ chữ sao cho dấu chiếm khoảng 62% đường chéo của trang.
      const diagonal = Math.hypot(width, height);
      const baseWidth = font.widthOfTextAtSize(watermark, 100);
      const size = Math.max(14, Math.min(160, (diagonal * 0.62 * 100) / Math.max(1, baseWidth)));
      const textWidth = font.widthOfTextAtSize(watermark, size);
      const textHeight = size * 0.7;
      const angle = Math.PI / 4;

      const x = width / 2 - (textWidth / 2) * Math.cos(angle) + (textHeight / 2) * Math.sin(angle);
      const y = height / 2 - (textWidth / 2) * Math.sin(angle) - (textHeight / 2) * Math.cos(angle);

      page.drawText(watermark, {
        x,
        y,
        size,
        font,
        rotate: degrees(45),
        color: rgb(0.55, 0.36, 0.96),
        opacity: Math.max(0.05, Math.min(1, payload.watermarkOpacity)),
      });
    }

    if (payload.pageNumbers !== 'none') {
      const label =
        payload.pageNumberFormat === 'n-of-total' ? `${index + 1} / ${total}` : `${index + 1}`;
      const size = 10;
      const margin = 24;
      const textWidth = font.widthOfTextAtSize(label, size);

      let x = (width - textWidth) / 2;
      let y = margin;
      if (payload.pageNumbers === 'bottom-right') x = width - margin - textWidth;
      if (payload.pageNumbers === 'bottom-left') x = margin;
      if (payload.pageNumbers === 'top-right') {
        x = width - margin - textWidth;
        y = height - margin - size;
      }

      page.drawText(label, { x, y, size, font, color: rgb(0.2, 0.2, 0.25) });
    }
  });

  return saveAndFinalize(context, qpdf, doc, payload.outputDirectory, payload.outputName, total);
}

/**
 * Xóa siêu dữ liệu (tiêu đề, tác giả, phần mềm tạo, XMP) khỏi tệp PDF.
 */
export async function runPrivacy(
  context: TaskContext,
  payload: PrivacyTaskPayload,
  qpdf: QpdfRunner,
): Promise<TaskOutput> {
  context.report(5, 'reading', 'tasks.preparing');

  const doc = await loadPdf(payload.path);
  context.report(40, 'processing', 'tasks.cleaning');

  const infoRef = doc.context.trailerInfo.Info;
  if (infoRef) {
    const info = doc.context.lookup(infoRef);
    if (info instanceof PDFDict) {
      for (const key of info.keys()) info.delete(key);
    }
  }
  doc.catalog.delete(PDFName.of('Metadata'));

  return saveAndFinalize(
    context,
    qpdf,
    doc,
    payload.outputDirectory,
    payload.outputName,
    doc.getPageCount(),
  );
}

/**
 * Đặt hoặc gỡ mật khẩu bằng qpdf (AES-256).
 *
 * Mật khẩu không nằm trên dòng lệnh: qpdf đọc tham số từ tệp `@args` ghi
 * trong thư mục tạm của tác vụ, và thư mục này bị xóa khi tác vụ kết thúc.
 */
export async function runProtect(
  context: TaskContext,
  payload: ProtectTaskPayload,
  qpdf: QpdfRunner,
): Promise<TaskOutput> {
  const { signal, tempDir } = context;

  context.report(5, 'reading', 'tasks.preparing');

  if (payload.password.length === 0) {
    throw new AppError('E_AUTH', 'Chua nhap mat khau');
  }

  const tempOutput = join(tempDir, 'protected.pdf');

  if (payload.mode === 'decrypt') {
    const check = await preflight(
      [{ path: payload.path, password: payload.password }],
      qpdf,
      tempDir,
      signal,
    );
    if (check.locked.length > 0) {
      throw new AppError('E_AUTH', 'Mat khau khong dung', undefined, [basename(payload.path)]);
    }
    if (check.broken.length > 0) {
      throw new AppError('E_STRUCT', 'Khong doc duoc tep', check.broken[0]?.message, [
        basename(payload.path),
      ]);
    }

    const usable = check.usable[0];
    if (!usable) throw new AppError('E_STRUCT', 'Khong doc duoc tep');

    context.report(45, 'processing', 'tasks.unlocking');
    await qpdf.runOrThrow(['--decrypt', usable.path, tempOutput], { signal });

    context.report(85, 'verifying', 'tasks.verifying');
    const verification = await verifyOutput(tempOutput, usable.pageCount, inspector(qpdf, signal));
    if (!verification.ok) {
      throw new AppError('E_STRUCT', 'Tep dau ra khong hop le', verification.reason);
    }

    const finalized = await finalizeOutput(tempOutput, payload.outputDirectory, `${payload.outputName}.pdf`);
    context.report(100, 'writing', 'tasks.done');
    return { outputPaths: [finalized.path], skipped: [] };
  }

  const check = await preflight([{ path: payload.path }], qpdf, tempDir, signal);
  if (check.locked.length > 0) {
    throw new AppError('E_AUTH', 'Tep da co mat khau', undefined, [basename(payload.path)]);
  }
  if (check.broken.length > 0) {
    throw new AppError('E_STRUCT', 'Khong doc duoc tep', check.broken[0]?.message, [
      basename(payload.path),
    ]);
  }
  const usable = check.usable[0];
  if (!usable) throw new AppError('E_STRUCT', 'Khong doc duoc tep');

  // Tệp tham số của qpdf: mỗi dòng một tham số, mật khẩu không lộ trên dòng lệnh.
  const argLines = ['--encrypt', payload.password, payload.password, '256'];
  if (payload.disablePrinting) argLines.push('--print=none');
  if (payload.disableCopying) argLines.push('--extract=n');
  argLines.push('--', usable.path, tempOutput);

  const argsFile = join(tempDir, 'encrypt-args.txt');
  await writeFile(argsFile, argLines.join('\n'), { encoding: 'utf8', mode: 0o600 });

  context.report(45, 'processing', 'tasks.protecting');
  await qpdf.runOrThrow([`@${argsFile}`], { signal });

  context.report(85, 'verifying', 'tasks.verifying');
  const passwordFile = join(tempDir, 'verify-password.txt');
  await writeFile(passwordFile, payload.password, { encoding: 'utf8', mode: 0o600 });

  const verification = await verifyOutput(
    tempOutput,
    usable.pageCount,
    inspector(qpdf, signal, passwordFile),
  );
  if (!verification.ok) {
    throw new AppError('E_STRUCT', 'Tep dau ra khong hop le', verification.reason);
  }

  const finalized = await finalizeOutput(tempOutput, payload.outputDirectory, `${payload.outputName}.pdf`);
  context.report(100, 'writing', 'tasks.done');
  return { outputPaths: [finalized.path], skipped: [] };
}

/**
 * Xử lý hàng loạt: áp dụng một thao tác cho nhiều tệp, lần lượt từng tệp.
 *
 * Tệp lỗi được ghi nhận rồi bỏ qua, các tệp còn lại vẫn tiếp tục.
 */
export async function runBatch(
  context: TaskContext,
  payload: BatchTaskPayload,
  qpdf: QpdfRunner,
): Promise<TaskOutput> {
  const outputPaths: string[] = [];
  const skipped: TaskOutput['skipped'] = [];
  const total = payload.paths.length;

  if (total === 0) throw new AppError('E_PATH', 'Chua chon tep nao');

  for (let index = 0; index < total; index += 1) {
    if (context.signal.aborted) throw new AppError('E_UNKNOWN', 'Tac vu da bi huy');

    const path = payload.paths[index] as string;
    const name = stripExtension(basename(path));
    const outputDirectory = payload.outputDirectory || dirname(path);

    // Mỗi tệp có thư mục tạm con riêng và tiến độ được quy về cả lô.
    const subDir = join(context.tempDir, `batch-${index}`);
    await mkdir(subDir, { recursive: true });
    const sub: TaskContext = {
      ...context,
      tempDir: subDir,
      report: (percent, phase, messageKey) =>
        context.report(((index + percent / 100) / total) * 100, phase, messageKey),
    };

    try {
      const op = payload.operation;
      let result: TaskOutput;

      switch (op.kind) {
        case 'compress':
          result = await runCompress(
            sub,
            {
              path,
              level: op.level,
              outputDirectory,
              outputName: OUTPUT_TEMPLATES.compressed.replace('{name}', name),
            },
            qpdf,
          );
          break;
        case 'rotate':
          result = await runRotate(
            sub,
            {
              path,
              pageSelection: { kind: 'all' },
              angle: op.angle,
              outputDirectory,
              outputName: OUTPUT_TEMPLATES.rotated.replace('{name}', name),
            },
            qpdf,
          );
          break;
        case 'stamp':
          result = await runStamp(
            sub,
            {
              path,
              watermarkText: op.watermarkText,
              watermarkOpacity: op.watermarkOpacity,
              pageNumbers: op.pageNumbers,
              pageNumberFormat: 'n-of-total',
              outputDirectory,
              outputName: OUTPUT_TEMPLATES.stamped.replace('{name}', name),
            },
            qpdf,
          );
          break;
        case 'privacy':
          result = await runPrivacy(
            sub,
            {
              path,
              outputDirectory,
              outputName: OUTPUT_TEMPLATES.cleaned.replace('{name}', name),
            },
            qpdf,
          );
          break;
        case 'protect':
          result = await runProtect(
            sub,
            {
              path,
              mode: 'encrypt',
              password: op.password,
              outputDirectory,
              outputName: OUTPUT_TEMPLATES.protected.replace('{name}', name),
            },
            qpdf,
          );
          break;
        default: {
          const exhaustive: never = op;
          throw new Error(`Thao tac khong duoc ho tro: ${JSON.stringify(exhaustive)}`);
        }
      }

      outputPaths.push(...result.outputPaths);
    } catch (error) {
      if (context.signal.aborted) throw error;
      skipped.push({ path, reason: toErrorPayload(error).messageKey });
    }
  }

  if (outputPaths.length === 0) {
    throw new AppError('E_STRUCT', 'Khong xu ly duoc tep nao', undefined, skipped.map((item) => basename(item.path)));
  }

  context.report(100, 'writing', 'tasks.done');
  return { outputPaths, skipped };
}
