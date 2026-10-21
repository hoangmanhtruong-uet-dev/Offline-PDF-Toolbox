import { create } from 'zustand';

import type { ErrorCode, FileEntry, FileMeta } from '@shared/types';

import { pdfWorkerClient } from '../services/pdfWorkerClient';

/**
 * Danh sách tệp của công cụ đang mở.
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
      void readFile(entry.id);
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

  reload: async (id) => {
    await readFile(id);
  },
}));

/** Đọc một tệp: số trang và hình thu nhổ trang đầu. */
async function readFile(id: string): Promise<void> {
  const update = (patch: Partial<FileEntry>): void => {
    useFilesStore.setState((state) => ({
      files: state.files.map((file) => (file.id === id ? { ...file, ...patch } : file)),
    }));
  };

  const file = useFilesStore.getState().files.find((item) => item.id === id);
  if (!file) return;

  update({ state: 'reading' });

  try {
    const result = (await window.optb.files.readBytes(file.path)) as
      | { ok: true; bytes: Uint8Array }
      | { ok: false; reason: string; size: number };

    if (!result.ok) {
      update({ state: 'error', errorCode: result.reason === 'tooLarge' ? 'E_DISK' : 'E_PARSE' });
      return;
    }

    const buffer = result.bytes.buffer.slice(
      result.bytes.byteOffset,
      result.bytes.byteOffset + result.bytes.byteLength,
    ) as ArrayBuffer;

    const opened = await pdfWorkerClient.open(id, buffer);

    if (!opened.ok) {
      update({ state: 'error', errorCode: opened.code as ErrorCode });
      return;
    }

    const thumbnail = await pdfWorkerClient.renderThumbnail(id, 1);
    update({ state: 'ready', pageCount: opened.pageCount, thumbnail: thumbnail ?? undefined });
  } catch (error) {
    update({ state: 'error', errorCode: 'E_UNKNOWN' });
    void error;
  }
}
