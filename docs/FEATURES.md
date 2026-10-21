# Đặc tả tính năng

Cập nhật: 2026-10-21 · Nguồn: mục 6, 7, 5 đặc tả gốc

Mỗi tính năng có mã `F-xx` để dùng trong backlog và kiểm thử. Nguyên tắc chung cho **mọi** tính năng, không có ngoại lệ:

1. Không ghi đè tệp gốc — luôn ghi ra tệp mới.
2. Xử lý trong luồng nền, không đơ giao diện.
3. Hiện tiến độ theo phần trăm.
4. Cho phép hủy giữa chừng.
5. Dọn tệp tạm khi kết thúc hoặc hủy.
6. Cảnh báo trước nếu thao tác làm mất hiệu lực chữ ký số (áp dụng cho mọi thao tác ghi tệp mới: gộp, tách, xoay, nén).
7. Kiểm tra tệp đầu ra trước khi báo thành công.

---

## F-01 Gộp PDF

| Mục | Đặc tả |
| --- | --- |
| Đầu vào | Kéo thả hoặc chọn nhiều tệp PDF, hoặc cả một thư mục; chấp nhận thêm tệp vào danh sách bất cứ lúc nào |
| Danh sách tệp | Mỗi dòng có tên, số trang, dung lượng, hình thu nhổ trang đầu; kéo để đổi thứ tự; nút xóa khỏi danh sách; sắp xếp nhanh theo tên, ngày sửa, dung lượng |
| Chọn trang từng tệp | Ô nhập dải trang như `1-3, 7, 10-`; mặc định là tất cả; báo lỗi ngay nếu dải trang vượt số trang |
| Tệp có mật khẩu | Hiện biểu tượng khóa, hỏi mật khẩu khi thêm tệp; mật khẩu chỉ giữ trong bộ nhớ, không lưu |
| Tệp lỗi | Báo tên tệp và lý do dễ hiểu (hỏng, không phải PDF, bị mã hóa chưa mở được); cho phép bỏ qua tệp đó và tiếp tục |
| Đầu ra | Một tệp mới; tên mặc định `Merged_YYYY-MM-DD.pdf`; chọn thư mục lưu; hộp kiểm "Mở thư mục sau khi xong" |
| Siêu dữ liệu | Tiêu đề lấy từ tên tệp đầu ra; tác giả để trống; không sao chép siêu dữ liệu từ tệp nguồn |
| Dấu trang | Bản 1.0 giữ trang nguyên vẹn; dấu trang theo tên tệp thêm ở bản 1.2 |
| Hiệu năng | Gộp 50 tệp, tổng 2.000 trang, dưới 30 giây trên máy 8 GB RAM; bộ nhớ đỉnh dưới 1 GB |

**Tiêu chí chấp nhận**

1. Thứ tự trang trong tệp đầu ra đúng thứ tự trong danh sách.
2. Kích thước và hướng từng trang được giữ nguyên, kể cả khi các tệp khác khổ giấy.
3. Văn bản vẫn chọn và tìm kiếm được; phông chữ hiển thị đúng.
4. Giới hạn Free (2 tệp) chặn đúng lúc, có thông báo hướng dẫn nâng cấp và **không mất danh sách đã chọn**.

**Ghi chú triển khai**
- Dùng `qpdf --empty --pages <tệp> <dải> -- <tệp đích>`; truyền mảng tham số, không nối chuỗi.
- Dải trang rỗng = toàn bộ tệp. Dải `10-` = từ trang 10 đến hết.
- Tệp có mật khẩu: dùng `--password=` của qpdf, không giữ mật khẩu sau tác vụ.

## F-02 Tách PDF

| Chế độ | Mô tả | Ví dụ |
| --- | --- | --- |
| Theo khoảng trang | Người dùng nhập các khoảng; mỗi khoảng thành một tệp | `1-3, 5, 8-10` ra 3 tệp |
| Mỗi N trang | Cắt đều theo số trang | Mỗi 10 trang một tệp |
| Mỗi trang một tệp | Tách rời hoàn toàn | 40 trang ra 40 tệp |
| Theo dấu trang cấp 1 | Dùng mục lục của tệp nếu có | Mỗi chương một tệp |
| Theo dung lượng tối đa | Mỗi phần không vượt quá giới hạn MB | Mỗi phần tối đa 10 MB để gửi email |
| Trích trang | Chỉ lấy các trang đã chọn thành một tệp duy nhất | Trang 4, 9, 12 thành một tệp |

