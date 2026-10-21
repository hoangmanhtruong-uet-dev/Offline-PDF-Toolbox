# Kiểm thử và chất lượng

Cập nhật: 2026-10-21 · Nguồn: mục 15, 16, 19-C đặc tả gốc

Với công cụ xử lý tệp, **một lỗi làm hỏng tài liệu của khách đủ để mất khách và nhận đánh giá một sao**. Kế hoạch kiểm thử dồn công sức vào ba thứ:

1. Bộ tệp PDF đa dạng.
2. Kiểm tra tự động kết quả đầu ra.
3. Thử trên máy sạch.

---

## 1. Bộ tệp kiểm thử (fixtures)

Tự tạo hoặc lấy tệp có bản quyền cho phép (tài liệu công khai, tệp tự sinh bằng công cụ khác). **Tuyệt đối không dùng hợp đồng hay hồ sơ thật của người khác.**

| Nhóm | Mô tả | Số tệp tối thiểu | Đặt tên |
| --- | --- | --- | --- |
| Văn bản thuần | Vài trang đến 500 trang, phông chữ nhúng và không nhúng | 6 | `text-*.pdf` |
| Scan toàn ảnh | JPEG màu, thang xám, 1 bit; 300 dpi và 600 dpi | 6 | `scan-*.pdf` |
| Hỗn hợp | Văn bản kèm ảnh, bảng, biểu đồ vector | 4 | `mixed-*.pdf` |
| Có mật khẩu | Mật khẩu mở; mật khẩu quyền; AES-128 và AES-256 | 4 | `locked-*.pdf` |
| Có chữ ký số | Chữ ký hợp lệ | 2 | `signed-*.pdf` |
| Có biểu mẫu | Trường điền, chú thích, liên kết, dấu trang | 4 | `form-*.pdf` |
| Khổ trang lạ | A3, Letter, trang ngang xen trang dọc, trang đã xoay sẵn | 4 | `page-size-*.pdf` |
| Hỏng nhẹ và hỏng nặng | Thiếu bảng tham chiếu, cắt cụt tệp, không phải PDF đổi đuôi | 5 | `broken-*.pdf` |
| Lớn | 300 MB, 3.000 trang | 2 | `large-*.pdf` |
| Ký tự đặc biệt | Tên tệp tiếng Việt, tiếng Đức có dấu, đường dẫn dài | 3 | `unicode-*.pdf` |
| Ảnh nguồn | JPG, PNG, TIFF, BMP các kích thước | 6 | `img/*.{jpg,png,tif,bmp}` |

Tệp lớn và tệp hỏng nặng **không** đưa vào git thường — dùng script sinh lại từ tệp nhỏ (`tests/scripts/generate-fixtures.ts`) để CI luôn có sẵn.

## 2. Các lớp kiểm thử

| Lớp | Công cụ | Nội dung | Chạy khi nào |
| --- | --- | --- | --- |
| Đơn vị | Vitest | Phân tích dải trang, đặt tên đầu ra, `FeatureGate`, tính độ phân giải ảnh, phân loại lỗi, `safePath` | Mỗi commit |
| Kiểm tra kết quả tự động | `tests/scripts/verify-output.ts` (dùng qpdf và PDF.js) | Số trang, hướng trang, văn bản còn chọn được, tệp mở được, hình vẽ ra khác biệt dưới ngưỡng so với bản mong đợi | Mỗi commit, và bắt buộc khi đổi engine xử lý |
| Đầu cuối (E2E) | Playwright cho Electron | Luồng chính của từng công cụ; luồng chạm giới hạn Free; luồng hủy | Mỗi PR, trên máy Windows |
| Offline | Playwright với mạng bị chặn | Mọi tính năng trên tài liệu vẫn chạy; xác nhận không có yêu cầu mạng nào phát sinh | Mỗi PR |
| Hiệu năng | `tests/scripts/perf.ts` | So với bảng mục tiêu ở [`ARCHITECTURE.md`](ARCHITECTURE.md) mục 10 | Hằng tuần |
| Cài đặt | Máy ảo Windows 10 và 11 sạch | Cài từ gói, chạy, gỡ cài đặt, không để lại tệp thừa | Tuần 9 và trước mỗi bản phát hành |
| Chứng nhận | Windows App Certification Kit | Không còn cảnh báo chặn | Tuần 9, và trước mỗi lần nộp |

