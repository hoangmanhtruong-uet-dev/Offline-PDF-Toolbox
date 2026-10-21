/**
 * Tải qpdf cho Windows và kiểm tra SHA-256.
 *
 * qpdf là động cơ chính xử lý PDF (ADR-002): gộp, tách, xoay, mã hóa và tối ưu
 * cấu trúc. Nó được chạy như tiến trình con, không dùng làm thư viện.
 *
 * Chạy: `node scripts/fetch-qpdf.mjs`
 *
 * Tệp nhị phân không đưa vào git: script này tải lại được, có kèm hash
 * đã ghim để bảo đảm đúng bản phát hành.
 */
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(here, '..');
const targetDir = join(packageRoot, 'resources', 'qpdf');

/** Phiên bản qpdf được ghim. */
export const QPDF_VERSION = '12.4.2';

/** Tệp phát hành dùng cho Windows x64 (bản MSVC, tự chứa các DLL cần thiết). */
export const QPDF_ASSET = `qpdf-${QPDF_VERSION}-msvc64.zip`;

/** SHA-256 của tệp phát hành, lấy từ trang release chính thức. */
export const QPDF_SHA256 = 'db87077e683630c1217e0e8f9a20a9749d952ab676e881c3689187763a5de25d';

const BASE_URL = 'https://github.com/qpdf/qpdf/releases/download';

/** Giấy phép Apache-2.0, đóng kèm cùng gói. */
const LICENSE_URL = 'https://www.apache.org/licenses/LICENSE-2.0.txt';

async function sha256(path) {
  const hash = createHash('sha256');
  hash.update(await readFile(path));
  return hash.digest('hex');
}

/** Chạy một lệnh và chờ kết thúc. */
function run(command, args) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, { stdio: 'inherit' });
    child.on('error', rejectPromise);
    child.on('close', (code) => {
      if (code === 0) resolvePromise();
      else rejectPromise(new Error(`${command} ket thuc voi ma ${code}`));
    });
  });
}

async function main() {
  const zipPath = join(targetDir, QPDF_ASSET);
  const url = `${BASE_URL}/v${QPDF_VERSION}/${QPDF_ASSET}`;

  await mkdir(targetDir, { recursive: true });

  console.log(`dang tai ${url}`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`khong tai duoc ${url}: HTTP ${response.status}`);
  }
  await writeFile(zipPath, Buffer.from(await response.arrayBuffer()));

  const actual = await sha256(zipPath);
  if (actual !== QPDF_SHA256) {
    await rm(zipPath, { force: true });
    throw new Error(
      `SHA-256 khong khop.\n  mong doi: ${QPDF_SHA256}\n  thu duoc: ${actual}`,
    );
  }
  console.log(`SHA-256 khop: ${actual}`);

  const extractDir = join(targetDir, '.extract');
  await rm(extractDir, { recursive: true, force: true });
  await mkdir(extractDir, { recursive: true });

  console.log('dang giai nen');
  await run('tar.exe', ['-xf', zipPath, '-C', extractDir]);

  const binDir = join(extractDir, `qpdf-${QPDF_VERSION}-msvc64`, 'bin');
  await cp(binDir, targetDir, { recursive: true });
  await rm(extractDir, { recursive: true, force: true });
  await rm(zipPath, { force: true });

  const license = await fetch(LICENSE_URL);
  if (license.ok) {
    await writeFile(join(targetDir, 'LICENSE-Apache-2.0.txt'), await license.text(), 'utf8');
  }
  await writeFile(
    join(targetDir, 'VERSION.txt'),
    `qpdf ${QPDF_VERSION}\n${QPDF_ASSET}\nsha256 ${QPDF_SHA256}\n`,
    'utf8',
  );

  console.log(`hoan tat: ${targetDir}`);
}

void main();
