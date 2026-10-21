import type { ErrorCode } from './types';

/**
 * Kiểu dữ liệu của các tác vụ xử lý tài liệu.
 *
 * Mọi tác vụ đều chạy trong tiến trình chính, đi qua hàng đợi, và ghi kết
 * quả ra tệp tạm trước khi di chuyển vào thư mục đích.
 */

/** Loại tác vụ. */
export type TaskKind = 'merge' | 'rotate';

/** Cách chọn trang cho thao tác xoay. */
export type PageSelection =
  | { kind: 'all' }
  | { kind: 'odd' }
  | { kind: 'even' }
  | { kind: 'range'; range: string };

/** Góc xoay, luôn là bội của 90 độ. */
export type RotateAngle = 90 | 180 | 270;

/** Một tệp đầu vào của thao tác gộp. */
export interface MergeInput {
  /** Đường dẫn tuyệt đối trên máy người dùng. */
  path: string;
  /** Dải trang như `1-3, 7`. Rỗng nghĩa là lấy toàn bộ. */
  pageRange?: string;
  /**
   * Mật khẩu của tệp.
   *
   * Chỉ tồn tại trong bộ nhớ tới khi tác vụ kết thúc. Khi gọi qpdf, mật khẩu
   * được ghi ra tệp tạm và xóa ngay, không truyền trên dòng lệnh.
   */
  password?: string;
}

/** Tham số tác vụ gộp. */
export interface MergeTaskPayload {
  files: MergeInput[];
  /** Thư mục đích. */
  outputDirectory: string;
  /** Tên tệp đầu ra, chưa kèm phần mở rộng. */
  outputName: string;
  /** Bỏ qua tệp hỏng và tiếp tục với các tệp còn lại. */
  skipBroken: boolean;
}

/** Tham số tác vụ xoay. */
export interface RotateTaskPayload {
  path: string;
  pageSelection: PageSelection;
  /** Xoay thêm (theo chiều kim đồng hồ) bao nhiêu độ. */
  angle: RotateAngle;
  outputDirectory: string;
  outputName: string;
  password?: string;
}

/** Tham số của một tác vụ bất kỳ. */
export type TaskPayload = MergeTaskPayload | RotateTaskPayload;

/** Kết quả kiểm tra đầu vào trước khi chạy tác vụ. */
export interface PreflightResult {
  /** Các tệp dùng được. */
  usable: { path: string; pageCount: number }[];
  /** Các tệp hỏng, kèm mã lỗi. */
  broken: { path: string; code: ErrorCode; message: string }[];
  /** Tệp cần mật khẩu. */
  locked: { path: string }[];
}

/** Thông tin trả về cho renderer sau khi tác vụ xong. */
export interface TaskOutcome {
  taskId: string;
  kind: TaskKind;
  /** Đường dẫn tệp đầu ra đã kiểm tra và di chuyển vào đích. */
  outputPaths: string[];
  /** Số trang của tệp đầu ra. */
  pageCount: number;
  /** Các tệp bị bỏ qua. */
  skipped: { path: string; reason: string }[];
}
