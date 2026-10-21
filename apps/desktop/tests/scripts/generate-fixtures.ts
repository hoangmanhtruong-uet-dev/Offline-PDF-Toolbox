/**
 * Sinh bộ tệp PDF kiểm thử.
 *
 * Tự sinh để không dùng tài liệu thật của người khác (TESTING.md mục 1).
 * Chạy: `npm run fixtures`.
 */
import { execFile } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const here = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(here, '..', 'fixtures');

/** Một trang nội dung. */
interface PageSpec {
  /** Văn bản hiển thị trên trang. */
  text: string;
  /** Vẽ hình chữ nhật xám, mô phỏng trang scan. */
  filled?: boolean;
  /** Kích thước trang theo điểm ảnh. Mặc định là Letter (612 x 792). */
  size?: [number, number];
}

/** Tạo một tệp PDF hợp lệ với số trang cho trước. */
export function buildPdf(pages: PageSpec[]): Buffer {
  const objects: string[] = [];

  // 1: Catalog, 2: Pages, 3..: trang, sau đó là nội dung và phông chữ.
  const pageCount = pages.length;
  const firstPageObject = 3;
  const contentStart = firstPageObject + pageCount;
  const fontObject = contentStart + pageCount;

  const kids = pages.map((_, index) => `${firstPageObject + index} 0 R`).join(' ');
  objects.push('<< /Type /Catalog /Pages 2 0 R >>');
  objects.push(`<< /Type /Pages /Kids [${kids}] /Count ${pageCount} >>`);

  pages.forEach((_page, index) => {
    const [width, height] = pages[index]?.size ?? [612, 792];
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] ` +
        `/Resources << /Font << /F1 ${fontObject} 0 R >> >> ` +
        `/Contents ${contentStart + index} 0 R >>`,
    );
  });

  pages.forEach((page) => {
    const content = page.filled
      ? `0.85 0.85 0.85 rg 40 40 532 712 re f\nBT /F1 24 Tf 72 700 Td (${escapeText(page.text)}) Tj ET`
      : `BT /F1 24 Tf 72 700 Td (${escapeText(page.text)}) Tj ET`;
    objects.push(`<< /Length ${Buffer.byteLength(content, 'latin1')} >>\nstream\n${content}\nendstream`);
  });

  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');

  let output = '%PDF-1.7\n%\xE2\xE3\xCF\xD3\n';
  const offsets: number[] = [];

  objects.forEach((body, index) => {
    offsets.push(Buffer.byteLength(output, 'latin1'));
    output += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(output, 'latin1');
  output += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) {
    output += `${String(offset).padStart(10, '0')} 00000 n \n`;
  }
  output += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(output, 'latin1');
}

function escapeText(text: string): string {
  return text.replace(/([\\()])/g, '\\$1');
}

/** Tệp PDF bị cắt cụt, để kiểm tra xử lý tệp hỏng. */
export function buildTruncatedPdf(): Buffer {
  const full = buildPdf([{ text: 'Truncated document' }]);
  return full.subarray(0, Math.floor(full.length * 0.6));
}

/**
 * Tạo ảnh JPEG giả lập trang scan.
 *
 * Ảnh có nhiều mảng sáng tối để nén JPEG thực sự làm nhỏ đi.
 */
async function buildScanJpeg(width: number, height: number): Promise<Buffer> {
  const { default: sharp } = await import('sharp');

  const raw = Buffer.alloc(width * height * 3);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 3;
      const band = ((x >> 5) + (y >> 5)) % 2 === 0;
      const noise = ((x * 7 + y * 13) % 17) - 8;
      raw[offset] = band ? 235 + noise : 60 + noise;
      raw[offset + 1] = band ? 238 + noise : 64 + noise;
      raw[offset + 2] = band ? 240 + noise : 70 + noise;
    }
  }

  return sharp(raw, { raw: { width, height, channels: 3 } })
    .jpeg({ quality: 92 })
    .toBuffer();
}

/**
 * Dựng PDF có nhúng ảnh JPEG phủ trọn trang.
 *
 * @param images Mỗi phần tử: ảnh JPEG, kích thước ảnh (pixel) và khổ trang.
 */
export function buildPdfWithJpegImages(
  images: { jpeg: Buffer; jpegWidth: number; jpegHeight: number; pageWidth: number; pageHeight: number }[],
): Buffer {
  const objects: Buffer[] = [];
  const pageCount = images.length;
  const firstPageObject = 3;
  const contentStart = firstPageObject + pageCount;
  const imageStart = contentStart + pageCount;
  const fontObject = imageStart + pageCount;

  const kids = images.map((_, index) => `${firstPageObject + index} 0 R`).join(' ');
  objects.push(Buffer.from('<< /Type /Catalog /Pages 2 0 R >>', 'latin1'));
  objects.push(Buffer.from(`<< /Type /Pages /Kids [${kids}] /Count ${pageCount} >>`, 'latin1'));

  images.forEach((image, index) => {
    objects.push(
      Buffer.from(
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${image.pageWidth} ${image.pageHeight}] ` +
          `/Resources << /XObject << /Im0 ${imageStart + index} 0 R >> ` +
          `/Font << /F1 ${fontObject} 0 R >> >> ` +
          `/Contents ${contentStart + index} 0 R >>`,
        'latin1',
      ),
    );
  });

  images.forEach((image) => {
    const content = `q ${image.pageWidth} 0 0 ${image.pageHeight} 0 0 cm /Im0 Do Q`;
    objects.push(
      Buffer.from(
        `<< /Length ${Buffer.byteLength(content, 'latin1')} >>\nstream\n${content}\nendstream`,
        'latin1',
      ),
    );
  });

  images.forEach((image) => {
    const header =
      `<< /Type /XObject /Subtype /Image /Width ${image.jpegWidth} /Height ${image.jpegHeight} ` +
      `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode ` +
      `/Length ${image.jpeg.length} >>\nstream\n`;
    objects.push(
      Buffer.concat([
        Buffer.from(header, 'latin1'),
        image.jpeg,
        Buffer.from('\nendstream', 'latin1'),
      ]),
    );
  });

  objects.push(
    Buffer.from(
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
      'latin1',
    ),
  );

  let result = Buffer.from('%PDF-1.7\n%\xE2\xE3\xCF\xD3\n', 'latin1');
  const offsets: number[] = [];

  objects.forEach((body, index) => {
    offsets.push(result.length);
    result = Buffer.concat([
      result,
      Buffer.from(`${index + 1} 0 obj\n`, 'latin1'),
      body,
      Buffer.from('\nendobj\n', 'latin1'),
    ]);
  });

  const xref = [`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`];
  for (const offset of offsets) {
    xref.push(`${String(offset).padStart(10, '0')} 00000 n \n`);
  }
  xref.push(
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${result.length}\n%%EOF\n`,
  );

  return Buffer.concat([result, Buffer.from(xref.join(''), 'latin1')]);
}

/** Danh sách tệp sẽ sinh. */
const files: { name: string; data: Buffer }[] = [
  { name: 'text-1page.pdf', data: buildPdf([{ text: 'Page one' }]) },
  {
    name: 'text-5pages.pdf',
    data: buildPdf(Array.from({ length: 5 }, (_, i) => ({ text: `Text page ${i + 1}` }))),
  },
  {
    name: 'mixed-3pages.pdf',
    data: buildPdf([
      { text: 'Text page', filled: false },
      { text: 'Scanned page', filled: true },
      { text: 'Text again', filled: false },
    ]),
  },
  {
    name: 'scan-2pages.pdf',
    data: buildPdf([
      { text: 'Scan one', filled: true },
      { text: 'Scan two', filled: true },
    ]),
  },
  // Ba khổ giấy khác nhau, dùng cho ca kiểm thử T-01.
  { name: 'page-size-letter.pdf', data: buildPdf([{ text: 'Letter page', size: [612, 792] }]) },
  { name: 'page-size-a4.pdf', data: buildPdf([{ text: 'A4 page', size: [595, 842] }]) },
  { name: 'page-size-a3.pdf', data: buildPdf([{ text: 'A3 page', size: [842, 1191] }]) },
  { name: 'broken-truncated.pdf', data: buildTruncatedPdf() },
  { name: 'broken-not-a-pdf.pdf', data: Buffer.from('Day la khong phai mot tep PDF.', 'utf8') },
  { name: 'unicode-tiếng-việt.pdf', data: buildPdf([{ text: 'Hop dong hop nhat' }]) },
];

/**
 * Sinh các tệp ảnh dùng cho công cụ Ảnh sang PDF.
 */
async function createImageFixtures(): Promise<void> {
  try {
    const { default: sharp } = await import('sharp');

    const make = (width: number, height: number, background: { r: number; g: number; b: number }) =>
      sharp({ create: { width, height, channels: 3, background } })
        .composite([
          {
            input: Buffer.from(
              `<svg width="${width}" height="${height}"><rect x="10" y="10" width="${
                width - 20
              }" height="${height - 20}" fill="none" stroke="black" stroke-width="6"/></svg>`,
            ),
            top: 0,
            left: 0,
          },
        ])
        .png()
        .toBuffer();

    await writeFile(join(fixturesDir, 'photo-1.png'), await make(400, 300, { r: 220, g: 120, b: 60 }));
    await writeFile(join(fixturesDir, 'photo-2.png'), await make(300, 400, { r: 60, g: 120, b: 220 }));
    await writeFile(
      join(fixturesDir, 'photo-3.jpg'),
      await sharp(await make(360, 480, { r: 40, g: 160, b: 90 })).jpeg({ quality: 90 }).toBuffer(),
    );

    console.log('da tao photo-1.png, photo-2.png, photo-3.jpg');
  } catch (error) {
    console.log('bo qua tep anh:', error instanceof Error ? error.message : error);
  }
}

