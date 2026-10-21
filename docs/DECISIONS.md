# Nhật ký quyết định kỹ thuật (ADR)

Cập nhật: 2026-10-21 · Nguồn: mục 9, 12, 16, 18 đặc tả gốc

Giữ danh sách này để tra cứu khi cần giải thích hoặc đổi hướng. **Mỗi quyết định đảo ngược hướng đi đều phải thêm một ADR mới** — không sửa ADR cũ để giấu lịch sử.

## Mẫu

```markdown
### ADR-XXX: <Tiêu đề>
- **Trạng thái:** Đề xuất | Đã chấp nhận | Bị thay thế bởi ADR-YYY
- **Ngày:** YYYY-MM-DD
- **Bối cảnh:** Vấn đề cần giải quyết, ràng buộc.
- **Quyết định:** Chọn gì.
- **Hệ quả:** Điều gì tốt, điều gì bất tiện, chi phí đổi hướng.
- **Phương án đã cân nhắc:** Các lựa chọn khác và lý do bác.
```

---

## ADR-001: Nền tảng ứng dụng — Electron

- **Trạng thái:** Đề xuất (chốt ở cổng tuần 1 sau hai spike)
- **Ngày:** 2026-10-21
- **Bối cảnh:** Cần ứng dụng Windows đóng gói được MSIX, gọi được API giấy phép Microsoft Store, xử lý PDF nặng, và làm được bởi một người quen web trong thời gian ngắn. Ba hướng: Electron + React + TS, Tauri, .NET WinUI 3.
- **Quyết định:** Electron + React + TypeScript, kèm chương trình .NET nhỏ (`StoreBridge`) để nói chuyện với hệ thống giấy phép Store.
- **Hệ quả:**
  - Tốt: tốc độ làm giao diện nhanh nhất; hệ sinh thái thư viện PDF JS phong phú; công cụ MSIX sẵn có.
  - Bất tiện: dung lượng cài đặt lớn (> 100 MB); phải tự quản lý cầu nối giấy phép.
  - Chi phí đổi hướng: cấu trúc `main/preload/renderer` có thể tái sử dụng nguyên vẹn khi chuyển sang WinUI 3 — nên giữ logic xử lý PDF trong worker độc lập với framework giao diện.
- **Phương án đã cân nhắc:** Tauri (đóng gói MSIX phải tự dựng, rủi ro cao hơn lợi ích); WinUI 3 (đường học XAML, chậm với một người quen web).
- **Điều kiện gỡ bỏ:** Nếu spike đóng gói MSIX **hoặc** spike kiểm tra giấy phép thất bại ở tuần 1, đánh giá lại và chuyển sang WinUI 3 khi chi phí đổi hướng còn thấp.

## ADR-002: qpdf là động cơ chính xử lý PDF

- **Trạng thái:** Đã chấp nhận
- **Ngày:** 2026-10-21
- **Bối cảnh:** Cần gộp, tách, xoay, mã hóa AES-256, tối ưu cấu trúc và kiểm tra tệp; phải xử lý được tệp lớn mà không nạp hết vào bộ nhớ, và xử lý tốt tệp lỗi nhẹ.
- **Quyết định:** qpdf (Apache-2.0) chạy như tiến trình con cho gộp, tách, xoay, mã hóa và tối ưu cấu trúc. JavaScript chỉ đảm nhiệm hình thu nhổ (PDF.js), nén lại ảnh nhúng (sharp), ảnh sang PDF và siêu dữ liệu (pdf-lib).
- **Hệ quả:**
  - Tốt: bộ nhớ thấp, hiệu năng tốt trên tệp lớn, xử lý tốt tệp lỗi nhẹ, giấy phép thân thiện.
  - Bất tiện: phải đóng gói `qpdf.exe` vào MSIX; phải quản lý tiến trình con (spawn, kill, phân tích mã thoát).
- **Phương án đã cân nhắc:** pdf-lib cho mọi thứ (chậm và tốn bộ nhớ với tệp lớn); Ghostscript và MuPDF (giấy phép AGPL hoặc thương mại — không dùng cho sản phẩm đóng kín khi chưa mua giấy phép).

## ADR-003: Mô hình "miễn phí có giới hạn + Pro mua đứt"

