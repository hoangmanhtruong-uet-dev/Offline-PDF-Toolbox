import { mkdtemp, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { isInsideDirectory, listPdfFiles, resolveOutputPath, uniqueOutputPath } from '../../src/main/services/safePath';

async function tempDir(): Promise<string> {
  return mkdtemp(join(tmpdir(), 'optb-test-'));
}

describe('isInsideDirectory', () => {
  it('chấp nhận đường dẫn nằm trong thư mục', () => {
    expect(isInsideDirectory(join('/data', 'ket-qua.pdf'), '/data')).toBe(true);
  });

  it('từ chối đường dẫn truy ngược', () => {
    expect(isInsideDirectory(join('/data', '..', 'khac.pdf'), '/data')).toBe(false);
  });
});

describe('resolveOutputPath', () => {
  it('làm sạch tên tệp đầu ra và giữ trong thư mục đích', async () => {
    const dir = await tempDir();
    const result = resolveOutputPath(dir, 'ket qua?.pdf');

    expect(result).not.toContain('?');
    expect(isInsideDirectory(result, dir)).toBe(true);
  });

  it('vô hiệu hoá đường dẫn truy ngược thay vì ghi ra ngoài', async () => {
    const dir = await tempDir();
    const result = resolveOutputPath(dir, '../ket-qua.pdf');

    expect(result).not.toContain('..');
    expect(isInsideDirectory(result, dir)).toBe(true);
  });

  it('không bao giờ trả về đường dẫn nằm ngoài thư mục đích', async () => {
    const dir = await tempDir();
    const outside = await tempDir();

    const hostile = [
      '../ket-qua.pdf',
      '../../etc/passwd',
      outside,
      '..\\..\\Windows\\System32\\config',
      'C:\\Windows\\System32\\drivers\\etc\\hosts',
      'CON.pdf',
      '..',
    ];

    for (const name of hostile) {
      const result = resolveOutputPath(dir, name);
      expect(isInsideDirectory(result, dir)).toBe(true);
      expect(result).not.toContain('..');
    }
  });
});

describe('uniqueOutputPath', () => {
  it('giữ nguyên tên khi chưa tồn tại', async () => {
    const dir = await tempDir();
    expect(await uniqueOutputPath(dir, 'ket-qua.pdf')).toBe(join(dir, 'ket-qua.pdf'));
  });

  it('không bao giờ ghi đè tệp đã tồn tại', async () => {
    const dir = await tempDir();
    await writeFile(join(dir, 'ket-qua.pdf'), 'x');

    const target = await uniqueOutputPath(dir, 'ket-qua.pdf');
    expect(target).not.toBe(join(dir, 'ket-qua.pdf'));
    expect(target).toContain('ket-qua (1)');
  });

  it('thêm hậu tố tiếp theo khi tên đã có nhiều bản', async () => {
    const dir = await tempDir();
    await writeFile(join(dir, 'ket-qua.pdf'), 'x');
    await writeFile(join(dir, 'ket-qua (1).pdf'), 'x');

    const target = await uniqueOutputPath(dir, 'ket-qua.pdf');
    expect(target).toContain('ket-qua (2)');
  });
});

describe('listPdfFiles', () => {
  it('chỉ liệt kê tệp PDF', async () => {
    const dir = await tempDir();
    await writeFile(join(dir, 'a.pdf'), 'x');
    await writeFile(join(dir, 'b.txt'), 'x');

    const files = await listPdfFiles(dir);
    expect(files).toHaveLength(1);
    expect(files[0]).toContain('a.pdf');
  });

  it('trả về mảng rỗng khi thư mục không tồn tại', async () => {
    const files = await listPdfFiles(join(tmpdir(), 'khong-ton-tai-xyz'));
    expect(files).toEqual([]);
  });

  it('bỏ qua thư mục con', async () => {
    const dir = await tempDir();
    const { mkdir } = await import('node:fs/promises');
    await mkdir(join(dir, 'con'));
    await writeFile(join(dir, 'con', 'a.pdf'), 'x');

    const files = await listPdfFiles(dir);
    expect(files).toHaveLength(0);
    expect(readdir).toBeDefined();
  });
});
