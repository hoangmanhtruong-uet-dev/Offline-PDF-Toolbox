import { mkdtemp, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { AppError } from '@shared/errors';

import { QpdfRunner } from '../../src/main/services/qpdfRunner';
import { buildSplitParts, runSplit } from '../../src/main/services/splitTask';
import type { TaskContext } from '../../src/main/services/taskQueue';

const qpdfPath = join(process.cwd(), 'resources', 'qpdf', 'qpdf.exe');
const fixtures = join(process.cwd(), 'tests', 'fixtures');
const qpdf = new QpdfRunner(qpdfPath);

function fakeContext(tempDir: string): TaskContext {
  return {
    taskId: 'test',
    signal: new AbortController().signal,
    tempDir,
    report: () => undefined,
  };
}

async function tempDir(): Promise<string> {
  return mkdtemp(join(tmpdir(), 'optb-split-'));
}

describe('buildSplitParts', () => {
  const base = {
    path: join(fixtures, 'text-5pages.pdf'),
    outputDirectory: '/tmp',
    outputSubfolder: 'out',
    outputNameTemplate: '{name}_{index}',
  };

  it('tách theo khoảng trang: mỗi khoảng một tệp', () => {
    const parts = buildSplitParts({ ...base, mode: 'ranges', ranges: '1-3, 5, 8-10' }, 10);

    expect(parts).toHaveLength(3);
    expect(parts[0]?.ranges).toEqual([{ start: 1, end: 3 }]);
    expect(parts[1]?.ranges).toEqual([{ start: 5, end: 5 }]);
    expect(parts[2]?.ranges).toEqual([{ start: 8, end: 10 }]);
  });

  it('tách mỗi N trang', () => {
    const parts = buildSplitParts({ ...base, mode: 'everyN', everyN: 2 }, 5);
    expect(parts).toHaveLength(3);
    expect(parts[0]?.ranges).toEqual([{ start: 1, end: 2 }]);
    expect(parts[2]?.ranges).toEqual([{ start: 5, end: 5 }]);
  });

  it('tách mỗi trang một tệp', () => {
    const parts = buildSplitParts({ ...base, mode: 'eachPage' }, 4);
    expect(parts).toHaveLength(4);
    expect(parts[3]?.ranges).toEqual([{ start: 4, end: 4 }]);
  });

  it('tách theo dấu trang: mỗi chương một tệp', () => {
    const parts = buildSplitParts(
      { ...base, mode: 'bookmarks', bookmarkPages: [1, 3, 8] },
      10,
    );

    expect(parts).toHaveLength(3);
    expect(parts[0]?.ranges).toEqual([{ start: 1, end: 2 }]);
    expect(parts[1]?.ranges).toEqual([{ start: 3, end: 7 }]);
    expect(parts[2]?.ranges).toEqual([{ start: 8, end: 10 }]);
  });

  it('trích trang thành một tệp duy nhất', () => {
    const parts = buildSplitParts({ ...base, mode: 'extract', pages: [2, 4, 6] }, 10);
    expect(parts).toHaveLength(1);
    expect(parts[0]?.ranges).toEqual([{ start: 2, end: 6 }]);
  });

  it('báo lỗi khi dải trang không hợp lệ', () => {
    expect(() => buildSplitParts({ ...base, mode: 'ranges', ranges: 'abc' }, 10)).toThrow(AppError);
  });

  it('báo lỗi khi chưa chọn trang nào để trích', () => {
    expect(() => buildSplitParts({ ...base, mode: 'extract', pages: [] }, 10)).toThrow(AppError);
  });
});

describe('runSplit', () => {
  it('tách ba tệp từ một tài liệu 5 trang', async () => {
    const dir = await tempDir();
    const context = fakeContext(dir);

    const result = await runSplit(
      context,
      {
        path: join(fixtures, 'text-5pages.pdf'),
        mode: 'ranges',
        ranges: '1-2, 3-4, 5',
        outputDirectory: dir,
        outputSubfolder: 'ket-qua',
        outputNameTemplate: '{name}_{index}',
      },
      qpdf,
    );

    expect(result.outputPaths).toHaveLength(3);
    expect(await qpdf.pageCount(result.outputPaths[0] as string)).toBe(2);
    expect(await qpdf.pageCount(result.outputPaths[1] as string)).toBe(2);
    expect(await qpdf.pageCount(result.outputPaths[2] as string)).toBe(1);
  });

  it('tổng số trang các tệp đầu ra bằng số trang đã chọn', async () => {
    const dir = await tempDir();
    const context = fakeContext(dir);

    const result = await runSplit(
      context,
      {
        path: join(fixtures, 'text-5pages.pdf'),
        mode: 'eachPage',
        outputDirectory: dir,
        outputSubfolder: 'tung-trang',
        outputNameTemplate: '{name}_{index}',
      },
      qpdf,
    );

    expect(result.outputPaths).toHaveLength(5);

    let total = 0;
    for (const path of result.outputPaths) {
      total += await qpdf.pageCount(path);
    }
    expect(total).toBe(5);
  });

  it('xuất vào thư mục con để không lẫn với tệp khác', async () => {
    const dir = await tempDir();
    const context = fakeContext(dir);

    const result = await runSplit(
      context,
      {
        path: join(fixtures, 'text-5pages.pdf'),
        mode: 'eachPage',
        outputDirectory: dir,
        outputSubfolder: 'thu-muc-con',
        outputNameTemplate: '{name}_{index}',
      },
      qpdf,
    );

    expect(result.outputPaths[0]).toContain('thu-muc-con');
  });

  it('không ghi đè tệp đã tồn tại', async () => {
    const dir = await tempDir();
    const context = fakeContext(dir);

    const payload = {
      path: join(fixtures, 'text-5pages.pdf'),
      mode: 'eachPage' as const,
      outputDirectory: dir,
      outputSubfolder: 'khong-ghi-de',
      outputNameTemplate: '{name}_{index}',
    };

    const first = await runSplit(context, payload, qpdf);
    const second = await runSplit(fakeContext(dir), payload, qpdf);

    expect(first.outputPaths[0]).not.toBe(second.outputPaths[0]);
    expect(second.outputPaths[0]).toContain('(1)');
  });

  it('trích các trang được chọn thành một tệp', async () => {
    const dir = await tempDir();
    const context = fakeContext(dir);

    const result = await runSplit(
      context,
      {
        path: join(fixtures, 'mixed-3pages.pdf'),
        mode: 'extract',
        pages: [1, 3],
        outputDirectory: dir,
        outputSubfolder: 'trich',
        outputNameTemplate: '{name}_trich',
      },
      qpdf,
    );

    expect(result.outputPaths).toHaveLength(1);
    expect(await qpdf.pageCount(result.outputPaths[0] as string)).toBe(3);
  });

  it('giữ dung lượng mỗi phần dưới giới hạn trong chế độ theo dung lượng', async () => {
    const dir = await tempDir();
    const context = fakeContext(dir);

    const result = await runSplit(
      context,
      {
        path: join(fixtures, 'text-5pages.pdf'),
        mode: 'maxSize',
        maxBytes: 800,
        outputDirectory: dir,
        outputSubfolder: 'theo-dung-luong',
        outputNameTemplate: '{name}_{index}',
      },
      qpdf,
    );

    expect(result.outputPaths.length).toBeGreaterThan(0);

    for (const path of result.outputPaths) {
      const info = await stat(path);
      expect(info.size).toBeLessThanOrEqual(800);
    }
  });

  it('báo lỗi khi tài liệu cần mật khẩu', async () => {
    const dir = await tempDir();

    try {
      await runSplit(
        fakeContext(dir),
        {
          path: join(fixtures, 'locked-user-password.pdf'),
          mode: 'eachPage',
          outputDirectory: dir,
          outputSubfolder: 'co-mat-khau',
          outputNameTemplate: '{name}_{index}',
        },
        qpdf,
      );
      throw new Error('phai nem loi');
    } catch (error) {
      expect((error as AppError).code).toBe('E_AUTH');
    }
  });

  it('tách được tệp có mật khẩu khi có mật khẩu đúng', async () => {
    const dir = await tempDir();

    const result = await runSplit(
      fakeContext(dir),
      {
        path: join(fixtures, 'locked-user-password.pdf'),
        mode: 'eachPage',
        outputDirectory: dir,
        outputSubfolder: 'da-mo-khoa',
        outputNameTemplate: '{name}_{index}',
        password: 'mat-khau-nguoi-dung',
      },
      qpdf,
    );

    expect(result.outputPaths).toHaveLength(1);
    expect(await qpdf.pageCount(result.outputPaths[0] as string)).toBe(1);
  });
});