- **Trạng thái:** Đã chấp nhận
- **Ngày:** 2026-10-21
- **Bối cảnh:** Cần tối đa hóa lượt cài (nhiên liệu cho thứ hạng tìm kiếm) mà vẫn thu được tiền, và giữ được lời hứa "không thuê bao" mà khách văn phòng ưa thích.
- **Quyết định:** Ứng dụng miễn phí + sản phẩm mua trong ứng dụng loại durable (mua một lần) giá 12,99 USD. Không thuê bao ở bản 1.0.
- **Hệ quả:**
  - Tốt: lượt cài cao; lời hứa "mua đứt, không phiền" nhất quán với thông điệp; giới hạn Free thiết kế theo **số lượng** không theo chất lượng.
  - Bất tiện: doanh thu một lần, không có thu nhập lặp lại; rủi ro chuyển đổi thấp (mục tiêu 1,5–3%).
- **Phương án đã cân nhắc:** thuê bao 1,99 USD/tháng (mâu thuẫn thông điệp, hòa vốn sau ~6,5 tháng); trả phí ngay từ đầu (giảm mạnh lượt cài); cả hai song song (rối trang Store).
- **Điều kiện gỡ bỏ:** Chỉ thêm gói thuê bao khi có tính năng liên tục có chi phí duy trì (OCR) và doanh thu hỗ trợ.

## ADR-004: Cầu nối giấy phép Store qua chương trình .NET riêng

- **Trạng thái:** Đã chấp nhận (xác nhận ở tuần 1)
- **Ngày:** 2026-10-21
- **Bối cảnh:** Electron không gọi trực tiếp `Windows.Services.Store` được; cần cơ chế mua hàng và khôi phục giao dịch hoạt động ngay sau khi mua.
- **Quyết định:** `tools/StoreBridge` — chương trình .NET 8 nhỏ, giao tiếp JSON trên stdin/stdout, chạy như tiến trình con của tiến trình chính.
- **Hệ quả:**
  - Tốt: cô lập phần phụ thuộc Windows-specific; có thể test độc lập; nếu đổi nền tảng giao diện thì StoreBridge giữ nguyên.
  - Bất tiện: hai tiến trình phải giữ đồng bộ; cần xử lý trường hợp StoreBridge chết giữa chừng.
- **Phương án đã cân nhắc:** mô-đun gốc Node (phức tạp, khó bảo trì); WinRT trực tiếp từ Electron (rủi ro cao, khó gỡ lỗi).

## ADR-005: Cấm thư viện AGPL trong sản phẩm đóng kín

- **Trạng thái:** Đã chấp nhận
- **Ngày:** 2026-10-21
- **Bối cảnh:** Ứng dụng bán đóng kín trên Store; một số thư viện PDF phổ biến dùng AGPL hoặc giấy phép thương mại song song.
- **Quyết định:** Chỉ dùng thư viện đã xác minh giấy phép tương thích. Cấm tuyệt đối **Ghostscript** và **MuPDF** khi chưa mua giấy phép thương mại. Duy trì SBOM trong repo.
- **Hệ quả:** Giảm lựa chọn công cụ nén (buộc tự xây quy trình nén ảnh nhúng); mỗi lần thêm thư viện phải cập nhật SBOM trước khi gộp PR.
- **Phương án đã cân nhắc:** dùng Ghostscript/MuPDF rồi mua giấy phép thương mại sau (chi phí và rủi ro pháp lý không xác định).

## ADR-006: Bản 1.0 không có thống kê gửi ra ngoài

- **Trạng thái:** Đã chấp nhận
- **Ngày:** 2026-10-21
- **Bối cảnh:** Quyền riêng tư là lý do khách trả tiền; thống kê gửi đi làm suy yếu đúng lời hứa đó.
- **Quyết định:** Không có dịch vụ báo lỗi hay thống kê gửi dữ liệu ra ngoài ở bản 1.0. Mọi chỉ số lấy từ Partner Center và hộp thư hỗ trợ. Nếu sau này thêm: mặc định tắt, ghi rõ trong chính sách quyền riêng tư, không bao giờ chứa tên tệp hay nội dung.
- **Hệ quả:** Không biết ngay tính năng nào được dùng nhiều — phải hỏi trực tiếp bằng khảo sát tùy chọn có liên kết ra ngoài. Đổi lại, không có rủi ro lộ dữ liệu và không cần dự án báo lỗi.
- **Phương án đã cân nhắc:** telemetry tùy chọn ngay từ bản 1.0 (vi phạm tinh thần sản phẩm).

## ADR-007: Giới hạn Free theo số lượng, không theo chất lượng

