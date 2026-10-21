import { describe, expect, it } from 'vitest';

import { AppError, classifyError, errorMessageKey, toErrorPayload } from '@shared/errors';
import { applyTemplate, buildOutputName, extensionOf, sanitizeFileName, stripExtension } from '@shared/naming';

describe('sanitizeFileName', () => {
  it('loại bỏ ký tự không hợp lệ trên Windows', () => {
    expect(sanitizeFileName('a/b\\c:d*e?f"g<h>i|j')).not.toMatch(/[<>:"/\\|?*]/);
  });

  it('loại bỏ ký tự điều khiển', () => {
    expect(sanitizeFileName('hop\u0000dong\u0007.pdf')).not.toContain('\u0000');
  });

  it('chặn đường dẫn truy ngược', () => {
    expect(sanitizeFileName('../../etc/passwd')).not.toContain('..');
  });

  it('tránh tên thiết bị đặc biệt của Windows', () => {
    expect(sanitizeFileName('CON').toLowerCase().startsWith('_')).toBe(true);
    expect(sanitizeFileName('nul.pdf').toLowerCase().startsWith('_')).toBe(true);
    expect(sanitizeFileName('LPT1.txt').toLowerCase().startsWith('_')).toBe(true);
  });

  it('giữ nguyên tên hợp lệ có dấu', () => {
    expect(sanitizeFileName('Hợp đồng hội nhập 2026.pdf')).toBe('Hợp đồng hội nhập 2026.pdf');
  });

  it('bỏ dấu chấm ở đầu và cuối', () => {
    expect(sanitizeFileName('.hidden.')).toBe('hidden');
  });

  it('cắt bớt tên quá dài', () => {
    const long = `${'a'.repeat(300)}.pdf`;
    expect(sanitizeFileName(long).length).toBeLessThanOrEqual(120);
  });

  it('không trả về chuỗi rỗng', () => {
    expect(sanitizeFileName('...')).toBe('file');
  });
});

describe('tiện ích tên tệp', () => {
  it('bỏ phần mở rộng', () => {
    expect(stripExtension('bao-cao.pdf')).toBe('bao-cao');
    expect(stripExtension('bao-cao')).toBe('bao-cao');
  });

  it('lấy phần mở rộng ở dạng chữ thường', () => {
    expect(extensionOf('a.PDF')).toBe('pdf');
    expect(extensionOf('khong co duoi')).toBe('');
  });
});

describe('applyTemplate và buildOutputName', () => {
  it('thay thế biến trong mẫu', () => {
    expect(applyTemplate('{name}_{index}', { name: 'hop-dong', index: 2 })).toBe('hop-dong_2');
  });

  it('giữ nguyên biến không có giá trị', () => {
    expect(applyTemplate('{name}_{index}', { name: 'hop-dong' })).toBe('hop-dong_{index}');
  });

  it('thêm phần mở rộng khi dựng tên đầu ra', () => {
    expect(buildOutputName('Merged_{date}', { date: '2026-10-21' })).toBe('Merged_2026-10-21.pdf');
  });

  it('làm sạch cả tên sinh ra', () => {
    expect(applyTemplate('{name}', { name: '../ket qua' })).not.toContain('..');
  });
});

describe('phân loại lỗi', () => {
  it('nhận diện lỗi hết dung lượng đĩa', () => {
    const error = Object.assign(new Error('no space left'), { code: 'ENOSPC' });
    expect(classifyError(error)).toBe('E_DISK');
  });

  it('nhận diện lỗi quyền ghi', () => {
    const error = Object.assign(new Error('denied'), { code: 'EACCES' });
    expect(classifyError(error)).toBe('E_PERM');
  });

  it('nhận diện lỗi đường dẫn quá dài', () => {
    const error = Object.assign(new Error('too long'), { code: 'ENAMETOOLONG' });
    expect(classifyError(error)).toBe('E_PATH');
  });

  it('giữ nguyên mã của AppError', () => {
    expect(classifyError(new AppError('E_SIGNED'))).toBe('E_SIGNED');
  });

  it('mọi mã lỗi đều có khoá thông báo', () => {
    for (const code of ['E_AUTH', 'E_STRUCT', 'E_PARSE', 'E_FORMAT', 'E_SIGNED', 'E_DISK', 'E_PERM', 'E_PATH', 'E_UNKNOWN'] as const) {
      expect(errorMessageKey(code)).toMatch(/^errors\./);
    }
  });

  it('chuyển lỗi bất kỳ thành payload an toàn', () => {
    const payload = toErrorPayload(new Error('chi tiết kỹ thuật'));
    expect(payload.code).toBe('E_UNKNOWN');
    expect(payload.messageKey).toBe('errors.unknown');
    expect(payload.detail).toBe('chi tiết kỹ thuật');
  });
});
