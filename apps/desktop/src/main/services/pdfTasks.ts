import { writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';

import { AppError } from '@shared/errors';
import { parsePageRange, resolveOpenEndedRanges, selectOddOrEven, toQpdfRange } from '@shared/pageRange';
import type {
  MergeInput,
  MergeTaskPayload,
  PageSelection,
  PreflightResult,
  RotateTaskPayload,
} from '@shared/tasks';
import type { ErrorCode } from '@shared/types';

import { finalizeOutput, verifyOutput } from './outputVerifier';
import { QPDF_EXIT_OK, QPDF_EXIT_WARNING } from './qpdfRunner';
import type { QpdfRunner } from './qpdfRunner';
import type { TaskContext } from './taskQueue';

/**
 * Thực thi các tác vụ xử lý PDF bằng qpdf.
 *
 * Mọi tác vụ đều theo cùng một trình tự:
 * 1. Kiểm tra đầu vào (trước hết là xác định tệp hỏng và tệp cần mật khẩu).
 * 2. Ghi ra tệp tạm trong thư mục tạm của tác vụ.
 * 3. Kiểm tra lại tệp đầu ra.
 * 4. Di chuyển vào thư mục đích với tên không trùng.
 */

/** Một tệp đầu vào đã qua kiểm tra. */
interface UsableInput {
  /** Đường dẫn dùng cho thao tác tiếp theo (bản đã giải mã nếu có mật khẩu). */
  path: string;
  /** Đường dẫn tệp gốc, dùng để báo lỗi cho người dùng. */
  originalPath: string;
  pageCount: number;
  /** Tệp chứa mật khẩu tạm, phải xóa khi tác vụ xong. */
  passwordFile?: string;
}

/**
 * Ghi mật khẩu ra tệp tạm để truyền cho qpdf.
 *
 * Mật khẩu không bao giờ nằm trên dòng lệnh, nên không bị lộ trong danh sách
 * tiến trình của máy.
 */
async function writePasswordFile(tempDir: string, path: string, password: string): Promise<string> {
  const safeName = basename(path).replace(/[^a-zA-Z0-9._-]/g, '_');
  const file = join(tempDir, `password-${safeName}.txt`);
  await writeFile(file, password, { encoding: 'utf8', mode: 0o600 });
  return file;
}

/** Nhận diện lỗi của qpdf theo nội dung thông báo. */
function classifyQpdfError(message: string): ErrorCode {
  const text = message.toLowerCase();
  if (text.includes('password') || text.includes('invalid password')) return 'E_AUTH';
  if (text.includes('not a pdf') || text.includes('does not appear to be a pdf')) return 'E_FORMAT';
  if (text.includes('damaged') || text.includes('invalid') || text.includes('error')) return 'E_STRUCT';
  return 'E_UNKNOWN';
}

/**
 * Kiểm tra các tệp đầu vào trước khi chạy tác vụ.
 *
 * Bước này tồn tại để báo cho người dùng biết **tệp nào** hỏng, thay vì chỉ
 * báo lỗi chung của qpdf. Nó cũng cho biết số trang của từng tệp, cần thiết
 * để kiểm tra dải trang và tính số trang của tệp đầu ra.
 *
 * Tệp được bảo vệ bằng mật khẩu sẽ được **giải mã vào thư mục tạm** trước.
 * Lý do: qpdf chỉ nhận `--password=` (tức là mật khẩu nằm trên dòng lệnh)
 * bên trong khối `--pages`. Giải mã trước giúp mật khẩu không bao giờ lộ ra
 * trong danh sách tiến trình của máy.
 */
export async function preflight(
  inputs: { path: string; password?: string }[],
  qpdf: QpdfRunner,
  tempDir: string,
  signal?: AbortSignal,
): Promise<{
  usable: UsableInput[];
  broken: PreflightResult['broken'];
  locked: PreflightResult['locked'];
}> {
  const usable: UsableInput[] = [];
  const broken: PreflightResult['broken'] = [];
  const locked: PreflightResult['locked'] = [];

  let index = 0;

  for (const input of inputs) {
    if (signal?.aborted) throw new AppError('E_UNKNOWN', 'Tac vu da bi huy');

    let passwordFile: string | undefined;
    if (input.password) {
      passwordFile = await writePasswordFile(tempDir, input.path, input.password);
    }

    const check = await qpdf.run(
      passwordFile
        ? ['--check', `--password-file=${passwordFile}`, input.path]
        : ['--check', input.path],
      { signal },
    );

    if (check.exitCode !== QPDF_EXIT_OK && check.exitCode !== QPDF_EXIT_WARNING) {
      const message = check.stderr.trim() || check.stdout.trim();
      const code = classifyQpdfError(message);

      if (code === 'E_AUTH') {
        locked.push({ path: input.path });
      } else {
        broken.push({ path: input.path, code, message });
      }
      continue;
    }

    // Tệp cần mật khẩu: giải mã vào thư mục tạm rồi dùng bản đã giải mã.
    let usablePath = input.path;
    if (passwordFile) {
      index += 1;
      usablePath = join(tempDir, `decrypted-${index}.pdf`);
      await qpdf.runOrThrow(
        [`--password-file=${passwordFile}`, '--decrypt', input.path, usablePath],
        { signal },
      );
    }

    const pageCount = await qpdf.pageCount(usablePath, { signal });

    usable.push({
      path: usablePath,
      originalPath: input.path,
      pageCount,
      ...(passwordFile ? { passwordFile } : {}),
    });
  }

  return { usable, broken, locked };
}

/** Chuẩn bị danh sách khoảng trang đã kiểm tra cho từng tệp. */
function resolveSelection(input: MergeInput, pageCount: number): { range: string; pages: number } {
  if (!input.pageRange || input.pageRange.trim().length === 0) {
    return { range: '', pages: pageCount };
  }

  const parsed = parsePageRange(input.pageRange, pageCount);
  if (!parsed.ok) {
    throw new AppError(
      'E_PATH',
      'Dai trang khong hop le',
      parsed.ok ? '' : `${parsed.code}${parsed.token ? `: ${parsed.token}` : ''}`,
    );
  }

  const ranges = resolveOpenEndedRanges(parsed.ranges, pageCount);
  const pages = ranges.reduce((sum, range) => sum + (range.end - range.start + 1), 0);
  return { range: toQpdfRange(ranges, pageCount), pages };
}

/**
 * Chạy tác vụ gộp (F-01).
 */
export async function runMerge(
  context: TaskContext,
  payload: MergeTaskPayload,
  qpdf: QpdfRunner,
): Promise<{ outputPaths: string[]; skipped: { path: string; reason: string }[] }> {
  const { signal, tempDir } = context;

  context.report(5, 'reading', 'tasks.preparing');

  const check = await preflight(payload.files, qpdf, tempDir, signal);

  const skipped: { path: string; reason: string }[] = [];

  if (check.locked.length > 0) {
    throw new AppError(
      'E_AUTH',
      'Co tep duoc bao ve bang mat khau',
      undefined,
      check.locked.map((file) => basename(file.path)),
    );
  }

  if (check.broken.length > 0 && !payload.skipBroken) {
    throw new AppError(
      'E_STRUCT',
      'Co tep khong the doc',
      check.broken.map((file) => `${basename(file.path)}: ${file.message}`).join('; '),
      check.broken.map((file) => basename(file.path)),
    );
  }

  if (check.broken.length > 0) {
    for (const file of check.broken) {
      skipped.push({ path: file.path, reason: file.message });
    }
  }

  const pageCounts = new Map(check.usable.map((file) => [file.originalPath, file.pageCount]));
  const usablePaths = new Map(check.usable.map((file) => [file.originalPath, file.path]));

  // Dựng tham số --pages cho qpdf.
  const args: string[] = ['--empty', '--pages'];

  for (const input of payload.files) {
    const pageCount = pageCounts.get(input.path);
    const usablePath = usablePaths.get(input.path);
    if (pageCount === undefined || !usablePath) continue;

    const selection = resolveSelection(input, pageCount);
    args.push(`--file=${usablePath}`);
    if (selection.range) args.push(`--range=${selection.range}`);
  }

  args.push('--');

  const tempOutput = join(tempDir, 'merged.pdf');
  args.push(tempOutput);

  context.report(35, 'processing', 'tasks.merging');

  const result = await qpdf.runOrThrow(args, { signal });

  if (result.exitCode === QPDF_EXIT_WARNING) {
    context.report(80, 'verifying', 'tasks.recovered');
  } else {
    context.report(80, 'verifying', 'tasks.verifying');
  }

  const expectedPages = payload.files.reduce((sum, input) => {
    const pageCount = pageCounts.get(input.path);
    if (pageCount === undefined) return sum;
    return sum + resolveSelection(input, pageCount).pages;
  }, 0);

  const verification = await verifyOutput(tempOutput, expectedPages, async (filePath) => {
    const valid = await qpdf.check(filePath, { signal });
    const pageCount = valid ? await qpdf.pageCount(filePath, { signal }) : null;
    return { valid, pageCount };
  });

  if (!verification.ok) {
    throw new AppError('E_STRUCT', 'Tep dau ra khong hop le', verification.reason);
  }

  const outputName = `${payload.outputName}.pdf`;
  const finalized = await finalizeOutput(tempOutput, payload.outputDirectory, outputName);

  context.report(100, 'writing', 'tasks.done');

  return { outputPaths: [finalized.path], skipped };
}

/**
 * Chạy tác vụ xoay (F-04).
 *
 * Xoay được thực hiện bằng thuộc tính `/Rotate` của trang: qpdf cộng góc vào
 * giá trị sẵn có theo modulo 360, nên nội dung trang không bị thay đổi.
 */
export async function runRotate(
  context: TaskContext,
  payload: RotateTaskPayload,
  qpdf: QpdfRunner,
): Promise<{ outputPaths: string[]; skipped: { path: string; reason: string }[] }> {
  const { signal, tempDir } = context;

  context.report(5, 'reading', 'tasks.preparing');

  const check = await preflight([{ path: payload.path, password: payload.password }], qpdf, tempDir, signal);

  if (check.locked.length > 0) {
    throw new AppError(
      'E_AUTH',
      'Tep duoc bao ve bang mat khau',
      undefined,
      [basename(payload.path)],
    );
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
  const range = buildRotateRange(payload.pageSelection, pageCount);

  const args: string[] = [];

  // `--password-file` là tuỳ chọn ở cấp tổng, nên mật khẩu không lộ ra
  // trong danh sách tiến trình.
  const passwordFile = check.usable[0]?.passwordFile;
  if (passwordFile) args.push(`--password-file=${passwordFile}`);

  // Không có khoảng trang nghĩa là xoay tất cả: phải vẫn truyền `--rotate`.
  const rotateOption = range ? `--rotate=+${payload.angle}:${range}` : `--rotate=+${payload.angle}`;
  args.push(rotateOption);

  const tempOutput = join(tempDir, 'rotated.pdf');
  args.push(check.usable[0]?.path ?? payload.path, tempOutput);

  context.report(35, 'processing', 'tasks.rotating');

  await qpdf.runOrThrow(args, { signal });

  context.report(80, 'verifying', 'tasks.verifying');

  const verification = await verifyOutput(tempOutput, pageCount, async (filePath) => {
    const valid = await qpdf.check(filePath, { signal });
    const count = valid ? await qpdf.pageCount(filePath, { signal }) : null;
    return { valid, pageCount: count };
  });

  if (!verification.ok) {
    throw new AppError('E_STRUCT', 'Tep dau ra khong hop le', verification.reason);
  }

  const outputName = `${payload.outputName}.pdf`;
  const finalized = await finalizeOutput(tempOutput, payload.outputDirectory, outputName);

  context.report(100, 'writing', 'tasks.done');

  return { outputPaths: [finalized.path], skipped: [] };
}

/** Dựng tham số chọn trang cho thao tác xoay. */
export function buildRotateRange(selection: PageSelection, pageCount: number): string {
  switch (selection.kind) {
    case 'all':
      return '';
    case 'odd':
      return selectOddOrEven(pageCount, 'odd').join(',');
    case 'even':
      return selectOddOrEven(pageCount, 'even').join(',');
    case 'range': {
      const parsed = parsePageRange(selection.range, pageCount);
      if (!parsed.ok) {
        throw new AppError('E_PATH', 'Dai trang khong hop le');
      }
      const ranges = resolveOpenEndedRanges(parsed.ranges, pageCount);
      return toQpdfRange(ranges, pageCount);
    }
    default: {
      const exhaustive: never = selection;
      throw new Error(`Khong ho tro cach chon trang: ${JSON.stringify(exhaustive)}`);
    }
  }
}