- **Trạng thái:** Đã chấp nhận
- **Ngày:** 2026-10-21
- **Bối cảnh:** Giới hạn Free phải đủ để người dùng làm xong một việc nhỏ và thấy chất lượng, nhưng chạm giới hạn khi dùng cho công việc thật.
- **Quyết định:** Giới hạn nằm ở số lượng (2 tệp khi gộp, 5 trang khi tách, 1 tệp 20 MB khi nén ở mức Nhẹ/Vừa). **Không** đóng dấu chìm, **không** hạn chế chất lượng kết quả.
- **Hệ quả:** Người dùng dùng thử thấy đúng chất lượng sản phẩm thật; tránh đánh giá một sao do dấu chìm. Đổi lại, cần cảnh báo giới hạn **trước** khi người dùng làm xong việc.
- **Phương án đã cân nhắc:** giới hạn theo chất lượng hoặc dấu chìm (rủi ro đánh giá xấu, tỷ lệ chuyển đổi thấp).

## ADR-008: Kiểm tra đầu ra bắt buộc trước khi báo thành công

- **Trạng thái:** Đã chấp nhận
- **Ngày:** 2026-10-21
- **Bối cảnh:** Một lỗi làm hỏng tài liệu của khách đủ để mất khách và nhận đánh giá một sao.
- **Quyết định:** Mọi tác vụ ghi tệp phải: ghi ra tệp tạm → kiểm tra (mở được, đúng số trang, văn bản còn chọn được, hình render đúng) → mới đổi tên vào đích. Không bao giờ ghi đè tệp có sẵn.
- **Hệ quả:** Thêm một bước và mất vài phần trăm thời gian xử lý — chấp nhận được. Đổi lại, không bao giờ giao cho người dùng một tệp hỏng mà không báo.
- **Phương án đã cân nhắc:** ghi thẳng ra đích rồi kiểm tra (nguy cơ giao tệp hỏng).

## ADR-009: Tên ứng dụng và nhận diện

- **Trạng thái:** Đề xuất (chốt sau khi giữ chỗ tên)
- **Ngày:** 2026-10-21
- **Bối cảnh:** Cần tên chứa từ khóa chính, không trùng tên trên Store, không vi phạm nhãn hiệu của hãng khác.
- **Quyết định:** Tên hiển thị dạng **"Offline PDF Toolbox: Merge, Split, Compress"**. Biểu tượng: tờ giấy có ổ khóa nhỏ, đọc rõ ở 44×44. Bảng màu một màu chủ đạo (xanh đậm) cộng màu nhấn. Không dùng "Adobe", "Acrobat", hoặc thiết kế giống sản phẩm hãng khác.
- **Hệ quả:** Tên dài hơn nhưng chứa từ khóa. Phải kiểm tra trùng tên trước khi giữ chỗ.
- **Phương án đã cân nhắc:** tên ngắn gọn hơn nhưng kém tối ưu tìm kiếm; tên có thương hiệu riêng (không có ngân sách marketing).

## ADR-010: Giữ logic xử lý PDF độc lập với framework giao diện

- **Trạng thái:** Đã chấp nhận
- **Ngày:** 2026-10-21
- **Bối cảnh:** Có khả năng phải chuyển từ Electron sang WinUI 3 nếu spike tuần 1 thất bại.
- **Quyết định:** Toàn bộ logic xử lý PDF nằm trong `src/workers/` và `tools/` — không phụ thuộc React. Renderer chỉ gọi qua IPC với hợp đồng dữ liệu ổn định.
- **Hệ quả:** Tốt: chi phí đổi hướng thấp hơn; có thể test logic xử lý bằng Vitest không cần UI. Bất tiện: giao diện không được dùng API React trong worker.
- **Phương án đã cân nhắc:** viết logic xử lý trực tiếp trong component (nhanh lúc đầu nhưng đắt khi đổi hướng).

---

## ADR-011: Giao diện được phục vụ qua giao thức nội bộ `app://`, không dùng `file://`

- **Trạng thái:** Đã chấp nhận
- **Ngày:** 2026-10-21
- **Bối cảnh:** Bản đóng gói phải nạp giao diện. Với `file://`, nguồn gốc của trang là "null" nên Chromium chặn Web Worker — mà PDF.js cần worker để phân tích PDF. Ba lựa chọn: `file://` + cờ `--allow-file-access-from-files`, `file://` + chạy PDF.js trên luồng giao diện, hoặc giao thức chuẩn riêng.
- **Quyết định:** Đăng ký giao thức chuẩn `app://` (privileges: standard, secure, supportFetchAPI) và phục vụ giao diện từ `.vite/renderer/main_window`. Trang chính nạp `app://bundle/index.html`.
- **Hệ quả:**
  - Tốt: giữ nguyên `webSecurity: true`; worker và worker lồng của PDF.js hoạt động bình thường; không cần nới lỏng chính sách bảo mật.
  - Bất tiện: phải tự quản lý bảng MIME và chặn truy cập ra ngoài thư mục gốc trong handler; module worker cần header `access-control-allow-origin`.
  - Lưu ý: Playwright không tự động nhận ra cửa sổ nạp bằng giao thức tùy biến trong một số phiên bản — đã xác minh là hoạt động với Electron 45.
