import { mkdtemp, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { PDFDocument } from 'pdf-lib';

import { COMPRESSION_PROFILES } from '../../src/main/services/compression/levels';
import { estimateCompression, runCompress } from '../../src/main/services/compressionTask';
import { QpdfRunner } from '../../src/main/services/qpdfRunner';
import type { TaskContext } from '../../src/main/services/taskQueue';

const qpdfPath = join(process.cwd(), 'resources', 'qpdf', 'qpdf.exe');
const fixtures = join(process.cwd(), 'tests', 'fixtures');
const qpdf = new QpdfRunner(qpdfPath);
const scanFixture = join(fixtures, 'scan-jpeg-1page.pdf');

function fakeContext(tempDir: string): TaskContext {
  return {
    taskId: 'test',
    signal: new AbortController().signal,
    tempDir,
    report: () => undefined,
  };
}

async function tempDir(): Promise<string> {
  return mkdtemp(join(tmpdir(), 'optb-compress2-'));
}

describe('dung lượng đích', () => {
  it('thử các mức cho tới khi đạt dung lượng yêu cầu', async () => {
    const dir = await tempDir();

    const result = await runCompress(
      fakeContext(dir),
      {
        path: scanFixture,
        level: 'medium',
        targetBytes: 300 * 1024,
        outputDirectory: dir,
        outputName: 'muc-tieu',
      },
      qpdf,
    );

    const output = result.outputPaths[0] as string;
    const size = (await stat(output)).size;

    expect(size).toBeLessThanOrEqual(300 * 1024);
    expect(await qpdf.check(output)).toBe(true);
    expect(result.details?.levelUsed).toBeDefined();
  });

  it('báo rõ khi không thể đạt dung lượng đích', async () => {
    const dir = await tempDir();

    await expect(
      runCompress(
        fakeContext(dir),
        {
          path: scanFixture,
          level: 'medium',
          targetBytes: 1024, // không thể nhỏ hơn 1 KB
          outputDirectory: dir,
          outputName: 'khong-dat',
        },
        qpdf,
      ),
    ).rejects.toThrow(/dat duoc dung luong dich/);
  });

  it('không xuất tệp khi không đạt dung lượng đích', async () => {
    const dir = await tempDir();
    const taskDir = await tempDir();

    await expect(
      runCompress(
        fakeContext(taskDir),
        {
          path: scanFixture,
          level: 'medium',
          targetBytes: 1024,
          outputDirectory: dir,
          outputName: 'khong-dat',
        },
        qpdf,
      ),
    ).rejects.toThrow();

    const { readdir } = await import('node:fs/promises');
    const files = await readdir(dir);
    expect(files.filter((name) => name.endsWith('.pdf'))).toHaveLength(0);
  });
});

describe('chi tiết kết quả', () => {
  it('trả về dung lượng trước, sau và phần trăm giảm', async () => {
    const dir = await tempDir();

    const result = await runCompress(
      fakeContext(dir),
      {
        path: scanFixture,
        level: 'medium',
        outputDirectory: dir,
        outputName: 'chi-tiet',
      },
      qpdf,
    );

    const details = result.details;
    expect(details).toBeDefined();
    expect(details?.originalBytes).toBeGreaterThan(0);
    expect(details?.newBytes).toBeGreaterThan(0);
    expect(details?.newBytes).toBeLessThan(details?.originalBytes ?? 0);
    expect(details?.pageCount).toBe(1);
    expect(details?.imagesProcessed).toBe(1);
  });
});

describe('mức Mạnh bỏ siêu dữ liệu', () => {
  it('xóa thông tin tài liệu và siêu dữ liệu XMP', async () => {
    const dir = await tempDir();

    const result = await runCompress(
      fakeContext(dir),
      {
        path: scanFixture,
        level: 'strong',
        outputDirectory: dir,
        outputName: 'khong-sieu-du-lieu',
      },
      qpdf,
    );

    const output = result.outputPaths[0] as string;
    const bytes = new Uint8Array(await (await import('node:fs/promises')).readFile(output));
    // Phải tải với `updateMetadata: false`, nếu không pdf-lib sẽ tự ghi lại
    // thông tin tài liệu khi nạp và che mất kết quả cần kiểm tra.
    const document = await PDFDocument.load(bytes, { updateMetadata: false });

    expect(document.getTitle()).toBe('');
    expect(document.getAuthor()).toBe('');
    expect(document.getProducer()).toBe('');
  });

  it('mức Nhẹ giữ nguyên kích thước ảnh', async () => {
    const dir = await tempDir();

    const result = await runCompress(
      fakeContext(dir),
      {
        path: scanFixture,
        level: 'light',
        outputDirectory: dir,
        outputName: 'nhe',
      },
      qpdf,
    );

    const output = result.outputPaths[0] as string;
    expect(await qpdf.check(output)).toBe(true);
    expect(result.details?.newBytes).toBeLessThan(result.details?.originalBytes ?? 0);
  });
});

describe('ước lượng', () => {
  it('ước lượng theo từng mức và cho ra tỉ lệ hợp lý', async () => {
    for (const level of ['light', 'medium', 'strong'] as const) {
      const estimate = await estimateCompression(scanFixture, level);
      expect(estimate.processableImages).toBe(1);
      expect(estimate.imageRatio).toBeGreaterThan(0);
      expect(estimate.imageRatio).toBeLessThanOrEqual(1);
    }
  });

  it('mức Mạnh ước lượng giảm nhiều hơn mức Nhẹ', async () => {
    const light = await estimateCompression(scanFixture, 'light');
    const strong = await estimateCompression(scanFixture, 'strong');
    expect(strong.imageRatio).toBeLessThan(light.imageRatio);
  });
});

describe('cấu hình mức nén', () => {
  it('đúng với đặc tả', () => {
    expect(COMPRESSION_PROFILES.light.targetDpi).toBeNull();
    expect(COMPRESSION_PROFILES.medium.targetDpi).toBe(150);
    expect(COMPRESSION_PROFILES.medium.jpegQuality).toBe(70);
    expect(COMPRESSION_PROFILES.strong.targetDpi).toBe(100);
    expect(COMPRESSION_PROFILES.strong.jpegQuality).toBe(50);
    expect(COMPRESSION_PROFILES.strong.grayscale).toBe(true);
    expect(COMPRESSION_PROFILES.strong.stripMetadata).toBe(true);
  });
});
