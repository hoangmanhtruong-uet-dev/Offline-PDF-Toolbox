/**
 * Kiểu dữ liệu dùng chung giữa tiến trình chính (main), tiền tản (preload)
 * và giao diện (renderer).
 *
 * Quy tắc: file này không được import bất kỳ thứ gì từ `electron` hay `node:*`
 * để có thể dùng lại trong cả ba tiến trình.
 */

/** Trạng thái của một tác vụ xử lý tài liệu. */
export type TaskState = 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';

/** Giai đoạn hiện tại của tác vụ, dùng để dựng thanh tiến độ. */
export type TaskPhase = 'reading' | 'processing' | 'writing' | 'verifying';

/** Ngôn ngữ giao diện được hỗ trợ. */
export type SupportedLanguage = 'en' | 'de' | 'fr' | 'es' | 'vi';

/** Chủ đề hiển thị. */
export type ThemePreference = 'system' | 'light' | 'dark';

/** Mức nén PDF. */
export type CompressionLevel = 'light' | 'medium' | 'strong';

/** Mã lỗi ổn định, dùng để đối chiếu với báo cáo hỗ trợ. */
export type ErrorCode =
  | 'E_AUTH'
  | 'E_STRUCT'
  | 'E_PARSE'
  | 'E_FORMAT'
  | 'E_SIGNED'
  | 'E_DISK'
  | 'E_PERM'
  | 'E_PATH'
  | 'E_UNKNOWN';

/** Thông tin tệp do tiến trình chính đọc từ hệ thống tệp. */
export interface FileMeta {
  /** Đường dẫn tuyệt đối trên máy người dùng. */
  path: string;
  /** Tên tệp kèm phần mở rộng. */
  name: string;
  /** Dung lượng tính bằng byte. */
  size: number;
  /** Thời điểm sửa đổi, dạng epoch milliseconds. */
  modifiedAt: number;
  /** Phần mở rộng, không có dấu chấm, chữ thường. */
  ext: string;
}

/** Trạng thái đọc tệp của một mục trong danh sách. */
export type FileReadState = 'pending' | 'reading' | 'ready' | 'error';

/** Một tệp trong danh sách của công cụ. */
export interface FileEntry extends FileMeta {
  /** Định danh duy nhất trong phiên làm việc, dùng làm khoá React. */
  id: string;
  /** Số trang, null khi chưa đọc được. */
  pageCount: number | null;
  /** Trạng thái đọc. */
  state: FileReadState;
  /** Mã lỗi khi đọc thất bại. */
  errorCode?: ErrorCode;
  /** Hình thu nhổ trang đầu, dạng data URL. */
  thumbnail?: string;
  /**
   * Dải trang người dùng chọn cho tệp này, ví dụ `1-3, 7`.
   *
   * Rỗng nghĩa là lấy toàn bộ.
   */
  pageRange?: string;
  /** Tệp có chữ ký số hay không. */
  hasSignature?: boolean;
  /** Các mục dấu trang cấp 1, dùng cho chế độ tách theo dấu trang. */
  outline?: { title: string; page: number }[];
}

/** Tiến độ tác vụ, phát từ main sang renderer. */
export interface TaskProgress {
  taskId: string;
  phase: TaskPhase;
  /** Phần trăm 0-100. */
  percent: number;
  /** Khoá chuỗi i18n, không phải chuỗi đã dịch. */
  messageKey: string;
}

/** Lỗi có cấu trúc, an toàn để gửi sang renderer. */
export interface ErrorPayload {
  code: ErrorCode;
  /** Khoá chuỗi i18n cho thông báo chính. */
  messageKey: string;
  /** Chi tiết kỹ thuật, không bao giờ chứa nội dung tài liệu. */
  detail?: string;
  /**
   * Danh sách tệp liên quan tới lỗi, ví dụ các tệp bị hỏng.
   *
   * Chỉ chứa tên tệp, không chứa đường dẫn đầy đủ.
   */
  files?: string[];
}

/** Kết quả của một tác vụ. */
export interface TaskResult {
  taskId: string;
  state: TaskState;
  /** Các đường dẫn tệp đầu ra đã được kiểm tra và di chuyển vào đích. */
  outputPaths: string[];
  error?: ErrorPayload;
}

/** Cài đặt của người dùng. */
export interface AppSettings {
  language: SupportedLanguage;
  theme: ThemePreference;
  /** Thư mục lưu mặc định, null nghĩa là cạnh tệp gốc. */
  outputDirectory: string | null;
  /** Có hiển thị danh sách tệp gần đây ở màn hình chính hay không. */
  showRecentFiles: boolean;
}

/** Trạng thái giấy phép Pro. */
export interface LicenseStatus {
  isPro: boolean;
  /** Epoch milliseconds của lần kiểm tra thành công gần nhất. */
  lastVerifiedAt: number | null;
  state: 'unknown' | 'active' | 'expired' | 'unavailable';
}

/** Một tệp trong danh sách tệp gần đây. */
export interface RecentFile {
  path: string;
  name: string;
  usedAt: number;
}
