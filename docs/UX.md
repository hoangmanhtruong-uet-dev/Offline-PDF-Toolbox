# Luồng người dùng và giao diện

Cập nhật: 2026-10-21 · Nguồn: mục 8 đặc tả gốc

Nguyên tắc thiết kế: **"một màn hình, một việc"**. Người dùng chọn công cụ ở màn hình chính → vào màn hình công cụ → hoàn thành việc → quay lại. Phong cách Fluent của Windows 11 để trông quen thuộc và đáng tin.

---

## 1. Danh sách màn hình

| Mã | Màn hình | Mục đích | Thành phần chính |
| --- | --- | --- | --- |
| S-01 | Màn hình chính | Chọn công cụ nhanh | Lưới 3x2 sáu thẻ công cụ (Gộp, Tách, Nén, Xoay, Sắp xếp trang, Ảnh sang PDF), mỗi thẻ có icon lớn, tên, mô tả một dòng và phím tắt; vùng kéo thả; danh sách tệp gần đây có hình thu nhổ, số trang, dung lượng, thời gian tương đối và ba thao tác (Mở, Hiện trong thư mục, Xóa) |
| S-02 | Công cụ Gộp | F-01 | Danh sách tệp kéo thả, ô dải trang, nút Gộp, thanh tiến độ |
| S-03 | Công cụ Tách | F-02 | Chọn chế độ, lưới hình thu nhổ, mẫu tên, nút Tách |
| S-04 | Công cụ Nén | F-03 | Chọn mức nén, ước lượng dung lượng, nút Nén, bảng kết quả trước và sau |
| S-05 | Công cụ Xoay | F-04 | Lưới hình thu nhổ, nút xoay, chọn nhóm trang |
| S-06 | Sắp xếp trang | F-05 | Lưới hình thu nhổ lớn, thanh công cụ xóa, trích, hoàn tác |
| S-07 | Ảnh sang PDF | F-06 | Danh sách ảnh, chọn cỡ giấy và lề |
| S-08 | Hàng loạt | F-09 | Chọn thư mục, chọn thao tác, bảng báo cáo |
| S-09 | Nâng cấp Pro | Bán hàng | So sánh Free và Pro, nút Mua, nút Khôi phục giao dịch |
| S-10 | Cài đặt và Giới thiệu | F-10 | Ngôn ngữ, chủ đề, thư mục lưu, quyền riêng tư, hỗ trợ, phiên bản, giấy phép |

## 1.1. Luồng của màn hình chính

**Chọn công cụ trước, thả tệp sau.** Mỗi công cụ có vùng thả riêng ở màn hình của nó và chỉ nhận đúng định dạng: PDF cho Gộp / Tách / Nén / Xoay / Sắp xếp trang, ảnh (JPG, PNG, TIFF, BMP) cho Ảnh sang PDF.

Nếu người dùng thả tệp ngay trên màn hình chính, ứng dụng hiện một **bảng chọn công cụ ngay tại chỗ** (không phải hộp thoại bật lên) với các công cụ phù hợp: nhiều tệp thì gợi ý Gộp, một tệp thì gợi ý Tách / Nén / Xoay / Sắp xếp trang. Xem ADR-016.

## 2. Bố cục chuẩn của màn hình công cụ

Mọi màn hình công cụ dùng chung một bố cục, để học một lần là dùng được cho tất cả:

1. **Thanh trên** — nút quay lại, tên công cụ, biểu tượng khóa và chữ **"Xử lý trên máy bạn"**.
2. **Vùng giữa** — vùng thả tệp khi trống; sau khi có tệp thì chuyển thành danh sách hoặc lưới hình thu nhổ.
3. **Bảng bên phải** — các tùy chọn của công cụ, chiều rộng cố định khoảng **320 điểm ảnh**.
4. **Thanh dưới** — nút hành động chính (**một nút duy nhất**, màu nhấn), thông tin tóm tắt (ví dụ "3 tệp, 42 trang"), và nút Hủy khi đang chạy.

Dòng trạng thái "Xử lý trên máy bạn" ở thanh trên là **bằng chứng trực quan** cho lời hứa offline — không được bỏ.

