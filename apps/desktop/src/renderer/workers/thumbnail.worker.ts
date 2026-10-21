import * as pdfjsLib from 'pdfjs-dist';

/**
 * Worker dựng hình thu nhổ trang.
 *
 * Quy trình: tiến trình renderer gửi nội dung tệp, worker dùng PDF.js để
 * phân tích và vẽ trang lên OffscreenCanvas, rồi trả về ảnh PNG.
 *
 * PDF.js tự chạy phần phân tích nặng trong worker riêng của nó. Địa chỉ
 * worker đó được truyền vào từ luồng giao diện dưới dạng URL tuyệt đối,
 * vì worker lồng nhau không tự suy ra được đường dẫn tương đối.
 */

/**
 * PDF.js v6 giả định chạy trong ngữ cảnh có `window` và `document`
 * (`document.baseURI` khi tải bộ phông, `window.location` khi dựng worker
 * nội bộ). Trong Web Worker hai đối tượng này không tồn tại.
 *
 * Bộ shim dưới đây chỉ cung cấp đúng những thuộc tính PDF.js cần, không
 * mở rộng quyền truy cập của worker.
 */
interface WorkerGlobalWithShims {
  document?: { baseURI: string };
  window?: unknown;
}

const workerGlobal = self as unknown as WorkerGlobalWithShims;

if (typeof workerGlobal.document === 'undefined') {
  workerGlobal.document = { baseURI: self.location.href };
}

if (typeof workerGlobal.window === 'undefined') {
  workerGlobal.window = self;
}

export type ThumbnailRequest =
  | {
      id: string;
      type: 'open';
      bytes: ArrayBuffer;
      pdfWorkerUrl: string;
      /** Đường dẫn bộ phông chuẩn của PDF.js. */
      standardFontDataUrl: string;
    }
  | {
      id: string;
      type: 'render';
      /** Mã của tài liệu đã mở, dùng để tra cứu trong worker. */
      documentId: string;
      pageNumber: number;
      width: number;
    }
  | { id: string; type: 'close' };

export type ThumbnailResponse =
  | { id: string; type: 'open'; ok: true; pageCount: number; hasSignature: boolean }
  | { id: string; type: 'render'; ok: true; blob: Blob }
  | { id: string; type: 'close'; ok: true }
  | {
      id: string;
      ok: false;
      code: 'E_PARSE' | 'E_FORMAT' | 'E_AUTH' | 'E_UNKNOWN';
      /** Chi tiết kỹ thuật, không chứa nội dung tài liệu. */
      detail?: string;
    };

interface WorkerScope {
  onmessage: ((event: MessageEvent<ThumbnailRequest>) => void) | null;
  postMessage: (message: ThumbnailResponse, transfer?: Transferable[]) => void;
}

const scope = self as unknown as WorkerScope;

/** Một tài liệu đang mở trong worker. */
interface OpenDocument {
  document: pdfjsLib.PDFDocumentProxy;
  loadingTask: pdfjsLib.PDFDocumentLoadingTask;
}

const documents = new Map<string, OpenDocument>();
let currentPdfWorkerUrl: string | null = null;

function applyPdfWorkerUrl(url: string): void {
  if (currentPdfWorkerUrl === url) return;
  pdfjsLib.GlobalWorkerOptions.workerSrc = url;
  currentPdfWorkerUrl = url;
}

/** Đoạn PDF có bắt đầu bằng chữ ký `%PDF-` không. */
function looksLikePdf(bytes: Uint8Array): boolean {
  return (
    bytes.length > 4 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d
  );
}

function classify(error: unknown): 'E_PARSE' | 'E_FORMAT' | 'E_AUTH' | 'E_UNKNOWN' {
  const name = error instanceof Error ? error.name : '';
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  if (name === 'PasswordException' || message.includes('password')) return 'E_AUTH';
  if (name === 'InvalidPDFException' || message.includes('invalid pdf')) return 'E_FORMAT';
  if (name === 'MissingPDFException') return 'E_FORMAT';
  return 'E_PARSE';
}

/** Mô tả lỗi để ghi ra nhật ký, không chứa nội dung tài liệu. */
function describe(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  return String(error);
}

async function openDocument(
  id: string,
  bytes: ArrayBuffer,
  pdfWorkerUrl: string,
  standardFontDataUrl: string,
): Promise<ThumbnailResponse> {
  try {
    applyPdfWorkerUrl(pdfWorkerUrl);

    const data = new Uint8Array(bytes);
    if (!looksLikePdf(data)) {
      return { id, ok: false, code: 'E_FORMAT' };
    }

    const loadingTask = pdfjsLib.getDocument({
      data,
      useSystemFonts: false,
      disableFontFace: false,
      // Bộ phông chuẩn (font 14 chuẩn) cần để vẽ chữ trong hình thu nhổ.
      standardFontDataUrl,
    });

    const document = await loadingTask.promise;
    documents.set(id, { document, loadingTask });

    // Phát hiện chữ ký số: các trường biểu mẫu có fieldType là "Sig".
    // Thao tác ghi tệp mới sẽ làm mất hiệu lực chữ ký, nên cần cảnh báo.
    let hasSignature = false;
    try {
      const fields = await document.getFieldObjects();
      hasSignature = Object.values(fields ?? {}).some(
        (field) => (field as { fieldType?: string }).fieldType === 'Sig',
      );
    } catch {
      hasSignature = false;
    }

    return { id, type: 'open', ok: true, pageCount: document.numPages, hasSignature };
  } catch (error) {
    return { id, ok: false, code: classify(error), detail: describe(error) };
  }
}

async function renderPage(
  requestId: string,
  documentId: string,
  pageNumber: number,
  width: number,
): Promise<ThumbnailResponse> {
  const opened = documents.get(documentId);
  if (!opened) {
    return { id: requestId, ok: false, code: 'E_UNKNOWN', detail: 'tai lieu chua duoc mo' };
  }

  try {
    const page = await opened.document.getPage(pageNumber);
    const base = page.getViewport({ scale: 1 });
    const scale = width / base.width;
    const viewport = page.getViewport({ scale });

    const canvas = new OffscreenCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
    const context = canvas.getContext('2d');

    if (!context) {
      return { id: requestId, ok: false, code: 'E_UNKNOWN', detail: 'khong tao duoc canvas' };
    }

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Kiểu của pdf.js khai báo `canvas` là HTMLCanvasElement, nhưng bản dựng
    // hỗ trợ OffscreenCanvas trong luồng worker.
    await page.render({ canvas: canvas as unknown as HTMLCanvasElement, viewport }).promise;

    const blob = await canvas.convertToBlob({ type: 'image/png' });
    return { id: requestId, type: 'render', ok: true, blob };
  } catch (error) {
    return { id: requestId, ok: false, code: classify(error), detail: describe(error) };
  }
}

scope.onmessage = async (event: MessageEvent<ThumbnailRequest>): Promise<void> => {
  const request = event.data;

  switch (request.type) {
    case 'open':
      scope.postMessage(
        await openDocument(
          request.id,
          request.bytes,
          request.pdfWorkerUrl,
          request.standardFontDataUrl,
        ),
      );
      return;
    case 'render':
      scope.postMessage(
        await renderPage(request.id, request.documentId, request.pageNumber, request.width),
      );
      return;
    case 'close': {
      const opened = documents.get(request.id);
      if (opened) {
        await opened.loadingTask.destroy().catch(() => undefined);
        documents.delete(request.id);
      }
      scope.postMessage({ id: request.id, type: 'close', ok: true });
      return;
    }
    default:
      return;
  }
};