async function main(): Promise<void> {
  await mkdir(fixturesDir, { recursive: true });

  for (const file of files) {
    await writeFile(join(fixturesDir, file.name), file.data);
    console.log(`da tao ${file.name} (${file.data.length} byte)`);
  }

  await createScanFixtures();
  await createImageFixtures();
  await createEncryptedFixture();

  console.log(`\n${files.length + 3} tep PDF va 3 tep anh da tao trong ${fixturesDir}`);
}

/**
 * Sinh các tệp mô phỏng trang scan: có ảnh JPEG nhúng phủ trọn trang.
 *
 * Dùng để kiểm thử việc nén ảnh (F-03). Ảnh có 300 dpi để nén thật sự
 * cho ra kết quả đo được.
 */
async function createScanFixtures(): Promise<void> {
  // Trang Letter 612 x 792 điểm ở 300 dpi -> 2550 x 3300 pixel.
  const letter = { pageWidth: 612, pageHeight: 792, dpi: 300 };
  const jpegWidth = Math.round((letter.pageWidth / 72) * letter.dpi);
  const jpegHeight = Math.round((letter.pageHeight / 72) * letter.dpi);

  try {
    const jpeg = await buildScanJpeg(jpegWidth, jpegHeight);

    const onePage = buildPdfWithJpegImages([
      { jpeg, jpegWidth, jpegHeight, pageWidth: letter.pageWidth, pageHeight: letter.pageHeight },
    ]);
    await writeFile(join(fixturesDir, 'scan-jpeg-1page.pdf'), onePage);
    console.log('da tao scan-jpeg-1page.pdf');

    const twoPages = buildPdfWithJpegImages([
      { jpeg, jpegWidth, jpegHeight, pageWidth: letter.pageWidth, pageHeight: letter.pageHeight },
      { jpeg, jpegWidth, jpegHeight, pageWidth: letter.pageWidth, pageHeight: letter.pageHeight },
    ]);
    await writeFile(join(fixturesDir, 'scan-jpeg-2pages.pdf'), twoPages);
    console.log('da tao scan-jpeg-2pages.pdf');
  } catch (error) {
    console.log('bo qua tep scan (khong tao duoc anh JPEG):', error instanceof Error ? error.message : error);
  }
}

/**
 * Tạo một tệp được bảo vệ bằng mật khẩu, dùng qpdf có sẵn.
 *
 * Không có qpdf thì bỏ qua: ca kiểm thử liên quan sẽ tự bỏ qua.
 */
async function createEncryptedFixture(): Promise<void> {
  const qpdf = join(here, '..', '..', 'resources', 'qpdf', 'qpdf.exe');
  const source = join(fixturesDir, 'text-1page.pdf');
  const target = join(fixturesDir, 'locked-user-password.pdf');

  try {
    await execFileAsync(qpdf, [
      '--encrypt',
      'mat-khau-nguoi-dung',
      'mat-khau-chu-so-hieu',
      '256',
      '--',
      source,
      target,
    ]);
    console.log('da tao locked-user-password.pdf');
  } catch {
    console.log('bo qua tep co mat khau (khong tim thay qpdf)');
  }
}

void main();