## 3. Luồng chính (ví dụ: gộp PDF)

1. Người dùng thả 3 tệp vào cửa sổ hoặc bấm "Chọn tệp".
2. App đọc nhanh số trang và hình thu nhổ trang đầu của từng tệp; danh sách hiện ra trong **dưới 1 giây** cho mỗi tệp thường.
3. Người dùng kéo để đổi thứ tự, tùy chọn nhập dải trang.
4. Bấm "Gộp"; thanh tiến độ hiện phần trăm; nút Hủy khả dụng.
5. Hoàn tất: hiện "Đã lưu 120 trang, 4,2 MB" cùng ba nút: **Mở tệp**, **Mở thư mục**, **Làm việc khác**.
6. Nếu chạm giới hạn Free, thông báo xuất hiện **trước** khi bấm Gộp (ngay khi thêm tệp thứ ba), không phải sau khi chờ xong.

## 4. Quy tắc giao diện

| Chủ đề | Quy tắc |
| --- | --- |
| Nhắc nâng cấp | Không cửa sổ bật lên giữa lúc làm việc; chỉ hiện dải thông báo nhỏ ở thanh dưới khi chạm giới hạn, kèm nút "Xem gói Pro"; tối đa một lần mỗi phiên làm việc cho cùng một giới hạn |
| Lỗi | Câu lỗi nói rõ chuyện gì xảy ra và cách xử lý, không dùng mã lỗi trần; có nút "Sao chép chi tiết" cho hỗ trợ (không chứa nội dung tài liệu) |
| Tiến độ | Phần trăm thật cho thao tác biết trước độ dài; thanh chạy liên tục chỉ dùng khi không thể ước lượng |
| Trạng thái trống | Câu hướng dẫn ngắn và biểu tượng, không dùng ảnh minh họa nặng |
| Phản hồi | Mọi thao tác chạy trên 1 giây phải có phản hồi thị giác ngay lập tức |
| Khả năng tiếp cận | Mọi điều khiển dùng được bằng bàn phím; tên điều khiển đọc được bởi Narrator; tương phản tối thiểu 4,5:1; hỗ trợ phóng to chữ 200% |
| Ngôn ngữ | Mọi chuỗi chữ nằm trong tệp ngôn ngữ, không viết cứng trong mã; chuỗi ngắn gọn để không vỡ bố cục khi dịch |

## 5. Trạng thái cần thiết kế cho mỗi màn hình

Đây là **checklist bắt buộc** trước khi coi một màn hình là xong. Màn hình nào thiếu trạng thái nào thì chưa xong.

| # | Trạng thái | Mô tả |
| --- | --- | --- |
| 1 | Trống | Chưa có tệp nào; hiện vùng thả và hướng dẫn ngắn |
| 2 | Đang đọc tệp | Đang quét tệp, lấy số trang và hình thu nhổ; có nút Hủy |
| 3 | Sẵn sàng | Có dữ liệu, nút hành động chính được bật |
| 4 | Đang chạy | Thanh tiến độ + nút Hủy; khóa tương tác với đầu vào |
| 5 | Thành công | Tóm tắt kết quả + Mở tệp / Mở thư mục / Làm việc khác |
| 6 | Lỗi một phần | Một số tệp thất bại, phần còn lại thành công; liệt kê tệp lỗi kèm lý do |
| 7 | Lỗi toàn bộ | Không có kết quả; nút thử lại và nút "Sao chép chi tiết" |
| 8 | Chạm giới hạn Free | Dải thông báo ở thanh dưới kèm nút "Xem gói Pro"; **không** mất dữ liệu đang làm |

## 6. Phím tắt

| Phím | Chức năng |
| --- | --- |
| Ctrl+O | Chọn tệp |
| Ctrl+1 … Ctrl+6 | Mở công cụ tương ứng theo thứ tự trên màn hình chính |
| Ctrl+, | Mở Cài đặt |
| Ctrl+S hoặc Enter | Thực hiện thao tác chính |
| Ctrl+Z, Ctrl+Y | Hoàn tác, làm lại (màn hình sắp xếp trang) |
| Delete | Xóa trang hoặc tệp đang chọn |
| Ctrl+A | Chọn tất cả |
| Esc | Hủy thao tác đang chạy hoặc quay lại |
| F1 | Mở trợ giúp |

