import { create } from 'zustand';

import type { FileMeta, RecentFile } from '@shared/types';

import { pdfWorkerClient } from '../services/pdfWorkerClient';

/**
 * Danh sách tệp gần đây.
 *
 * Dùng chung cho màn hình chính và màn hình Cài đặt, nên một store duy
 * nhất thay vì mỗi màn hình tự tải.
 *
 * Số trang và hình thu nhổ được bổ sung **lazy**: chỉ tệp nào lọt vào vùng
 * nhìn thấy mới được đọc, và sau khi dựng xong thì tài liệu được đóng trong
 * worker để không giữ bộ nhớ.
 */

/** Thông tin bổ sung đã đọc được cho một tệp gần đây. */
export interface RecentDetail {
  pageCount?: number;
  thumbnail?: string;
}

interface RecentState {
  files: RecentFile[];
  /** Thông tin bổ sung theo đường dẫn tệp. */
  details: Record<string, RecentDetail>;
  /** Tệp đang được đọc, để không đọc trùng. */
  loading: Record<string, boolean>;
  load: () => Promise<void>;
  remove: (path: string) => Promise<void>;
  clear: () => Promise<void>;
  /** Đọc số trang và dựng hình thu nhổ cho một tệp gần đây. */
  enrich: (file: RecentFile) => Promise<void>;
}

export const useRecentStore = create<RecentState>((set, get) => ({
  files: [],
  details: {},
  loading: {},

  load: async () => {
    const files = (await window.optb.recent.get()) as RecentFile[];
    // Loại trùng theo đường dẫn, ưu tiên bản dùng gần nhất.
    const unique = new Map<string, RecentFile>();
    for (const file of files) {
      if (!unique.has(file.path)) unique.set(file.path, file);
    }
    set({ files: [...unique.values()] });
  },

  remove: async (path) => {
    await window.optb.recent.remove(path);
    set({
      files: get().files.filter((file) => file.path !== path),
    });
  },

  clear: async () => {
    await window.optb.recent.clear();
    set({ files: [], details: {} });
  },

  enrich: async (file) => {
    const state = get();
    if (state.loading[file.path] || state.details[file.path]) return;

    set({ loading: { ...state.loading, [file.path]: true } });

    try {
      const result = (await window.optb.files.readBytes(file.path)) as
        | { ok: true; bytes: Uint8Array }
        | { ok: false };

      if (!result.ok) {
        set({ details: { ...get().details, [file.path]: {} } });
        return;
      }

      const buffer = result.bytes.buffer.slice(
        result.bytes.byteOffset,
        result.bytes.byteOffset + result.bytes.byteLength,
      ) as ArrayBuffer;

      const documentId = `recent:${file.path}`;
      const opened = await pdfWorkerClient.open(documentId, buffer);

      if (!opened.ok) {
        set({ details: { ...get().details, [file.path]: {} } });
        return;
      }

      const thumbnail = await pdfWorkerClient.renderThumbnail(documentId, 1, 96);

      // Đóng tài liệu trong worker, giữ lại ảnh đã dựng.
      await pdfWorkerClient.releaseDocument(documentId);

      set({
        details: {
          ...get().details,
          [file.path]: { pageCount: opened.pageCount, thumbnail: thumbnail ?? undefined },
        },
      });

      // Ghi nhận số trang vào danh sách gần đây để lần sau khỏi đọc lại.
      if (file.pageCount !== opened.pageCount) {
        await window.optb.recent.touch(file.path, opened.pageCount);
        set({
          files: get().files.map((item) =>
            item.path === file.path ? { ...item, pageCount: opened.pageCount } : item,
          ),
        });
      }
    } catch {
      set({ details: { ...get().details, [file.path]: {} } });
    } finally {
      const loading = { ...get().loading };
      delete loading[file.path];
      set({ loading });
    }
  },
}));

/** Tạo FileMeta từ một bản ghi tệp gần đây. */
export function toFileMeta(file: RecentFile): FileMeta {
  return {
    path: file.path,
    name: file.name,
    size: file.size,
    modifiedAt: file.usedAt,
    ext: file.name.split('.').pop()?.toLowerCase() ?? '',
  };
}
