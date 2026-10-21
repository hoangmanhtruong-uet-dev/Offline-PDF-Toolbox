import { mkdtemp, readFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { AppError } from '@shared/errors';

import { buildRotateRange, runMerge, runRotate } from '../../src/main/services/pdfTasks';
import { QpdfRunner } from '../../src/main/services/qpdfRunner';
import type { TaskContext } from '../../src/main/services/taskQueue';

const qpdfPath = join(process.cwd(), 'resources', 'qpdf', 'qpdf.exe');
const fixtures = join(process.cwd(), 'tests', 'fixtures');
const qpdf = new QpdfRunner(qpdfPath);

/** Tạo ngữ cảnh tác vụ giả để gọi hàm xử lý trực tiếp. */
function fakeContext(tempDir: string): TaskContext {
  return {
    taskId: 'test',
    signal: new AbortController().signal,
    tempDir,
    report: () => undefined,
  };
}

async function tempDir(): Promise<string> {
  return mkdtemp(join(tmpdir(), 'optb-task-'));
}

describe('buildRotateRange', () => {
  it('xoay tất cả trang thì không truyền khoảng', () => {
    expect(buildRotateRange({ kind: 'all' }, 10)).toBe('');
  });

  it('chọn đúng trang lẻ và trang chẵn', () => {
    expect(buildRotateRange({ kind: 'odd' }, 5)).toBe('1,3,5');
    expect(buildRotateRange({ kind: 'even' }, 5)).toBe('2,4');
  });

  it('chuyển khoảng trang thành định dạng của qpdf', () => {
    expect(buildRotateRange({ kind: 'range', range: '1-3' }, 10)).toBe('1-3');
    expect(buildRotateRange({ kind: 'range', range: '2,5-6' }, 10)).toBe('2,5-6');
  });

  it('báo lỗi khi khoảng trang vượt số trang', () => {
    expect(() => buildRotateRange({ kind: 'range', range: '1-99' }, 10)).toThrow(AppError);
  });
});

describe('runMerge', () => {
  it('gộp ba tệp theo thứ tự và giữ nguyên số trang', async () => {
    const dir = await tempDir();
    const context = fakeContext(dir);

    const result = await runMerge(
      context,
      {
        files: [
          { path: join(fixtures, 'text-1page.pdf') },
          { path: join(fixtures, 'mixed-3pages.pdf') },
          { path: join(fixtures, 'scan-2pages.pdf') },
        ],
        outputDirectory: dir,
        outputName: 'ket-qua',
        skipBroken: false,
      },
      qpdf,
    );

    expect(result.outputPaths).toHaveLength(1);
    expect(result.outputPaths[0]).toContain('ket-qua.pdf');

    // Tệp đầu ra phải tồn tại và có đúng số trang.
    const info = await stat(result.outputPaths[0] as string);
    expect(info.size).toBeGreaterThan(0);
    expect(await qpdf.pageCount(result.outputPaths[0] as string)).toBe(6);
  });

  it('chỉ lấy các trang được chọn trong dải trang', async () => {
    const dir = await tempDir();
    const context = fakeContext(dir);

    const result = await runMerge(
      context,
      {
        files: [{ path: join(fixtures, 'mixed-3pages.pdf'), pageRange: '1-2' }],
        outputDirectory: dir,
        outputName: 'mot-phan',
        skipBroken: false,
      },
      qpdf,
    );

    expect(await qpdf.pageCount(result.outputPaths[0] as string)).toBe(2);
  });

  it('không ghi đè tệp đã tồn tại', async () => {
    const dir = await tempDir();
    const context = fakeContext(dir);

    const payload = {
      files: [{ path: join(fixtures, 'text-1page.pdf') }],
      outputDirectory: dir,
      outputName: 'trung-ten',
      skipBroken: false,
    };

    const first = await runMerge(context, payload, qpdf);
    const second = await runMerge(context, payload, qpdf);

    expect(first.outputPaths[0]).not.toBe(second.outputPaths[0]);
    expect(second.outputPaths[0]).toContain('trung-ten (1)');
  });

  it('báo lỗi và nêu tên tệp hỏng', async () => {
    const dir = await tempDir();
    const context = fakeContext(dir);

    await expect(
      runMerge(
        context,
        {
          files: [
            { path: join(fixtures, 'text-1page.pdf') },
            { path: join(fixtures, 'broken-not-a-pdf.pdf') },
          ],
          outputDirectory: dir,
          outputName: 'khong-hop-le',
          skipBroken: false,
        },
        qpdf,
      ),
    ).rejects.toThrow(AppError);

    try {
      await runMerge(
        context,
        {
          files: [{ path: join(fixtures, 'broken-not-a-pdf.pdf') }],
          outputDirectory: dir,
          outputName: 'khong-hop-le',
          skipBroken: false,
        },
        qpdf,
      );
    } catch (error) {
      expect((error as AppError).files).toContain('broken-not-a-pdf.pdf');
    }
  });

  it('bỏ qua tệp hỏng khi được cho phép', async () => {
    const dir = await tempDir();
    const context = fakeContext(dir);

    const result = await runMerge(
      context,
      {
        files: [
          { path: join(fixtures, 'text-1page.pdf') },
          { path: join(fixtures, 'broken-not-a-pdf.pdf') },
        ],
        outputDirectory: dir,
        outputName: 'bo-qua',
        skipBroken: true,
      },
      qpdf,
    );

    expect(result.skipped).toHaveLength(1);
    expect(result.skipped[0]?.path).toContain('broken-not-a-pdf.pdf');
    expect(await qpdf.pageCount(result.outputPaths[0] as string)).toBe(1);
  });

  it('báo lỗi khi tệp cần mật khẩu', async () => {
    const dir = await tempDir();
    const context = fakeContext(dir);

    try {
      await runMerge(
        context,
        {
          files: [{ path: join(fixtures, 'locked-user-password.pdf') }],
          outputDirectory: dir,
          outputName: 'co-mat-khau',
          skipBroken: false,
        },
        qpdf,
      );
      throw new Error('phai nem loi');
    } catch (error) {
      expect((error as AppError).code).toBe('E_AUTH');
    }
  });

  it('gộp được tệp có mật khẩu khi người dùng nhập đúng', async () => {
    const dir = await tempDir();
    const context = fakeContext(dir);

    const result = await runMerge(
      context,
      {
        files: [
          { path: join(fixtures, 'locked-user-password.pdf'), password: 'mat-khau-nguoi-dung' },
        ],
        outputDirectory: dir,
        outputName: 'da-mo-khoa',
        skipBroken: false,
      },
      qpdf,
    );

    expect(await qpdf.pageCount(result.outputPaths[0] as string)).toBe(1);
  });
});

describe('runRotate', () => {
  it('xoay đúng các trang được chọn', async () => {
    const dir = await tempDir();
    const context = fakeContext(dir);

    const result = await runRotate(
      context,
      {
        path: join(fixtures, 'text-5pages.pdf'),
        pageSelection: { kind: 'range', range: '3,5' },
        angle: 90,
        outputDirectory: dir,
        outputName: 'xoa-trang-3-5',
      },
      qpdf,
    );

    expect(result.outputPaths).toHaveLength(1);
    expect(await qpdf.pageCount(result.outputPaths[0] as string)).toBe(5);

    // Tệp đầu ra phải khác tệp nguồn và không phải tệp rỗng.
    const output = await readFile(result.outputPaths[0] as string);
    expect(output.length).toBeGreaterThan(0);
  });

  it('xoay thêm 90 độ hai lần bằng 180 độ', async () => {
    const dir = await tempDir();
    const context = fakeContext(dir);

    const once = await runRotate(
      context,
      {
        path: join(fixtures, 'text-5pages.pdf'),
        pageSelection: { kind: 'all' },
        angle: 90,
        outputDirectory: dir,
        outputName: 'xoa-90',
      },
      qpdf,
    );

    const twice = await runRotate(
      fakeContext(dir),
      {
        path: once.outputPaths[0] as string,
        pageSelection: { kind: 'all' },
        angle: 90,
        outputDirectory: dir,
        outputName: 'xoa-90-lan-2',
      },
      qpdf,
    );

    const direct = await runRotate(
      fakeContext(dir),
      {
        path: join(fixtures, 'text-5pages.pdf'),
        pageSelection: { kind: 'all' },
        angle: 180,
        outputDirectory: dir,
        outputName: 'xoa-180',
      },
      qpdf,
    );

    const sizeOf = async (path: string): Promise<number> => (await stat(path)).size;
    expect(await sizeOf(twice.outputPaths[0] as string)).toBe(
      await sizeOf(direct.outputPaths[0] as string),
    );
  });
});