- **Phương án đã cân nhắc:** `--allow-file-access-from-files` (nới lỏng toàn bộ chính sách bảo mật, không chấp nhận được với sản phẩm hứa riêng tư); chạy PDF.js trên luồng giao diện (giải quyết được worker nhưng vẽ ảnh sẽ đơ giao diện khi lưới trang lớn ở bản 1.2).

## ADR-012: PDF.js chạy trong Web Worker riêng, kèm bộ shim `document`/`window`

- **Trạng thái:** Đã chấp nhận
- **Ngày:** 2026-10-21
- **Bối cảnh:** PDF.js v6 giả định chạy trong ngữ cảnh trang web: `document.baseURI` khi tải bộ phông chuẩn, `window.location` khi dựng worker nội bộ. Trong Web Worker, cả hai đều không tồn tại, khiến PDF.js rơi về "fake worker" và không tải được bộ phông (hình thu nhổ thiếu chữ).
- **Quyết định:** Chạy PDF.js trong worker riêng (`src/workers/thumbnail.worker.ts`) và cài một bộ shim tối thiểu cấp `document.baseURI` và `window` (= `self`). Đồng thời chép bộ phông chuẩn (`standard_fonts/`) của pdfjs-dist vào `public/` khi build.
- **Hệ quả:**
  - Tốt: cả phân tích và vẽ đều ngoài luồng giao diện; PDF.js dựng được worker nội bộ thật; hình thu nhổ có đủ chữ.
  - Bất tiện: bộ shim là điểm phụ thuộc vào hành vi nội bộ của PDF.js, phải kiểm tra lại khi nâng cấp phiên bản.
- **Phương án đã cân nhắc:** chạy PDF.js trên luồng giao diện (đơn giản hơn nhưng vẽ ảnh sẽ đơ giao diện khi lưới trang lớn); dùng thư viện vẽ PDF khác (thêm giấy phép và phụ thuộc).

## ADR-013: Mật khẩu tệp PDF được truyền cho qpdf bằng tệp tạm, không nằm trên dòng lệnh

- **Trạng thái:** Đã chấp nhận
- **Ngày:** 2026-10-21
- **Bối cảnh:** qpdf hỗ trợ `--password=` (mật khẩu trên dòng lệnh) và `--password-file=` (mật khẩu trong tệp). Mật khẩu trên dòng lệnh bị lộ trong danh sách tiến trình của máy — bất kỳ ứng dụng nào khác cũng đọc được. Nhưng bên trong khối `--pages`, qpdf 12.4.2 chỉ nhận `--password=`.
- **Quyết định:** Tệp được bảo vệ bằng mật khẩu được **giải mã vào thư mục tạm** (`qpdf --password-file=... --decrypt`) rồi mới gộp bản đã giải mã. Mật khẩu chỉ tồn tại trong bộ nhớ và trong tệp tạm, tệp tạm bị xóa cùng thư mục tạm của tác vụ.
- **Hệ quả:**
  - Tốt: mật khẩu không bao giờ xuất hiện trên dòng lệnh; bản giải mã tạm nằm trong thư mục tạm của tác vụ và bị dọn khi tác vụ kết thúc.
  - Bất tiện: tốn thêm một lượt ghi/đọc tệp cho mỗi tệp có mật khẩu; tệp đã giải mã tồn tại trong thư mục tạm một khoảnh thời gian.
- **Phương án đã cân nhắc:** truyền `--password=` trực tiếp (đơn giản hơn nhưng lộ mật khẩu); dùng `qpdf --decrypt` với mật khẩu đọc từ stdin (qpdf không hỗ trợ).

## ADR-014: Công cụ xoay chỉ giữ một tệp, không dùng chung danh sách với công cụ gộp

