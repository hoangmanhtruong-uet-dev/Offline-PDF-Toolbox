import { mkdtemp, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { runCompress } from '../../src/main/services/compressionTask';
import { QpdfRunner } from '../../src/main/services/qpdfRunner';
import type { TaskContext } from '../../src/main/services/taskQueue';
import type { CompressionLevel } from '../../src/shared/types';

/**
 * Đo chất lượng nén trên bộ tệp thử (T6-06).
 *
 * Mục tiêu trong đặc tả:
 * - Tệp scan toàn ảnh giảm trung bình từ 50% trở lên ở mức Vừa.
 * - Tệp văn bản thường giảm ít hơn nhiều.
 * - Không tệp nào bị hỏng, số trang luôn giữ nguyên.
 */
const qpdfPath = join(process.cwd(), 'resources', 'qpdf', 'qpdf.exe');
const fixtures = join(process.cwd(), 'tests', 'fixtures');
const qpdf = new QpdfRunner(qpdfPath);

function context(tempDir: string): TaskContext {
  return {
    taskId: 'quality',
    signal: new AbortController().signal,
    tempDir,
    report: () => undefined,
  };
}

async function compress(
  file: string,
  level: CompressionLevel,
): Promise<{ before: number; after: number; saving: number; output: string }> {
  const dir = await mkdtemp(join(tmpdir(), 'optb-quality-'));

  const result = await runCompress(
    context(dir),
    {
      path: join(fixtures, file),
      level,
      outputDirectory: dir,
      outputName: 'ket-qua',
    },
    qpdf,
  );

  const output = result.outputPaths[0] as string;
  const before = (await stat(join(fixtures, file))).size;
  const after = (await stat(output)).size;

  return { before, after, saving: 1 - after / before, output };
}

describe('chất lượng nén', () => {
  it('tệp scan toàn ảnh giảm từ 50% trở lên ở mức Vừa', async () => {
    const result = await compress('scan-jpeg-1page.pdf', 'medium');
    expect(result.saving).toBeGreaterThanOrEqual(0.5);
  });

  it('tệp scan nhiều trang cũng giảm từ 50% trở lên ở mức Vừa', async () => {
    const result = await compress('scan-jpeg-2pages.pdf', 'medium');
    expect(result.saving).toBeGreaterThanOrEqual(0.5);
  });

  it('mức Mạnh giảm nhiều hơn mức Vừa', async () => {
    const medium = await compress('scan-jpeg-1page.pdf', 'medium');
    const strong = await compress('scan-jpeg-1page.pdf', 'strong');
    expect(strong.saving).toBeGreaterThan(medium.saving);
  });

  it('tệp văn bản thường giảm ít hơn nhiều so với tệp scan', async () => {
    const text = await compress('text-5pages.pdf', 'medium');
    const scan = await compress('scan-jpeg-1page.pdf', 'medium');
    expect(text.saving).toBeLessThan(0.5);
    expect(scan.saving).toBeGreaterThan(text.saving);
  });

  it('không tệp nào bị hỏng và số trang luôn giữ nguyên', async () => {
    const files = ['scan-jpeg-1page.pdf', 'scan-jpeg-2pages.pdf', 'text-5pages.pdf'];

    for (const file of files) {
      const result = await compress(file, 'medium');
      const before = await qpdf.pageCount(join(fixtures, file));
      const after = await qpdf.pageCount(result.output);

      expect(await qpdf.check(result.output)).toBe(true);
      expect(after).toBe(before);
    }
  });
});
