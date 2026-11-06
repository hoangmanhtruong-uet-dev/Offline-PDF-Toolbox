/**
 * Tạo các tệp PDF mẫu có nội dung thật để chụp ảnh Store.
 *
 *   node scripts/make-demo-pdfs.mjs
 *
 * Kết quả ghi vào `store-assets/demo-pdfs/`. Tệp quét giả có ảnh nặng để màn
 * hình Nén cho thấy mức giảm dung lượng rõ rệt.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import sharp from 'sharp';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, '..', 'store-assets', 'demo-pdfs');
await mkdir(outDir, { recursive: true });

const PAGE = [595, 842]; // A4
const ink = rgb(0.12, 0.12, 0.18);
const muted = rgb(0.4, 0.4, 0.5);
const accent = rgb(0.486, 0.227, 0.929);

/** Ngắt đoạn văn thành các dòng vừa chiều rộng. */
function wrap(text, font, size, width) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) > width) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

const PARAGRAPHS = [
  'This Agreement sets out the terms under which the Supplier will provide services to the Client, including scope, delivery dates, payment terms and the responsibilities of each party.',
  'The Supplier shall perform the services with reasonable skill and care, in accordance with the specification agreed in writing, and shall notify the Client promptly of any matter likely to cause delay.',
  'All invoices are payable within thirty days of receipt. Late payments accrue interest at the statutory rate. Disputed amounts must be raised in writing within ten working days.',
  'Each party shall keep confidential all non-public information received from the other and shall use it only for the purpose of this Agreement. This obligation survives termination for five years.',
  'Either party may terminate this Agreement on thirty days written notice. On termination the Client shall pay for all services performed up to the date of termination.',
];

async function textDocument(file, title, pages, subtitle) {
  const doc = await PDFDocument.create();
  doc.setTitle(title);
  doc.setAuthor('Alex Morgan');
  doc.setProducer('Sample Generator');
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  for (let index = 0; index < pages; index += 1) {
    const page = doc.addPage(PAGE);
    page.drawRectangle({ x: 0, y: 802, width: 595, height: 40, color: accent });
    page.drawText(title, { x: 48, y: 815, size: 14, font: bold, color: rgb(1, 1, 1) });

    let y = 740;
    page.drawText(index === 0 ? subtitle : `Section ${index + 1}`, { x: 48, y, size: 22, font: bold, color: ink });
    y -= 36;

    for (let block = 0; block < 5; block += 1) {
      const paragraph = PARAGRAPHS[(index + block) % PARAGRAPHS.length];
      page.drawText(`${index + 1}.${block + 1}`, { x: 48, y, size: 11, font: bold, color: accent });
      for (const line of wrap(paragraph, font, 11, 440)) {
        page.drawText(line, { x: 84, y, size: 11, font, color: ink });
        y -= 16;
      }
      y -= 14;
    }

    page.drawText(`Page ${index + 1} of ${pages}`, { x: 48, y: 36, size: 9, font, color: muted });
  }

  await writeFile(join(outDir, file), await doc.save());
}

async function invoice() {
  const doc = await PDFDocument.create();
  doc.setTitle('Invoice 1042');
  doc.setAuthor('Alex Morgan');
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage(PAGE);

  page.drawText('INVOICE', { x: 48, y: 770, size: 32, font: bold, color: accent });
  page.drawText('No. 1042  |  Date: 2026-11-02', { x: 48, y: 745, size: 11, font, color: muted });
  page.drawText('Northwind Studio', { x: 380, y: 770, size: 14, font: bold, color: ink });
  page.drawText('12 Harbor Street, Portland', { x: 380, y: 752, size: 10, font, color: muted });

  const rows = [
    ['Brand identity package', '1', '1,200.00'],
    ['Website design (5 pages)', '1', '2,400.00'],
    ['Copywriting', '6', '90.00'],
    ['Hosting setup', '1', '150.00'],
  ];
  let y = 660;
  page.drawRectangle({ x: 48, y: y - 6, width: 499, height: 24, color: rgb(0.95, 0.93, 1) });
  page.drawText('Description', { x: 56, y, size: 11, font: bold, color: ink });
  page.drawText('Qty', { x: 380, y, size: 11, font: bold, color: ink });
  page.drawText('Amount (USD)', { x: 450, y, size: 11, font: bold, color: ink });
  for (const [name, qty, amount] of rows) {
    y -= 30;
    page.drawText(name, { x: 56, y, size: 11, font, color: ink });
    page.drawText(qty, { x: 385, y, size: 11, font, color: ink });
    page.drawText(amount, { x: 470, y, size: 11, font, color: ink });
  }
  y -= 50;
  page.drawText('Total due', { x: 380, y, size: 13, font: bold, color: ink });
  page.drawText('4,290.00', { x: 470, y, size: 13, font: bold, color: accent });

  await writeFile(join(outDir, 'Invoice-1042.pdf'), await doc.save());
}

async function report() {
  const doc = await PDFDocument.create();
  doc.setTitle('Quarterly Report');
  doc.setAuthor('Alex Morgan');
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const bars = [42, 58, 51, 77];

  for (let index = 0; index < 4; index += 1) {
    const page = doc.addPage(PAGE);
    page.drawText(`Quarterly Report - Q${index + 1}`, { x: 48, y: 770, size: 24, font: bold, color: ink });
    page.drawText('Revenue by month (thousand USD)', { x: 48, y: 730, size: 12, font, color: muted });
    for (let bar = 0; bar < 4; bar += 1) {
      const value = bars[(bar + index) % 4] + index * 3;
      page.drawRectangle({ x: 80 + bar * 110, y: 400, width: 70, height: value * 3.2, color: accent, opacity: 0.55 + bar * 0.1 });
      page.drawText(String(value), { x: 100 + bar * 110, y: 408 + value * 3.2, size: 11, font: bold, color: ink });
    }
    for (const [lineIndex, line] of wrap(PARAGRAPHS[index % PARAGRAPHS.length], font, 11, 480).entries()) {
      page.drawText(line, { x: 48, y: 360 - lineIndex * 16, size: 11, font, color: ink });
    }
  }
  await writeFile(join(outDir, 'Quarterly-Report.pdf'), await doc.save());
}

/** Tệp "quét" giả: ảnh nhiễu nặng để việc nén cho kết quả rõ ràng. */
async function scanned() {
  const doc = await PDFDocument.create();
  doc.setTitle('Scanned Contract');
  for (let index = 0; index < 3; index += 1) {
    const jpeg = await sharp({
      create: { width: 1700, height: 2400, channels: 3, background: { r: 238, g: 236, b: 230 }, noise: { type: 'gaussian', mean: 238, sigma: 18 } },
    })
      .composite([
        {
          input: Buffer.from(
            `<svg xmlns="http://www.w3.org/2000/svg" width="1700" height="2400"><g fill="#33333a" opacity="0.8">${Array.from({ length: 26 }, (_, row) => `<rect x="170" y="${260 + row * 70}" width="${900 + ((row * 97) % 400)}" height="14" rx="7"/>`).join('')}</g></svg>`,
          ),
        },
      ])
      .jpeg({ quality: 96 })
      .toBuffer();
    const image = await doc.embedJpg(jpeg);
    const page = doc.addPage(PAGE);
    page.drawImage(image, { x: 0, y: 0, width: 595, height: 842 });
  }
  await writeFile(join(outDir, 'Scanned-Contract.pdf'), await doc.save());
}

await textDocument('Service-Agreement.pdf', 'Service Agreement', 6, 'Service Agreement');
await invoice();
await report();
await scanned();
console.log(`Đã tạo PDF mẫu tại ${outDir}`);
