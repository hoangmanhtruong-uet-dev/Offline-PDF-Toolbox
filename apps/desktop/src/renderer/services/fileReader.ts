import type { FileEntry, FileMeta } from '@shared/types';

import { pdfWorkerClient } from './pdfWorkerClient';

/**
 * Đọc thông tin của một tệp PDF: số trang, hình thu nhổ và cờ chữ ký số.
 *
 * Việc đọc chạy trong worker, nên giao diện không bị chặn.
 */
export async function readFileEntry(meta: FileMeta, id: string): Promise<FileEntry> {
  const base: FileEntry = {
    ...meta,
    id,
    pageCount: null,
    state: 'reading',
  };

  try {
    const result = (await window.optb.files.readBytes(meta.path)) as
      | { ok: true; bytes: Uint8Array }
      | { ok: false; reason: string; size: number };

    if (!result.ok) {
      return { ...base, state: 'error', errorCode: result.reason === 'tooLarge' ? 'E_DISK' : 'E_PARSE' };
    }

    const buffer = result.bytes.buffer.slice(
      result.bytes.byteOffset,
      result.bytes.byteOffset + result.bytes.byteLength,
    ) as ArrayBuffer;

    const opened = await pdfWorkerClient.open(id, buffer);

    if (!opened.ok) {
      return { ...base, state: 'error', errorCode: opened.code };
    }

    const thumbnail = await pdfWorkerClient.renderThumbnail(id, 1);

    return {
      ...base,
      state: 'ready',
      pageCount: opened.pageCount,
      hasSignature: opened.hasSignature,
      ...(thumbnail ? { thumbnail } : {}),
    };
  } catch {
    return { ...base, state: 'error', errorCode: 'E_UNKNOWN' };
  }
}
