# Offline PDF Toolbox

<p align="center">
  <img src="apps/desktop/assets/icon.png" alt="Offline PDF Toolbox Logo" width="128" height="128" />
</p>

<p align="center">
  <strong>Bộ công cụ xử lý PDF chuyên nghiệp, an toàn và bảo mật tối đa — hoạt động hoàn toàn Offline trên Windows</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Windows%2010%20%7C%2011%20(x64)-0078D4?logo=windows" alt="Platform Windows" />
  <img src="https://img.shields.io/badge/Version-0.5.0-crimson" alt="Version 0.5.0" />
  <img src="https://img.shields.io/badge/Stack-Electron%20%2B%20React%2019%20%2B%20Vite%20%2B%20TS-61DAFB?logo=react" alt="Tech Stack" />
  <img src="https://img.shields.io/badge/Design-Bright%20Fluent%20Modern-FF5722" alt="Fluent Design" />
  <img src="https://img.shields.io/badge/Tests-141%20Passed%20(100%25)-success" alt="Tests" />
  <img src="https://img.shields.io/badge/Network-100%25%20Offline%20(Zero%20Telemetry)-brightgreen" alt="100% Offline" />
  <img src="https://img.shields.io/badge/Store-Microsoft%20Store%20Ready%20(MSIX)-blue" alt="Store Ready" />
</p>

---

## 📖 Lời hứa duy nhất (Core Promise)

> **"Tài liệu và dữ liệu của bạn không bao giờ rời khỏi máy tính cá nhân."**

**Offline PDF Toolbox** là giải pháp phần mềm máy tính dành cho cá nhân, doanh nghiệp và các tổ chức có yêu cầu khắt khe về quyền riêng tư và bảo mật dữ liệu. Khác biệt với phần lớn các công cụ web hiện nay (vốn âm thầm tải tệp lên đám mây để xử lý):

- 🔒 **Không tải tệp lên mạng**: Tất cả các thao tác gộp, tách, nén, xoay, quản lý trang đều diễn ra trực tiếp trên CPU/bộ nhớ máy bạn.
- 🚫 **Zero Network Telemetry**: Ứng dụng chủ động chặn toàn bộ các yêu cầu mạng ở cấp phiên làm việc (`NetworkGuard`). Không gọi API phân tích, không thu thập hành vi, hoạt động mượt mà ngay cả khi ngắt kết nối Internet hoàn toàn.
- 🛡️ **An toàn tuyệt đối cho tệp gốc**: Quy tắc bất biến — xử lý qua tệp tạm, kiểm tra tính toàn vẹn, sau đó mới di chuyển vào đích. Không bao giờ ghi đè lên tài liệu ban đầu của người dùng.
- 💳 **Mua đứt một lần (Không thuê bao phiền phức)**: Trải nghiệm bản Miễn phí với đầy đủ tính năng cốt lõi hoặc nâng cấp Pro trọn đời qua Microsoft Store.

---

## ✨ Tính năng cốt lõi (Core Features)

Ứng dụng hiện đã hoàn thiện toàn diện các mô-đun công cụ chính:

| Biểu tượng | Công cụ | Mã | Mô tả chi tiết & Điểm mạnh nổi bật |
| :---: | :--- | :---: | :--- |
| 🔀 | **Gộp PDF (Merge)** | `F-01` | Gộp nhiều tài liệu PDF theo thứ tự tùy chọn. Hỗ trợ chọn dải trang linh hoạt (vd: `1-3, 5, 8-`), xử lý thông minh tệp có mật khẩu, tự động bỏ qua tệp lỗi mà không làm gián đoạn tiến trình. |
| ✂️ | **Tách PDF (Split)** | `F-02` | **6 chế độ tách chuyên sâu**: Tách theo khoảng trang, tách mỗi $N$ trang, mỗi trang một tệp, tách theo Bookmarks cấp 1, tách theo dung lượng tối đa (MB), hoặc trích xuất trang chọn lọc. Tự động xuất ra thư mục con chuyên biệt. |
| 🗜️ | **Nén PDF (Compress)** | `F-03` | Tối ưu hóa dung lượng thông minh bằng `sharp` + `qpdf`. Cung cấp **3 mức chất lượng** (Nhẹ, Vừa, Mạnh) hoặc chế độ **Dung lượng đích (Target Size)**. Giảm đến **90%** dung lượng với tệp scan mà vẫn giữ nguyên chữ và vector. Bảng báo cáo dung lượng trước/sau rõ ràng. |
| 🔄 | **Xoay PDF (Rotate)** | `F-04` | Xoay toàn bộ tài liệu hoặc theo trang chọn lọc với góc 90°, 180°, 270°. Tự động cộng góc thông minh theo modulo 360°, xem trước hình thu nhỏ tức thì. |
| 📑 | **Sắp xếp & Quản lý trang** | `F-05` | Lưới trang thu nhỏ (Page Grid) trực quan: kéo thả đổi thứ tự trang, xóa trang thừa, trích xuất trang thành tài liệu mới, hỗ trợ **Hoàn tác / Làm lại (Undo / Redo Ctrl+Z / Ctrl+Y)** lên đến 50 bước. |
| 🖼️ | **Ảnh sang PDF (Images to PDF)** | `F-06` | Chuyển đổi hàng loạt ảnh (JPG, PNG, WebP, BMP, TIFF) thành một tệp PDF chuẩn. Hỗ trợ sắp xếp thứ tự ảnh, xoay chiều ảnh, lựa chọn khổ giấy (A4, Letter, Khổ theo ảnh) và căn lề linh hoạt. |
| 🛡️ | **Bảo mật & Network Guard** | `Core` | Giám sát và chặn đứng 100% kết nối mạng ở cấp Electron session. Thực thi sandbox, `contextIsolation: true`, `nodeIntegration: false`. |
| 💎 | **Giấy phép Microsoft Store** | `F-08` | Cầu nối `StoreBridge` (.NET 8.0) giao tiếp trực tiếp với Windows Store Commerce API. Hỗ trợ xác thực bản quyền, mua in-app Pro, khôi phục mua hàng và lưu trữ cache ngoại tuyến an toàn trong 14 ngày. |

