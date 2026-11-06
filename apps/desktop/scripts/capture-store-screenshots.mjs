/* global document */
/**
 * Chụp ảnh màn hình cho trang Microsoft Store từ chính ứng dụng đang chạy.
 *
 * Cách dùng (cần `npm run dev` đang chạy ở cửa sổ khác để có máy chủ giao diện):
 *   node scripts/capture-store-screenshots.mjs
 *
 * Ảnh PNG 1920x1080 được ghi vào `store-assets/screenshots/`. Tệp mẫu lấy từ
 * `store-assets/demo-pdfs` (tạo bằng `node scripts/make-demo-pdfs.mjs`; bản sao trong
 * thư mục tạm, không làm bẩn thư mục gốc).
 */
import { copyFile, mkdir, rm } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { _electron as electron } from 'playwright';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const outDir = join(root, 'store-assets', 'screenshots');
const fixtures = join(root, 'store-assets', 'demo-pdfs');

await mkdir(outDir, { recursive: true });
// Thư mục trung tính để ảnh không lộ tên người dùng hay thư mục tạm của máy chụp.
const work = String.raw`C:\Users\Public\Documents\PDF-Samples`;
await rm(work, { recursive: true, force: true });
await mkdir(work, { recursive: true });

async function copyFixture(name) {
  const target = join(work, name);
  await copyFile(join(fixtures, name), target);
  return target;
}

// Một số terminal (VS Code) đặt ELECTRON_RUN_AS_NODE khiến Electron chạy như Node thuần.
const env = { ...process.env, ELECTRON_USER_DATA: join(work, '.user-data') };
delete env.ELECTRON_RUN_AS_NODE;

const app = await electron.launch({
  args: [root, '--lang=en-US'],
  env,
});

const page = await app.firstWindow();
await page.waitForLoadState('domcontentloaded');

// Khung hình chuẩn của Store: 1920x1080, ép bằng CDP để không phụ thuộc cỡ màn hình thật.
const cdp = await page.context().newCDPSession(page);
await cdp.send('Emulation.setDeviceMetricsOverride', {
  width: 1920,
  height: 1080,
  deviceScaleFactor: 1,
  mobile: false,
});
await page.waitForTimeout(800);

async function setTheme(theme) {
  await page.evaluate(
    (value) =>
      window.optb.settings.update({
        theme: value,
        // Ảnh Store không nên lộ danh sách tệp gần đây hay đường dẫn tạm của máy chụp.
        showRecentFiles: false,
        outputDirectory: String.raw`C:\Users\Alex\Documents\PDFs`,
      }),
    theme,
  );
  await page.evaluate(() => {
    window.location.hash = '#/';
  });
  await page.reload();
  await page.waitForSelector('[data-testid="tool-grid"]');
  await page.waitForTimeout(600);
}

async function stubDialog(paths) {
  await app.evaluate(({ dialog }, filePaths) => {
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths });
  }, paths);
}

async function shot(name) {
  await page.waitForTimeout(700);
  await page.screenshot({ path: join(outDir, `${name}.png`) });
  const size = page.viewportSize();
  console.log(`ok ${name}.png`, size ? `${size.width}x${size.height}` : '');
}

/** Chụp màn hình chính thu nhỏ để thấy đủ cả lưới công cụ. */
async function shotHome(name) {
  await page.evaluate(() => {
    document.body.style.zoom = '0.74';
  });
  await shot(name);
  await page.evaluate(() => {
    document.body.style.zoom = '';
  });
}

async function home() {
  await page.evaluate(() => {
    window.location.hash = '#/';
  });
  await page.waitForSelector('[data-testid="tool-grid"]');
}

async function openTool(toolId, paths) {
  await home();
  await stubDialog(paths);
  await page.locator(`[data-tool-id="${toolId}"]`).click();
  await page.waitForSelector('[data-testid="options-panel"]');
  await page
    .getByTestId('drop-zone')
    .getByRole('button', { name: /Browse files|Select files/i })
    .click();
  await page.waitForSelector('[data-testid]', { timeout: 15000 });
  await page.waitForTimeout(3500);
}

const agreement = await copyFixture('Service-Agreement.pdf');
const invoice = await copyFixture('Invoice-1042.pdf');
const report = await copyFixture('Quarterly-Report.pdf');
const scan = await copyFixture('Scanned-Contract.pdf');

await setTheme('light');

// 01 Màn hình chính (lời hứa riêng tư, lưới công cụ).
await home();
await shotHome('01-home');

// 02 Gộp PDF.
await openTool('merge', [agreement, invoice, report]);
await shot('02-merge');

// 03 Nén PDF.
await openTool('compress', [scan]);
await shot('03-compress');

// 04 Tách PDF.
await openTool('split', [agreement]);
await shot('04-split');

// 05 Đóng dấu và đánh số trang.
await openTool('stamp', [agreement]);
await page.getByTestId('stamp-text').fill('CONFIDENTIAL');
await shot('05-watermark-page-numbers');

// 06 PDF sang ảnh.
await openTool('pdf2img', [report]);
await shot('06-pdf-to-images');

// 07 Khóa mật khẩu.
await openTool('protect', [invoice]);
await page.getByTestId('protect-password').fill('example-password');
await page.getByTestId('protect-confirm').fill('example-password');
await shot('07-password-lock');

// 08 Màn hình chính ở chế độ tối, 09 Gộp ở chế độ tối.
await setTheme('dark');
await home();
await shotHome('08-home-dark');
await openTool('merge', [agreement, invoice, report]);
await shot('09-merge-dark');

await setTheme('system');
await app.close();
await rm(work, { recursive: true, force: true });
console.log(`Xong. Ảnh nằm ở: ${outDir}`);
