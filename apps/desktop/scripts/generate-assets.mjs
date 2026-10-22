import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = dirname(fileURLToPath(import.meta.url));
const desktopRoot = resolve(here, '..');
const assetsDir = join(desktopRoot, 'assets');

/**
 * Sinh biểu tượng SVG chất lượng cao (512x512):
 * Tờ giấy màu trắng/xanh nhạt với góc gấp, 3 vạch tài liệu và ổ khóa bảo mật vàng ở góc.
 */
function createIconSvg(size = 512) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="${size}" height="${size}">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f6cbd" />
      <stop offset="100%" stop-color="#004c87" />
    </linearGradient>
    <linearGradient id="paperGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#f0f4f8" />
    </linearGradient>
    <linearGradient id="foldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#d0dbe5" />
      <stop offset="100%" stop-color="#b8c8d8" />
    </linearGradient>
    <linearGradient id="lockGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffb900" />
      <stop offset="100%" stop-color="#d83b01" />
    </linearGradient>
    <filter id="dropShadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="16" stdDeviation="16" flood-color="#001830" flood-opacity="0.35" />
    </filter>
    <filter id="lockShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#000000" flood-opacity="0.3" />
    </filter>
  </defs>

  <!-- Nền hình vuông bo góc -->
  <rect width="512" height="512" rx="100" fill="url(#bgGrad)" />

  <!-- Tờ giấy PDF chính với góc gấp -->
  <g filter="url(#dropShadow)">
    <path d="M 130 90 
             L 300 90 
             L 382 172 
             L 382 422 
             A 16 16 0 0 1 366 438 
             L 146 438 
             A 16 16 0 0 1 130 422 
             Z" 
          fill="url(#paperGrad)" />
    
    <!-- Góc gấp tam giác phía trên bên phải -->
    <path d="M 300 90 
             L 300 162 
             A 10 10 0 0 0 310 172 
             L 382 172 
             Z" 
          fill="url(#foldGrad)" />
  </g>

  <!-- Các dòng tài liệu -->
  <rect x="180" y="210" width="150" height="18" rx="9" fill="#0f6cbd" opacity="0.8" />
  <rect x="180" y="250" width="130" height="18" rx="9" fill="#8da4be" />
  <rect x="180" y="290" width="100" height="18" rx="9" fill="#8da4be" />

  <!-- Biểu tượng ổ khóa bảo mật (Offline/Privacy) -->
  <g filter="url(#lockShadow)" transform="translate(260, 270)">
    <!-- Quai khóa -->
    <path d="M 45 45 L 45 30 A 25 25 0 0 1 95 30 L 95 45" 
          fill="none" 
          stroke="#e0e8f0" 
          stroke-width="14" 
          stroke-linecap="round" />
    <!-- Thân khóa -->
    <rect x="25" y="45" width="90" height="75" rx="16" fill="url(#lockGrad)" />
    <!-- Lỗ khóa -->
    <circle cx="70" cy="75" r="9" fill="#2b0000" />
    <path d="M 67 75 L 73 75 L 75 95 L 65 95 Z" fill="#2b0000" />
  </g>
</svg>`;
}

/**
 * Sinh ảnh biểu ngữ ngang (Wide 310x150) cho Start Menu tile
 */
function createWideSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 310 150" width="310" height="150">
  <defs>
    <linearGradient id="wideBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f6cbd" />
      <stop offset="100%" stop-color="#004c87" />
    </linearGradient>
  </defs>
  <rect width="310" height="150" fill="url(#wideBg)" />
  <g transform="translate(25, 20) scale(0.21)">
    <!-- Icon mini -->
    <path d="M 130 90 L 300 90 L 382 172 L 382 422 A 16 16 0 0 1 366 438 L 146 438 A 16 16 0 0 1 130 422 Z" fill="#ffffff" />
    <path d="M 300 90 L 300 162 A 10 10 0 0 0 310 172 L 382 172 Z" fill="#b8c8d8" />
    <rect x="180" y="210" width="150" height="20" rx="10" fill="#0f6cbd" />
    <rect x="180" y="255" width="130" height="20" rx="10" fill="#8da4be" />
    <g transform="translate(260, 270)">
      <path d="M 45 45 L 45 30 A 25 25 0 0 1 95 30 L 95 45" fill="none" stroke="#ffffff" stroke-width="16" stroke-linecap="round" />
      <rect x="25" y="45" width="90" height="75" rx="16" fill="#ffb900" />
    </g>
  </g>
  <text x="125" y="72" font-family="Segoe UI, system-ui, sans-serif" font-weight="600" font-size="20" fill="#ffffff">Offline PDF</text>
  <text x="125" y="98" font-family="Segoe UI, system-ui, sans-serif" font-weight="400" font-size="16" fill="#d0e4f5">Toolbox</text>
</svg>`;
}

/**
 * Sinh ảnh Splash Screen (620x300)
 */
function createSplashSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 620 300" width="620" height="300">
  <defs>
    <linearGradient id="splashBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f6cbd" />
      <stop offset="100%" stop-color="#003e6d" />
    </linearGradient>
  </defs>
  <rect width="620" height="300" fill="url(#splashBg)" />
  <g transform="translate(250, 45) scale(0.24)">
    <path d="M 130 90 L 300 90 L 382 172 L 382 422 A 16 16 0 0 1 366 438 L 146 438 A 16 16 0 0 1 130 422 Z" fill="#ffffff" />
    <path d="M 300 90 L 300 162 A 10 10 0 0 0 310 172 L 382 172 Z" fill="#b8c8d8" />
    <rect x="180" y="210" width="150" height="20" rx="10" fill="#0f6cbd" />
    <rect x="180" y="255" width="130" height="20" rx="10" fill="#8da4be" />
    <g transform="translate(260, 270)">
      <path d="M 45 45 L 45 30 A 25 25 0 0 1 95 30 L 95 45" fill="none" stroke="#ffffff" stroke-width="16" stroke-linecap="round" />
      <rect x="25" y="45" width="90" height="75" rx="16" fill="#ffb900" />
    </g>
  </g>
  <text x="310" y="200" text-anchor="middle" font-family="Segoe UI, system-ui, sans-serif" font-weight="600" font-size="28" fill="#ffffff">Offline PDF Toolbox</text>
  <text x="310" y="232" text-anchor="middle" font-family="Segoe UI, system-ui, sans-serif" font-weight="400" font-size="16" fill="#bed8f0">100% On-Device &amp; Private</text>
</svg>`;
}

/**
 * Đóng gói nhiều kích cỡ PNG thành tệp Windows .ico
 */
function createIco(pngBuffers, sizes) {
  const count = pngBuffers.length;
  const headerSize = 6;
  const entrySize = 16;
  let offset = headerSize + count * entrySize;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type 1 = icon
  header.writeUInt16LE(count, 4);

  const entries = [];
  for (let i = 0; i < count; i++) {
    const size = sizes[i];
    const buf = pngBuffers[i];
    const entry = Buffer.alloc(entrySize);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // width
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
    entry.writeUInt8(0, 2); // color count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(buf.length, 8); // image size
    entry.writeUInt32LE(offset, 12); // image offset
    entries.push(entry);
    offset += buf.length;
  }

  return Buffer.concat([header, ...entries, ...pngBuffers]);
}

async function main() {
  await mkdir(assetsDir, { recursive: true });
  console.log(`Đang sinh tài nguyên hình ảnh tại: ${assetsDir}`);

  const iconSvg = Buffer.from(createIconSvg(512));
  const wideSvg = Buffer.from(createWideSvg());
  const splashSvg = Buffer.from(createSplashSvg());

  // 1. Square44x44Logo.png (App icon nhỏ, taskbar, start menu)
  await sharp(iconSvg).resize(44, 44).png().toFile(join(assetsDir, 'Square44x44Logo.png'));
  console.log('  ✓ Square44x44Logo.png (44x44)');

  // 2. Square150x150Logo.png (Start Menu Medium Tile)
  await sharp(iconSvg).resize(150, 150).png().toFile(join(assetsDir, 'Square150x150Logo.png'));
  console.log('  ✓ Square150x150Logo.png (150x150)');

  // 3. StoreLogo.png (50x50 - Microsoft Store Logo)
  await sharp(iconSvg).resize(50, 50).png().toFile(join(assetsDir, 'StoreLogo.png'));
  console.log('  ✓ StoreLogo.png (50x50)');

  // 4. LockScreenLogo.png (24x24 - Khuyến nghị)
  await sharp(iconSvg).resize(24, 24).png().toFile(join(assetsDir, 'LockScreenLogo.png'));
  console.log('  ✓ LockScreenLogo.png (24x24)');

  // 5. Wide310x150Logo.png (Start Menu Wide Tile)
  await sharp(wideSvg).resize(310, 150).png().toFile(join(assetsDir, 'Wide310x150Logo.png'));
  console.log('  ✓ Wide310x150Logo.png (310x150)');

  // 6. SplashScreen.png (620x300 - Splash screen)
  await sharp(splashSvg).resize(620, 300).png().toFile(join(assetsDir, 'SplashScreen.png'));
  console.log('  ✓ SplashScreen.png (620x300)');

  // 7. Square310x310Logo.png (Start Menu Large Tile)
  await sharp(iconSvg).resize(310, 310).png().toFile(join(assetsDir, 'Square310x310Logo.png'));
  console.log('  ✓ Square310x310Logo.png (310x310)');

  // 8. Master icon.png (512x512)
  await sharp(iconSvg).resize(512, 512).png().toFile(join(assetsDir, 'icon.png'));
  console.log('  ✓ icon.png (512x512)');

  // 9. icon.ico cho Windows Desktop executable
  const icoSizes = [16, 32, 48, 64, 128, 256];
  const icoBuffers = [];
  for (const s of icoSizes) {
    const b = await sharp(iconSvg).resize(s, s).png().toBuffer();
    icoBuffers.push(b);
  }
  const icoData = createIco(icoBuffers, icoSizes);
  await writeFile(join(assetsDir, 'icon.ico'), icoData);
  console.log('  ✓ icon.ico (multi-res 16..256)');

  console.log('\nHoàn tất sinh toàn bộ Visual Assets!');
}

await main();