- **Trạng thái:** Đã chấp nhận
- **Ngày:** 2026-10-21
- **Bối cảnh:** F-04 xoay trang trong **một** tệp. Bản đầu tiên dùng chung danh sách tệp với công cụ gộp và lấy tệp đầu tiên, khiến người dùng dễ tưởng đang xoay nhầm tệp.
- **Quyết định:** Công cụ xoay có trạng thái riêng (`rotateStore`) giữ đúng một tệp; thêm tệp mới thay thế tệp cũ. Tên tệp đang xoay luôn hiện rõ trên màn hình.
- **Hệ quả:**
  - Tốt: không thể xoay nhầm tệp; tác vụ xoay thuộc một tệp đúng như đặc tả.
  - Bất tiện: thêm một store riêng và một đường đọc tệp dùng chung (`services/fileReader.ts`).
- **Phương án đã cân nhắc:** giữ danh sách chung và ghi rõ "chỉ tệp đầu tiên được xoay" — dễ nhầm, đã bị bỏ.

---

## Mục lục ADR

| Mã | Tiêu đề | Trạng thái |
| --- | --- | --- |
| ADR-001 | Nền tảng ứng dụng — Electron | Đề xuất |
| ADR-002 | qpdf là động cơ chính xử lý PDF | Đã chấp nhận |
| ADR-003 | Mô hình miễn phí + Pro mua đứt | Đã chấp nhận |
| ADR-004 | Cầu nối giấy phép Store qua .NET | Đã chấp nhận |
| ADR-005 | Cấm thư viện AGPL | Đã chấp nhận |
| ADR-006 | Không thống kê gửi ra ngoài ở bản 1.0 | Đã chấp nhận |
| ADR-007 | Giới hạn Free theo số lượng | Đã chấp nhận |
| ADR-008 | Kiểm tra đầu ra bắt buộc | Đã chấp nhận |
| ADR-009 | Tên ứng dụng và nhận diện | Đề xuất |
| ADR-010 | Logic xử lý độc lập framework giao diện | Đã chấp nhận |
| ADR-011 | Giao thức nội bộ `app://` | Đã chấp nhận |
| ADR-012 | PDF.js trong worker riêng kèm bộ shim | Đã chấp nhận |
| ADR-013 | Mật khẩu qua `--password-file` + giải mã tạm | Đã chấp nhận |
| ADR-014 | Công cụ xoay giữ một tệp riêng | Đã chấp nhận |

## Rủi ro đã biết (theo dõi)

| Mã | Rủi ro | Xác suất | Tác động | Tín hiệu cảnh báo |
| --- | --- | --- | --- | --- |
| R-01 | Nén làm hỏng tệp hoặc cho kết quả kém | Vừa | Cao | Tệp thử bị lỗi hiển thị, người thử báo mất ảnh |
| R-02 | Giấy phép Store không chạy tốt với Electron | Vừa | Cao | StoreBridge không lấy được giấy phép ở tuần 1 |
| R-03 | Thư viện có giấy phép không phù hợp bán đóng kín | Thấp | Cao | Thư viện mới được thêm mà chưa kiểm tra giấy phép |
| R-04 | Bị từ chối chứng nhận lần đầu | Vừa | Thấp | Cảnh báo WACK chưa xử lý |
| R-05 | Đối thủ miễn phí chiếm thị phần | Cao | Vừa | Lượt cài thấp, đánh giá so sánh bất lợi |
| R-06 | Chuyển đổi sang Pro thấp | Cao | Cao | Dưới 1% sau 30 ngày |
| R-07 | Đánh giá thấp vì giới hạn Free gây khó chịu | Vừa | Vừa | Lời nhận xét lặp lại "phải trả tiền mới dùng được" |
| R-08 | Dùng từ ngữ tuân thủ gây hiểu nhầm | Thấp | Cao | Khách hỏi "có chứng nhận HIPAA không" |
| R-09 | Khiếu nại nhãn hiệu về tên ứng dụng | Thấp | Vừa | Thư khiếu nại từ Store hoặc hãng khác |
| R-10 | Lỗ hổng bảo mật trong thư viện PDF | Vừa | Cao | Thông báo lỗ hổng về PDF.js, qpdf, sharp, Electron |
| R-11 | Quá tải hỗ trợ khách khi chỉ có một người | Vừa | Vừa | Nhiều thư lặp lại một câu hỏi |
| R-12 | Làm chậm tiến độ do mở rộng tính năng | Cao | Vừa | Trễ hơn một tuần ở bất kỳ mốc nào |
| R-13 | Vấn đề thuế và nhận tiền | Vừa | Vừa | Hồ sơ Partner Center bị yêu cầu bổ sung |
| R-14 | Dung lượng cài đặt lớn khiến khách ngại | Vừa | Thấp | Tỷ lệ cài trên lượt xem thấp |
