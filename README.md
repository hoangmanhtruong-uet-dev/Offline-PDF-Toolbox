# Offline PDF Toolbox

Ứng dụng Windows gộp, tách, nén, xoay PDF **hoàn toàn trên máy**. Không tải tệp lên mạng, không cần tài khoản, mua đứt một lần trên Microsoft Store.

> **Lời hứa duy nhất:** tài liệu của khách hàng không bao giờ rời khỏi máy tính của họ.

| Hạng mục | Giá trị |
| --- | --- |
| Nền tảng | Windows 10 22H2, Windows 11 — x64 (ARM64 ở bản 2.0) |
| Bản hiện tại | 0.5 nội bộ (đang xây) |
| Bản phát hành | 1.0 — mục tiêu tuần 10 kể từ khi bắt đầu |
| Công nghệ | Electron + React + TypeScript, qpdf, PDF.js, sharp, .NET StoreBridge |
| Mô hình thu phí | Miễn phí có giới hạn + Pro mua đứt 12,99 USD |
| Ngôn ngữ | en, de, fr, es, vi |
| Đặc tả gốc | [`docs/Offline PDF Toolbox — Đặc tả sản phẩm và kế hoạch phát hành Microsoft Store.md`](docs/Offline%20PDF%20Toolbox%20%E2%80%94%20%C4%90%E1%BA%B7c%20t%E1%BA%A3%20s%E1%BA%A3n%20ph%E1%BA%A9m%20v%C3%A0%20k%E1%BA%BF%20ho%E1%BA%A1ch%20ph%C3%A1t%20h%C3%A0nh%20Microsoft%20Store.md) |

---

## 1. Năm nguyên tắc sản phẩm (bất biến)

Mọi quyết định kỹ thuật và giao diện đều phải phục vụ năm nguyên tắc này. Không có ngoại lệ.

1. **Offline thật sự** — không gửi tệp, không gửi nội dung tệp, không gọi mạng khi xử lý tài liệu.
2. **Ba cú nhấp là xong** — chọn tệp → chọn tùy chọn → bấm chạy.
3. **Không làm hỏng tệp gốc** — luôn ghi ra tệp mới, không bao giờ ghi đè.
4. **Nhanh và nhẹ** — mở app dưới 3 giây, gộp 100 trang dưới 5 giây.
5. **Minh bạch về giới hạn** — bản dùng thử nói rõ giới hạn *trước* khi người dùng làm xong việc, không chặn ở bước cuối.

## 2. Bốn quy tắc kỹ thuật bất biến

| # | Quy tắc | Kiểm chứng |
| --- | --- | --- |
| K-01 | Renderer không bao giờ đọc/ghi tệp trực tiếp; mọi thao tác tệp đi qua tiến trình chính | `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` |
| K-02 | Mọi việc nặng chạy ở worker hoặc tiến trình con, không bao giờ ở luồng giao diện | Kiểm thử không đơ giao diện |
| K-03 | Ghi ra tệp tạm → kiểm tra lại → mới đổi tên vào đích. Không bao giờ ghi đè | Bộ kiểm tra kết quả tự động |
| K-04 | Không có yêu cầu mạng nào phát sinh trong luồng xử lý tài liệu | Bài kiểm thử "offline" tự động |

## 3. Bản đồ tài liệu

Đọc theo thứ tự nếu bạn mới vào dự án. Mỗi tài liệu đều trả lời một câu hỏi cụ thể.

| Tài liệu | Câu hỏi trả lời | Đọc khi nào |
| --- | --- | --- |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | Tuần này làm gì, xong là gì, cổng kiểm tra ra sao? | Mỗi tuần bắt đầu |
| [`docs/BACKLOG.md`](docs/BACKLOG.md) | Việc cụ thể nào đang chờ, ưu tiên ra sao? | Hằng ngày |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Code nằm ở đâu, chạy thế nào, đổi thư viện thì sao? | Khi viết code lần đầu |
| [`docs/FEATURES.md`](docs/FEATURES.md) | Tính năng này hành xử thế nào, xong là gì? | Trước khi làm một tính năng |
| [`docs/UX.md`](docs/UX.md) | Màn hình, trạng thái, bàn phím, ngôn ngữ thế nào? | Khi làm giao diện |
| [`docs/LICENSING.md`](docs/LICENSING.md) | Free/Pro giới hạn ra sao, mua hàng thế nào? | Khi làm `FeatureGate` |
| [`docs/SECURITY-PRIVACY.md`](docs/SECURITY-PRIVACY.md) | Bảo vệ gì, cam kết gì, dữ liệu lưu đâu? | Khi đụng bảo mật hoặc dữ liệu |
| [`docs/TESTING.md`](docs/TESTING.md) | Kiểm thử cái gì, bộ tệp ở đâu, khi nào được phát hành? | Trước mỗi commit lớn |
| [`docs/STORE-LAUNCH.md`](docs/STORE-LAUNCH.md) | Đóng gói và nộp Store thế nào? | Từ tuần 9 |
| [`docs/MARKETING.md`](docs/MARKETING.md) | Từ khóa, mô tả, ảnh, kênh bán hàng? | Từ tuần 1, siết từ tuần 9 |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | Vì sao chọn hướng này, đổi thì giá là gì? | Khi cần tranh luận kỹ thuật |
| [`docs/AI-WORKFLOW.md`](docs/AI-WORKFLOW.md) | Dùng AI viết code trong dự án này thế nào? | Trước khi giao việc cho AI |

