# Kiến trúc kỹ thuật

Cập nhật: 2026-10-21 · Nguồn: mục 9, 10, 19-A đặc tả gốc

---

## 1. Quyết định nền tảng

**Electron + React + TypeScript + qpdf + một chương trình .NET nhỏ (StoreBridge).**

| Tiêu chí | Electron + React + TS | Tauri | .NET WinUI 3 |
| --- | --- | --- | --- |
| Tốc độ làm giao diện | Rất nhanh | Nhanh | Chậm hơn nếu chưa quen XAML |
| Dung lượng cài đặt | Lớn (> 100 MB) | Nhỏ | Trung bình |
| Đóng gói MSIX | Có công cụ hỗ trợ | Không có sẵn, phải tự dựng | Mặc định |
| Truy cập API Store | Qua chương trình trợ giúp .NET hoặc mô-đun gốc | Qua WinRT, khó | Gọi trực tiếp |
| Thư viện PDF | Hệ sinh thái JS phong phú | Ít ví dụ hơn | Nhiều, nhưng vài cái giấy phép thương mại |
| Rủi ro lớn nhất | Dung lượng + cầu nối giấy phép | Tự dựng quy trình đóng gói | Đường học giao diện mới |

**Cửa quyết định:** tuần 1 chạy hai spike bắt buộc (T1-01 đóng gói MSIX, T1-02 kiểm tra giấy phép). Nếu một trong hai không qua khi chi phí đổi hướng còn thấp → chuyển sang WinUI 3. Ghi quyết định vào [`DECISIONS.md`](DECISIONS.md) (ADR-001).

## 2. Các tầng của hệ thống

| Tầng | Thành phần | Trách nhiệm | Không được làm |
| --- | --- | --- | --- |
| Giao diện (renderer) | React, Zustand | Hiển thị, nhận thao tác, gửi lệnh qua cầu nối | Không đọc/ghi tệp trực tiếp, không có `require` |
| Cầu nối (preload) | API tối thiểu qua `contextBridge` | Chỉ lộ hàm cần thiết: chọn tệp, chạy tác vụ, hủy, đọc trạng thái | Không lộ `ipcRenderer` thô, không lộ `fs` |
| Tiến trình chính (main) | Cửa sổ, hộp thoại, cài đặt, định tuyến lệnh | Vòng đời app, hàng đợi tác vụ, kiểm tra đầu ra | Không làm việc nặng tuần tự trên luồng chính |
| Nhóm luồng xử lý | Worker pool (`pdf-worker`, `thumbnail-worker`, `image-worker`) | Toàn bộ việc nặng: pdf-lib, PDF.js, sharp | Không chạm trực tiếp UI |
| Tiến trình con qpdf | `qpdf.exe` đóng kèm | Tối ưu cấu trúc, mã hóa, kiểm tra tệp | Không được gọi qua `shell: true` |
| Trợ giúp Store | `tools/StoreBridge` (.NET) | Trạng thái giấy phép, mở luồng mua, khôi phục giao dịch | Không truy cập tài liệu của người dùng |
| Dữ liệu cục bộ | JSON trong thư mục dữ liệu app | Cài đặt, tệp gần đây (tùy chọn) | Không lưu nội dung tài liệu |

## 3. Cấu trúc kho mã