---

## 🎯 5 Nguyên tắc sản phẩm & 4 Quy tắc kỹ thuật

### 5 Nguyên tắc sản phẩm bất biến
1. **Offline thật sự**: Không gửi tệp, không gửi siêu dữ liệu, không kết nối máy chủ ngoại vi trong mọi tình huống.
2. **Ba cú nhấp chuột là xong**: Thiết kế luồng thao tác siêu tốc: *Chọn tệp* ➔ *Chọn thông số* ➔ *Nhấn thực hiện*.
3. **Bảo vệ toàn vẹn tài liệu**: Không bao giờ ghi đè tệp gốc; luôn tạo tệp mới với hậu tố thông minh và kiểm tra hợp lệ trước khi hoàn tất.
4. **Nhanh và nhẹ**: Tải ứng dụng dưới 2 giây, dựng hình thu nhỏ bất đồng bộ qua Worker, xử lý tài liệu 100 trang trong vài giây.
5. **Minh bạch về giới hạn**: Giới hạn bản Free được thông báo rõ ràng trước khi người dùng bắt đầu tác vụ; không có hành vi "lừa người dùng làm xong rồi mới đòi tiền".

### 4 Quy tắc kỹ thuật (Technical Constraints)
* **K-01 (Cách ly hoàn toàn)**: Renderer process không bao giờ truy cập trực tiếp hệ thống tệp hay Node API. Mọi giao tiếp đi qua `contextBridge` và IPC tối giản.
* **K-02 (Không khóa giao diện)**: Tác vụ nặng (nén ảnh, parse PDF, qpdf) luôn chạy ở tiến trình con (`child_process.spawn`) hoặc Web Worker. Giao diện luôn mượt mà ở 60 FPS.
* **K-03 (Ghi an toàn nguyên tử)**: Xử lý ghi vào thư mục tạm (`AppData/.../temp`) ➔ kiểm tra tệp đầu ra không rỗng và mở được ➔ di chuyển an toàn vào đích.
* **K-04 (Kiểm thử offline nghiêm ngặt)**: Bộ kiểm thử tự động kiểm tra việc ngắt mạng và xác nhận không có bất kỳ request HTTP/WebSocket/DNS trái phép nào phát sinh.

---

## 💎 Mô hình bản quyền (Free vs Pro)

| Tính năng | Bản Miễn phí (Free) | Bản Pro ($12.99 trọn đời) |
| :--- | :--- | :--- |
| **Gộp PDF** | Tối đa 3 tệp mỗi lần | Không giới hạn số lượng tệp |
| **Tách PDF** | Tách theo khoảng trang cơ bản | Đầy đủ 6 chế độ tách chuyên sâu |
| **Nén PDF** | 3 tệp mỗi ngày, mức nén Vừa | Không giới hạn, đầy đủ mức nén & Target Size |
| **Xoay PDF** | Xoay toàn bộ tài liệu | Xoay chi tiết từng trang hoặc nhóm trang |
| **Quản lý trang** | Tài liệu tối đa 20 trang | Không giới hạn số trang |
| **Ảnh sang PDF** | Tối đa 10 ảnh mỗi lần | Không giới hạn số lượng ảnh |
| **Quảng cáo** | **Hoàn toàn không có quảng cáo** | **Không có quảng cáo** |
| **Quyền riêng tư** | 100% Offline trên máy | 100% Offline trên máy |

