import { spawn } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { LicenseStatus } from '@shared/types';

/**
 * Mã sản phẩm Pro mua một lần trong Partner Center.
 */
export const DEFAULT_PRO_PRODUCT_ID = 'pro_lifetime';

/** Thời gian giữ trạng thái Pro khi ngoại tuyến: 14 ngày (mục 6 LICENSING.md). */
const CACHE_VALIDITY_MS = 14 * 24 * 60 * 60 * 1000;

interface StoreBridgeRequest {
  id: string;
  cmd: 'getLicense' | 'purchase' | 'restore' | 'ping';
  productId?: string;
}

interface StoreBridgeResponse {
  id: string;
  ok: boolean;
  isPro?: boolean;
  licenseState?: string;
  status?: string;
  errorCode?: string;
  message?: string;
}

export interface LicenseServiceOptions {
  userDataDir: string;
  storeBridgePath?: string;
  productId?: string;
  isPackaged?: boolean;
}

export class LicenseService extends EventEmitter {
  private readonly cacheFile: string;
  private readonly storeBridgePath: string;
  private readonly productId: string;
  private readonly isPackaged: boolean;
  private currentStatus: LicenseStatus = {
    isPro: false,
    lastVerifiedAt: null,
    state: 'unknown',
  };

  constructor(options: LicenseServiceOptions) {
    super();
    this.cacheFile = join(options.userDataDir, 'license.json');
    this.storeBridgePath = options.storeBridgePath ?? '';
    this.productId = options.productId ?? DEFAULT_PRO_PRODUCT_ID;
    this.isPackaged = options.isPackaged ?? true;
  }

  /** Tìm đường dẫn tệp thực thi StoreBridge. */
  public static resolveBinaryPath(appPath: string): string {
    const candidates = [
      join(appPath, 'resources', 'store-bridge', 'StoreBridge.exe'),
      join(appPath, '..', 'resources', 'store-bridge', 'StoreBridge.exe'),
      join(appPath, 'tools', 'StoreBridge', 'bin', 'Release', 'net8.0-windows10.0.19041.0', 'StoreBridge.exe'),
      join(process.cwd(), 'apps', 'desktop', 'resources', 'store-bridge', 'StoreBridge.exe'),
    ];

    for (const candidate of candidates) {
      if (existsSync(candidate)) return candidate;
    }
    return candidates[0] as string;
  }

  /** Khởi tạo và nạp giấy phép lúc khởi động. */
  public async init(): Promise<LicenseStatus> {
    await this.loadCache();

    // Môi trường kiểm thử có cờ OPTB_TEST_PRO
    if (!this.isPackaged && process.env.OPTB_TEST_PRO === '1') {
      this.currentStatus = {
        isPro: true,
        lastVerifiedAt: Date.now(),
        state: 'active',
      };
      return this.currentStatus;
    }

    // Hỏi StoreBridge
    await this.refreshLicense();
    return this.currentStatus;
  }

  /** Lấy trạng thái giấy phép hiện tại. */
  public getStatus(): LicenseStatus {
    if (!this.isPackaged && process.env.OPTB_TEST_PRO === '1') {
      return {
        isPro: true,
        lastVerifiedAt: Date.now(),
        state: 'active',
      };
    }
    return this.currentStatus;
  }

  /** Làm mới trạng thái giấy phép từ Store. */
  public async refreshLicense(): Promise<LicenseStatus> {
    try {
      const res = await this.callStoreBridge({
        id: String(Date.now()),
        cmd: 'getLicense',
        productId: this.productId,
      });

      if (res.ok && res.isPro !== undefined) {
        this.updateStatus({
          isPro: res.isPro,
          lastVerifiedAt: Date.now(),
          state: res.isPro ? 'active' : 'unknown',
        });
      } else {
        this.applyOfflineFallback();
      }
    } catch {
      this.applyOfflineFallback();
    }

    return this.currentStatus;
  }