```text
offline-pdf-toolbox/
  apps/desktop/
    package.json
    forge.config.ts                 # cấu hình Electron Forge + maker MSIX
    vite.main.config.ts
    vite.renderer.config.ts
    tsconfig.json
    src/
      main/
        index.ts                    # khởi tạo app, cửa sổ, CSP, bộ lọc mạng
        ipc/                        # handler từng nhóm lệnh
          files.ts  tasks.ts  license.ts  settings.ts
        services/
          taskQueue.ts              # hàng đợi tác vụ
          workerPool.ts             # quản lý nhóm luồng
          tempManager.ts            # thư mục tạm theo tác vụ, quét dọn
          outputVerifier.ts         # kiểm tra đầu ra trước khi ghi vào đích
          safePath.ts               # làm sạch tên tệp, chặn `..`, tên thiết bị
          qpdfRunner.ts             # bọc spawn qpdf, phân tích mã thoát, hủy
          licenseService.ts         # trạng thái Pro, cache 14 ngày
        window/
          createWindow.ts           # contextIsolation, sandbox, preload
      preload/
        index.ts                    # contextBridge: api tối thiểu
        api.d.ts
      renderer/
        index.html                  # kèm CSP
        main.tsx
        App.tsx
        features/
          home/HomeScreen.tsx       # S-01
          merge/MergeScreen.tsx     # F-01
          split/SplitScreen.tsx     # F-02
          rotate/RotateScreen.tsx   # F-04
          tools/ToolScreen.tsx      # điều hướng tới từng công cụ
          tools/tools.ts            # danh mục sáu công cụ
          settings/SettingsScreen.tsx
          pro/ProScreen.tsx         # S-09 (giấy phép, tạm thời)
        components/
          AppShell.tsx              # thanh trên, bảng bên phải, thanh dưới
          DropZone.tsx
          FileList.tsx
          PageGrid.tsx              # lưới trang dùng chung (F-02, F-05)
          OptionsPanel.tsx
          ActionBar.tsx              # nút hành động chính + tiến độ + Hủy
          OfflineBadge.tsx           # dấu hiệu "Xử lý trên máy bạn"
          PasswordPrompt.tsx         # hộp thoại nhập mật khẩu
          ResultSummary.tsx
          UpsellBanner.tsx
        hooks/
          usePageThumbnails.ts       # vẽ hình thu nhổ theo yêu cầu
        services/
          pdfWorkerClient.ts        # khách hàng của worker hình thu nhổ
          fileReader.ts             # đọc một tệp: số trang, dấu trang, chữ ký
        state/
          appStore.ts               # cài đặt, thông tin môi trường, giấy phép
          filesStore.ts             # danh sách tệp của công cụ gộp
          rotateStore.ts            # tệp đang xoay (một tệp)
          splitStore.ts             # tệp đang tách (một tệp)
          taskStore.ts              # tác vụ đang chạy, tiến độ, kết quả
        i18n/
          index.tsx                 # dịch, số ít/số nhiều, định dạng theo vùng
          en.json  de.json  fr.json  es.json  vi.json
        styles/app.css
      workers/
        thumbnail.worker.ts         # phân tích và vẽ hình thu nhổ bằng PDF.js
      shared/
        types.ts                    # kiểu dữ liệu dùng chung
        errors.ts                   # mã lỗi ổn định + ánh xạ thông báo
        features.ts                 # bảng giới hạn Free/Pro + FeatureGate
        pageRange.ts                # phân tích "1-3, 7, 10-"
        naming.ts                   # làm sạch và dựng tên tệp đầu ra
        ipc.ts                      # tên kênh IPC
        tasks.ts                    # kiểu tham số của từng tác vụ
    scripts/
      copy-pdfjs-assets.mjs         # chép bộ phông chuẩn của PDF.js vào public
      fetch-qpdf.mjs               # tải qpdf, kiểm SHA-256, giải nén
  tools/StoreBridge/
    StoreBridge.csproj
    Program.cs                     # JSON trên stdin/stdout
    StoreBridge.cs                 # bọc Windows.Services.Store
  packaging/msix/
    AppxManifest.xml
    assets/                        # logo các kích thước bắt buộc
    build-msix.ps1
    resources.pri                  # nếu cần tài nguyên WinUI
  tests/
    fixtures/                      # bộ tệp PDF kiểm thử (mục 2 TESTING.md)
    scripts/generate-fixtures.ts   # tự sinh bộ tệp kiểm thử
    scripts/verify-output.ts       # kiểm tra kết quả đầu ra bằng tay
    helpers/pdfCheck.ts            # bộ kiểm tra kết quả dùng chung
    unit/                          # Vitest
    e2e/                           # Playwright cho Electron
  docs/
```

**Quy ước đặt tên:**
- Tệp: `kebab-case.ts` / `kebab-case.tsx`. Thư mục: `camelCase` cho `features/`, `PascalCase` cho component.
- Hằng: `SCREAMING_SNAKE_CASE`. Hàm: `camelCase`. Kiểu/interface: `PascalCase`.
- Mọi chuỗi chữ hiển thị: **không** viết cứng trong mã — nằm trong `i18n/<lang>.json`.
- Mã lỗi: `E_<CATEGORY>_<NN>` (xem `shared/errors.ts`).

## 4. Cấu hình Electron giữ lời hứa offline