**Quy tắc**
- Đặt tên đầu ra theo mẫu `{tên gốc}_{số thứ tự}` hoặc `{tên gốc}_p{từ}-{đến}`; cho phép sửa mẫu.
- Xuất vào một thư mục con mới để không lẫn với tệp khác.
- Xem trước bằng lưới hình thu nhỏ có thể nhấp để chọn trang.
- Chế độ "theo dung lượng" dùng ước lượng theo từng trang và kiểm tra lại sau khi ghi; nếu một phần vượt giới hạn thì lùi một trang rồi ghi lại.

**Tiêu chí chấp nhận**
- Tổng số trang của các tệp đầu ra bằng số trang đã chọn; không trang nào bị lặp hoặc mất.
- Tệp đầu ra mở được bằng Edge, Chrome và Acrobat Reader.

**Ghi chú triển khai**
- `shared/pageRange.ts` là nguồn duy nhất cho việc phân tích dải trang — dùng chung với F-01 và ô dải trang.
- Chế độ "theo dấu trang cấp 1" đọc outline cấp 1 qua PDF.js; tệp không có outline thì báo rõ và gợi ý dùng chế độ khác.

## F-03 Nén PDF

| Mức | Mục đích | Ảnh | Cấu trúc tệp | Kết quả kỳ vọng |
| --- | --- | --- | --- | --- |
| Nhẹ | Giữ gần như nguyên chất lượng | Giữ độ phân giải, chỉ nén lại không mất chất lượng khi có thể | Tối ưu cấu trúc, gộp đối tượng, bỏ dữ liệu thừa | Giảm ít nhưng an toàn |
| Vừa (mặc định) | Gửi email, lưu trữ | Giảm xuống khoảng 150 dpi, chất lượng JPEG khoảng 70 | Như trên | Giảm rõ rệt, vẫn đọc tốt |
| Mạnh | Dung lượng nhỏ nhất | Giảm xuống khoảng 100 dpi, chất lượng JPEG khoảng 50, ảnh màu thành thang xám nếu chọn | Như trên, bỏ siêu dữ liệu không cần | Giảm nhiều, chất lượng ảnh giảm thấy được |
| Dung lượng đích | Người dùng nhập "dưới X MB" | Thử lần lượt các mức từ nhẹ đến mạnh cho tới khi đạt | Như trên | Đạt hoặc báo rõ không thể đạt |

**Các quy tắc quan trọng**

- Hiển thị **ước lượng** dung lượng trước khi chạy (dựa trên mẫu vài trang đầu) và **dung lượng thật** sau khi chạy (trước, sau, phần trăm giảm).
- Nếu tệp kết quả không nhỏ hơn tệp gốc → **không xuất tệp mới**, báo "Tệp này đã được tối ưu, không giảm thêm được".
- Không chuyển văn bản và hình vector thành ảnh; chỉ xử lý các ảnh nhúng, để văn bản vẫn chọn và tìm kiếm được.
- Tệp có chữ ký số: cảnh báo trước rằng thao tác sẽ làm chữ ký mất hiệu lực, cho phép tiếp tục hoặc hủy.
- Giới hạn Free: 1 tệp, mức Nhẹ hoặc Vừa, đầu vào tối đa 20 MB.

**Mục tiêu chất lượng để đo trong kiểm thử** (mục tiêu, cần xác nhận bằng bộ tệp thật)
- Tệp scan toàn ảnh: giảm trung bình từ **50% trở lên** ở mức Vừa.
- Tệp văn bản thường: giảm ít hơn nhiều, có thể chỉ vài phần trăm.

**Ghi chú triển khai**
- Quy trình 8 bước ở [`ARCHITECTURE.md`](ARCHITECTURE.md) mục 7 là nguồn chân lý.
- Mức nén → tham số: `{ dpi, jpegQuality, grayscale }`:
  - Nhẹ: giữ độ phân giải, `jpegQuality` cao.
  - Vừa: 150 dpi, JPEG 70.
  - Mạnh: 100 dpi, JPEG 50, tuỳ chọn thang xám.
- Dung lượng đích: thử lần lượt Nhẹ → Vừa → Mạnh; nếu vẫn không đạt thì báo rõ không thể đạt, không tạo tệp sai.

## F-04 Xoay PDF

