import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

/**
 * Bộ kiểm tra kết quả đầu ra (TESTING.md mục 5).
 *
 * Bốn kiểm tra theo đặc tả:
 * 1. Tệp mở được.
 * 2. Đúng số trang mong đợi.
 * 3. Hướng (khổ giấy) của từng trang.
 * 4. Văn bản còn chọn và tìm kiếm được.
 *
 * Dùng chung cho kiểm thử đơn vị, kiểm thử đầu-cuối và script kiểm tra
 * thủ công.
 */

/** Thông tin từng trang của một tệp PDF. */
export interface PageInfo {
  /** Chiều rộng trang theo điểm ảnh. */
  width: number;
  /** Chiều cao trang theo điểm ảnh. */
  height: number;
  /** Góc xoay của trang theo độ. */
  rotate: number;
  /** Văn bản trích xuất được từ trang. */
  text: string;
}

/** Đường dẫn tới bộ phông chuẩn của PDF.js. */
function standardFontDataUrl(): string {
  return (
    pathToFileURL(join(process.cwd(), 'node_modules', 'pdfjs-dist', 'standard_fonts')).href + '/'
  );
}

/** Đọc thông tin từng trang của một tệp PDF. */
export async function readPdfPages(path: string): Promise<PageInfo[]> {
  const data = new Uint8Array(await readFile(path));
  const document = await getDocument({
    data,
    useSystemFonts: false,
    standardFontDataUrl: standardFontDataUrl(),
  }).promise;

  const pages: PageInfo[] = [];
  for (let index = 1; index <= document.numPages; index += 1) {
    const page = await document.getPage(index);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();

    pages.push({
      width: Math.round(viewport.width),
      height: Math.round(viewport.height),
      rotate: page.rotate,
      text: content.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ')
        .trim(),
    });
  }

  await document.cleanup();
  return pages;
}

/** Kỳ vọng về một tệp đầu ra. */
export interface PdfExpectations {
  /** Số trang phải có. */
  pageCount?: number;
  /** Khổ giấy mong đợi của từng trang, theo thứ tự. */
  pageSizes?: { width: number; height: number }[];
  /** Văn bản phải còn trích xuất được (tệp có lớp chữ). */
  textRequired?: boolean;
  /** Dung lượng tối đa cho phép, tính bằng byte. */
  maxBytes?: number;
}

/** Kết quả kiểm tra một tệp đầu ra. */
export interface CheckResult {
  ok: boolean;
  /** Các vấn đề tìm được, rỗng nếu tệp đạt yêu cầu. */
  problems: string[];
  pageCount: number;
  pages: PageInfo[];
  sizeBytes: number;
}

/**
 * Kiểm tra một tệp đầu ra theo kỳ vọng.
 *
 * Không ném lỗi: trả về danh sách vấn đề để báo cáo được đầy đủ.
 */
export async function checkPdf(
  path: string,
  expectations: PdfExpectations = {},
): Promise<CheckResult> {
  const problems: string[] = [];

  let sizeBytes = 0;
  try {
    sizeBytes = (await stat(path)).size;
  } catch {
    return { ok: false, problems: ['khong doc duoc tep dau ra'], pageCount: 0, pages: [], sizeBytes: 0 };
  }

  let pages: PageInfo[] = [];
  try {
    pages = await readPdfPages(path);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      problems: [`khong mo duoc tep: ${detail}`],
      pageCount: 0,
      pages: [],
      sizeBytes,
    };
  }

  if (expectations.pageCount !== undefined && pages.length !== expectations.pageCount) {
    problems.push(`so trang khong dung: mong doi ${expectations.pageCount}, nhan duoc ${pages.length}`);
  }

  if (expectations.pageSizes) {
    for (let index = 0; index < expectations.pageSizes.length; index += 1) {
      const expected = expectations.pageSizes[index];
      const actual = pages[index];
      if (!expected || !actual) continue;
      if (actual.width !== expected.width || actual.height !== expected.height) {
        problems.push(
          `kho giay trang ${index + 1} khong dung: mong doi ${expected.width}x${expected.height}, nhan duoc ${actual.width}x${actual.height}`,
        );
      }
    }
  }

  if (expectations.textRequired) {
    const withText = pages.filter((page) => page.text.length > 0).length;
    if (withText === 0 && pages.length > 0) {
      problems.push('khong trich xuat duoc van ban nao');
    }
  }

  if (expectations.maxBytes !== undefined && sizeBytes > expectations.maxBytes) {
    problems.push(
      `dung luong vuot gioi han: ${sizeBytes} > ${expectations.maxBytes} byte`,
    );
  }

  return { ok: problems.length === 0, problems, pageCount: pages.length, pages, sizeBytes };
}

/** Tổng số trang của các tệp đầu ra. */
export function totalPages(results: CheckResult[]): number {
  return results.reduce((sum, result) => sum + result.pageCount, 0);
}