```ts
// src/main/window/createWindow.ts
const win = new BrowserWindow({
  webPreferences: {
    preload: path.join(__dirname, 'preload.cjs'),
    contextIsolation: true,   // bắt buộc
    nodeIntegration: false,    // bắt buộc
    sandbox: true,             // bắt buộc
    webSecurity: true,
  },
});

// Bộ lọc mạng nằm ở src/main/services/networkGuard.ts, cài trên session
// trước khi nạp bất kỳ nội dung nào.
installNetworkGuard(session.defaultSession, IS_DEV);
```

Bốn điểm bắt buộc:

1. `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`.
2. CSP chỉ cho phép tài nguyên cục bộ (`default-src 'self'; script-src 'self'; img-src 'self' data: blob:; worker-src 'self' blob:; connect-src 'self'; object-src 'none'` — xem `src/renderer/index.html`).
3. Chặn mọi yêu cầu mạng ở cấp session, trong renderer lẫn main. Chỉ mở trình duyệt hệ thống khi người dùng bấm một liên kết trợ giúp, thì dùng `shell.openExternal` — không đi qua `window.open`.
4. Bản 1.0 **không** có dịch vụ báo lỗi hay thống kê gửi dữ liệu ra ngoài. Nếu sau này thêm: mặc định tắt, ghi rõ trong chính sách quyền riêng tư, không bao giờ chứa tên tệp hay nội dung.

### 4.1. Giao thức nội bộ `app://`

Giao diện **không** được nạp bằng `file://`. Với `file://`, nguồn gốc của trang là "null" và Chromium chặn Web Worker, còn PDF.js cần một worker để phân tích tài liệu.

Vì vậy ứng dụng đăng ký một giao thức chuẩn riêng:

```ts
// src/main/protocol.ts
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } },
]);

protocol.handle('app', async (request) => {
  // phục vụ tệp từ .vite/renderer/main_window, chặn truy cập ra ngoài thư mục gốc
});
```

Hệ quả:
- `webSecurity: true` được giữ nguyên — không cần `--allow-file-access-from-files`.
- Worker (kể cả worker lồng của PDF.js) hoạt động bình thường.
- Module worker luôn được nạp theo chế độ CORS, nên handler phải trả header `access-control-allow-origin`.
- Ở chế độ phát triển, giao diện do máy chủ Vite phục vụ (`http://localhost`), không dùng handler này.

### 4.2. PDF.js trong Web Worker

PDF.js v6 giả định chạy trong ngữ cảnh có `window` và `document`:

- `document.baseURI` khi tải bộ phông chuẩn (`fetchData`).
- `window.location` khi dựng worker nội bộ (`PDFWorker`).

Trong Web Worker hai đối tượng này không tồn tại, nên `src/workers/thumbnail.worker.ts` cài một bộ shim tối thiểu:

```ts
if (typeof workerGlobal.document === 'undefined') {
  workerGlobal.document = { baseURI: self.location.href };
}
if (typeof workerGlobal.window === 'undefined') {
  workerGlobal.window = self;
}
```

Bộ shim chỉ cung cấp đúng hai thuộc tính PDF.js cần, không mở rộng quyền truy cập của worker. Sau khi có shim, PDF.js dựng được worker nội bộ thật (không còn cảnh báo "fake worker") và tải được bộ phông chuẩn.

**Bộ phông chuẩn** (`standard_fonts/`, khoảng 780 KB) được chép từ gói `pdfjs-dist` vào `src/renderer/public/` bởi `scripts/copy-pdfjs-assets.mjs` khi build. Thiếu bộ phông này, hình thu nhổ sẽ không có chữ với các tài liệu dùng font 14 chuẩn.

Vì `pdfjs-dist` phân tích trong worker riêng và vẽ trong worker của ta, **không có việc nặng nào chạy trên luồng giao diện**.

## 5. Mô hình tác vụ

| Trạng thái | Ý nghĩa | Chuyển sang |
| --- | --- | --- |
| `queued` | Đã nhận, chờ luồng rảnh | `running`, `cancelled` |
| `running` | Đang xử lý, phát sự kiện tiến độ | `succeeded`, `failed`, `cancelled` |
| `succeeded` | Tệp đầu ra đã kiểm tra và di chuyển vào đích | kết thúc |
| `failed` | Lỗi đã được phân loại | kết thúc |
| `cancelled` | Người dùng hủy, tệp tạm đã dọn | kết thúc |

Quy tắc bắt buộc cho mọi tác vụ:

