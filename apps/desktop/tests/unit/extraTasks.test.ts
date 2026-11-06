import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { FeatureGate } from '@shared/features';

import { runBatch, runPrivacy, runProtect, runStamp, toLatinText } from '../../src/main/services/extraTasks';
import { QpdfRunner } from '../../src/main/services/qpdfRunner';
import type { TaskContext } from '../../src/main/services/taskQueue';

const qpdf = new QpdfRunner(join(process.cwd(), 'resources', 'qpdf', 'qpdf.exe'));
const fixtures = join(process.cwd(), 'tests', 'fixtures');
const source = join(fixtures, 'mixed-3pages.pdf');

async function setup(): Promise<{ dir: string; context: TaskContext }> {
  const dir = await mkdtemp(join(tmpdir(), 'optb-extra-'));
  const temp = await mkdtemp(join(tmpdir(), 'optb-extra-tmp-'));
  return {
    dir,
    context: { taskId: 't', signal: new AbortController().signal, tempDir: temp, report: () => undefined },
  };
}

describe('toLatinText', () => {
  it('bỏ dấu tiếng Việt', () => {
    expect(toLatinText('Tài liệu Mật Đặc biệt')).toBe('Tai lieu Mat Dac biet');
  });
});

describe('runStamp', () => {
  it('đóng dấu và đánh số trang, giữ nguyên số trang', async () => {
    const { dir, context } = await setup();
    const result = await runStamp(
      context,
      {
        path: source,
        watermarkText: 'Mật',
        watermarkOpacity: 0.3,
        pageNumbers: 'bottom-center',
        pageNumberFormat: 'n-of-total',
        outputDirectory: dir,
        outputName: 'stamped',
      },
      qpdf,
    );
    expect(result.outputPaths).toHaveLength(1);
    expect(await qpdf.pageCount(result.outputPaths[0] as string)).toBe(3);
  });

  it('báo lỗi khi không có gì để đóng dấu', async () => {
    const { dir, context } = await setup();
    await expect(
      runStamp(
        context,
        {
          path: source,
          watermarkText: '  ',
          watermarkOpacity: 0.3,
          pageNumbers: 'none',
          pageNumberFormat: 'n',
          outputDirectory: dir,
          outputName: 'x',
        },
        qpdf,
      ),
    ).rejects.toThrow();
  });
});

describe('runPrivacy', () => {
  it('xóa tác giả và tiêu đề', async () => {
    const { dir, context } = await setup();
    const result = await runPrivacy(context, { path: source, outputDirectory: dir, outputName: 'clean' }, qpdf);
    const text = (await readFile(result.outputPaths[0] as string)).toString('latin1');
    expect(text).not.toMatch(/\/Author\s*\(/);
    expect(text).not.toMatch(/\/Title\s*\(/);
    expect(await qpdf.pageCount(result.outputPaths[0] as string)).toBe(3);
  });
});

describe('runProtect', () => {
  it('đặt rồi gỡ mật khẩu', async () => {
    const { dir, context } = await setup();
    const locked = await runProtect(
      context,
      { path: source, mode: 'encrypt', password: 'bi-mat-123', outputDirectory: dir, outputName: 'locked' },
      qpdf,
    );
    const lockedPath = locked.outputPaths[0] as string;

    // Không có mật khẩu thì qpdf không mở được.
    const noPassword = await qpdf.run(['--check', lockedPath]);
    expect(noPassword.exitCode).not.toBe(0);

    const second = await setup();
    const unlocked = await runProtect(
      second.context,
      { path: lockedPath, mode: 'decrypt', password: 'bi-mat-123', outputDirectory: dir, outputName: 'unlocked' },
      qpdf,
    );
    const unlockedPath = unlocked.outputPaths[0] as string;
    expect((await qpdf.run(['--check', unlockedPath])).exitCode).toBe(0);
    expect(await qpdf.pageCount(unlockedPath)).toBe(3);
  });

  it('báo lỗi khi gỡ sai mật khẩu', async () => {
    const { dir, context } = await setup();
    const locked = await runProtect(
      context,
      { path: source, mode: 'encrypt', password: 'dung', outputDirectory: dir, outputName: 'l2' },
      qpdf,
    );
    const second = await setup();
    await expect(
      runProtect(
        second.context,
        { path: locked.outputPaths[0] as string, mode: 'decrypt', password: 'sai', outputDirectory: dir, outputName: 'u2' },
        qpdf,
      ),
    ).rejects.toMatchObject({ code: 'E_AUTH' });
  });
});

describe('runBatch', () => {
  it('xử lý nhiều tệp và bỏ qua tệp hỏng', async () => {
    const { dir, context } = await setup();
    const broken = join(dir, 'hong.pdf');
    await writeFile(broken, 'khong phai pdf');

    const result = await runBatch(
      context,
      {
        paths: [source, join(fixtures, 'text-1page.pdf'), broken],
        operation: { kind: 'privacy' },
        outputDirectory: dir,
      },
      qpdf,
    );
    expect(result.outputPaths).toHaveLength(2);
    expect(result.skipped).toHaveLength(1);
  });
});

describe('FeatureGate mới', () => {
  it('Free bị giới hạn đóng dấu, ảnh và độ phân giải; Pro thì không', () => {
    const free = FeatureGate.forLicense(false);
    const pro = FeatureGate.forLicense(true);
    expect(free.check('stamp', { pages: 11 }).allowed).toBe(false);
    expect(free.check('pdf2img', { pages: 5, width: 1600 }).allowed).toBe(true);
    expect(free.check('pdf2img', { pages: 6, width: 1600 }).allowed).toBe(false);
    expect(free.check('pdf2img', { pages: 1, width: 3200 }).allowed).toBe(false);
    expect(free.check('privacy', { files: 2 }).allowed).toBe(false);
    expect(free.check('password').allowed).toBe(false);
    expect(pro.check('pdf2img', { pages: 999, width: 4000 }).allowed).toBe(true);
    expect(pro.check('batch').allowed).toBe(true);
  });
});
