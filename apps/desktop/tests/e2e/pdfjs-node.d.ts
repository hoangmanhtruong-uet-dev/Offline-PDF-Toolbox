/**
 * Khai báo kiểu cho bản dựng ESM của pdfjs-dist.
 *
 * Gói `pdfjs-dist` chỉ khai báo kiểu cho điểm vào chính (`pdfjs-dist`), không
 * khai báo cho đường dẫn sâu bên trong. Kiểm thử dùng đường dẫn này để nạp
 * bản dựng trình duyệt trong Node.
 */
declare module 'pdfjs-dist/legacy/build/pdf.mjs' {
  import type { PDFDocumentProxy } from 'pdfjs-dist';

  export interface GetDocumentParameters {
    data?: Uint8Array | ArrayBuffer;
    useSystemFonts?: boolean;
    disableFontFace?: boolean;
    standardFontDataUrl?: string;
    [key: string]: unknown;
  }

  export interface PDFPageProxyLike {
    rotate: number;
    getViewport(options: { scale: number }): { width: number; height: number };
    getTextContent(): Promise<{
      items: ({ str?: string } | { str: string })[];
    }>;
  }

  export function getDocument(parameters: GetDocumentParameters): {
    promise: Promise<PDFDocumentProxy>;
  };
}

declare module 'pdfjs-dist/build/pdf.mjs' {
  export * from 'pdfjs-dist/legacy/build/pdf.mjs';
}
