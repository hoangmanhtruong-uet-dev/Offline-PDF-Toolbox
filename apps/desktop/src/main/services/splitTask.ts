import { mkdir, stat } from 'node:fs/promises';
import { basename, join } from 'node:path';

import { AppError } from '@shared/errors';
import { applyTemplate } from '@shared/naming';
import { chunkRanges, parsePageRange, resolveOpenEndedRanges, toQpdfRange } from '@shared/pageRange';
import type { PageRange } from '@shared/pageRange';
import type { SplitTaskPayload } from '@shared/tasks';

import { finalizeOutput, verifyOutput } from './outputVerifier';
import { QPDF_EXIT_OK, QPDF_EXIT_WARNING } from './qpdfRunner';
import type { QpdfRunner } from './qpdfRunner';
import { preflight } from './pdfTasks';
import type { TaskContext } from './taskQueue';

/**
 * Thực thi tác vụ tách PDF (F-02).
 *
 * Sáu chế độ theo đặc tả:
 * 1. Theo khoảng trang — mỗi khoảng thành một tệp.
 * 2. Mỗi N trang — cắt đều.
 * 3. Mỗi trang một tệp.
 * 4. Theo dấu trang cấp 1 — mỗi chương một tệp.
 * 5. Theo dung lượng tối đa — mỗi phần không vượt quá giới hạn.
 * 6. Trích trang — các trang đã chọn thành một tệp duy nhất.
 */

/** Một phần kết quả tách. */
interface SplitPart {
  /** Các khoảng trang thuộc phần này. */
  ranges: PageRange[];
  /** Tên tệp đầu ra (chưa kèm phần mở rộng). */
  name: string;
}

/** Tổng số trang của các khoảng. */
function countPages(ranges: PageRange[]): number {
  return ranges.reduce((sum, range) => sum + (range.end - range.start + 1), 0);
}

/** Dựng danh sách phần theo chế độ tách. */
export function buildSplitParts(
  payload: SplitTaskPayload,
  pageCount: number,
): SplitPart[] {
  const baseName = basename(payload.path).replace(/\.pdf$/i, '');

  switch (payload.mode) {
    case 'ranges': {
      const parsed = parsePageRange(payload.ranges ?? '', pageCount);
      if (!parsed.ok) {
        throw new AppError('E_PATH', 'Dai trang khong hop le');
      }
      const ranges = resolveOpenEndedRanges(parsed.ranges, pageCount);
      return ranges.map((range, index) => ({
        ranges: [range],
        name: applyTemplate(payload.outputNameTemplate, {
          name: baseName,
          index: index + 1,
          from: range.start,
          to: range.end,
        }),
      }));
    }

    case 'everyN': {
      const size = payload.everyN ?? 1;
      if (!Number.isInteger(size) || size < 1) {
        throw new AppError('E_PATH', 'So trang moi phan phai la so nguyen duong');
      }
      return chunkRanges(pageCount, size).map((range, index) => ({
        ranges: [range],
        name: applyTemplate(payload.outputNameTemplate, {
          name: baseName,
          index: index + 1,
          from: range.start,
          to: range.end,
        }),
      }));
    }

    case 'eachPage': {
      return Array.from({ length: pageCount }, (_unused, index) => ({
        ranges: [{ start: index + 1, end: index + 1 }],
        name: applyTemplate(payload.outputNameTemplate, {
          name: baseName,
          index: index + 1,
          from: index + 1,
          to: index + 1,
        }),
      }));
    }

    case 'bookmarks': {
      const starts = [...new Set(payload.bookmarkPages ?? [])].sort((a, b) => a - b);
      if (starts.length === 0) {
        throw new AppError('E_PATH', 'Tai lieu khong co muc sach nao');
      }

      return starts.map((start, index) => {
        const end = index + 1 < starts.length ? (starts[index + 1] as number) - 1 : pageCount;
        return {
          ranges: [{ start, end: Math.max(start, end) }],
          name: applyTemplate(payload.outputNameTemplate, {
            name: baseName,
            index: index + 1,
            from: start,
            to: Math.max(start, end),
          }),
        };
      });
    }

    case 'extract': {
      const pages = [...new Set(payload.pages ?? [])].sort((a, b) => a - b);
      if (pages.length === 0) {
        throw new AppError('E_PATH', 'Chua chon trang nao');
      }
      return [
        {
          ranges: [{ start: pages[0] as number, end: pages[pages.length - 1] as number }],
          name: applyTemplate(payload.outputNameTemplate, { name: baseName, index: 1 }),
        },
      ];
    }

    case 'maxSize':
      // Được xử lý riêng vì cần đo dung lượng thực tế của từng phần.
      return [];

    default: {
      const exhaustive: never = payload.mode;
      throw new Error(`Che do tach khong duoc ho tro: ${JSON.stringify(exhaustive)}`);
    }
  }
}

/**
 * Chạy qpdf để trích một phần trang ra tệp.
 *
 * Tệp nguồn luôn là bản đã giải mã nếu có mật khẩu, nên không cần truyền
 * mật khẩu ở đây (và qpdf cũng không nhận `--password-file` bên trong khối
 * `--pages`).
 */