## 3. Ma trận tương thích

| Chiều | Giá trị cần thử |
| --- | --- |
| Hệ điều hành | Windows 10 22H2, Windows 11 (bản hiện hành) |
| Phần cứng | 4 GB RAM (thấp), 8 GB (trung bình), 16 GB (cao) |
| Màn hình | 100%, 150%, 200% tỷ lệ hiển thị; hai màn hình |
| Ngôn ngữ hệ điều hành | Anh (Mỹ), Đức, Pháp, Tây Ban Nha, Việt |
| Trình xem để kiểm tra kết quả | Edge, Chrome, Adobe Acrobat Reader, và một trình xem khác |
| Chế độ hiển thị | Sáng, tối, độ tương phản cao |

## 4. Ca kiểm thử chấp nhận

| Mã | Kịch bản | Kết quả mong đợi | Lớp kiểm thử | Tính năng |
| --- | --- | --- | --- | --- |
| T-01 | Gộp 3 tệp khác khổ giấy theo thứ tự đã sắp | Đúng thứ tự, khổ trang giữ nguyên | Tự động | F-01 |
| T-02 | Gộp khi một tệp bị hỏng nặng | Báo lỗi đúng tệp, các tệp còn lại vẫn gộp được nếu người dùng chọn bỏ qua | Tự động | F-01 |
| T-03 | Tách theo `1-3, 5, 8-10` | Ba tệp, đúng số trang | Tự động | F-02 |
| T-04 | Nén tệp scan 40 MB ở mức Vừa | Nhỏ hơn rõ rệt, văn bản (nếu có lớp chữ) còn chọn được | Tự động | F-03 |
| T-05 | Nén tệp đã được tối ưu | Báo "đã được tối ưu", không xuất tệp lớn hơn | Tự động | F-03 |
| T-06 | Xoay trang 3 và 5 thêm 90 độ | Chỉ hai trang đổi hướng | Tự động | F-04 |
| T-07 | Hủy giữa lúc nén tệp lớn | Dừng trong vài giây, không để lại tệp tạm | E2E | Tất cả |
| T-08 | Thao tác trên tệp có chữ ký số | Hiện cảnh báo, chỉ tiếp tục khi người dùng đồng ý | Tự động + E2E | Tất cả |
| T-09 | Ngắt Wi-Fi rồi chạy lần lượt mọi công cụ | Tất cả hoạt động bình thường | Offline | Tất cả |
| T-10 | Dùng Free rồi mua Pro rồi dùng tiếp | Giới hạn mở ngay, không cần khởi động lại | E2E | Giấy phép |
| T-11 | Cài lại app, bấm Khôi phục mua hàng | Pro được khôi phục | Thủ công + E2E | Giấy phép |
| T-12 | Tên tệp tiếng Việt và đường dẫn dài | Đọc và ghi đúng | Tự động | Tất cả |

### Bổ sung (đề xuất thêm, không bắt buộc)

| Mã | Kịch bản | Kết quả mong đợi |
| --- | --- | --- |
| T-13 | Gộp 2.000 trang từ 50 tệp | Dưới 30 giây, bộ nhớ đỉnh dưới 1 GB |
| T-14 | Xuất vào thư mục đã có tệp cùng tên | Tệp cũ không bị ghi đè; có hậu tố số |
| T-15 | Nén ở mức Mạnh rồi mở bằng Acrobat Reader | Mở được, ảnh hiển thị đúng |
| T-16 | Chọn trang bằng Shift+nhấp rồi kéo thả đổi thứ tự | Đúng thứ tự mong muốn |
| T-17 | Hoàn tác 60 lần trong màn hình sắp xếp trang | Vẫn hoạt động; lịch sử giữ tối thiểu 50 bước |

