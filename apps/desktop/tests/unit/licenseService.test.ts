import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { LicenseService } from '../../src/main/services/licenseService';

describe('LicenseService', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'optb-license-test-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('khởi tạo mặc định ở trạng thái Free khi chưa có bộ đệm', async () => {
    const service = new LicenseService({
      userDataDir: tempDir,
      storeBridgePath: join(tempDir, 'non-existent.exe'),
      isPackaged: true,
    });

    const status = await service.init();
    expect(status.isPro).toBe(false);
    expect(status.state).toBe('unknown');
  });

  it('giữ trạng thái Pro trong 14 ngày khi Store không kết nối được (mục 6 LICENSING.md)', async () => {
    const cachedData = {
      isPro: true,
      lastVerifiedAt: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 ngày trước (< 14 ngày)
      state: 'active',
    };
    await writeFile(join(tempDir, 'license.json'), JSON.stringify(cachedData));

    const service = new LicenseService({
      userDataDir: tempDir,
      storeBridgePath: join(tempDir, 'non-existent.exe'),
      isPackaged: true,
    });

    const status = await service.init();
    expect(status.isPro).toBe(true);
    expect(status.state).toBe('active');
  });

  it('hạ về Free khi bộ nhớ đệm Pro đã quá 14 ngày', async () => {
    const cachedData = {
      isPro: true,
      lastVerifiedAt: Date.now() - 15 * 24 * 60 * 60 * 1000, // 15 ngày trước (> 14 ngày)
      state: 'active',
    };
    await writeFile(join(tempDir, 'license.json'), JSON.stringify(cachedData));

    const service = new LicenseService({
      userDataDir: tempDir,
      storeBridgePath: join(tempDir, 'non-existent.exe'),
      isPackaged: true,
    });

    const status = await service.init();
    expect(status.isPro).toBe(false);
    expect(status.state).toBe('unknown');
  });

  it('bật Pro ngay lập tức khi chạy ở chế độ kiểm thử (cờ OPTB_TEST_PRO)', async () => {
    process.env.OPTB_TEST_PRO = '1';
    try {
      const service = new LicenseService({
        userDataDir: tempDir,
        storeBridgePath: join(tempDir, 'non-existent.exe'),
        isPackaged: false,
      });

      const status = await service.init();
      expect(status.isPro).toBe(true);
      expect(status.state).toBe('active');
      expect(service.getStatus().isPro).toBe(true);
    } finally {
      delete process.env.OPTB_TEST_PRO;
    }
  });
});
