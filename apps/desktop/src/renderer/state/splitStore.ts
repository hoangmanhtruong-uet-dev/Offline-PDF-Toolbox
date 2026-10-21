import { create } from 'zustand';

import type { FileEntry, FileMeta } from '@shared/types';

import { readFileEntry } from '../services/fileReader';
import { pdfWorkerClient } from '../services/pdfWorkerClient';

/**
 * Tệp đang được tách.
 *
 * F-02 tách **một** tài liệu thành nhiều tệp, nên công cụ chỉ giữ một tệp.
 * Thêm tệp mới sẽ thay thế tệp cũ.
 */
interface SplitState {
  file: FileEntry | null;
  /** Đặt tệp đang tách, đọc trong worker. */
  setFile: (meta: FileMeta | null) => void;
  /** Bỏ tệp đang tách. */
  clear: () => void;
}

let idCounter = 0;

function nextId(): string {
  idCounter += 1;
  return `split-${Date.now().toString(36)}-${idCounter}`;
}

export const useSplitStore = create<SplitState>((set, get) => ({
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
