import { basename, join } from 'node:path';

import { AppError } from '@shared/errors';

import { finalizeOutput, verifyOutput } from './outputVerifier';
import { QPDF_EXIT_OK, QPDF_EXIT_WARNING } from './qpdfRunner';
import type { QpdfRunner } from './qpdfRunner';
import type { TaskContext } from './taskQueue';

/**
 * Tác vụ Sắp xếp trang (F-05).
 *
 * Người dùng sắp xếp lại các trang của một hoặc nhiều tệp PDF, rồi lưu thành
 * một tệp mới. Thứ tự và hướng xoay của từng trang do giao diện quyết định.
 */

/** Một trang trong danh sách sắp xếp. */
export interface PageItem {
  /** Đường dẫn tệp nguồn. */
  path: string;
  /** Số trang trong tệp nguồn, bắt đầu từ 1. */
  pageNumber: number;
  /**
   * Góc xoay **cộng thêm** so với hướng sẵn có của trang, tính bằng độ.
   *
   * Dùng góc tương đối để không phụ thuộc vào hướng xoay gốc của tệp.
   */
  rotationDelta: 0 | 90 | 180 | 270;
}

export interface PagesTaskPayload {
  /** Các trang theo đúng thứ tự người dùng đã sắp. */
  pages: PageItem[];
  outputDirectory: string;
  outputName: string;
  /** Chỉ lưu những trang đã chọn, bỏ qua trang nào không chọn. */
  selectedPageIds?: string[];
}

/** Nhóm các trang theo tệp nguồn, giữ nguyên thứ tự xuất hiện. */
function groupBySource(pages: PageItem[]): { path: string; pages: PageItem[] }[] {
  const groups: { path: string; pages: PageItem[] }[] = [];

  for (const page of pages) {
    const last = groups[groups.length - 1];
    if (last && last.path === page.path) {
      last.pages.push(page);
      continue;
    }
    groups.push({ path: page.path, pages: [page] });
  }

  return groups;
}

/** Gom các trang liên tiếp có cùng góc xoay thành một khoảng. */
function groupByRotation(pages: PageItem[]): { delta: number; range: string }[] {
  const groups: { delta: number; start: number; end: number }[] = [];

  for (const page of pages) {
    const last = groups[groups.length - 1];
    if (last && last.delta === page.rotationDelta && last.end + 1 === page.pageNumber) {
      last.end = page.pageNumber;
      continue;
    }
    groups.push({ delta: page.rotationDelta, start: page.pageNumber, end: page.pageNumber });
  }

  return groups.map((group) => ({
    delta: group.delta,
    range: group.start === group.end ? `${group.start}` : `${group.start}-${group.end}`,
  }));
}

/**
 * Chạy tác vụ sắp xếp trang.
 */
export async function runPages(
  context: TaskContext,
  payload: PagesTaskPayload,
  qpdf: QpdfRunner,
): Promise<{ outputPaths: string[]; skipped: { path: string; reason: string }[] }> {
  const { signal, tempDir } = context;

  context.report(5, 'reading', 'tasks.preparing');

  const pages = payload.pages.filter(
    (page) => !payload.selectedPageIds || payload.selectedPageIds.includes(`${page.path}#${page.pageNumber}`),
  );

  if (pages.length === 0) {
    throw new AppError('E_PATH', 'Chua chon trang nao');
  }

  const groups = groupBySource(pages);
  const prepared: { path: string; ranges: string[] }[] = [];

  // Với mỗi tệp nguồn, tạo một bản đã xoay nếu cần.
  for (let index = 0; index < groups.length; index += 1) {
    const group = groups[index] as { path: string; pages: PageItem[] };

    const rotations = groupByRotation(group.pages);
    let source = group.path;

    const needsRotation = rotations.some((rotation) => rotation.delta !== 0);
    if (needsRotation) {
      const rotatedPath = join(tempDir, `rotated-${index}.pdf`);
      const args = [group.path];

      for (const rotation of rotations) {
        if (rotation.delta === 0) continue;
        args.push(`--rotate=+${rotation.delta}:${rotation.range}`);
      }
      args.push(rotatedPath);

      const result = await qpdf.run(args, { signal });
      if (result.exitCode !== QPDF_EXIT_OK && result.exitCode !== QPDF_EXIT_WARNING) {
        throw new AppError('E_STRUCT', 'Khong xoay duoc cac trang', result.stderr.trim());
      }
      source = rotatedPath;
    }

    prepared.push({ path: source, ranges: group.pages.map((page) => String(page.pageNumber)) });
  }

  context.report(40, 'processing', 'tasks.assembling');

  // Ghép các trang theo đúng thứ tự người dùng đã sắp.
  const args: string[] = ['--empty', '--pages'];
  for (const item of prepared) {
    for (const range of item.ranges) {
      args.push(`--file=${item.path}`, `--range=${range}`);
    }
  }
  args.push('--');

  const tempOutput = join(tempDir, 'pages.pdf');
  args.push(tempOutput);

  const result = await qpdf.run(args, { signal });
  if (result.exitCode !== QPDF_EXIT_OK && result.exitCode !== QPDF_EXIT_WARNING) {
    throw new AppError('E_STRUCT', 'Khong ghep duoc cac trang', result.stderr.trim());
  }

  context.report(80, 'verifying', 'tasks.verifying');

  const verification = await verifyOutput(tempOutput, pages.length, async (filePath) => {
    const valid = await qpdf.check(filePath, { signal });
    const count = valid ? await qpdf.pageCount(filePath, { signal }) : null;
    return { valid, pageCount: count };
  });

  if (!verification.ok) {
    throw new AppError('E_STRUCT', 'Tep dau ra khong hop le', verification.reason);
  }

  const finalized = await finalizeOutput(
    tempOutput,
    payload.outputDirectory,
    `${payload.outputName}.pdf`,
  );

  context.report(100, 'writing', 'tasks.done');

  return { outputPaths: [finalized.path], skipped: [] };
}

/** Tên tệp mặc định khi không có tên do người dùng đặt. */
export function defaultPagesName(sourcePath: string): string {
  return basename(sourcePath).replace(/\.pdf$/i, '') || 'document';
}
