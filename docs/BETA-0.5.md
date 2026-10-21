# Bản 0.5 nội bộ — kế hoạch thử nghiệm

Cập nhật: 2026-10-21 · Mục tiêu: tuần 4 theo [`ROADMAP.md`](ROADMAP.md)

Đây là bản **nội bộ**, dùng để thu thập phản hồi trước khi phát hành rộng rãi. Chưa có luồng mua hàng, chưa có Store listing, chưa có mã hóa mật khẩu đầu ra.

---

## 1. Đã có gì trong bản 0.5

| Tính năng | Mã | Trạng thái |
| --- | --- | --- |
| Gộp PDF | F-01 | Xong — nhiều tệp, dải trang từng tệp, kéo thả sắp xếp, thư mục + tên tệp đầu ra |
| Tách PDF | F-02 | Xong — 6 chế độ: khoảng trang, mỗi N trang, mỗi trang một tệp, dấu trang, dung lượng tối đa, trích trang |
| Xoay PDF | F-04 | Xong — tất cả/lẻ/chẵn/khoảng, góc 90/180/270 |
| Sắp xếp, xóa, trích trang | F-05 | Chưa |
| Nén PDF | F-03 | Chưa |
| Ảnh sang PDF | F-06 | Chưa |
| Mật khẩu đầu ra (đặt mật khẩu) | F-07 | Chưa — mới chỉ đọc được tệp có mật khẩu |
| Giấy phép Pro | — | Chưa — mọi người dùng đều ở mức Free |

## 2. Cần thử gì

Mỗi người thử làm đủ **bốn việc** dưới đây trên tài liệu thật của họ (không dùng tài liệu của người khác về mặt pháp lý).

### A. Gộp (F-01)

1. Chọn 2–3 tệp PDF có khổ giấy khác nhau → gộp → mở tệp kết quả.
2. Kiểm tra: thứ tự trang đúng như đã sắp xếp? Khổ giấy từng trang giữ nguyên? Văn bản vẫn bôi đen/copy được?
3. Thử một tệp lỗi hoặc tệp không phải PDF → xem thông báo có rõ tên tệp không.
4. Thử gộp 3 tệp (vượt giới hạn Free) → xem dải nhắc nâng cấp có xuất hiện đúng lúc không.

### B. Tách (F-02)

1. Tách theo khoảng trang: `1-3, 5, 8-10` → đủ số tệp không? Tổng số trang có đúng không?
2. Tách mỗi N trang, mỗi trang một tệp.
3. Chế độ trích trang: chọn vài trang trong lưới → một tệp.
4. Chế độ theo dung lượng tối đa: đặt 10 MB → mỗi tệp có nhỏ hơn không?

### C. Xoay (F-04)

1. Xoay 90 độ vài trang → mở bằng Edge, Chrome, Acrobat Reader → hướng đúng không?
2. Xoay hai lần 90 độ → có giống xoay 180 độ không?

### D. Trải nghiệm chung

1. Mở app có mất lâu không? (mục tiêu: dưới 3 giây)
2. Có thấy dòng "Xử lý trên máy bạn" ở góc trên bên phải không?
3. Thử kéo thả tệp vào cửa sổ → có hoạt động không?
4. Có lỗi nào hiện ra không? Ghi lại **nguyên văn** thông báo lỗi.

## 3. Cách phản hồi

Gửi cho tác giả, kèm:

| Thông tin | Cách lấy |
| --- | --- |
| Phiên bản | Màn hình Cài đặt → Phiên bản |
| Hệ điều hành | Được hỏi kèm |
| Cách tái hiện | Các bước + tệp (nếu được phép chia sẻ) |
| Nguyên văn thông báo lỗi | Nút "Sao chép chi tiết" trong hộp thoại lỗi |

**Không** gửi tài liệu chứa thông tin nhạy cảm (hồ sơ bệnh án, hợp đồng thật) — dùng tài liệu tự tạo.

## 4. Vấn đề cần tìm trước

Ưu tiên theo mức độ nghiêm trọng (xem [`TESTING.md`](TESTING.md) mục 6):

| Mức | Ví dụ |
| --- | --- |
| Nghiêm trọng | Làm hỏng tệp, mất dữ liệu, lộ dữ liệu ra mạng, không cài được |
| Cao | Một công cụ chạy sai với loại tệp phổ biến, sập app |
| Trung bình | Giao diện lệch ở một tỷ lệ hiển thị, thông báo khó hiểu |
| Thấp | Lỗi chính tả, căn lề nhỏ |

## 5. Cổng kiểm tra của tuần 4

Bản 0.5 chỉ được phát hành cho người thử khi:

- [x] Tất cả kiểm thử đơn vị và đầu-cuối đều đạt.
- [x] Gộp, tách, xoay chạy đúng trên bộ tệp thử, không làm hỏng tệp nào.
- [x] Bộ kiểm tra kết quả tự động chạy được bằng tay: `node tests/scripts/verify-output.ts <tep.pdf>`.
- [ ] Nhận phản hồi từ 3–5 người thử.

## 6. Việc cần làm tiếp sau khi thu phản hồi

| Việc | Nguồn |
| --- | --- |
| Chuyển F-05 (sắp xếp, xóa, trích trang) lên lưới trang dùng chung | Tuần 4–5 |
| Tách theo dung lượng: kiểm tra lại giới hạn khi một trang đã vượt | Phản hồi |
| Hộp thoại nhập mật khẩu trong giao diện | Phản hồi |
| Nén PDF (F-03) | Tuần 5–6 |
