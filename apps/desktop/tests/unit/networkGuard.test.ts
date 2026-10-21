import { describe, expect, it } from 'vitest';

import { isRequestAllowed } from '../../src/main/services/networkGuard';

/**
 * Bộ lọc chặn mạng là một trong bốn điểm kiểm soát offline
 * (SECURITY-PRIVACY.md mục 2). Ở bản phát hành, mọi yêu cầu ra ngoài đều
 * bị chặn.
 */
describe('isRequestAllowed', () => {
  it('cho phép tài nguyên nội bộ', () => {
    expect(isRequestAllowed('app://bundle/index.html', true)).toBe(true);
    expect(isRequestAllowed('file:///C:/app/x.pdf', true)).toBe(true);
    expect(isRequestAllowed('blob:app://bundle/abc', true)).toBe(true);
    expect(isRequestAllowed('data:image/png;base64,AAA', true)).toBe(true);
  });

  it('chặn mọi giao thức mạng ở bản phát hành', () => {
    expect(isRequestAllowed('https://example.com/ping', true)).toBe(false);
    expect(isRequestAllowed('http://example.com/ping', true)).toBe(false);
    expect(isRequestAllowed('ws://example.com/socket', true)).toBe(false);
    expect(isRequestAllowed('wss://example.com/socket', true)).toBe(false);
  });

  it('chặn cả localhost ở bản phát hành', () => {
    expect(isRequestAllowed('http://localhost:5173/', true)).toBe(false);
    expect(isRequestAllowed('http://127.0.0.1:5173/', true)).toBe(false);
  });

  it('cho phép máy chủ phát triển khi đang phát triển', () => {
    expect(isRequestAllowed('http://localhost:5173/', false)).toBe(true);
    expect(isRequestAllowed('http://127.0.0.1:5173/', false)).toBe(true);
    expect(isRequestAllowed('ws://localhost:5173/', false)).toBe(true);
  });

  it('vẫn chặn máy chủ lạ khi đang phát triển', () => {
    expect(isRequestAllowed('https://example.com/ping', false)).toBe(false);
    expect(isRequestAllowed('http://192.168.1.10/', false)).toBe(false);
  });

  it('chặn URL không phân giải được', () => {
    expect(isRequestAllowed('khong phai url', true)).toBe(false);
  });
});