1. Mỗi tác vụ có thư mục tạm riêng trong thư mục tạm hệ thống; xóa khi kết thúc; quét dọn tệp tạm cũ khi app khởi động.
2. Ghi kết quả ra tệp tạm → **kiểm tra lại** (mở được, đủ số trang mong đợi) → mới đổi tên vào đích. Tên đã tồn tại thì thêm hậu tố số. **Không bao giờ ghi đè.**
3. Chạy trong luồng hoặc tiến trình con, không bao giờ trong luồng giao diện.
4. Hủy được ở mọi lúc: gửi tín hiệu dừng, giết tiến trình con qpdf nếu có, dọn tệp tạm.
5. Số tác vụ chạy song song = số nhân CPU trừ một, tối đa 4.

### Hợp đồng kênh tiến độ

```ts
// main → renderer (qua preload)
type TaskProgress = {
  taskId: string;
  phase: 'reading' | 'processing' | 'writing' | 'verifying';
  percent: number;      // 0–100, số nguyên
  messageKey: string;   // khoá i18n, không phải chuỗi đã dịch
};
```

Renderer chỉ nhận `messageKey` để việc dịch không bị kẹt trong tiến trình chính.

## 6. Chia công việc giữa qpdf và JavaScript

**qpdf là động cơ chính** cho gộp, tách, xoay, mã hóa và tối ưu cấu trúc — làm việc trực tiếp trên cấu trúc tệp, tiết kiệm bộ nhớ, xử lý tốt tệp lỗi nhẹ.

| Việc | Công cụ | Lý do |
| --- | --- | --- |
| Gộp, tách, xoay, trích trang | qpdf | Không nạp cả tệp vào bộ nhớ JS; xử lý tệp lỗi nhẹ |
| Tối ưu cấu trúc, nén lại luồng | qpdf | Gom đối tượng, Flate mức cao |
| Mã hóa AES-256, gỡ mật khẩu | qpdf | Xử lý chuẩn PDF, quyền hạn |
| Kiểm tra đầu ra (số trang, mở được) | qpdf + PDF.js | Kiểm tra bằng hai bộ đọc độc lập |
| Hình thu nhổ, xem trước | PDF.js (`pdfjs-dist`) | Apache-2.0, chạy trong worker |
| Nén lại ảnh nhúng | sharp (libvips) | Xử lý ảnh nhanh, giữ SMask |
| Ảnh sang PDF, siêu dữ liệu | pdf-lib | API đơn giản, MIT |
| Phân tích dải trang, đặt tên, gate | TypeScript thuần | Logic thuần, kiểm thử đơn vị dễ |

### Bọc qpdf an toàn

```ts
// KHÔNG dùng shell: true — tránh chuyển chuỗi lệnh
spawn(qpdfPath, ['--empty', '--pages', '--file=...', '--'], { shell: false });
```

- Luôn truyền mảng tham số, không nối chuỗi.
- Nạp `qpdf.exe` từ `resources/qpdf/` (đóng kèm), không từ PATH. Đường dẫn là `join(app.getAppPath(), 'resources', 'qpdf', 'qpdf.exe')`.
- Dùng `--password-file` (tệp tạm) thay vì `--password` để **mật khẩu không bao giờ nằm trên dòng lệnh** — nếu không nó sẽ bị lộ trong danh sách tiến trình của máy.
- Bản ghi lỗi chỉ giữ mã lỗi, không giữ nội dung tài liệu.

**Hạn chế của qpdf 12.4.2:** bên trong khối `--pages`, qpdf chỉ nhận `--password=` (tức là mật khẩu trên dòng lệnh), không nhận `--password-file=`. Vì vậy tệp được bảo vệ bằng mật khẩu được **giải mã vào thư mục tạm** trước (`qpdf --password-file=... --decrypt`), rồi mới gộp bản đã giải mã. Mật khẩu vẫn không bao giờ lộ ra ngoài.

### Ba lệnh qpdf được dùng

| Việc | Lệnh |
| --- | --- |
| Gộp | `qpdf --empty --pages --file=A [--range=1-3] --file=B -- out.pdf` |
| Xoay | `qpdf --rotate=+90:1,3 in.pdf out.pdf` (không có dải trang nghĩa là xoay tất cả) |
| Kiểm tra | `qpdf --check file.pdf` (mã thoát 0 = sạch, 2 = lỗi, 3 = cảnh báo) |
| Đếm trang | `qpdf --show-npages file.pdf` |