## 5. Cách kiểm tra kết quả đầu ra

Mỗi tệp đầu ra phải qua bốn kiểm tra trước khi được báo "thành công" cho người dùng:

| Kiểm tra | Công cụ | Điều kiện đạt |
| --- | --- | --- |
| Mở được | qpdf `--check` | Không lỗi |
| Đủ số trang | qpdf / PDF.js | Bằng số trang mong đợi |
| Văn bản còn chọn được | PDF.js | Lớp chữ vẫn trích xuất được (với tệp có lớp chữ) |
| Hình vẽ ra đúng | PDF.js render + so sánh | Khác biệt dưới ngưỡng so với bản mong đợi |

Quy tắc: **lỗi kiểm tra → không ghi tệp vào đích**, báo lỗi cho người dùng, và dọn tệp tạm.

## 6. Mức độ lỗi và quy tắc phát hành

| Mức | Ví dụ | Quy tắc |
| --- | --- | --- |
| Nghiêm trọng | Làm hỏng tệp, mất dữ liệu, lộ dữ liệu ra mạng, không cài được | Chặn phát hành; sửa ngay |
| Cao | Một công cụ chạy sai với loại tệp phổ biến, sập app | Sửa trước khi nộp |
| Trung bình | Giao diện lệch ở một tỷ lệ hiển thị, thông báo khó hiểu | Sửa nếu kịp, nếu không đưa vào bản cập nhật kế tiếp |
| Thấp | Lỗi chính tả, căn lề nhỏ | Đưa vào danh sách chờ |

**Điều kiện phát hành bản 1.0:** không còn lỗi nghiêm trọng và lỗi cao; WACK sạch; bài kiểm thử offline đạt; bộ ca chấp nhận đạt hết.

## 7. Quy trình cuối tuần

1. Dựng gói cài đặt.
2. Cài trên máy sạch (hoặc máy ảo sạch).
3. Chạy bộ kiểm thử chấp nhận T-01…T-17.
4. Ghi lại điểm yếu vào nhật ký (mẫu ở [`ROADMAP.md`](ROADMAP.md) mục 5).
5. Nếu có lỗi nghiêm trọng → sửa ngay trước khi bắt đầu tuần mới.

## 8. Bộ kiểm thử hồi quy bắt buộc

Một bộ ca tối thiểu phải chạy **mọi lần** trước khi gộp, để bảo vệ những thứ đã chạy được:

| Nhóm ca | Nội dung |
| --- | --- |
| Cốt lõi | T-01, T-03, T-06, T-07 |
| An toàn tệp | T-02, T-04, T-05, T-08, T-12, T-14 |
| Lời hứa sản phẩm | T-09 (offline), giới hạn Free không mất dữ liệu |
| Bền vững | Kiểm thử đơn vị `FeatureGate`, `pageRange`, `safePath` |

## 9. Đánh giá đối thủ (tuần 0)

Cài 5 ứng dụng cạnh tranh và ghi lại từng mục sau để định hình ưu tiên:

1. Thời gian khởi động và thời gian gộp cùng một bộ tệp mẫu.
2. Dung lượng sau nén cùng một tệp scan ở mức mặc định.
3. Số bước để hoàn thành việc gộp hai tệp.
4. Có quảng cáo, yêu cầu tài khoản hay yêu cầu mạng không.
5. Giá và giới hạn của bản miễn phí.
6. Điểm đánh giá và những lời phàn nàn lặp lại nhiều nhất trong đánh giá thấp.

Kết quả ghi vào [`MARKETING.md`](MARKETING.md) mục 2.