---

## 🏗️ Kiến trúc công nghệ (Architecture)

```text
offline-pdf-toolbox/
├── apps/
│   └── desktop/                   # Ứng dụng chính (Electron + React)
│       ├── assets/                # Icon, logo Microsoft Store, SplashScreen
│       ├── forge.config.ts        # Cấu hình Electron Forge (MSIX & Zip Maker)
│       ├── scripts/               # Scripts tự động hóa tải qpdf, copy PDF.js assets
│       ├── src/
│       │   ├── main/              # Electron Main Process
│       │   │   ├── ipc/           # IPC Handlers (files, tasks, license)
│       │   │   ├── services/      # QpdfRunner, TaskQueue, LicenseService, SafeStorage
│       │   │   └── window/        # Quản lý cửa sổ, CSP, NetworkGuard
│       │   ├── preload/           # Cầu nối contextBridge bảo mật (API thu hẹp)
│       │   ├── renderer/          # Giao diện React 19 + Fluent UI System
│       │   │   ├── components/    # PageGrid, FileList, DropZone, ToolCard...
│       │   │   ├── features/      # Màn hình Merge, Split, Compress, Rotate, Pages, Images...
│       │   │   ├── i18n/          # Đa ngôn ngữ (English, Tiếng Việt)
│       │   │   ├── state/         # Quản trị trạng thái với Zustand
│       │   │   └── styles/        # Fluent Modern styling với PDF Red tokens
│       │   ├── shared/            # Type definitions, Task contracts, FeatureGate
│       │   └── workers/           # Web Workers xử lý vẽ thumbnail bằng PDF.js
│       └── tests/                 # 141+ unit tests (Vitest) và E2E tests (Playwright)
├── tools/
│   └── StoreBridge/               # Công cụ cầu nối .NET 8.0 giao tiếp Windows Store API
├── docs/                          # Hệ thống tài liệu đặc tả, kiến trúc, kiểm thử
│   ├── ARCHITECTURE.md            # Thiết kế kiến trúc chi tiết
│   ├── BACKLOG.md                 # Danh sách phiếu công việc và tiến độ
│   ├── FEATURES.md                # Đặc tả tiêu chí chấp nhận tính năng
│   ├── ROADMAP.md                 # Lộ trình phát triển 10 tuần & các mốc phát hành
│   ├── STORE-LAUNCH.md            # Hướng dẫn đóng gói và kiểm định Store (WACK)
│   ├── DECISIONS.md               # Nhật ký các quyết định kiến trúc (ADR)
│   └── privacy/index.html         # Trang chính sách quyền riêng tư tĩnh
└── package.json                   # Root monorepo workspace configuration
```

---

## 🚀 Hướng dẫn cài đặt & phát triển (Quickstart)

### Yêu cầu môi trường
* **Hệ điều hành**: Windows 10 22H2 hoặc Windows 11 (x64)
* **Node.js**: Phiên bản `22.13.0` trở lên
* **Trình quản lý gói**: `npm` v11+ hoặc `pnpm`
* **.NET SDK**: `8.0` trở lên (dùng để biên dịch công cụ `StoreBridge`)
* **Windows SDK**: Để chạy Windows App Certification Kit (WACK) khi đóng gói MSIX

### Các bước khởi chạy

1. **Sao chép kho mã nguồn:**
   ```bash
   git clone https://github.com/hoangmanhtruong-uet-dev/PDF-tool.git
   cd "PDF-tool"
   ```

2. **Cài đặt các gói phụ thuộc:**
   ```bash
   npm install
   ```

3. **Chuẩn bị tài nguyên cần thiết (qpdf binary, PDF.js fonts & StoreBridge build):**
   ```bash
   npm run assets --workspace @optb/desktop
   ```

4. **Khởi chạy ứng dụng ở chế độ phát triển (Hot Reload):**
   ```bash
   npm run dev
   ```

---

## 🧪 Kiểm thử & Đảm bảo chất lượng (Quality Assurance)

Dự án áp dụng tiêu chuẩn kiểm thử khắt khe trước mỗi bản phát hành:

```bash
# Kiểm tra kiểu dữ liệu TypeScript strict
npm run typecheck

# Kiểm tra quy chuẩn mã nguồn (ESLint)
npm run lint

# Chạy toàn bộ 141 bài kiểm thử đơn vị (Vitest)
npm test

# Chạy kiểm thử chấp nhận đầu-cuối (Playwright E2E)
npm run test:e2e

# Chạy kiểm thử cô lập mạng (Network Isolation / Zero-leak)
npm run test:offline --workspace @optb/desktop

# Xuất báo cáo hiệu quả nén PDF thực tế trên bộ tệp mẫu
npm run report:compression --workspace @optb/desktop
```