async function extractPart(
  qpdf: QpdfRunner,
  source: string,
  range: PageRange,
  output: string,
  signal: AbortSignal | undefined,
): Promise<void> {
  const args = [
    '--empty',
    '--pages',
    `--file=${source}`,
    `--range=${toQpdfRange([range], range.end)}`,
    '--',
    output,
  ];

  const result = await qpdf.run(args, { signal });
  if (result.exitCode !== QPDF_EXIT_OK && result.exitCode !== QPDF_EXIT_WARNING) {
    throw new AppError('E_STRUCT', 'Khong tach duoc tep', result.stderr.trim());
  }
}

/**
 * Chạy tác vụ tách.
 */
export async function runSplit(
  context: TaskContext,
  payload: SplitTaskPayload,
  qpdf: QpdfRunner,
): Promise<{ outputPaths: string[]; skipped: { path: string; reason: string }[] }> {
  const { signal, tempDir } = context;

  context.report(5, 'reading', 'tasks.preparing');

  const check = await preflight([{ path: payload.path, password: payload.password }], qpdf, tempDir, signal);

  if (check.locked.length > 0) {
    throw new AppError('E_AUTH', 'Tep duoc bao ve bang mat khau', undefined, [basename(payload.path)]);
  }

  if (check.broken.length > 0) {
    throw new AppError(
      'E_STRUCT',
      'Khong doc duoc tep',
      check.broken[0]?.message,
      [basename(payload.path)],
    );
  }

  const pageCount = check.usable[0]?.pageCount ?? 0;
  const source = check.usable[0]?.path ?? payload.path;

  // Tạo thư mục con để không lẫn kết quả với các tệp khác.
  const outputDir = join(payload.outputDirectory, payload.outputSubfolder);
  await mkdir(outputDir, { recursive: true });

  const outputPaths: string[] = [];

  if (payload.mode === 'maxSize') {
    await splitByMaxSize(context, payload, qpdf, source, outputDir, pageCount, outputPaths);
  } else {
    const parts = buildSplitParts(payload, pageCount);
    context.report(20, 'processing', 'tasks.splitting');

    for (let index = 0; index < parts.length; index += 1) {
      const part = parts[index] as SplitPart;
      const tempOutput = join(tempDir, `part-${index + 1}.pdf`);

      await extractPart(qpdf, source, part.ranges[0] as PageRange, tempOutput, signal);

      const verification = await verifyOutput(tempOutput, countPages(part.ranges), async (filePath) => {
        const valid = await qpdf.check(filePath, { signal });
        const count = valid ? await qpdf.pageCount(filePath, { signal }) : null;
        return { valid, pageCount: count };
      });

      if (!verification.ok) {
        throw new AppError('E_STRUCT', 'Tep dau ra khong hop le', verification.reason);
      }

      const finalized = await finalizeOutput(tempOutput, outputDir, `${part.name}.pdf`);
      outputPaths.push(finalized.path);

      context.report(
        20 + Math.round(((index + 1) / parts.length) * 70),
        'writing',
        'tasks.splitting',
      );
    }
  }

  context.report(100, 'writing', 'tasks.done');

  return { outputPaths, skipped: [] };
}

/**
 * Chế độ tách theo dung lượng tối đa.
 *
 * Cách làm theo đặc tả: ước lượng theo từng trang, ghi ra tệp, kiểm tra lại
 * dung lượng thật; nếu một phần vượt giới hạn thì lùi một trang rồi ghi lại.
 */
async function splitByMaxSize(
  context: TaskContext,
  payload: SplitTaskPayload,
  qpdf: QpdfRunner,
  source: string,
  outputDir: string,
  pageCount: number,
  outputPaths: string[],
): Promise<void> {
  const limit = payload.maxBytes ?? 10 * 1024 * 1024;
  if (limit <= 0) {
    throw new AppError('E_PATH', 'Gioi han dung luong phai lon hon 0');
  }

  // Ước lượng: dung lượng tệp chia đều theo số trang, tối thiểu 1 byte mỗi trang.
  const sourceSize = (await stat(source)).size;
  const perPage = Math.max(1, Math.ceil(sourceSize / Math.max(1, pageCount)));
  const pagesPerPart = Math.max(1, Math.floor(limit / perPage));

  const baseName = basename(payload.path).replace(/\.pdf$/i, '');
  let partIndex = 0;

  for (let start = 1; start <= pageCount; start += pagesPerPart) {
    let end = Math.min(start + pagesPerPart - 1, pageCount);
    const tempOutput = join(context.tempDir, `part-${partIndex + 1}.pdf`);

    // Ghi ra rồi kiểm tra dung lượng thật; vượt giới hạn thì lùi một trang.
    for (;;) {
      await extractPart(qpdf, source, { start, end }, tempOutput, context.signal);

      const info = await stat(tempOutput);
      if (info.size <= limit || end <= start) break;

      end -= 1;
    }

    const verification = await verifyOutput(tempOutput, end - start + 1, async (filePath) => {
      const valid = await qpdf.check(filePath, { signal: context.signal });
      const count = valid ? await qpdf.pageCount(filePath, { signal: context.signal }) : null;
      return { valid, pageCount: count };
    });

    if (!verification.ok) {
      throw new AppError('E_STRUCT', 'Tep dau ra khong hop le', verification.reason);
    }

    partIndex += 1;
    const name = applyTemplate(payload.outputNameTemplate, {
      name: baseName,
      index: partIndex,
      from: start,
      to: end,
    });

    const finalized = await finalizeOutput(tempOutput, outputDir, `${name}.pdf`);
    outputPaths.push(finalized.path);

    context.report(
      20 + Math.round((end / pageCount) * 70),
      'writing',
      'tasks.splitting',
    );

    start = end + 1;
  }
}
