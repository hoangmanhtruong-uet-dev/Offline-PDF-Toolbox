# Lộ trình phát triển

Cập nhật: 2026-10-21 · Nguồn: mục 16 đặc tả gốc

Lộ trình giả định **15–20 giờ làm việc mỗi tuần**. Nếu bạn có ít thời gian hơn, hãy kéo dài lộ trình tương ứng — **không cắt kiểm thử và không cắt chống làm hỏng tệp**.

> **Quy tắc cổng kiểm tra (gate):** mỗi tuần kết thúc bằng một cổng. Chưa qua cổng thì **không** sang tuần sau. Nếu trễ, dùng thứ tự cắt giảm ở mục 4, không dùng "làm thêm giờ".

---

## 1. Bảng 10 tuần

| Tuần | Mục tiêu | Công việc chính | Sản phẩm bàn giao | Cổng kiểm tra |
| --- | --- | --- | --- | --- |
| 1 | Giảm rủi ro nền tảng | Đánh giá 5 đối thủ; đăng ký tài khoản nhà phát triển + xác minh; giữ chỗ tên; **spike** đóng gói MSIX bằng Electron cài được trên máy sạch; **spike** StoreBridge gọi được kiểm tra giấy phép | Báo cáo đối thủ, gói MSIX thử, StoreBridge chạy được | Cài từ gói thành công; gọi được API Store. Nếu không → đánh giá chuyển sang WinUI 3 |
| 2 | Khung ứng dụng | Cấu trúc thư mục, giao diện nền, hàng đợi tác vụ, nhóm luồng nền, i18n, hộp thoại chọn tệp, hình thu nhổ bằng PDF.js | Ứng dụng mở được tệp và hiện hình thu nhổ | Hình thu nhổ hiện đúng với bộ tệp thử |
| 3 | Gộp và xoay | F-01 + F-04 hoàn chỉnh; tích hợp qpdf; ghi tệp an toàn và kiểm tra đầu ra | Gộp và xoay chạy tốt | Qua T-01, T-02, T-06 |
| 4 | Tách và bản 0.5 | F-02; lưới trang chung; bộ kiểm tra kết quả tự động; giao cho 3–5 người thử | Bản 0.5 nội bộ | Không còn lỗi nghiêm trọng ở gộp, tách, xoay trên bộ tệp thử |
| 5 | Nén, phần 1 | F-03: quét ảnh, tính độ phân giải, nén lại ảnh JPEG và Flate phổ biến; tối ưu cấu trúc bằng qpdf | Nén chạy được với tệp scan thường gặp | Đạt mục tiêu giảm dung lượng ở mức Vừa trên tệp scan thử |
| 6 | Nén, phần 2 | Mức Nhẹ/Mạnh, dung lượng đích, ước lượng trước khi chạy, các trường hợp bỏ qua, chống tệp lớn hơn gốc, cảnh báo chữ ký số | Nén hoàn chỉnh | Qua T-04, T-05, T-08; không làm hỏng tệp nào trong bộ thử |
| 7 | Tính năng bổ trợ | F-05 (sắp xếp, xóa, trích, hoàn tác), F-06, F-07, F-08 | Bộ tính năng hoàn chỉnh | Qua kiểm thử tính năng bổ trợ |
| 8 | Thu phí và địa phương hóa | `FeatureGate`, `LicenseService`, luồng mua, khôi phục, mua thử trong môi trường thử; dịch de/fr/es | Bản có Free và Pro | Qua T-10, T-11; mua thử thành công |
| 9 | Ổn định và hồ sơ Store | Kiểm thử hiệu năng, máy sạch, ma trận tương thích, WACK; mô tả, ảnh, video, trang quyền riêng tư; beta 10–20 người | Gói ứng viên phát hành + bộ hồ sơ Store | Không còn lỗi nghiêm trọng và cao; WACK sạch |
| 10 | Nộp và phát hành | Nộp chứng nhận; sửa nếu bị từ chối; phát hành; theo dõi 48 giờ đầu | Bản 1.0 trên Store | Được chứng nhận và hiển thị trên Store |

## 2. Việc cần làm trước khi bắt đầu tuần 1

Đây là những việc mà trễ một ngày thì trễ cả tuần, vì chúng phụ thuộc vào bên thứ ba.

- [ ] Mở tài khoản nhà phát triển Microsoft (cá nhân miễn phí) — hoàn tất xác minh danh tính.
- [ ] Hoàn tất hồ sơ nhận tiền và biểu mẫu thuế trong Partner Center.
- [ ] Giữ chỗ tên ứng dụng, ghi lại chính xác `Identity Name` và `Publisher`.
- [ ] Kiểm tra trùng tên và rủi ro nhãn hiệu (ADR-009).
- [ ] Tạo tài khoản GitHub và bật CI chạy trên `windows-latest`.
- [ ] Chuẩn bị bộ tệp thử tối thiểu (mục 2.3) để tuần 2 có cái gì đo.

