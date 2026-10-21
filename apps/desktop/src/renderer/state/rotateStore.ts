import { create } from 'zustand';

import type { FileEntry, FileMeta } from '@shared/types';

import { readFileEntry } from '../services/fileReader';
import { pdfWorkerClient } from '../services/pdfWorkerClient';

/**
 * Tệp đang được xoay.
 *
 * F-04 xoay trang trong **một** tệp, nên công cụ xoay chỉ giữ đúng một tệp.
 * Thêm tệp mới sẽ thay thế tệp cũ, tránh tình trạng người dùng tưởng đang
 * xoay tệp khác.
 */
interface RotateState {
  file: FileEntry | null;
  /** Đặt tệp đang xoay, đọc trong worker. */
  setFile: (meta: FileMeta | null) => void;
  /** Bỏ tệp đang xoay. */
  clear: () => void;
}

let idCounter = 0;

function nextId(): string {
  idCounter += 1;
  return `rotate-${Date.now().toString(36)}-${idCounter}`;
}

export const useRotateStore = create<RotateState>((set, get) => ({
  file: null,

  setFile: (meta) => {
    const current = get().file;
    if (current) {
      void pdfWorkerClient.close(current.id);
    }

    if (!meta) {
      set({ file: null });
      return;
    }

    const id = nextId();
    set({
      file: {
        ...meta,
        id,
        pageCount: null,
        state: 'reading',
      },
    });

    void readFileEntry(meta, id).then((updated) => {
      if (get().file?.id !== id) return;
      set({ file: updated });
    });
  },

  clear: () => {
    const current = get().file;
    if (current) {
      void pdfWorkerClient.close(current.id);
    }
    set({ file: null });
  },
}));
