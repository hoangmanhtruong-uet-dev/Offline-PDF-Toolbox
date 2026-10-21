import { execFile } from 'node:child_process';
import { copyFile, mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

import { _electron as electron } from 'playwright';
import type { ElectronApplication, Page } from 'playwright';

import { checkPdf } from '../helpers/pdfCheck';

/**
 * Kiểm tra bản phát hành đã đóng gói.
 *
 * Chạy ứng dụng **từ gói đã đóng gói** (không phải bản chạy dev), với thư
 * mục dữ liệu sạch, rồi chạy qua cả sáu công cụ và theo dõi xem có kết
 * nối mạng nào không.
 *
 * Chạy: `npx vite-node --config vite.scripts.config.ts tests/scripts/release-check.ts`
 *
 * Tham số:
 * - `--app <thư mục>`: thư mục ứng dụng đã đóng gói (mặc định:
 *   `out/Offline PDF Toolbox-win32-x64`).
 */

const execFileAsync = promisify(execFile);

/** Thư mục gốc của ứng dụng điện tử. */
const here = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = resolve(here, '../..');

/** Thư mục tệp kiểm thử. */
const FIXTURES = join(APP_ROOT, 'tests', 'fixtures');

/** Kết quả của một công cụ. */
interface ToolResult {
  tool: string;
  ok: boolean;
  detail: string;
}

/** Thư mục ứng dụng đã đóng gói, lấy từ tham số dòng lệnh. */
function appDirectory(): string {
  const index = process.argv.indexOf('--app');
  if (index >= 0 && process.argv[index + 1]) {
    return resolve(process.argv[index + 1]);
  }
  return join(APP_ROOT, 'out', 'Offline PDF Toolbox-win32-x64');
}

/** Thay thế hộp thoại chọn tệp. */
async function stubFileDialog(app: ElectronApplication, paths: string[]): Promise<void> {
  await app.evaluate(async ({ dialog }, filePaths) => {
    dialog.showOpenDialog = (async () => ({
      canceled: false,
      filePaths,
    })) as typeof dialog.showOpenDialog;
  }, paths);
}

/** Chuyển tới một công cụ rồi thêm các tệp đã cho. */
async function openTool(
  app: ElectronApplication,
  page: Page,
  toolId: string,
  paths: string[],
): Promise<void> {
  await stubFileDialog(app, paths);
  await page.locator(`[data-tool-id="${toolId}"]`).click();
  await page.getByTestId('options-panel').waitFor({ timeout: 15_000 });
  const dropBtn = page.getByTestId('drop-zone').getByRole('button').first();
  if (await dropBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await dropBtn.click();
  } else {
    await page.getByTestId('drop-zone').click();
  }
}

/** Chạy tác vụ và chờ dải tóm tắt kết quả. */
async function runTask(page: Page, timeout = 30_000): Promise<string> {
  const btn = page.getByTestId('primary-action');
  await btn.waitFor({ state: 'visible', timeout });
  await page
    .waitForFunction(() => {
      const el = document.querySelector('[data-testid="primary-action"]') as HTMLButtonElement | null;
      return el && !el.disabled && el.getAttribute('aria-disabled') !== 'true';
    }, { timeout: 15_000 })
    .catch(() => {});
  await btn.click();
  await page.getByTestId('result-summary').waitFor({ timeout });
  const output = await page.getByTestId('result-summary').getAttribute('data-output-path');
  if (!output) throw new Error('khong lay duoc duong dan tep dau ra');
  return output;
}

/** Về màn hình chính để chuyển sang công cụ khác. */
async function backToHome(page: Page): Promise<void> {
  await page.locator('[data-testid="back-button"]').first().click();
  await page.getByTestId('tool-grid').waitFor();
}

/** Chạy một công cụ và kiểm tra tệp đầu ra. */
async function exercise(
  app: ElectronApplication,
  page: Page,
  tool: string,
  toolId: string,
  paths: string[],
  expectations: Parameters<typeof checkPdf>[1],
): Promise<ToolResult> {
  try {
    console.log(`- Đang thử công cụ: ${tool}...`);
    await openTool(app, page, toolId, paths);
    const output = await runTask(page);
    const result = await checkPdf(output, expectations);

    const res = {
      tool,
      ok: result.ok,
      detail: result.ok
        ? `${result.pageCount} trang, ${(result.sizeBytes / 1024).toFixed(0)} KB`
        : result.problems.join('; '),
    };
    console.log(`  -> ${res.ok ? 'Đạt' : 'Lỗi'}: ${res.detail}`);
    return res;
  } catch (error) {
    const res = {
      tool,
      ok: false,
      detail: error instanceof Error ? error.message : String(error),
    };
    console.log(`  -> Lỗi ngoại lệ: ${res.detail}`);
    return res;
  }
}

/** Lấy các kết nối mạng đang mở của ứng dụng. */
async function networkConnections(pid: number): Promise<string[]> {
  try {
    const { stdout } = await execFileAsync('netstat', ['-ano']);
    return stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .filter((line) => !/^\s*Proto/.test(line))
      .filter((line) => !/127\.0\.0\.1|\[::1\]|0\.0\.0\.0:0|\*:0/.test(line))
      .filter((line) => !/LISTENING/.test(line))
      .filter((line) => {
        const parts = line.split(/\s+/);
        const linePid = parts[parts.length - 1];
        return linePid === String(pid);
      });
  } catch {
    return [];
  }
}

async function main(): Promise<void> {
  const appDir = appDirectory();
  const exe = join(appDir, 'OfflinePdfToolbox.exe');

  console.log(`Kiểm tra bản phát hành tại: ${appDir}\n`);

  // Chuẩn bị thư mục làm việc sạch: sao chép tệp kiểm thử sang nơi khác
  // để tệp đầu ra không làm bẩn kho tệp kiểm thử.
  const work = await mkdtemp(join(tmpdir(), 'optb-release-'));
  const inputs = join(work, 'input');
  const outputs = join(work, 'output');
  await import('node:fs/promises').then((fs) => fs.mkdir(inputs, { recursive: true }));
  await import('node:fs/promises').then((fs) => fs.mkdir(outputs, { recursive: true }));

  const wanted = [
    'page-size-letter.pdf',
    'page-size-a4.pdf',
    'mixed-3pages.pdf',
    'text-5pages.pdf',
    'photo-1.png',
    'photo-2.png',
  ];

  for (const name of wanted) {
    await copyFile(join(FIXTURES, name), join(inputs, name));
  }

  const available = new Set(await readdir(inputs));
  const missing = wanted.filter((name) => !available.has(name));
  if (missing.length > 0) {
    throw new Error(`thieu tep kiem thu: ${missing.join(', ')}`);
  }

  const userData = join(work, 'user-data');

  const cleanEnv: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined) {
      cleanEnv[key] = value;
    }
  }

  const app = await electron.launch({
    executablePath: exe,
    args: ['--enable-logging', `--user-data-dir=${userData}`],
    env: cleanEnv,
  });

  const results: ToolResult[] = [];
  const networkAttempts: string[] = [];
  const connectionsSeen = new Set<string>();

  try {
    const page = await app.firstWindow();
    await page.waitForLoadState('domcontentloaded');
    await page.getByTestId('tool-grid').waitFor({ timeout: 60_000 });

    // Theo dõi mọi yêu cầu mạng mà giao diện cố gắng gửi đi.
    page.on('request', (request) => {
      const url = request.url();
      if (!url.startsWith('app://') && !url.startsWith('blob:') && !url.startsWith('data:')) {
        networkAttempts.push(url);
      }
    });

    const pid = app.process()?.pid ?? 0;

    // Lấy mẫu kết nối mạng trong lúc chạy.
    let sampling = false;
    const sampler = setInterval(() => {
      if (sampling) return;
      sampling = true;
      void networkConnections(pid)
        .then((lines) => {
          for (const line of lines) connectionsSeen.add(line);
        })
        .finally(() => {
          sampling = false;
        });
    }, 2000);

    // 1. Gộp PDF.
    results.push(
      await exercise(app, page, 'Gộp PDF', 'merge', [
        join(inputs, 'page-size-letter.pdf'),
        join(inputs, 'page-size-a4.pdf'),
      ], {
        pageCount: 2,
        pageSizes: [
          { width: 612, height: 792 },
          { width: 595, height: 842 },
        ],
      }),
    );
    await backToHome(page);

    // 2. Tách PDF.
    results.push(
      await exercise(app, page, 'Tách PDF', 'split', [join(inputs, 'mixed-3pages.pdf')], {
        pageCount: 3,
      }),
    );
    await backToHome(page);

    // 3. Nén PDF.
    results.push(
      await exercise(app, page, 'Nén PDF', 'compress', [join(inputs, 'text-5pages.pdf')], {
        pageCount: 5,
      }),
    );
    await backToHome(page);

    // 4. Xoay trang.
    results.push(
      await exercise(app, page, 'Xoay trang', 'rotate', [join(inputs, 'mixed-3pages.pdf')], {
        pageCount: 3,
      }),
    );
    await backToHome(page);

    // 5. Sắp xếp trang.
    results.push(
      await exercise(app, page, 'Sắp xếp trang', 'pages', [join(inputs, 'mixed-3pages.pdf')], {
        pageCount: 3,
      }),
    );
    await backToHome(page);

    // 6. Ảnh sang PDF.
    results.push(
      await exercise(app, page, 'Ảnh sang PDF', 'images', [
        join(inputs, 'photo-1.png'),
        join(inputs, 'photo-2.png'),
      ], {
        pageCount: 2,
      }),
    );

    clearInterval(sampler);

    console.log('Kết quả sáu công cụ:');
    for (const result of results) {
      console.log(
        `  ${result.ok ? 'OK  ' : 'LOI '} ${result.tool.padEnd(16)} ${result.detail}`,
      );
    }

    console.log('\nKiểm tra mạng:');
    console.log(
      `  yêu cầu mạng từ giao diện: ${networkAttempts.length === 0 ? '0 (không có)' : networkAttempts.join(', ')}`,
    );
    console.log(
      `  kết nối TCP ra ngoài: ${connectionsSeen.size === 0 ? '0 (không có)' : [...connectionsSeen].join(' | ')}`,
    );

    const failed = results.filter((result) => !result.ok);
    const offlineOk = networkAttempts.length === 0 && connectionsSeen.size === 0;

    console.log('');
    if (failed.length === 0 && offlineOk) {
      console.log('KET LUAN: dat — ca sau cong cu chay that va khong co ket noi mang.');
    } else {
      console.log(
        `KET LUAN: khong dat — ${failed.length} cong cu loi, ${offlineOk ? 'offline OK' : 'phat hien ket noi mang'}.`,
      );
      process.exitCode = 1;
    }
  } finally {
    await app.close();
    await rm(work, { recursive: true, force: true });
  }
}

await main();
