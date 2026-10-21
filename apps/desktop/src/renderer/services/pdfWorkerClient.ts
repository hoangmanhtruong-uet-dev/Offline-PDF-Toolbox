import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

import type { ErrorCode } from '@shared/types';

import type { ThumbnailRequest, ThumbnailResponse } from '../workers/thumbnail.worker';

/**
 * Khách hàng của worker hình thu nhổ.
 *
 * Quản lý:
 * - Vòng đời worker (tạo khi cần, huỷ khi không dùng).
 * - Ghép yêu cầu với phản hồi qua mã định danh.
 * - Bộ đệm hình thu nhổ tối đa 200 ảnh, loại bỏ theo thứ tự dùng gần nhất.
 */

/** Số hình thu nhổ tối đa được giữ trong bộ đệm. */
export const MAX_THUMBNAIL_CACHE = 200;

/** Chiều rộng hình thu nhổ tính bằng pixel. */
export const THUMBNAIL_WIDTH = 160;

type Pending = {
  resolve: (value: ThumbnailResponse) => void;
  reject: (reason: unknown) => void;
};

export type OpenResult =
  | {
      ok: true;
      pageCount: number;
      hasSignature: boolean;
      /** Các mục dấu trang cấp 1 của tài liệu. */
      outline: { title: string; page: number }[];
    }
  | { ok: false; code: ErrorCode };

export class PdfWorkerClient {
  private worker: Worker | null = null;
  private readonly pending = new Map<string, Pending>();
  private readonly thumbnails = new Map<string, string>();
  private counter = 0;

  /** Bộ đệm hình thu nhổ dùng lại được, giới hạn 200 ảnh. */
  get cacheSize(): number {
    return this.thumbnails.size;
  }

  private ensureWorker(): Worker {
    if (this.worker) return this.worker;

    const worker = new Worker(new URL('../workers/thumbnail.worker.ts', import.meta.url), {
      type: 'module',
    });

    worker.onmessage = (event: MessageEvent<ThumbnailResponse>) => {
      const response = event.data;
      const pending = this.pending.get(response.id);
      if (!pending) return;
      this.pending.delete(response.id);
      pending.resolve(response);
    };

    worker.onerror = (event) => {
      const error = new Error(event.message || 'Worker loi');
      for (const pending of this.pending.values()) pending.reject(error);
      this.pending.clear();
      this.worker?.terminate();
      this.worker = null;
    };

    this.worker = worker;
    return worker;
  }

  private request(payload: ThumbnailRequest, transfer?: Transferable[]): Promise<ThumbnailResponse> {
    const worker = this.ensureWorker();
    return new Promise<ThumbnailResponse>((resolve, reject) => {
      this.pending.set(payload.id, { resolve, reject });
      worker.postMessage(payload, { transfer: transfer ?? [] });
    });
  }

  private nextId(): string {
    this.counter += 1;
    return `pdf-${this.counter}`;
  }

  /** Mở một tệp PDF trong worker và trả về số trang. */
  async open(documentId: string, bytes: ArrayBuffer): Promise<OpenResult> {
    // Mã của tài liệu chính là mã yêu cầu: worker lưu tài liệu theo mã này
    // nên các lệnh vẽ sau đó không cần gửi lại nội dung tệp.
    const response = await this.request(
      {
        id: documentId,
        type: 'open',
        bytes,
        pdfWorkerUrl: new URL(pdfWorkerUrl, window.location.href).href,
        standardFontDataUrl: new URL('standard_fonts/', window.location.href).href,
      },
      [bytes],
    );

    if (!response.ok) {
      return { ok: false, code: response.code as ErrorCode };
    }

    if (response.type === 'open') {
      return {
        ok: true,
        pageCount: response.pageCount,
        hasSignature: response.hasSignature,
        outline: response.outline ?? [],
      };
    }

    return { ok: false, code: 'E_UNKNOWN' };
  }

  /**
   * Vẽ hình thu nhổ một trang.
   *
   * @returns Đường dẫn `blob:` của ảnh, hoặc null nếu không vẽ được.
   */
  async renderThumbnail(documentId: string, pageNumber: number, width = THUMBNAIL_WIDTH): Promise<string | null> {
    const cacheKey = `${documentId}:${pageNumber}:${width}`;
    const cached = this.thumbnails.get(cacheKey);
    if (cached) {
      // Đưa lên đầu để bộ đệm loại bỏ theo thứ tự dùng gần nhất.
      this.thumbnails.delete(cacheKey);
      this.thumbnails.set(cacheKey, cached);
      return cached;
    }

    const id = this.nextId();
    const response = await this.request({
      id,
      type: 'render',
      documentId,
      pageNumber,
      width,
    });

    if (!response.ok || response.type !== 'render') {
      if (!response.ok) {
        console.error('[pdf-worker] khong ve duoc hinh thu nho:', response.code, response.detail ?? '');
      }
      return null;
    }

    const url = URL.createObjectURL(response.blob);
    this.thumbnails.set(cacheKey, url);
    this.pruneCache();

    return url;
  }

  /** Xóa một tài liệu khỏi worker. */
  async close(documentId: string): Promise<void> {
    await this.request({ id: documentId, type: 'close' }).catch(() => undefined);
    for (const key of [...this.thumbnails.keys()]) {
      if (key.startsWith(`${documentId}:`)) {
        URL.revokeObjectURL(this.thumbnails.get(key) as string);
        this.thumbnails.delete(key);
      }
    }
  }

  /** Giải phóng toàn bộ tài nguyên. */
  dispose(): void {
    for (const url of this.thumbnails.values()) URL.revokeObjectURL(url);
    this.thumbnails.clear();
    this.worker?.terminate();
    this.worker = null;
    this.pending.clear();
  }

  private pruneCache(): void {
    while (this.thumbnails.size > MAX_THUMBNAIL_CACHE) {
      const oldest = this.thumbnails.keys().next();
      if (oldest.done) break;
      const url = this.thumbnails.get(oldest.value);
      if (url) URL.revokeObjectURL(url);
      this.thumbnails.delete(oldest.value);
    }
  }
}

/** Một client dùng chung cho toàn bộ ứng dụng. */
export const pdfWorkerClient = new PdfWorkerClient();
