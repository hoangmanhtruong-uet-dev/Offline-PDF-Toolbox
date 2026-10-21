import { create } from 'zustand';

import { pdfWorkerClient } from '../services/pdfWorkerClient';

/**
 * Danh sách trang của công cụ Sắp xếp trang (F-05).
 *
 * Mỗi trang giữ mã của tệp nguồn và số trang trong tệp đó, cùng góc xoay
 * **cộng thêm** so với hướng sẵn có. Cách này để việc xoay không phụ thuộc
 * vào hướng xoay gốc của tệp.
 */

/** Một trang trong danh sách. */
export interface PageEntry {
  /** Định danh duy nhất trong phiên làm việc. */
  id: string;
  /** Đường dẫn tệp nguồn. */
  path: string;
  /** Thư mục chứa tệp nguồn. */
  directory: string;
  /** Số trang trong tệp nguồn, bắt đầu từ 1. */
  pageNumber: number;
  /** Góc xoay cộng thêm, tính bằng độ. */
  rotationDelta: 0 | 90 | 180 | 270;
  /** Hình thu nhổ trang, nếu đã vẽ. */
  thumbnail?: string;
}

interface PagesState {
  pages: PageEntry[];
  /** Thêm tất cả trang của một tệp vào danh sách. */
  addFile: (path: string) => Promise<void>;
  /** Xóa một trang. */
  removePage: (index: number) => void;
  /** Xoay thêm 90 độ một trang. */
  rotatePage: (index: number) => void;
  /** Chuyển một trang từ vị trí này sang vị trí khác. */
  movePage: (from: number, to: number) => void;
  /** Vẽ hình thu nhổ cho một trang nếu chưa có. */
  loadThumbnail: (index: number) => Promise<void>;
  /** Xóa toàn bộ danh sách. */
  clear: () => void;
}

let idCounter = 0;

function nextId(): string {
  idCounter += 1;
  return `page-${Date.now().toString(36)}-${idCounter}`;
}

/** Mã tài liệu trong worker, theo đường dẫn tệp nguồn. */
function documentId(path: string): string {
  return `pages:${path}`;
}

export const usePagesStore = create<PagesState>((set, get) => ({
  pages: [],

  addFile: async (path) => {
    const result = (await window.optb.files.readBytes(path)) as
      | { ok: true; bytes: Uint8Array }
      | { ok: false };

    if (!result.ok) return;

    const buffer = result.bytes.buffer.slice(
      result.bytes.byteOffset,
      result.bytes.byteOffset + result.bytes.byteLength,
    ) as ArrayBuffer;

    const opened = await pdfWorkerClient.open(documentId(path), buffer);
    if (!opened.ok) return;

    const separator = Math.max(path.lastIndexOf('\\'), path.lastIndexOf('/'));
    const directory = separator > 0 ? path.slice(0, separator) : '';

    const entries: PageEntry[] = Array.from({ length: opened.pageCount }, (_unused, index) => ({
      id: nextId(),
      path,
      directory,
      pageNumber: index + 1,
      rotationDelta: 0 as const,
    }));

    set({ pages: [...get().pages, ...entries] });
  },

  removePage: (index) => {
    set({ pages: get().pages.filter((_page, position) => position !== index) });
  },

  rotatePage: (index) => {
    set({
      pages: get().pages.map((page, position) =>
        position === index
          ? { ...page, rotationDelta: (((page.rotationDelta + 90) % 360) as PageEntry['rotationDelta']) }
          : page,
      ),
    });
  },

  movePage: (from, to) => {
    const pages = [...get().pages];
    if (from < 0 || from >= pages.length || to < 0 || to >= pages.length) return;
    const [moved] = pages.splice(from, 1);
    if (!moved) return;
    pages.splice(to, 0, moved);
    set({ pages });
  },

  loadThumbnail: async (index) => {
    const page = get().pages[index];
    if (!page || page.thumbnail) return;

    const url = await pdfWorkerClient.renderThumbnail(documentId(page.path), page.pageNumber, 120);
    if (!url) return;

    set({
      pages: get().pages.map((item, position) =>
        position === index ? { ...item, thumbnail: url } : item,
      ),
    });
  },

  clear: () => {
    for (const page of get().pages) {
      void pdfWorkerClient.releaseDocument(documentId(page.path));
    }
    set({ pages: [] });
  },
}));