## 3. Việc song song cần duy trì xuyên suốt

Không để các việc này dồn vào cuối, vì chúng là phần hay bị trễ nhất.

| Việc | Tần suất | Mốc cần đạt |
| --- | --- | --- |
| Bộ tệp kiểm thử (`tests/fixtures`) | Bổ sung mỗi tuần | Đủ 10 nhóm trước tuần 9 |
| Bài kiểm thử offline (chặn mạng) | Mỗi lần đổi luồng xử lý | Luôn xanh trên CI |
| Ảnh chụp màn hình cho Store | Từ tuần 2 | ≥ 4 ảnh thật trước tuần 9 |
| Ghi chú thay đổi bản phát hành | Mỗi bản | Bằng tiếng Anh, nêu rõ điểm |
| Ghi nhật ký hằng tuần (điểm yếu, đo được gì) | Cuối tuần | Xem mục 5 |
| Cập nhật `docs/DECISIONS.md` | Khi có thay đổi hướng | Ngay khi quyết định |

## 4. Tiến độ thực tế

| Tuần | Trạng thái | Ghi chú |
| --- | --- | --- |
| 1 | Chưa bắt đầu | Việc phụ thuộc bên thứ ba (tài khoản nhà phát triển, giữ chỗ tên) chưa làm |
| 2 | **Xong** | Khung ứng dụng, bốn ràng buộc bảo mật, hàng đợi tác vụ, i18n EN + VI |
| 3 | **Xong** | Tích hợp qpdf 12.4.2, gộp (F-01), xoay (F-04), ghi an toàn, phát hiện chữ ký số |
| 4 | **Xong** | Tách (F-02) đủ 6 chế độ, lưới trang dùng chung, bộ kiểm tra kết quả, bản 0.5.0 nội bộ |
| 5 | **Xong** | Nén ảnh nhúng bằng pdf-lib + sharp, độ phân giải hiệu dụng tính từ ma trận cm, ước lượng trước khi chạy |
| 6 | **Xong** | Dung lượng đích, bảng kết quả trước/sau, cảnh báo chữ ký số, bỏ siêu dữ liệu ở mức Mạnh |

Kiểm thử ở thời điểm hiện tại: **137 ca đơn vị + 35 ca đầu-cuối**, tất cả đều đạt.

Báo cáo chất lượng nén trên bộ tệp thử: `npm run report:compression`.

## 5. Thứ tự cắt giảm khi trễ tiến độ

Cắt theo thứ tự sau. **Không bao giờ** cắt kiểm thử, kiểm tra đầu ra tệp, hoặc các bảo đảm "không ghi đè / không làm hỏng tệp".

1. Ngôn ngữ Đức, Pháp, Tây Ban Nha → bản 1.0 chỉ có tiếng Anh (UI) và tiếng Anh (Store).
2. F-08 Siêu dữ liệu.
3. Phát hiện trang trống trong F-05.
4. F-06 Ảnh sang PDF.
5. F-07 Mật khẩu — **lựa chọn cuối cùng**, vì đây là tính năng Pro có giá trị cao nhất.

Cắt được nghĩa là: hạ mục sang backlog của bản 1.1/1.2, ghi rõ lý do cắt, và thông báo cho người thử beta biết tính năng đó chưa có.

## 6. Nhật ký cuối tuần

Mỗi cuối tuần, dựng gói → cài trên máy sạch → chạy bộ kiểm thử chấp nhận → ghi lại. Mẫu:

```text
## Tuần N — <ngày>
- Bản dựng: <phiên bản>
- Kết quả kiểm thử: <đạt/trượt> (<số ca>)
- Đo được: khởi động <x>s | gộp 100 trang <y>s | nén scan 40MB <z>s
- Lỗi nghiêm trọng còn lại: <danh sách>
- Tính năng bị cắt: <danh sách>
- Việc tuần sau: <3 việc quan trọng nhất>
```

## 7. Ngoài lộ trình này

| Sự kiện | Mốc |
| --- | --- |
| Phát hành bản 1.0 | Tuần 10 |
| Bản 1.1 — giữ thứ hạng, thêm hàng loạt/preset, thêm ngôn ngữ | Tuần 12–14 |
| Bản 1.2 — xóa siêu dữ liệu, redaction cơ bản, dấu trang khi gộp | Tuần 16–20 |
| Bản 2.0 — OCR offline, chữ ký hình ảnh, ARM64 | Sau 6 tháng, nếu doanh thu hỗ trợ |
| Đánh giá 90 ngày và quyết định hướng | T+8 tuần sau phát hành |

Điều kiện dừng đã đặt sẵn: **nếu sau 90 ngày dưới 500 lượt cài tự nhiên và chưa có đơn trả tiền nào, đổi hướng định vị** (chẳng hạn nhắm riêng một nghề) thay vì thêm tính năng. Xem [`MARKETING.md`](MARKETING.md).