### Kết quả kiểm định tự động
- **Unit Tests**: 13/13 test suites passed, 141/141 tests passed 100%.
- **Accessibility & Contrast**: Đạt chuẩn tương phản **WCAG 2.1 AA** (độ tương phản văn bản > 4.5:1, icon > 3:1) trên cả nền sáng (Light) và nền tối (Dark).
- **Network Isolation**: Vượt qua kịch bản chặn mạng ở tầng Chromium Session, đảm bảo không có rò rỉ dữ liệu.

---

## 📦 Đóng gói & Phát hành Microsoft Store (MSIX)

Dự án được cấu hình sẵn sàng với Electron Forge để xuất bản gói MSIX tương thích Microsoft Partner Center:

```bash
# Dựng gói ứng dụng cục bộ
npm run build

# Đóng gói bộ cài MSIX cho Microsoft Store
$env:OPTB_BUILD_MSIX="1"
npm run make
```

Gói sản phẩm `.msix` sẽ được tạo ra trong thư mục `apps/desktop/out/make/` kèm theo chữ ký số và manifest chứng nhận Windows (`MTDStudio.OfflinePDFToolbox`).

---

## 🗺️ Bản đồ tài liệu (Documentation Map)

Mọi chi tiết về sản phẩm, kiến trúc và quyết định kỹ thuật được lưu trữ minh bạch trong thư mục [`docs/`](docs/):

| Tài liệu | Nội dung trọng tâm |
| :--- | :--- |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Kiến trúc Electron, luồng dữ liệu IPC, quản lý bộ nhớ, bảo mật. |
| [`docs/FEATURES.md`](docs/FEATURES.md) | Đặc tả chi tiết và tiêu chí chấp nhận cho từng tính năng `F-01` → `F-08`. |
| [`docs/BACKLOG.md`](docs/BACKLOG.md) | Bảng theo dõi tiến độ từng đầu việc tuần 0 đến tuần 10. |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | Kế hoạch triển khai theo tuần và cổng kiểm soát chất lượng. |
| [`docs/STORE-LAUNCH.md`](docs/STORE-LAUNCH.md) | Quy trình đóng gói MSIX, chạy WACK, checklist nộp Partner Center. |
| [`docs/LICENSING.md`](docs/LICENSING.md) | Kiến trúc StoreBridge, quy định hạn mức Free và cơ chế mở khóa Pro. |
| [`docs/SECURITY-PRIVACY.md`](docs/SECURITY-PRIVACY.md) | Cam kết bảo mật, chính sách quyền riêng tư và biện pháp phòng vệ. |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | Nhật ký các quyết định kiến trúc (ADR-001 đến ADR-018). |
| [`docs/TESTING.md`](docs/TESTING.md) | Danh mục ca kiểm thử, bộ tài liệu thử nghiệm thực tế. |
| [`docs/Tich-hop-Bulk-Converter-vao-Offline-PDF-Toolbox.md`](docs/Tich-hop-Bulk-Converter-vao-Offline-PDF-Toolbox.md) | Kế hoạch mở rộng xử lý ảnh và video hàng loạt trong các phiên bản sau. |
| [`docs/privacy/index.html`](docs/privacy/index.html) | Trang công bố chính sách quyền riêng tư chuẩn cho Microsoft Store. |

---

## 📅 Lộ trình phát triển tương lai (Future Roadmap)

- **Bản 1.0 (Hiện tại)**: Bộ công cụ cốt lõi hoàn chỉnh (Gộp, Tách, Nén, Xoay, Quản lý trang, Ảnh sang PDF), tích hợp Microsoft Store IAP, chứng nhận WACK sạch.
- **Bản 1.1**: Xử lý hàng loạt theo thư mục (Batch Mode), mở rộng công cụ chuyển đổi và tối ưu ảnh hàng loạt (F-11, F-12), tích hợp menu ngữ cảnh Windows File Explorer.
- **Bản 1.2**: Công cụ nén và chuyển đổi định dạng video ngoại tuyến nhẹ nhàng (F-13) qua bộ mã hóa phần cứng.
- **Bản 2.0**: Nhận diện ký tự quang học ngoại tuyến (Offline OCR), chữ ký số hình ảnh, hỗ trợ nền tảng Windows on ARM64.

---

## 📄 Bản quyền & Tuyên bố miễn trừ

- Phát triển và đóng gói bởi **MTD Studio**.
- Sử dụng các thư viện mã nguồn mở uy tín tuân thủ giấy phép: `qpdf` (Apache-2.0), `pdf-lib` (MIT), `PDF.js` (Apache-2.0), `sharp` (Apache-2.0).
- Mọi tài liệu và cam kết đều hướng đến mục tiêu duy nhất: **Bảo vệ quyền riêng tư của người dùng**.