Góc xoay dùng dấu `+` (cộng thêm vào `/Rotate` theo modulo 360) đúng như đặc tả yêu cầu: xoay hai lần 90 độ cho kết quả giống xoay 180 độ.

### Lấy qpdf và giấy phép

qpdf **không** đưa vào git. Script `scripts/fetch-qpdf.mjs` tải bản phát hành chính thức, kiểm tra SHA-256 đã ghim, giải nén và ghi kèm giấy phép Apache-2.0 cùng `VERSION.txt`. Chạy tự động trước khi build và trong CI.

Phiên bản dùng: **qpdf 12.4.2**, bản `msvc64` (tự chứa, không cần DLL MinGW).

## 7. Quy trình nén (chi tiết)

Đây là phần khó nhất. Thực hiện đúng thứ tự sau:

1. **Kiểm tra đầu vào** bằng qpdf: mở được? có mật khẩu? có chữ ký số không (tìm trường chữ ký và dải byte của chữ ký)?
2. **Quét ảnh nhúng**: bộ lọc (JPEG, Flate, khác), kích thước điểm ảnh, không gian màu, có mặt nạ không.
3. **Tính độ phân giải hiệu dụng**: ảnh phủ trọn trang → số điểm ảnh ÷ kích thước trang tính bằng inch. Ảnh nhỏ trong trang → dùng giới hạn cạnh dài tối đa thay vì độ phân giải.
4. **Quyết định từng ảnh**:
   - Bỏ qua: ảnh dưới ~50 KB, ảnh 1 bit (đen trắng), bộ lọc chưa hỗ trợ (JBIG2, CCITT, JPEG 2000 ở bản 1.0).
   - Xử lý: JPEG, và Flate 8 bit màu/thang xám → giải mã, thu nhỏ tới độ phân giải đích nếu cao hơn, mã hóa lại JPEG theo chất lượng của mức nén.
   - Giữ nguyên mặt nă SMask và thông tin vị trí; chỉ thay phần dữ liệu ảnh nền.
   - Chỉ thay ảnh khi bản mới nhỏ hơn ít nhất 5%.
5. **Ghi lại** ảnh đã thay vào bản sao tệp, giữ nguyên văn bản và vector.
6. **Tối ưu cấu trúc** bằng qpdf.
7. **So sánh dung lượng**: không nhỏ hơn tệp gốc → hủy kết quả, báo "đã được tối ưu".
8. **Ước lượng trước khi chạy**: xử lý thử ảnh lớn nhất, suy ra tỷ lệ giảm, hiển thị dưới dạng khoảng (ví dụ "khoảng 55% đến 70%").

Bản 1.0 **không** chuyển văn bản và hình vector thành ảnh — chỉ xử lý ảnh nhúng, để văn bản vẫn chọn và tìm kiếm được.

> Bước 2–5 cần thử nghiệm nhiều vì PDF lưu ảnh rất đa dạng (Flate có dự đoán, ảnh đảo màu, ICC, CMYK). Chấp nhận bản 1.0 chỉ hỗ trợ các trường hợp phổ biến; ghi nhận trường hợp bỏ qua vào báo cáo.

### 7.1. Sáu chế độ tách (F-02)

Mỗi chế độ dựng ra một danh sách "phần" (mỗi phần là một tệp đầu ra) rồi ghi từng phần bằng cùng một lệnh qpdf.

| Chế độ | Cách dựng danh sách phần |
| --- | --- |
| Theo khoảng trang | Mỗi khoảng trong chuỗi `1-3, 5, 8-10` là một phần |
| Mỗi N trang | `chunkRanges(totalPages, N)` |
| Mỗi trang một tệp | Mỗi trang là một phần |
| Theo dấu trang cấp 1 | Trang bắt đầu của mừng chương; phần kéo dài tới trang trước chương sau |
| Theo dung lượng tối đa | Ước lượng số trang mỗi phần từ dung lượng tệp nguồn, rồi **đo lại** tệp đã ghi; nếu vượt giới hạn thì lùi một trang và ghi lại |
| Trích trang | Các trang đã chọn trong lưới trang thành một tệp duy nhất |

Dấu trang cấp 1 được đọc trong worker PDF.js (`document.getOutline()`), nên không cần qpdf đọc outline.

**Giới hạn của chế độ theo dung lượng:** nếu một trang đơn lẻ đã vượt giới hạn thì không thể lùi thêm — tệp đó vẫn được tạo, vì đây là kích thước nhỏ nhất có thể.

