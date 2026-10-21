import { useCallback, useRef, useState } from 'react';

import { pdfWorkerClient } from '../services/pdfWorkerClient';

/**
 * Vẽ hình thu nhổ trang theo yêu cầu.
 *
 * Mỗi trang chỉ được vẽ khi lọt vào vùng nhìn thấy. Ảnh đã vẽ được giữ
 * trong bộ đệm của lớp dịch vụ (tối đa 200 ảnh), nên các lần cuộn lại không
 * phải vẽ lại.
 *
 * Ảnh được gắn theo mã tài liệu, nên khi đổi tài liệu cũng không cần xóa
 * trạng thái: các ảnh cũ chỉ nằm im trong bộ đệm và bị loại bỏ theo thứ tự
 * dùng gần nhất.
 */
export interface PageThumbnails {
  /** Hình thu nhổ đã vẽ, theo số trang của tài liệu hiện tại. */
  thumbnails: Record<number, string>;
  /** Báo một trang cần vẽ. */
  requestPage: (pageNumber: number) => void;
}

export function usePageThumbnails(
  documentId: string | null,
  pageCount: number,
  width = 120,
): PageThumbnails {
  const [drawn, setDrawn] = useState<Record<string, string>>({});
  const pending = useRef(new Set<string>());

  const requestPage = useCallback(
    (pageNumber: number) => {
      if (!documentId) return;
      if (pageNumber < 1 || pageNumber > pageCount) return;

      const key = `${documentId}:${pageNumber}`;
      if (pending.current.has(key)) return;

      pending.current.add(key);

      void pdfWorkerClient.renderThumbnail(documentId, pageNumber, width).then((url) => {
        pending.current.delete(key);
        if (!url) return;
        setDrawn((current) => ({ ...current, [key]: url }));
      });
    },
    [documentId, pageCount, width],
  );

  const thumbnails: Record<number, string> = {};
  if (documentId) {
    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      const url = drawn[`${documentId}:${pageNumber}`];
      if (url) thumbnails[pageNumber] = url;
    }
  }

  return { thumbnails, requestPage };
}
