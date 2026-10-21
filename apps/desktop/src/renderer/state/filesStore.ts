import { create } from 'zustand';

import type { FileEntry, FileMeta } from '@shared/types';

import { readFileEntry } from '../services/fileReader';
import { pdfWorkerClient } from '../services/pdfWorkerClient';

/**
 * Danh sách tệp của công cụ gộp.
 *
 * Mỗi tệp được đọc trong worker: lấy số trang và dựng hình thu nhổ trang đầu.
 * Việc đọc chạy nền, không chặn giao diện.
 */

interface FilesState {
  files: FileEntry[];
  /** Thêm các tệp đã biết (từ hộp thoại hoặc kéo thả) và bắt đầu đọc. */
  addFiles: (metas: FileMeta[]) => void;
  removeFile: (id: string) => void;
  clear: () => void;
  moveFile: (from: number, to: number) => void;
  /** Đặt dải trang cho một tệp. */
  setPageRange: (id: string, range: string) => void;
  /** Sắp xếp lại danh sách theo một tiêu chí. */
  sortBy: (key: 'name' | 'modifiedAt' | 'size') => void;
  /** Đọc lại một tệp, dùng sau khi người dùng thay đổi tệp nguồn. */
  reload: (id: string) => Promise<void>;
}

let idCounter = 0;

function nextId(): string {
  idCounter += 1;
  return `file-${Date.now().toString(36)}-${idCounter}`;
}

export const useFilesStore = create<FilesState>((set, get) => ({
  files: [],

  addFiles: (metas) => {
    const existing = get().files;
    const known = new Set(existing.map((file) => file.path));
    const entries: FileEntry[] = metas
      .filter((meta) => !known.has(meta.path))
      .map((meta) => ({
        ...meta,
        id: nextId(),
        pageCount: null,
        state: 'pending',
      }));

    if (entries.length === 0) return;

    set({ files: [...existing, ...entries] });

    for (const entry of entries) {
      void readFileEntry(entry, entry.id).then((updated) => {
        // Giữ lại dải trang người dùng đã nhập: kết quả đọc tệp chỉ bổ sung
        // thông tin, không được xoá dữ liệu do người dùng nhập.
        useFilesStore.setState((state) => ({
          files: state.files.map((file) =>
            file.id === updated.id ? { ...file, ...updated, pageRange: file.pageRange } : file,
          ),
        }));
      });
    }
  },

  removeFile: (id) => {
    void pdfWorkerClient.close(id);
    set({ files: get().files.filter((file) => file.id !== id) });
  },

  clear: () => {
    for (const file of get().files) {
      void pdfWorkerClient.close(file.id);
    }
    set({ files: [] });
  },

  moveFile: (from, to) => {
    const files = [...get().files];
    if (from < 0 || from >= files.length || to < 0 || to >= files.length) return;
    const [moved] = files.splice(from, 1);
    if (!moved) return;
    files.splice(to, 0, moved);
    set({ files });
  },

  setPageRange: (id, range) => {
    set({
      files: get().files.map((file) => (file.id === id ? { ...file, pageRange: range } : file)),
    });
  },

  sortBy: (key) => {
    const files = [...get().files];
    files.sort((a, b) => {
      switch (key) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'modifiedAt':
          return b.modifiedAt - a.modifiedAt;
        case 'size':
          return b.size - a.size;
        default:
          return 0;
      }
    });
    set({ files });
  },

  reload: async (id) => {
    const file = get().files.find((item) => item.id === id);
    if (!file) return;
    const updated = await readFileEntry(file, id);
    set({
      files: get().files.map((item) =>
        item.id === id ? { ...item, ...updated, pageRange: item.pageRange } : item,
      ),
    });
  },
}));
