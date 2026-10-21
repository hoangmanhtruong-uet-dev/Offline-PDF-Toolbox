# Bảo mật và quyền riêng tư

Cập nhật: 2026-10-21 · Nguồn: mục 11 đặc tả gốc

Quyền riêng tư là **lý do khách trả tiền**, nên đây là phần được thiết kế như một tính năng, không phải thủ tục.

> Nguyên tắc số 1: **chỉ cam kết những gì có thể chứng minh được bằng kiểm thử.**

---

## 1. Cam kết với người dùng và cách bảo đảm

| Cam kết | Cách bảo đảm trong sản phẩm |
| --- | --- |
| Tệp không rời khỏi máy | Không có mã gửi dữ liệu tài liệu qua mạng; bộ lọc chặn yêu cầu mạng; bài kiểm thử tự động khi tắt mạng |
| Không cần tài khoản | Không có màn hình đăng nhập; giấy phép Pro gắn với tài khoản Microsoft qua Store |
| Không theo dõi nội dung | Bản 1.0 không có thống kê sử dụng; nếu thêm sau này thì mặc định tắt và không bao giờ ghi tên tệp hay nội dung |
| Không giữ lại dữ liệu | Tệp tạm bị xóa khi tác vụ kết thúc hoặc khi app khởi động lại; danh sách tệp gần đây chỉ lưu đường dẫn, có nút xóa và có thể tắt |
| Mật khẩu không bị lưu | Mật khẩu chỉ tồn tại trong bộ nhớ tới khi tác vụ xong |

**Giới hạn cần nói thật:** xóa tệp tạm trên ổ SSD không bảo đảm dữ liệu không thể khôi phục bằng công cụ chuyên dụng. App **không** dùng cụm "xóa an toàn tuyệt đối".

## 2. Bốn điểm kiểm soát offline

Đây là bốn chỗ duy nhất app có thể chạm vào mạng. Kiểm soát cả bốn:

| # | Điểm chạm mạng | Kiểm soát |
| --- | --- | --- |
| 1 | Renderer gọi `fetch`/`XMLHttpRequest` | CSP `default-src 'self'` + bộ lọc `onBeforeRequest` ở cấp session |
| 2 | Main process gọi mạng | Không có mã gọi mạng nào trong `src/main`. Bộ lọc ở #1 chặn cả request của session, nhưng cần kiểm thử riêng |
| 3 | `shell.openExternal` (mở trang trợ giúp) | Chỉ được gọi từ hành động rõ ràng của người dùng (bấm liên kết), không tự mở |
| 4 | StoreBridge (mua hàng, kiểm tra giấy phép) | Dùng kết nối của Microsoft Store; **không** đụng tới tài liệu |

**Bài kiểm thử offline bắt buộc** (chạy trong CI, tuần 2 trở đi):
1. Chặn mọi yêu cầu mạng ở cấp máy ảo.
2. Chạy lần lượt: gộp, tách, nén, xoay, sắp xếp trang, ảnh sang PDF.
3. Xác nhận tất cả vẫn hoạt động bình thường.
4. Xác nhận **không có yêu cầu mạng nào phát sinh** (đếm request ở proxy).

## 3. Mô hình mối đe dọa

| Mối đe dọa | Rủi ro | Biện pháp |
| --- | --- | --- |
| Tệp PDF độc hại làm lỗi trình đọc | Chạy mã ngoài ý muốn, làm sập app | Renderer bật sandbox; xử lý PDF trong tiến trình nền; tắt tính năng JavaScript của PDF; cập nhật thư viện thường xuyên |
| Tên tệp hoặc đường dẫn độc hại | Ghi ra ngoài thư mục đích | Làm sạch tên tệp, chặn ký tự `..`, ký tự điều khiển và tên thiết bị đặc biệt của Windows |
| Tệp tạm bị lộ | Người khác đọc được tài liệu còn sót | Thư mục tạm riêng theo tác vụ, dọn sạch khi kết thúc và khi khởi động |
| Nhật ký chứa thông tin nhạy cảm | Lộ tên tệp, đường dẫn | Nhật ký chỉ ghi mã lỗi và thông số kỹ thuật; tên tệp được băm hoặc cắt bớt |
| Thư viện bên thứ ba có lỗ hổng | Rủi ro dây chuyền | Khóa phiên bản, kiểm tra lỗ hổng định kỳ, lập SBOM, cập nhật Electron, PDF.js, qpdf, sharp theo lịch |
| Giả mạo gói cài đặt | Người dùng cài bản độc | Chỉ phân phối qua Store, gói được Microsoft ký |
| Bẻ khóa giấy phép Pro | Mất doanh thu | Chấp nhận mức rủi ro thấp; kiểm tra giấy phép qua Store, không đầu tư vào cơ chế chống bẻ khóa phức tạp |

### Vệ tinh bắt buộc cho đường dẫn

`src/main/services/safePath.ts` phải:
- Chặn `..` và dấu `/`, `\`.
- Chặn ký tự điều khiển (`\0`–`\x1F`) và các ký tự không hợp lệ trong tên tệp Windows (`< > : " / \ | ? *`).
- Chặn tên thiết bị đặc biệt: `CON`, `PRN`, `AUX`, `NUL`, `COM1`–`COM9`, `LPT1`–`LPT9` (kể cả khi kèm phần mở rộng).
- Giới hạn độ dài đường dẫn; khi vượt → gợi ý tên khác thay vì cắt bừa.
- Kiểm tra kết quả nằm trong thư mục đích (sau khi resolve) trước khi ghi.