| Mục | Đặc tả |
| --- | --- |
| Chế độ chọn trang | Tất cả trang; trang lẻ; trang chẵn; khoảng trang; chọn trực tiếp trên lưới hình thu nhổ |
| Góc xoay | 90 độ theo chiều kim đồng hồ, 90 độ ngược chiều, 180 độ |
| Xoay nhanh từng trang | Nút xoay nằm ngay trên mỗi hình thu nhổ; hình thu nhổ xoay ngay để xem trước |
| Cách thực hiện | Cộng thêm vào thuộc tính xoay của trang (`/Rotate`) theo modulo 360; không thay đổi nội dung bên trong trang |
| Gợi ý hướng | Bản 1.0: đánh dấu các trang có chiều ngang trong tệp chủ yếu chiều dọc để người dùng xem nhanh; **không tự xoay** |
| Đầu ra | Tệp mới `{tên gốc}_rotated.pdf` |

**Tiêu chí chấp nhận**
- Trang đã xoay hiển thị đúng hướng trên Edge, Chrome và Acrobat Reader.
- Trang không chọn giữ nguyên.
- Xoay hai lần liên tiếp 90 độ cho kết quả giống xoay 180 độ.

**Ghi chú triển khai**
- Vì chỉ đổi `/Rotate` nên không cần nạp nội dung trang → rất nhanh, không ảnh hưởng chất lượng.

## F-05 Sắp xếp, xóa, trích trang

| Mục | Đặc tả |
| --- | --- |
| Giao diện | Lưới hình thu nhổ của mọi trang; chọn một hoặc nhiều trang bằng nhấp, Ctrl+nhấp, Shift+nhấp và kéo vùng chọn |
| Sắp xếp | Kéo thả trang để đổi thứ tự; nút di chuyển lên, xuống cho bàn phím |
| Xóa | Phím Delete hoặc nút Xóa; thao tác Hoàn tác và Làm lại (Ctrl+Z, Ctrl+Y) với tối thiểu 50 bước |
| Chèn | Chèn trang từ tệp PDF khác tại vị trí chọn (bản 1.1) |
| Trích | "Lưu các trang đã chọn thành tệp mới" |
| Phát hiện trang trống | Gợi ý các trang gần như trắng toàn bộ để xóa nhanh (ngưỡng độ trắng chỉnh được) |
| Xuất | Chỉ xuất khi người dùng bấm Lưu; mọi thay đổi trước đó chỉ là trạng thái trong bộ nhớ |

**Tiêu chí chấp nhận**
- Hoàn tác khôi phục đúng thứ tự và nội dung.
- Trang trống được phát hiện đúng trên bộ tệp thử: tỷ lệ bỏ sót dưới 2%, không đề xuất nhầm trang có chữ nhỏ.

**Ghi chú triển khai**
- Lịch sử hoàn tác: mảng snapshot trạng thái, tối đa 50 bước, snapshot chỉ chứa mảng id + thứ tự (không chứa dữ liệu trang).
- Phát hiện trang trắng: dựa trên ảnh thu nhổ xám, không render toàn độ phân giải.

## F-06 Ảnh sang PDF

- Chấp nhận JPG, PNG, TIFF một trang và BMP. HEIC để bản sau, nếu bộ giải mã hỗ trợ trên máy.
- Sắp xếp thứ tự ảnh bằng kéo thả; xoay từng ảnh trước khi ghi.
- Cỡ giấy: Vừa theo ảnh, A4, Letter — **mặc định theo vùng của Windows**: Letter cho Mỹ, A4 cho châu Âu. Căn lề 0, 10 hoặc 20 mm.
- Chất lượng ảnh: Gốc (không nén lại) hoặc Giảm dung lượng (JPEG chất lượng 75).
- Mỗi ảnh một trang; giữ nguyên tỷ lệ, không kéo giãn.
- Giới hạn Free: tối đa 3 ảnh mỗi lần.

## F-07 Đặt và gỡ mật khẩu

| Mục | Đặc tả |
| --- | --- |
| Đặt mật khẩu | Mật khẩu mở tệp (user password) bắt buộc; mật khẩu quyền (owner password) tùy chọn; mã hóa AES-256 |
| Quyền hạn | Tùy chọn cấm in, cấm sao chép văn bản, cấm chỉnh sửa — lưu ý quyền hạn chỉ có tác dụng với phần mềm tôn trọng chúng |
| Gỡ mật khẩu | Chỉ khi người dùng nhập đúng mật khẩu mở tệp; app **không** bẻ khóa hay dò mật khẩu |
| Kiểm tra độ mạnh | Gợi ý độ dài tối thiểu 10 ký tự; cảnh báo mật khẩu yếu nhưng không ép buộc |
| Lưu ý hiển thị | Nhắc người dùng rằng mất mật khẩu thì không khôi phục được tệp; app không lưu mật khẩu |

