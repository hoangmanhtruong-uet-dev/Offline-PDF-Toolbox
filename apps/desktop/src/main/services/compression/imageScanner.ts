import { inflateSync } from 'node:zlib';

import {
  PDFArray,
  PDFContext,
  PDFDict,
  PDFDocument,
  PDFName,
  PDFNumber,
  PDFObject,
  PDFPageLeaf,
  PDFRawStream,
  PDFRef,
} from 'pdf-lib';

import { findImagePlacements } from './contentStream';

/**
 * Quét các ảnh nhúng trong một tệp PDF.
 *
 * Kết quả cho mỗi ảnh: kích thước pixel, kích thước vật lý trên trang,
 * độ phân giải hiệu dụng, bộ lọc, không gian màu, và lý do không thể xử lý
 * (nếu có).
 */

/** Một ảnh nhúng tìm thấy trong tài liệu. */
export interface ScannedImage {
  /** Đối tượng gián tiếp của ảnh, dùng để thay nội dung. */
  ref: PDFRef | null;
  /** Từ điển chứa ảnh, dùng khi ảnh là đối tượng trực tiếp. */
  parent: PDFDict | null;
  /** Số trang nơi ảnh xuất hiện, bắt đầu từ 1. */
  page: number;
  /** Tên tài nguyên trong trang. */
  name: string;
  /** Chiều rộng ảnh tính bằng pixel. */
  pixelWidth: number;
  /** Chiều cao ảnh tính bằng pixel. */
  pixelHeight: number;
  /** Kích thước vật lý trên trang, tính bằng điểm ảnh. */
  placedWidth: number;
  /** Kích thước vật lý trên trang, tính bằng điểm ảnh. */
  placedHeight: number;
  /** Độ phân giải hiệu dụng (dpi), tính theo cạnh dài. */
  effectiveDpi: number;
  /** Dung lượng dữ liệu ảnh gốc, tính bằng byte. */
  originalBytes: number;
  /** Bộ lọc của luồng ảnh, ví dụ `DCTDecode`. */
  filter: string;
  /** Số kênh màu, hoặc 0 nếu không xác định được. */
  channels: number;
  /** Tên không gian màu, ví dụ `DeviceRGB`. */
  colorSpace: string;
  /** Số bit cho mỗi thành phần. */
  bitsPerComponent: number;
  /** Có mặt nạ mềm (SMask) hay không. */
  hasSoftMask: boolean;
  /** Có thể xử lý hay không. */
  processable: boolean;
  /** Lý do không xử lý được. */
  skipReason?: string;
}

/** Kết quả quét toàn tài liệu. */
export interface ScanResult {
  images: ScannedImage[];
  /** Tổng dung lượng ảnh nhúng. */
  totalImageBytes: number;
}

/** Đọc một giá trị trong từ điển, phân giải tham chiếu nếu cần. */
function resolveDictValue(
  context: PDFContext,
  dict: PDFDict | undefined,
  key: string,
): PDFObject | undefined {
  if (!dict) return undefined;
  const raw = dict.get(PDFName.of(key));
  if (raw instanceof PDFRef) return context.lookup(raw);
  return raw;
}

/** Đọc số nguyên từ từ điển. */
function getNumber(dict: PDFDict, key: string): number | undefined {
  const value = dict.get(PDFName.of(key));
  if (value instanceof PDFNumber) return value.asNumber();
  return undefined;
}