Tất cả kết quả tách nằm trong **thư mục con** đặt trong thư mục đích, để không lẫn với các tệp khác của người dùng.

### 7.2. Cách triển khai trong bản 1.0

Ba công cụ làm việc trên **cấu trúc tệp PDF**, không vẽ lại trang:

| Việc | Công cụ | Ghi chú |
| --- | --- | --- |
| Đọc và ghi luồng ảnh | pdf-lib | Ở mức đối tượng thô: chỉ nội dung luồng ảnh và `/Width`, `/Height`, `/Filter`, `/ColorSpace` bị đổi |
| Giải mã và nén lại ảnh | sharp (libvips) | Ảnh JPEG (DCTDecode) giải mã trực tiếp; ảnh Flate 8 bit được giải nén rồi đưa vào sharp dạng raw |
| Tối ưu cấu trúc | qpdf | `--object-streams=generate --compress-streams=y --recompress-flate` |
| Tìm vị trí ảnh trên trang | Bộ phân tích luồng nội dung của ứng dụng | Theo dõi toán tử `q`/`Q`/`cm`/`Do` để biết ảnh được đặt rộng bao nhiêu |

**Độ phân giải hiệu dụng** được tính từ ma trận `cm` của lần đặt ảnh:

```
dpi = pixelWidth / (chiều rộng vật lý trên trang / 72)
```

Nhờ vậy không cần giả định "ảnh phủ trọn trang": ảnh nhỏ giữa trang cũng được tính đúng, và khi giảm kích thước ảnh thì luồng nội dung trang **không cần sửa** — ảnh vẫn chiếm đúng diện tích cũ, chỉ có số pixel giảm.

**Ảnh có mặt nạ mền (SMask)** chỉ được nén lại cùng kích thước, vì mặt nạ phải khớp kích thước ảnh nền.

**Quy tắc thay ảnh:** chỉ thay khi bản mới nhỏ hơn ít nhất 5%, và bỏ qua ảnh dưới 50 KB, ảnh 1 bit, bộ lọc chưa hỗ trợ (JBIG2, CCITT, JPEG 2000) và không gian màu lạ (Indexed, Separation).

## 8. Bộ nhớ và tệp lớn

| Tình huống | Cách xử lý |
| --- | --- |
| Gộp, tách, xoay tệp lớn | Dùng qpdf, không nạp cả tệp vào bộ nhớ JavaScript |
| Nén tệp scan hàng trăm MB | Xử lý từng ảnh một, giải phóng bộ nhớ sau mỗi ảnh, giới hạn bộ nhớ của luồng nền |
| Tệp > 300 MB hoặc > 3.000 trang | Cảnh báo "có thể mất nhiều phút" nhưng vẫn cho chạy |
| Hình thu nhổ tệp nhiều trang | Vẽ theo yêu cầu khi cuộn tới, bộ đệm tối đa 200 ảnh, hủy vẽ ngoài vùng nhìn |

## 9. Phân loại lỗi

| Loại | Nhận biết | Thông báo (khoá i18n) | Hành động |
| --- | --- | --- | --- |
| Cần mật khẩu | qpdf báo tệp mã hóa | `error.needsPassword` | Hộp nhập mật khẩu |
| Hỏng nhẹ | qpdf báo cảnh báo cấu trúc | `error.recovered` | Tiếp tục với bản đã khôi phục, ghi chú trong báo cáo |
| Hỏng nặng | Không đọc được | `error.unreadable` | Bỏ qua hoặc dừng |
| Không phải PDF | Thiếu phần đầu PDF | `error.notPdf` | Loại khỏi danh sách |
| Chữ ký số | Có trường chữ ký | `error.signature` | Cho chọn tiếp tục hoặc hủy |
| Hết dung lượng đĩa | Lỗi ghi | `error.diskFull` | Chọn thư mục khác |
| Không có quyền ghi | Lỗi quyền | `error.noPermission` | Chọn thư mục khác |
| Đường dẫn/ký tự lạ | Lỗi đường dẫn | `error.badPath` | Gợi ý tên khác |
| Lỗi không xác định | Còn lại | `error.unknown` | Nút "Sao chép chi tiết" (không chứa nội dung tài liệu) |

