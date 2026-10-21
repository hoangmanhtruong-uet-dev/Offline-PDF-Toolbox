/**
 * Sinh bộ tệp PDF kiểm thử.
 *
 * Tự sinh để không dùng tài liệu thật của người khác (TESTING.md mục 1).
 * Chạy: `pnpm fixtures`.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(here, '..', 'fixtures');

/** Một trang nội dung. */
interface PageSpec {
  /** Văn bản hiển thị trên trang. */
  text: string;
  /** Vẽ hình chữ nhật đen, mô phỏng trang scan. */
  filled?: boolean;
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
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] ` +
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

/** Danh sách tệp sẽ sinh. */
const files: { name: string; data: Buffer }[] = [
  { name: 'text-1page.pdf', data: buildPdf([{ text: 'Page one' }]) },
  { name: 'text-5pages.pdf', data: buildPdf(Array.from({ length: 5 }, (_, i) => ({ text: `Text page ${i + 1}` }))) },
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
  { name: 'broken-truncated.pdf', data: buildTruncatedPdf() },
  { name: 'broken-not-a-pdf.pdf', data: Buffer.from('Day la khong phai mot tep PDF.', 'utf8') },
  { name: 'unicode-tiếng-việt.pdf', data: buildPdf([{ text: 'Hop dong hop nhat' }]) },
];

async function main(): Promise<void> {
  await mkdir(fixturesDir, { recursive: true });
  for (const file of files) {
    await writeFile(join(fixturesDir, file.name), file.data);
    console.log(`da tao ${file.name} (${file.data.length} byte)`);
  }
  console.log(`\n${files.length} tep da tao trong ${fixturesDir}`);
}

void main();
