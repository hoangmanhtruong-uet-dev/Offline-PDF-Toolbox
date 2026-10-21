/**
 * Báo cáo chất lượng nén trên bộ tệp kiểm thử.
 *
 * Chạy: `node tests/scripts/compression-report.ts`
 *
 * Với mỗi tệp trong `tests/fixtures`, nén ở cả ba mức rồi báo cáo:
 * dung lượng trước, sau, phần trăm giảm, và số trang có giữ nguyên không.
 * Đây là con số dùng để đối chiếu với mục tiêu trong đặc tả:
 * tệp scan toàn ảnh giảm trung bình từ 50% trở lên ở mức Vừa.
 */
import { mkdtemp, readdir, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { QpdfRunner } from '../../src/main/services/qpdfRunner';
import { runCompress } from '../../src/main/services/compressionTask';
import type { TaskContext } from '../../src/main/services/taskQueue';
import type { CompressionLevel } from '../../src/shared/types';

const qpdf = new QpdfRunner(join(process.cwd(), 'resources', 'qpdf', 'qpdf.exe'));
const fixturesDir = join(process.cwd(), 'tests', 'fixtures');
const levels: CompressionLevel[] = ['light', 'medium', 'strong'];

function context(tempDir: string): TaskContext {
  return {
    taskId: 'report',
    signal: new AbortController().signal,
    tempDir,
    report: () => undefined,
  };
}

/** Định dạng dung lượng. */
function kb(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

async function main(): Promise<void> {
  const names = (await readdir(fixturesDir)).filter((name) => name.endsWith('.pdf')).sort();
  const workDir = await mkdtemp(join(tmpdir(), 'optb-report-'));

  console.log('tep'.padEnd(28), 'muc'.padEnd(7), 'truoc'.padStart(10), 'sau'.padStart(10), 'giam'.padStart(8), 'trang');
  console.log('-'.repeat(80));

  try {
    for (const name of names) {
      const source = join(fixturesDir, name);

      for (const level of levels) {
        const outDir = join(workDir, `${name}-${level}`);
        const before = (await stat(source)).size;
        const pagesBefore = await qpdf.pageCount(source).catch(() => null);

        try {
          const result = await runCompress(
            context(outDir),
            {
              path: source,
              level,
              outputDirectory: outDir,
              outputName: 'ket-qua',
            },
            qpdf,
          );

          const output = result.outputPaths[0] as string;
          const after = (await stat(output)).size;
          const pagesAfter = await qpdf.pageCount(output).catch(() => null);
          const saving = Math.round((1 - after / before) * 100);
          const pagesOk = pagesBefore === pagesAfter ? '' : ` (${pagesBefore} -> ${pagesAfter})`;

          console.log(
            name.padEnd(28),
            level.padEnd(7),
            kb(before).padStart(10),
            kb(after).padStart(10),
            `${saving}%`.padStart(8),
            `${pagesAfter ?? '?'}${pagesOk}`,
          );
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.log(
            name.padEnd(28),
            level.padEnd(7),
            kb(before).padStart(10),
            '-'.padStart(10),
            '-'.padStart(8),
            message.slice(0, 30),
          );
        }
      }
    }
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

void main();