Mã lỗi ổn định để đối chiếu với báo cáo hỗ trợ: `E_AUTH`, `E_STRUCT`, `E_PARSE`, `E_FORMAT`, `E_SIGNED`, `E_DISK`, `E_PERM`, `E_PATH`, `E_UNKNOWN`.

## 10. Mục tiêu hiệu năng

Đo trên máy tầm trung (4 nhân, 8 GB RAM, ổ SSD).

| Thao tác | Mục tiêu |
| --- | --- |
| Khởi động app đến lúc dùng được | < 3 giây |
| Đọc và hiện hình thu nhổ trang đầu, tệp thường | < 1 giây |
| Gộp 100 trang từ 5 tệp | < 5 giây |
| Tách tệp 500 trang thành từng trang | < 20 giây |
| Nén tệp scan 50 trang, 40 MB | < 30 giây |
| Bộ nhớ đỉnh khi gộp 2.000 trang | < 1 GB |
| Gộp 50 tệp / 2.000 trang trên máy 8 GB | < 30 giây |

Script đo: `tests/scripts/perf.ts`. Chạy trong CI hằng tuần, ghi kết quả vào nhật ký.

## 11. Thư viện và giấy phép

| Nhiệm vụ | Thư viện | Giấy phép | Ghi chú |
| --- | --- | --- | --- |
| Gộp/tách/xoay/nén cấu trúc, AES-256 | qpdf (kèm trong gói) | Apache-2.0 | Chạy như tiến trình con — thêm ở tuần 3 |
| Hình thu nhổ, xem trước | pdfjs-dist 6 | Apache-2.0 | Chạy trong worker riêng; xem mục 4.2 |
| Ảnh sang PDF, siêu dữ liệu | pdf-lib | MIT | Bản gốc ít cập nhật — kiểm thử kỹ, cân nhắc nhánh được bảo trì — thêm ở tuần 7 |
| Nén lại ảnh nhúng | sharp (libvips) | Apache-2.0 / LGPL | Dùng liên kết động theo gói chính thức — thêm ở tuần 5 |
| Giao diện | React 19, Fluent UI React 9 | MIT | Phong cách Windows 11 |
| Trạng thái | Zustand | MIT | |
| Kiểm thử | Vitest, Playwright | MIT / Apache-2.0 | Chạy trên GitHub Actions bằng máy Windows |

**Cấm tuyệt đối** trong sản phẩm đóng kín khi chưa mua giấy phép thương mại: **Ghostscript** và **MuPDF** (AGPL hoặc giấy phép thương mại song song). Mỗi lần thêm thư viện mới phải ghi vào `resources/qpdf/LICENSE-BUNDLE.md` hoặc SBOM — việc này là bắt buộc, không phải tùy chọn.

## 12. Cầu nối IPC

Preload chỉ lộ đúng các hàm sau (`src/preload/index.ts`). Thêm hàm mới phải kèm kiểm thử chặn truy cập trực tiếp.

| Nhóm | Hàm | Kênh |
| --- | --- | --- |
| Tệp | `pick`, `pickFolder`, `stat`, `readBytes`, `reveal`, `getPathForFile` | `files:*` |
| Cài đặt | `get`, `update` | `settings:*` |
| Tệp gần đây | `get`, `clear` | `recent:*` |
| Môi trường | `info`, `license` | `app:*`, `license:*` |
| Tác vụ | `onTaskProgress`, `onTaskState` (đẩy từ main) | `task:*` |

Quy tắc: không truyền `ipcRenderer` thô; không dùng kênh `invoke` chung với tên lệnh động — mỗi lệnh một hàm được định nghĩa rõ. Tên kênh nằm trong `src/shared/ipc.ts` để main và preload luôn khớp.

`getPathForFile` dùng `webUtils.getPathForFile` của Electron: từ Electron 32, `File.path` đã bị gỡ, và đây là cách được hỗ trợ chính thức để lấy đường dẫn thật của tệp được kéo thả.

## 13. Kiểm soát phiên bản

- Khoá phiên bản chính xác trong `package.json` (không dùng `^` cho thư viện xử lý PDF).
- `npm audit` và kiểm tra lỗ hổng chạy trong CI hằng tuần.
- Lập SBOM (danh sách thành phần) và cập nhật Electron, PDF.js, qpdf, sharp theo lịch tháng.
- Mỗi bản phát hành ghi lại phiên bản các thành phần bên trong, hiển thị trong màn hình Giới thiệu và gửi kèm trong "Sao chép chi tiết lỗi".
