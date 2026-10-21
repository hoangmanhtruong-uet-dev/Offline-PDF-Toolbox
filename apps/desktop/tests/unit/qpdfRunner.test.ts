import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { AppError } from '@shared/errors';

import { QpdfRunner } from '../../src/main/services/qpdfRunner';

/**
 * Kiểm thử lớp bọc qpdf với chính qpdf thật.
 *
 * Bộ kiểm thử này bỏ qua nếu qpdf chưa được tải (xem scripts/fetch-qpdf.mjs).
 */
const qpdfPath = join(process.cwd(), 'resources', 'qpdf', 'qpdf.exe');
const fixtures = join(process.cwd(), 'tests', 'fixtures');
const qpdf = new QpdfRunner(qpdfPath);

describe('QpdfRunner', () => {
  it('đọc được số trang của tệp hợp lệ', async () => {
    expect(await qpdf.isAvailable()).toBe(true);
    expect(await qpdf.pageCount(join(fixtures, 'text-5pages.pdf'))).toBe(5);
    expect(await qpdf.pageCount(join(fixtures, 'mixed-3pages.pdf'))).toBe(3);
  });

  it('báo tệp hỏng khi kiểm tra cấu trúc', async () => {
    expect(await qpdf.check(join(fixtures, 'text-1page.pdf'))).toBe(true);
    expect(await qpdf.check(join(fixtures, 'broken-not-a-pdf.pdf'))).toBe(false);
    expect(await qpdf.check(join(fixtures, 'broken-truncated.pdf'))).toBe(false);
  });

  it('ném lỗi có mã khi đọc tệp hỏng', async () => {
    await expect(qpdf.pageCount(join(fixtures, 'broken-not-a-pdf.pdf'))).rejects.toThrow(AppError);
  });

  it('nhận diện tệp cần mật khẩu', async () => {
    const result = await qpdf.run(['--check', join(fixtures, 'locked-user-password.pdf')]);
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr.toLowerCase()).toContain('password');
  });

  it('không truyền mật khẩu trên dòng lệnh khi dùng tệp mật khẩu', async () => {
    // Tệp mật khẩu được tạo bởi scripts/generate-fixtures.ts.
    const passwordFile = join(process.cwd(), 'tests', 'fixtures', '.test-password.txt');
    const { writeFile, rm } = await import('node:fs/promises');
    await writeFile(passwordFile, 'mat-khau-nguoi-dung', 'utf8');

    try {
      const count = await qpdf.pageCount(join(fixtures, 'locked-user-password.pdf'), {
        passwordFile,
      });
      expect(count).toBe(1);
    } finally {
      await rm(passwordFile, { force: true });
    }
  });

  it('trả về mã thoát khác 0 cho tệp không tồn tại', async () => {
    const result = await qpdf.run(['--check', join(fixtures, 'khong-ton-tai.pdf')]);
    expect(result.exitCode).not.toBe(0);
  });
});