## 4. Dữ liệu lưu cục bộ

| Dữ liệu | Nơi lưu | Nội dung | Có thể xóa |
| --- | --- | --- | --- |
| Cài đặt | Thư mục dữ liệu ứng dụng | Ngôn ngữ, chủ đề, thư mục mặc định, mẫu tên | Có, trong Cài đặt |
| Tệp gần đây | Thư mục dữ liệu ứng dụng | Đường dẫn và thời điểm dùng | Có, một nút; có công tắc tắt |
| Trạng thái giấy phép | Do Store quản lý | Tình trạng Pro | Không (do hệ thống) |
| Nhật ký lỗi | Thư mục dữ liệu ứng dụng | Mã lỗi, phiên bản, thông số kỹ thuật | Có, một nút |
| Tệp tạm | Thư mục tạm hệ thống | Tệp làm việc của tác vụ | Tự xóa khi xong; quét dọn khi khởi động |

**Không bao giờ** lưu: nội dung tài liệu, trích xuất văn bản, mật khẩu, tên tệp đầy đủ trong nhật ký.

## 5. Quy tắc nhật ký

1. Nhật ký chỉ ghi: mã lỗi ổn định, phiên bản ứng dụng, phiên bản thành phần, thông số kỹ thuật, thời gian.
2. Tên tệp **không** ghi nguyên văn — băm (hash) hoặc cắt bớt.
3. Đường dẫn đầy đủ không ghi — chỉ ghi tên thư mục cuối nếu thật sự cần.
4. Nội dung thông báo lỗi từ thư viện bên thứ ba: chỉ giữ mã, không giữ nguyên chuỗi có thể chứa dữ liệu.
5. Nút "Sao chép chi tiết lỗi" trong app dán vào clipboard **nội dung đã lọc** này.
6. Nhật ký nằm trong thư mục dữ liệu app, xóa được bằng một nút.

## 6. Thành phần và giấy phép

- Duy trì **SBOM** (danh sách thành phần + phiên bản + giấy phép) trong repo.
- Cấm tuyệt đối: **Ghostscript**, **MuPDF** (AGPL hoặc giấy phép thương mại song song) trong sản phẩm đóng kín khi chưa mua giấy phép thương mại.
- Mỗi lần thêm thư viện mới phải cập nhật SBOM **trước khi gộp PR**.
- Kiểm tra lỗ hổng định kỳ hằng tuần trong CI; cập nhật Electron, PDF.js, qpdf, sharp theo lịch tháng.

## 7. Cách nói về HIPAA và GDPR

**Không** ghi "tuân thủ HIPAA" hay "tuân thủ GDPR" trong mô tả Store hay trên giao diện. Đây là nghĩa vụ của tổ chức sử dụng phần mềm, không phải thuộc tính của một công cụ.

**Cách nói đúng:**

> "Tài liệu của bạn được xử lý hoàn toàn trên máy tính của bạn. Chúng tôi không nhận, không lưu và không truyền tải nội dung tài liệu."

Câu này giúp khách tự đánh giá việc dùng app trong quy trình của họ.

Nên nhờ một người có chuyên môn pháp lý đọc lại trang quyền riêng tư và phần mô tả trước khi phát hành, nhất là nếu bán cho khách doanh nghiệp.

## 8. Nội dung trang chính sách quyền riêng tư

Trang này cần có **địa chỉ web công khai** (một trang tĩnh miễn phí) và được ghi vào hồ sơ Store.

1. Ứng dụng xử lý những loại dữ liệu nào và xử lý ở đâu (trên máy người dùng).
2. Ứng dụng không thu thập hay truyền tải nội dung tài liệu.
3. Dữ liệu cục bộ nào được lưu và cách xóa.
4. Thông tin do Microsoft Store thu thập (thanh toán, lượt cài, báo cáo lỗi) thuộc chính sách của Microsoft.
5. Cách liên hệ để hỏi về quyền riêng tư.
6. Ngày hiệu lực và lịch sử thay đổi.

Kiểm tra yêu cầu hiện hành trong Partner Center khi nộp.

## 9. Kiểm tra bảo mật trước khi phát hành

- [ ] Renderer: `contextIsolation` bật, `nodeIntegration` tắt, `sandbox` bật.
- [ ] CSP chỉ cho phép tài nguyên cục bộ; không có `unsafe-eval` trong bản phát hành.
- [ ] Bài kiểm thử offline xanh trên CI.
- [ ] `safePath` có kiểm thử cho: `..`, ký tự điều khiển, `CON.txt`, đường dẫn quá dài, tên Unicode (tiếng Việt, tiếng Đức).
- [ ] Nhật ký không chứa tên tệp, đường dẫn đầy đủ hay nội dung tài liệu (kiểm thử bằng cách chạy tác vụ thật rồi grep).
- [ ] Mật khẩu không ghi ra đĩa, không vào biến môi trường, không vào tham số dòng lệnh lâu dài.
- [ ] JavaScript trong PDF bị tắt.
- [ ] SBOM cập nhật, không có thư viện AGPL.
- [ ] Trang quyền riêng tư công khai, liên kết hoạt động, không dùng từ "tuân thủ HIPAA/GDPR".