  /** Thực hiện yêu cầu mua Pro qua Store. */
  public async purchase(): Promise<{ success: boolean; status: string; message?: string }> {
    try {
      const res = await this.callStoreBridge({
        id: String(Date.now()),
        cmd: 'purchase',
        productId: this.productId,
      });

      if (res.ok && (res.status === 'completed' || res.status === 'alreadyPurchased')) {
        await this.refreshLicense();
        return { success: true, status: res.status };
      }

      if (res.status === 'cancelled') {
        return { success: false, status: 'cancelled' };
      }

      return {
        success: false,
        status: res.errorCode ?? 'E_PURCHASE_FAILED',
        message: res.message,
      };
    } catch (error) {
      return {
        success: false,
        status: 'E_STORE_UNAVAILABLE',
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /** Khôi phục giao dịch mua hàng. */
  public async restore(): Promise<LicenseStatus> {
    try {
      await this.callStoreBridge({
        id: String(Date.now()),
        cmd: 'restore',
        productId: this.productId,
      });
      return await this.refreshLicense();
    } catch {
      return this.getStatus();
    }
  }

  /** Áp dụng luật bộ nhớ đệm 14 ngày khi không kết nối được Store. */
  private applyOfflineFallback(): void {
    const { isPro, lastVerifiedAt } = this.currentStatus;
    if (isPro && lastVerifiedAt && Date.now() - lastVerifiedAt < CACHE_VALIDITY_MS) {
      this.currentStatus = {
        isPro: true,
        lastVerifiedAt,
        state: 'active',
      };
    } else {
      this.currentStatus = {
        isPro: false,
        lastVerifiedAt,
        state: 'unknown',
      };
    }
  }

  /** Cập nhật trạng thái và lưu bộ đệm. */
  private updateStatus(newStatus: LicenseStatus): void {
    const changed =
      this.currentStatus.isPro !== newStatus.isPro ||
      this.currentStatus.state !== newStatus.state;

    this.currentStatus = newStatus;
    void this.saveCache();

    if (changed) {
      this.emit('change', this.currentStatus);
    }
  }

  /** Gọi tiến trình con StoreBridge qua stdin/stdout JSON. */
  private callStoreBridge(req: StoreBridgeRequest): Promise<StoreBridgeResponse> {
    return new Promise((resolvePromise, rejectPromise) => {
      if (!this.storeBridgePath || !existsSync(this.storeBridgePath)) {
        resolvePromise({
          id: req.id,
          ok: false,
          errorCode: 'E_STORE_UNAVAILABLE',
          message: 'StoreBridge executable not found',
        });
        return;
      }

      const child = spawn(this.storeBridgePath, [], {
        windowsHide: true,
        stdio: ['pipe', 'pipe', 'ignore'],
      });

      let stdout = '';
      child.stdout.on('data', (chunk) => {
        stdout += chunk.toString();
      });

      child.on('error', (err) => {
        rejectPromise(err);
      });

      child.on('close', (code) => {
        if (code !== 0 && !stdout.trim()) {
          resolvePromise({
            id: req.id,
            ok: false,
            errorCode: 'E_STORE_EXIT',
            message: `StoreBridge exited with code ${code}`,
          });
          return;
        }

        try {
          const lines = stdout.trim().split(/\r?\n/);
          const lastLine = lines[lines.length - 1];
          const response = JSON.parse(lastLine || '{}') as StoreBridgeResponse;
          resolvePromise(response);
        } catch (parseError) {
          rejectPromise(parseError);
        }
      });

      child.stdin.write(JSON.stringify(req) + '\n');
      child.stdin.end();
    });
  }

  private async loadCache(): Promise<void> {
    try {
      const data = await readFile(this.cacheFile, 'utf8');
      const parsed = JSON.parse(data) as LicenseStatus;
      if (typeof parsed.isPro === 'boolean') {
        this.currentStatus = parsed;
      }
    } catch {
      // Bỏ qua nếu chưa có tệp bộ nhớ đệm
    }
  }

  private async saveCache(): Promise<void> {
    try {
      await writeFile(this.cacheFile, JSON.stringify(this.currentStatus, null, 2), 'utf8');
    } catch {
      // Bỏ qua lỗi ghi bộ nhớ đệm
    }
  }
}
