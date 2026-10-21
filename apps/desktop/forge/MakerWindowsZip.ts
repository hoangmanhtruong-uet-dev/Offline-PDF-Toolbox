import { execFile } from 'node:child_process';
import { rm } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

import { MakerBase } from '@electron-forge/maker-base';
import type { MakerOptions } from '@electron-forge/maker-base';
import type { ForgePlatform } from '@electron-forge/shared-types';

const execFileAsync = promisify(execFile);

/**
 * Maker ZIP cho Windows, tự viết.
 *
 * `@electron-forge/maker-zip` dùng `cross-zip`, và bản mới nhất của
 * `cross-zip` vẫn gọi `fs.rmdir(dir, { recursive: true })` — Node 26 đã bỏ
 * tuỳ chọn này nên `npm run make` lỗi ngay trước khi nén.
 *
 * Thay bằng `System.IO.Compression.ZipFile` của .NET (có sẵn trong mọi máy
 * Windows) để không phụ thuộc thêm gói nào và không sửa `node_modules`.
 */
export class MakerWindowsZip extends MakerBase<Record<string, never>> {
  override name = 'zip';

  override defaultPlatforms: ForgePlatform[] = ['win32'];

  /** Không có trong lớp gốc, nhưng `IForgeMaker` dùng để lọc nền tảng. */
  supportedPlatforms: ForgePlatform[] = ['win32'];

  override isSupportedOnCurrentPlatform(): boolean {
    return process.platform === 'win32';
  }

  override async make({
    dir,
    makeDir,
    appName,
    packageJSON,
    targetArch,
    targetPlatform,
  }: MakerOptions): Promise<string[]> {
    const zipName = `${path.basename(dir)}-${packageJSON.version}.zip`;
    const zipPath = path.resolve(makeDir, 'zip', targetPlatform, targetArch, zipName);

    // CreateFromDirectory không ghi đè, nên dọn tệp cũ trước.
    await rm(zipPath, { force: true });

    const script = [
      '& { param([String]$src, [String]$dst)',
      'Add-Type -A "System.IO.Compression.FileSystem"',
      '[IO.Compression.ZipFile]::CreateFromDirectory($src, $dst)',
      'exit !$? }',
    ].join('; ');

    await execFileAsync(
      'powershell.exe',
      [
        '-nologo',
        '-noprofile',
        '-command',
        script,
        '-src',
        `"${dir}"`,
        '-dst',
        `"${zipPath}"`,
      ],
      { maxBuffer: Number.POSITIVE_INFINITY },
    );

    console.log(`  • Đã nén gói phát hành: ${appName} ${packageJSON.version} → ${zipPath}`);

    return [zipPath];
  }
}