## 7. Mã hoá giao diện

| Mã | Ý nghĩa |
| --- | --- |
| `S-01` … `S-10` | Màn hình |
| `F-01` … `F-10` | Tính năng |
| `UC-01` … `UC-09` | Tình huống sử dụng |
| `T-01` … `T-12` | Ca kiểm thử chấp nhận |
| `R-01` … `R-14` | Rủi ro |
| `K-01` … `K-04` | Quy tắc kỹ thuật bất biến (README) |

## 8. Bộ thẻ giao diện

Nguồn: `apps/desktop/src/styles/tokens.css`. Đặt tên theo vai trò, không theo màu.

| Token | Vai trò |
| --- | --- |
| `--bg-canvas`, `--bg-surface`, `--bg-elevated` | Nền các lớp |
| `--text-primary`, `--text-secondary`, `--text-disabled` | Văn bản |
| `--accent-default`, `--accent-hover`, `--accent-pressed` | Màu nhấn cho hành động chính |
| `--border-subtle`, `--border-strong` | Đường viền |
| `--status-success`, `--status-warning`, `--status-error`, `--status-info` | Trạng thái |
| `--space-1` … `--space-8` | Thang khoảng cách |
| `--radius-sm`, `--radius-md`, `--radius-lg` | Bo góc |

Nguyên tắc màu:
- Bảng màu **một màu chủ đạo** (xanh đậm gợi sự tin cậy) cộng màu nhấn cho nút hành động chính.
- Tuân thủ hệ thống Windows: chủ đề sáng / tối / theo hệ thống, hỗ trợ chế độ tương phản cao.
- Mọi cặp màu chữ/nền phải đạt tương phản **≥ 4,5:1** — kiểm bằng công cụ tự động trong CI.

## 9. Ngôn ngữ và bản địa

- Khoá chuỗi: `i18n/<lang>.json`, cấu trúc phẳng theo màn hình, ví dụ `screens.merge.title`, `errors.needsPassword`.
- Chuỗi có tham số: `"Đã lưu {count} trang, {size}"` — định dạng số theo vùng qua `Intl.NumberFormat`.
- Cảm giác độ dài chuỗi: thiết kế để chịu được bản dịch dài hơn tiếng Anh ~30%. Không cắt chuỗi bằng CSS `text-overflow`.
- Ngôn ngữ khởi động: theo ngôn ngữ hệ thống, sau đó theo lựa chọn đã lưu.
- Bản 1.0: `en` và `vi`. Mặc định theo ngôn ngữ hệ thống, fallback `en`. Xem ADR-017.

## 10. Văn phong thông báo

| Nên | Không nên |
| --- | --- |
| "Tệp này được bảo vệ bằng mật khẩu. Nhập mật khẩu để tiếp tục." | "Error 0x8003: invalid password" |
| "Ổ đĩa không đủ chỗ trống. Hãy chọn thư mục khác." | "ENOSPC" |
| "Tệp này đã được tối ưu, không giảm thêm được." | "Compression failed" |
| "Đã lưu 120 trang, 4,2 MB" | "Operation completed successfully" |

Nguyên tắc: **một câu, nói về việc người dùng cần làm**, không phải về hệ thống.

## 11. Kiểm tra giao diện trước khi nghiệm thu

- [ ] Đủ 8 trạng thái ở mục 5.
- [ ] Điều khiển nào cũng điều hướng được bằng Tab, thứ tự Tab hợp lý.
- [ ] Có nhãn truy cập được (accessible name) cho mọi nút và ảnh.
- [ ] Tương phản đạt 4,5:1; kiểm ở cả sáng và tối.
- [ ] Chạy được ở tỷ lệ hiển thị 100%, 150%, 200%.
- [ ] Không tràn layout ở tiếng Anh, Đức, Pháp, Tây Ban Nha, Việt.
- [ ] Thông báo lỗi không chứa mã lỗi trần và không chứa nội dung tài liệu.
- [ ] Không có cửa sổ bật lên giữa lúc người dùng đang làm việc.