/** Đọc tên không gian màu. */
function getColorSpace(dict: PDFDict): { name: string; channels: number } {
  const value = dict.get(PDFName.of('ColorSpace'));

  if (value instanceof PDFName) {
    const name = value.asString().replace(/^\//, '');
    const channels = name === 'DeviceGray' || name === 'CalGray' ? 1 : name === 'DeviceCMYK' ? 4 : 3;
    return { name, channels };
  }

  if (value instanceof PDFArray && value.size() > 0) {
    const first = value.get(0);
    if (first instanceof PDFName) {
      const family = first.asString().replace(/^\//, '');
      if (family === 'ICCBased') {
        // Số kênh nằm trong luồng ICC; để 0 để bỏ qua ảnh này.
        return { name: 'ICCBased', channels: 0 };
      }
      if (family === 'Indexed' || family === 'Separation' || family === 'DeviceN') {
        return { name: family, channels: 0 };
      }
      if (family === 'DeviceGray' || family === 'CalGray') return { name: 'DeviceGray', channels: 1 };
      if (family === 'DeviceCMYK') return { name: 'DeviceCMYK', channels: 4 };
      return { name: 'DeviceRGB', channels: 3 };
    }
  }

  return { name: 'unknown', channels: 0 };
}

/** Đọc bộ lọc của một luồng. */
function getFilter(dict: PDFDict): string {
  const value = dict.get(PDFName.of('Filter'));
  if (value instanceof PDFName) return value.asString().replace(/^\//, '');
  if (value instanceof PDFArray && value.size() > 0) {
    const first = value.get(0);
    if (first instanceof PDFName) return first.asString().replace(/^\//, '');
  }
  return 'none';
}

/**
 * Giải mã nội dung của một luồng PDF.
 *
 * Chỉ hỗ trợ `FlateDecode` và luồng không nén — đủ cho luồng nội dung trang.
 */
export function decodeStreamContents(stream: PDFRawStream): Uint8Array | null {
  const filter = getFilter(stream.dict);
  const contents = stream.contents;

  if (filter === 'none') return contents;
  if (filter === 'FlateDecode') {
    try {
      return new Uint8Array(inflateSync(contents));
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Quét các ảnh nhúng trong tài liệu.
 */
export function scanImages(document: PDFDocument): ScanResult {
  const context = document.context;
  const images = new Map<string, ScannedImage>();
  let totalImageBytes = 0;

  const pages = document.getPages();

  pages.forEach((page, pageIndex) => {
    const resources = page.node.Resources();
    const xObjects = resolveDictValue(context, resources, 'XObject');
    if (!(xObjects instanceof PDFDict)) return;

    const contents = readPageContents(page.node);
    if (!contents) return;

    const placements = findImagePlacements(contents);
    const pageSize = page.getSize();

    for (const placement of placements) {
      // `get` trả về giá trị gốc (có thể là PDFRef), khác với `lookup` vốn
      // tự phân giải tham chiếu.
      const raw = xObjects.get(PDFName.of(placement.name));
      if (!raw) continue;

      const ref = raw instanceof PDFRef ? raw : null;
      const object = ref ? context.lookup(ref) : raw;
      if (!(object instanceof PDFRawStream)) continue;

      const dict = object.dict;
      const subtype = dict.get(PDFName.of('Subtype'));
      if (!(subtype instanceof PDFName) || subtype.asString() !== '/Image') continue;

      const pixelWidth = getNumber(dict, 'Width') ?? 0;
      const pixelHeight = getNumber(dict, 'Height') ?? 0;
      const originalBytes = object.contents.length;
      totalImageBytes += originalBytes;

      const colorSpace = getColorSpace(dict);
      const filter = getFilter(dict);
      const bitsPerComponent = getNumber(dict, 'BitsPerComponent') ?? 8;
      const hasSoftMask = dict.has(PDFName.of('SMask'));

      const placedWidth = placement.placedWidth > 0 ? placement.placedWidth : pageSize.width;
      const placedHeight = placement.placedHeight > 0 ? placement.placedHeight : pageSize.height;

      const dpiWidth = placedWidth > 0 ? pixelWidth / (placedWidth / 72) : 0;
      const dpiHeight = placedHeight > 0 ? pixelHeight / (placedHeight / 72) : 0;
      const effectiveDpi = Math.max(dpiWidth, dpiHeight);

      const refKey = ref ? ref.toString() : `direct:${pageIndex}:${placement.name}`;
      const existing = images.get(refKey);
      if (existing) {        // Ảnh dùng nhiều lần: giữ lần đặt có kích thước vật lý lớn nhất,
        // vì đó là lần đặt quyết định độ phân giải cần đạt.
        if (placedWidth * placedHeight > existing.placedWidth * existing.placedHeight) {
          existing.placedWidth = placedWidth;
          existing.placedHeight = placedHeight;
          existing.effectiveDpi = effectiveDpi;
        }
        continue;
      }

      const candidate: ScannedImage = {
        ref,
        parent: ref ? null : xObjects,
        page: pageIndex + 1,
        name: placement.name,
        pixelWidth,
        pixelHeight,
        placedWidth,
        placedHeight,
        effectiveDpi,
        originalBytes,
        filter,
        channels: colorSpace.channels,
        colorSpace: colorSpace.name,
        bitsPerComponent,
        hasSoftMask,
        processable: true,
      };

      const reason = checkProcessable(candidate);
      if (reason) {
        candidate.processable = false;
        candidate.skipReason = reason;
      }

      images.set(refKey, candidate);
    }
  });

  return { images: [...images.values()], totalImageBytes };
}

/** Kiểm tra một ảnh có thể xử lý nén được hay không. */
function checkProcessable(image: ScannedImage): string | undefined {
  if (image.pixelWidth <= 0 || image.pixelHeight <= 0) return 'khong doc duoc kich thuoc anh';
  if (image.originalBytes < 50 * 1024) return 'anh qua nho, khong dang xu ly';
  if (image.bitsPerComponent === 1) return 'anh 1 bit, khong ho tro';
  if (image.bitsPerComponent !== 8) return `khong ho tro ${image.bitsPerComponent} bit cho moi kenh`;
  if (image.filter !== 'DCTDecode' && image.filter !== 'FlateDecode') {
    return `khong ho tro bo loc ${image.filter}`;
  }
  if (image.channels === 0) return `khong ho tro khong gian mau ${image.colorSpace}`;
  if (image.channels === 1 && image.filter === 'FlateDecode') {
    // Ảnh thang xám nén Flate: vẫn xử lý được.
  }
  return undefined;
}

/** Đọc và ghép nội dung của một trang. */
function readPageContents(node: PDFPageLeaf): Uint8Array | null {
  const contents = node.Contents();
  if (!contents) return null;

  const context = node.context;
  const parts: Uint8Array[] = [];

  const append = (object: unknown): void => {
    if (object instanceof PDFRawStream) {
      const decoded = decodeStreamContents(object);
      if (decoded) parts.push(decoded);
      return;
    }
    if (object instanceof PDFArray) {
      for (let index = 0; index < object.size(); index += 1) {
        const item = object.get(index);
        const resolved = item instanceof PDFRef ? context.lookup(item) : item;
        append(resolved);
      }
    }
  };

  const resolved = contents instanceof PDFRef ? context.lookup(contents) : contents;
  append(resolved);

  if (parts.length === 0) return null;

  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    merged.set(part, offset);
    offset += part.length;
  }
  return merged;
}