Đặc tả gốc trong `docs/` là **nguồn chân lý** (single source of truth) về phạm vi sản phẩm và kế hoạch. Các tài liệu trên là bản diễn giải để làm việc; khi hai bên lệch nhau, cập nhật cả hai.

## 4. Cấu trúc kho mã (kế hoạch)

```text
offline-pdf-toolbox/
  apps/desktop/
    src/main/          # tiến trình chính: cửa sổ, hộp thoại, hàng đợi tác vụ
    src/preload/       # cầu nối contextBridge (API tối thiểu)
    src/renderer/      # giao diện React
      features/        # home, tools, settings
      components/      # thành phần dùng chung
      i18n/            # en, de, fr, es, vi
    src/workers/       # thumbnail.worker.ts
    src/shared/        # kiểu dữ liệu, giới hạn Free/Pro, phân tích dải trang
  tools/StoreBridge/   # chương trình .NET cho giấy phép Store
  packaging/msix/      # manifest, tài nguyên logo, kịch bản đóng gói
  tests/
    fixtures/          # bộ tệp PDF kiểm thử (tự sinh)
    unit/              # Vitest
    e2e/               # Playwright cho Electron
  docs/
```

Chi tiết và quy ước đặt tên: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## 5. Khởi động dự án

Yêu cầu môi trường (kiểm tra lại khi bắt đầu tuần 1):

| Thành phần | Phiên bản | Ghi chú |
| --- | --- | --- |
| Node.js | 22.13 trở lên | Renderer build bằng Vite |
| Trình quản lý gói | npm 11 (hoặc pnpm) | Dự án dùng npm workspaces |
| .NET SDK | 8.0 | Chỉ cần cho `tools/StoreBridge` (tuần 8) |
| qpdf | 11.x | Đóng kèm trong `apps/desktop/resources/qpdf/` — tuần 3 |
| Windows SDK | bản mới nhất | Dùng cho MSIX và Windows App Certification Kit — tuần 9 |

```bash
npm install                # cài phụ thuộc
npm run assets             # tải qpdf + chép bộ phông PDF.js (chạy trước khi build)
npm run dev                # chạy Electron ở chế độ phát triển (có HMR)
npm test                   # kiểm thử đơn vị (Vitest)
npm run test:e2e           # kiểm thử đầu-cuối (Playwright cho Electron)
npm run lint               # ESLint
npm run typecheck          # TypeScript
npm run build              # dựng gói ứng dụng
npm run fixtures           # sinh lại bộ tệp PDF kiểm thử
```

Lệnh tuần 8 trở đi (cần Windows SDK cho gói MSIX):

```bash
$env:OPTB_BUILD_MSIX='1'; npm run make   # dựng gói phát hành kèm MSIX
```

### Trạng thái hiện tại

| Hạng mục | Trạng thái |
| --- | --- |
| Khung ứng dụng (T2-01 → T2-11) | **Xong** |
| Bốn ràng buộc bảo mật | **Xong** và có kiểm thử |
| Hàng đợi tác vụ + thư mục tạm | **Xong**, có kiểm thử đơn vị |
| Đọc tệp, số trang, hình thu nhổ | **Xong**, có kiểm thử đầu-cuối |
| Giao diện S-01 + khung màn hình công cụ | **Xong** |
| i18n 5 ngôn ngữ, sáng/tối | **Xong** |
| Gộp PDF (F-01) | **Xong** — dải trang, thứ tự, ghi an toàn, bỏ qua tệp hỏng |
| Xoay PDF (F-04) | **Xong** — chọn trang, góc 90/180/270, cộng modulo 360 |
| Tách PDF (F-02) | Tuần 4 |
| Nén PDF (F-03) | Tuần 5–6, cần sharp |
| Giấy phép Store (F-08 tuần 8) | Tuần 8, cần `StoreBridge` |

## 6. Quy trình làm việc

1. Mỗi tính năng = một phiếu việc trong [`docs/BACKLOG.md`](docs/BACKLOG.md), kèm tiêu chí chấp nhận lấy từ [`docs/FEATURES.md`](docs/FEATURES.md).
2. Mọi nhánh đi qua kiểm thử tự động trên GitHub Actions (máy Windows) trước khi gộp.
3. Mỗi cuối tuần: dựng gói → cài trên máy sạch → chạy bộ kiểm thử chấp nhận → ghi điểm yếu vào nhật ký.
4. Giữ [`docs/DECISIONS.md`](docs/DECISIONS.md) cập nhật mỗi khi đổi hướng kỹ thuật.
5. Không thêm tính năng ngoài phạm vi đã duyệt. Nếu cần thêm, viết vào backlog và cắt theo thứ tự ở [`docs/ROADMAP.md`](docs/ROADMAP.md).

## 7. Định nghĩa "xong"

Một hạng mục chỉ được coi là xong khi đáp ứng **cả ba** điều:

- **Đúng** — khớp tiêu chí chấp nhận trong `FEATURES.md`.
- **An toàn** — không làm hỏng tệp; có kiểm thử tự động chứng minh; nếu có xử lý tệp thì đã qua bộ kiểm tra kết quả.
- **Có tài liệu** — mọi chuỗi chữ mới nằm trong file i18n, không viết cứng trong mã.

Bản 1.0 chỉ hoàn thành khi đạt toàn bộ tiêu chí ở [`docs/STORE-LAUNCH.md`](docs/STORE-LAUNCH.md) và mục "Tiêu chí hoàn thành MVP" trong đặc tả gốc.