Tính năng Pro, vì giá trị cao với nhóm pháp lý và y tế.

## F-08 Siêu dữ liệu và làm sạch tệp

- Xem và sửa Tiêu đề, Tác giả, Chủ đề, Từ khóa, Ứng dụng tạo tệp.
- Nút "Xóa toàn bộ siêu dữ liệu" trước khi gửi ra ngoài — phù hợp với nhóm quan tâm quyền riêng tư.
- Hiển thị cảnh báo nếu tệp có tệp đính kèm, chú thích, hoặc JavaScript nhúng; cho phép gỡ bỏ các thành phần này khi người dùng chọn.
- Không tự động xóa bất cứ thứ gì nếu người dùng chưa xác nhận.

> Ưu tiên cắt giảm: **#2** trong danh sách cắt của [`ROADMAP.md`](ROADMAP.md). Không dùng F-08 ở bản 1.0 nếu phải cắt.

## F-09 Xử lý hàng loạt (Pro, bản 1.1)

| Mục | Đặc tả |
| --- | --- |
| Đầu vào | Một thư mục hoặc nhiều tệp |
| Thao tác hỗ trợ | Nén, xoay, đặt mật khẩu, xóa siêu dữ liệu — cùng một cài đặt cho mọi tệp |
| Kết quả | Tạo thư mục kết quả cạnh thư mục gốc; tệp lỗi ghi vào báo cáo cuối, không dừng cả mẻ |
| Báo cáo | Bảng: tên tệp, trạng thái, dung lượng trước và sau, lỗi nếu có; có nút xuất CSV |
| Song song | Xử lý nhiều tệp cùng lúc theo số nhân CPU (tối đa 4 luồng mặc định) |

## F-10 Cài đặt chung và tiện ích

- Chọn ngôn ngữ giao diện: bản 1.0 có tiếng Anh, tiếng Đức, tiếng Pháp, tiếng Tây Ban Nha; tiếng Việt thêm cho cộng đồng trong nước.
- Chủ đề sáng, tối hoặc theo hệ thống.
- Thư mục lưu mặc định: cạnh tệp gốc hoặc một thư mục cố định.
- Mẫu tên tệp đầu ra có thể chỉnh.
- Mở bằng chuột phải trên tệp PDF trong File Explorer ("Gộp với...", "Nén...") — ưu tiên cao cho bản 1.1, vì tăng thói quen dùng hằng ngày.
- Trang Giới thiệu và Quyền riêng tư nằm trong app, nêu rõ app không gửi dữ liệu tài liệu ra ngoài.

---

## Bảng giới hạn Free / Pro

Nguồn duy nhất trong mã: `apps/desktop/src/shared/features.ts`.

| Tính năng | Free (dùng thử) | Pro |
| --- | --- | --- |
| Gộp PDF | Tối đa 2 tệp mỗi lần | Không giới hạn |
| Tách PDF | Xuất tối đa 5 trang mỗi lần | Không giới hạn |
| Nén PDF | 1 tệp mỗi lần, mức Nhẹ và Vừa, đầu vào tối đa 20 MB | Cả ba mức, tệp lớn tới giới hạn bộ nhớ |
| Xoay PDF | Xoay trang trong 1 tệp, tối đa 10 trang mỗi lần | Không giới hạn |
| Sắp xếp, xóa, trích trang | Xem trước và sắp xếp được; xuất tối đa 5 trang | Không giới hạn |
| Đặt mật khẩu | Không có | Có (AES-256) |
| Ảnh sang PDF | Tối đa 3 ảnh mỗi lần | Không giới hạn |
| Xử lý hàng loạt cả thư mục | Không có | Có |
| Preset thao tác dùng lại | Không có | Có |
| Hỗ trợ | Qua email, ưu tiên thấp | Qua email, ưu tiên cao |

**Nguyên tắc giới hạn:** giới hạn nằm ở **số lượng**, không nằm ở **chất lượng kết quả**. Không đóng dấu chìm lên tệp xuất ra — dấu chìm dễ gây đánh giá một sao.
