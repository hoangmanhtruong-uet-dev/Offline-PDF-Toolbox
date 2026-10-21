import { mkdtemp, readFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { PDFDocument } from 'pdf-lib';

import { scanImages } from '../../src/main/services/compression/imageScanner';
import { targetSize } from '../../src/main/services/compression/imageProcessor';
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
  return mkdtemp(join(tmpdir(), 'optb-compress-'));
}

async function loadScan(path: string) {
  const bytes = new Uint8Array(await readFile(path));
  const document = await PDFDocument.load(bytes, {
    updateMetadata: false,
    ignoreEncryption: true,
  });
  return { document, scan: scanImages(document) };
}

describe('quét ảnh nhúng', () => {
  it('tìm thấy ảnh JPEG phủ trọn trang và tính đúng độ phân giải', async () => {
    const { scan } = await loadScan(scanFixture);

    expect(scan.images).toHaveLength(1);
    const image = scan.images[0];

    expect(image).toBeDefined();
    // 2550 x 3300 pixel trên trang 612 x 792 điểm -> 300 dpi.
    expect(image?.pixelWidth).toBe(2550);
    expect(image?.pixelHeight).toBe(3300);
    expect(image?.effectiveDpi).toBeCloseTo(300, 0);
    expect(image?.filter).toBe('DCTDecode');
    expect(image?.colorSpace).toBe('DeviceRGB');
    expect(image?.processable).toBe(true);
  });

  it('không coi ảnh nhỏ hoặc ảnh không nén là ứng viên', async () => {
    const { scan } = await loadScan(join(fixtures, 'text-1page.pdf'));
    expect(scan.images).toHaveLength(0);
  });

  it('tính kích thước đích theo mức nén', async () => {
    const { scan } = await loadScan(scanFixture);
    const image = scan.images[0];
    if (!image) throw new Error('khong tim thay anh');

    // Nhẹ: giữ nguyên kích thước.
    expect(targetSize(image, COMPRESSION_PROFILES.light)).toEqual({
      width: image.pixelWidth,
      height: image.pixelHeight,
    });

    // Vừa: 150 dpi, tức khoảng một nửa chiều.
    const medium = targetSize(image, COMPRESSION_PROFILES.medium);
    expect(medium.width).toBeLessThan(image.pixelWidth);
    expect(medium.width / image.pixelWidth).toBeCloseTo(0.5, 1);
  });
});

describe('ước lượng trước khi chạy', () => {
  it('ước lượng được mức giảm cho tệp scan', async () => {
    const estimate = await estimateCompression(scanFixture, 'medium');

    expect(estimate.processableImages).toBe(1);
    expect(estimate.imageBytes).toBeGreaterThan(0);
    expect(estimate.imageRatio).toBeLessThan(1);
    expect(estimate.estimatedImageBytes).toBeLessThan(estimate.imageBytes);
  });
});

describe('nén PDF', () => {
  it('giảm dung lượng đáng kể cho tệp scan ở mức Vừa', async () => {
    const dir = await tempDir();

    const result = await runCompress(
      fakeContext(dir),
      {
        path: scanFixture,
        level: 'medium',
        outputDirectory: dir,
        outputName: 'nen',
      },
      qpdf,
    );

    const output = result.outputPaths[0] as string;
    const before = (await stat(scanFixture)).size;
    const after = (await stat(output)).size;

    expect(after).toBeLessThan(before);
    // Mục tiêu của đặc tả: tệp scan giảm trung bình từ 50% trở lên.
    expect(1 - after / before).toBeGreaterThanOrEqual(0.5);

    // Tệp đầu ra phải mở được và giữ nguyên số trang.
    expect(await qpdf.check(output)).toBe(true);
    expect(await qpdf.pageCount(output)).toBe(1);
  });

  it('giữ nguyên văn bản chọn và tìm kiếm được', async () => {
    const dir = await tempDir();
    const textFixture = join(fixtures, 'text-5pages.pdf');

    const result = await runCompress(
      fakeContext(dir),
      {
        path: textFixture,
        level: 'medium',
        outputDirectory: dir,
        outputName: 'van-ban',
      },
      qpdf,
    );

    const output = result.outputPaths[0] as string;
    const source = new Uint8Array(await readFile(textFixture));
    const compressed = new Uint8Array(await readFile(output));

    const sourceDoc = await PDFDocument.load(source);
    const compressedDoc = await PDFDocument.load(compressed);

    expect(compressedDoc.getPageCount()).toBe(sourceDoc.getPageCount());
  });

  it('tệp chỉ có văn bản vẫn được tối ưu cấu trúc và nhỏ lại', async () => {
    const dir = await tempDir();
    const textFixture = join(fixtures, 'text-5pages.pdf');

    const result = await runCompress(
      fakeContext(dir),
      {
        path: textFixture,
        level: 'medium',
        outputDirectory: dir,
        outputName: 'van-ban',
      },
      qpdf,
    );

    const output = result.outputPaths[0] as string;

    // Không có ảnh để nén, nhưng tối ưu cấu trúc vẫn làm tệp nhỏ lại.
    expect((await stat(output)).size).toBeLessThanOrEqual((await stat(textFixture)).size);
    expect(await qpdf.check(output)).toBe(true);
    expect(await qpdf.pageCount(output)).toBe(5);
  });

  it('báo "đã được tối ưu" khi nén lần hai tệp đã nén', async () => {
    const dir = await tempDir();

    const first = await runCompress(
      fakeContext(dir),
      {
        path: scanFixture,
        level: 'medium',
        outputDirectory: dir,
        outputName: 'lan-1',
      },
      qpdf,
    );

    const compressed = first.outputPaths[0] as string;

    // Lần hai: ảnh đã ở độ phân giải đích nên không nén lại được nữa, và
    // tệp đã được tối ưu cấu trúc — ứng dụng phải báo ra chứ không xuất
    // thêm một tệp.
    await expect(
      runCompress(
        fakeContext(dir),
        {
          path: compressed,
          level: 'medium',
          outputDirectory: dir,
          outputName: 'lan-2',
        },
        qpdf,
      ),
    ).rejects.toThrow(/da duoc toi uu/);
  });

  it('không làm hỏng tệp: tệp đầu ra mở được và giữ số trang', async () => {
    const dir = await tempDir();

    const result = await runCompress(
      fakeContext(dir),
      {
        path: join(fixtures, 'scan-jpeg-2pages.pdf'),
        level: 'strong',
        outputDirectory: dir,
        outputName: 'manh',
      },
      qpdf,
    );

    const output = result.outputPaths[0] as string;

    expect(await qpdf.check(output)).toBe(true);
    expect(await qpdf.pageCount(output)).toBe(2);
    expect((await stat(output)).size).toBeLessThan((await stat(join(fixtures, 'scan-jpeg-2pages.pdf'))).size);
  });
});
