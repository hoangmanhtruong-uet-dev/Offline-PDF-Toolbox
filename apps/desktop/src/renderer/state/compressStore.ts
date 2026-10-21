import { create } from 'zustand';

import type { FileEntry, FileMeta } from '@shared/types';

import { readFileEntry } from '../services/fileReader';
import { pdfWorkerClient } from '../services/pdfWorkerClient';

/**
 * Tệp đang được nén.
 *
 * F-03 nén **một** tệp, nên công cụ chỉ giữ đúng một tệp. Thêm tệp mới sẽ
 * thay thế tệp cũ.
 */
interface CompressState {
  file: FileEntry | null;
  /** Đặt tệp đang nén, đọc trong worker. */
  setFile: (meta: FileMeta | null) => void;
  /** Bỏ tệp đang nén. */
  clear: () => void;
}

let idCounter = 0;

function nextId(): string {
  idCounter += 1;
  return `compress-${Date.now().toString(36)}-${idCounter}`;
}

export const useCompressStore = create<CompressState>((set, get) => ({
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
