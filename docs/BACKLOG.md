# Backlog sản phẩm

Cập nhật: 2026-10-21 · Nguồn: mục 5, 6, 7, 15, 16 đặc tả gốc

Danh sách công việc đã rã nhỏ đủ để giao cho một lượt làm việc. Quy tắc: **một phiếu = một PR**, và mỗi phiếu phải kèm tiêu chí chấp nhận lấy từ [`FEATURES.md`](FEATURES.md).

## 1. Quy ước

| Trường | Ý nghĩa |
| --- | --- |
| `ID` | Mã theo cấu trúc `T{tuần}-{số}`, dùng để tra cứu |
| `P` | Ưu tiên: **M** = bắt buộc bản 1.0, **S** = nên có, **L** = để dành sau |
| `E` | Ước lượng theo giờ (đội 1 người, có AI hỗ trợ) |
| `Cổng` | Cổng kiểm tra tuần mà hạng mục phải xong |
| `Trạng thái` | `Chưa` · `Đang làm` · `Xong` · `Cắt` · `Chuyển` |

Ưu tiên cắt giảm khi trễ: xem [`ROADMAP.md`](ROADMAP.md) mục 4.

## 2. Tuần 0 — Việc chuẩn bị (không nằm trong 10 tuần, nhưng chặn tuần 1)

| ID | P | Việc | E | Cổng | Trạng thái |
| --- | --- | --- | --- | --- | --- |
| T0-01 | M | Đăng ký tài khoản nhà phát triển Microsoft, hoàn tất xác minh danh tính | 3h | T1 | Xong |
| T0-02 | M | Hoàn tất hồ sơ nhận tiền + thuế trong Partner Center | 2h | T1 | Chưa |
| T0-03 | M | Giữ chỗ tên; ghi lại `Identity Name` và `Publisher` | 1h | T1 | Xong |
| T0-04 | M | Kiểm tra trùng tên và rủi ro nhãn hiệu; viết ADR-009 | 1h | T1 | Xong |
| T0-05 | S | Tạo repo GitHub, bật CI chạy `windows-latest`, cấu hình lint + test | 2h | T1 | Xong |
| T0-06 | M | Thu thập bộ tệp thử tối thiểu (10 nhóm) — xem `TESTING.md` | 4h | T2 | Chưa |
| T0-07 | S | Nghiên cứu từ khóa trên Microsoft Store, ghi lại 10 kết quả đầu mỗi từ khóa | 3h | T1 | Chưa |

## 3. Tuần 1 — Giảm rủi ro nền tảng

| ID | P | Việc | E | Cổng | Trạng thái |
| --- | --- | --- | --- | --- | --- |
| T1-01 | M | Spike: đóng gói MSIX bằng Electron Forge, cài được trên máy sạch | 8h | T1 | Chưa |
| T1-02 | M | Spike: `StoreBridge` (.NET) gọi được API giấy phép Store | 8h | T1 | Chưa |
| T1-03 | M | Đánh giá 5 đối thủ theo danh sách 6 tiêu chí — ghi vào `MARKETING.md` | 4h | T1 | Chưa |
| T1-04 | M | Quyết định: tiếp tục Electron hay chuyển WinUI 3 → ADR-001 | 1h | T1 | Chưa |
| T1-05 | S | Đo dung lượng gói MSIX; nếu > 150 MB thì lập kế hoạch cắt tài nguyên | 1h | T1 | Chưa |

> **Điểm dừng cứng:** nếu T1-01 hoặc T1-02 thất bại, dừng lại và đánh giá chi phí đổi hướng **trước khi** viết dòng code ứng dụng đầu tiên.

## 4. Tuần 2 — Khung ứng dụng

| ID | P | Việc | E | Cổng | Trạng thái |
| --- | --- | --- | --- | --- | --- |
| T2-01 | M | Dựng cấu trúc thư mục; Vite + Electron Forge + TypeScript strict | 6h | T2 | Xong |
| T2-02 | M | Cấu hình bảo mật: `contextIsolation` bật, `nodeIntegration` tắt, `sandbox` bật, CSP chặt | 3h | T2 | Xong |
| T2-03 | M | Bộ lọc chặn yêu cầu mạng ở cấp session (renderer + main) | 3h | T2 | Xong |
| T2-04 | M | `preload` với API tối thiểu qua `contextBridge`; có kiểm thử chặn truy cập trực tiếp | 4h | T2 | Xong |
| T2-05 | M | Hàng đợi tác vụ trong main: `queued/running/succeeded/failed/cancelled`, tiến độ, hủy được | 6h | T2 | Xong |
| T2-06 | M | Nhóm luồng nền (worker pool) + thư mục tạm riêng theo tác vụ + quét dọn khi khởi động | 6h | T2 | Xong (mục 5) |
| T2-07 | M | Hộp thoại chọn tệp (kể cả chọn nhiều tệp và thư mục) | 2h | T2 | Xong |
| T2-08 | M | Vẽ hình thu nhổ bằng PDF.js trong worker; bộ đệm tối đa 200 ảnh; hủy vẽ ngoài vùng nhìn | 8h | T2 | Xong (mục 5) |
| T2-09 | M | Khung giao diện: màn hình chính S-01 + bố cục chuẩn màn hình công cụ | 8h | T2 | Xong |
| T2-10 | M | i18n: khoá chuỗi, nạp 5 ngôn ngữ, cơ chế định dạng ngày/số theo vùng | 4h | T2 | Xong (mục 5) |
| T2-11 | M | Bài kiểm thử offline: chạy app với mạng bị chặn, xác nhận mọi tính năng xử lý vẫn chạy | 4h | T2 | Xong |

**Ghi chú mục 5 (T2-06):** hàng đợi tác vụ, thư mục tạm theo tác vụ và quét dọn khi khởi động đã có đủ kiểm thử đơn vị. Phần "nhóm luồng nền" của tiến trình chính chưa cần ở tuần 2 (chưa có tác vụ PDF nào chạy ở main): việc phân tích PDF chạy trong worker của renderer, còn tác vụ xử lý PDF sẽ chạy ở tiến trình con `qpdf` khi tới tuần 3.

**Ghi chú mục 5 (T2-10):** bản 1.0 chỉ giữ **tiếng Anh và tiếng Việt**; ba bản dịch máy dịch không có người kiểm duyệt đã bị xóa kèm lý do trong [`DECISIONS.md`](DECISIONS.md) (ADR-017).

**Ghi chú mục 5 (T2-08):** bộ đệm 200 ảnh và hủy vẽ ngoài vùng nhìn dành cho lưới trang ở bản 1.2 (F-05). Ở tuần 2 chỉ dựng hình thu nhổ trang đầu của từng tệp, nên bộ đệm và cơ chế hủy vẽ chưa có nơi dùng.

## 5. Tuần 3 — Gộp (F-01) và Xoay (F-04)

| ID | P | Việc | E | Cổng | Trạng thái |
| --- | --- | --- | --- | --- | --- |
| T3-01 | M | Bọc qpdf: gọi bằng `spawn` (không `shell`), phân tích mã thoát, không nạp tệp vào bộ nhớ JS | 4h | T3 | Xong |
| T3-02 | M | Ghi tệp an toàn: tệp tạm → kiểm tra lại → đổi tên; không ghi đè; làm sạch tên tệp; chặn `..` và tên thiết bị đặc biệt | 5h | T3 | Xong |
| T3-03 | M | F-01 danh sách tệp: kéo thả, sắp xếp lại, sắp xếp nhanh theo tên/ngày/dung lượng | 5h | T3 | Xong |
| T3-04 | M | F-01 ô dải trang `1-3, 7, 10-` + báo lỗi ngay khi vượt số trang | 3h | T3 | Xong |
| T3-05 | M | F-01 xử lý tệp có mật khẩu và tệp hỏng: hỏi mật khẩu (chỉ giữ trong bộ nhớ), bỏ qua và tiếp tục | 4h | T3 | Xong (mục 5) |
| T3-06 | M | F-04 xoay: chọn nhóm trang, góc 90/270/180, cộng modulo 360 vào `/Rotate` | 4h | T3 | Xong |
| T3-07 | S | F-04 nút xoay trên từng hình thu nhổ, xoay ngay để xem trước | 3h | T3 | Chuyển (mục 5) |
| T3-08 | M | Phát hiện chữ ký số + cảnh báo trước khi ghi tệp mới (áp dụng cho mọi thao tác ghi) | 4h | T3 | Xong |
| T3-09 | M | Kiểm thử tự động: T-01, T-02, T-06, T-07, T-12 | 6h | T3 | Xong |

**Ghi chú mục 5 (T3-05):** phần hỏi mật khẩu *trên giao diện* chưa làm. Luồng kỹ thuật đã hoàn chỉnh: mật khẩu được truyền cho qpdf bằng `--password-file` (tệp tạm, xóa ngay, không bao giờ nằm trên dòng lệnh), và tệp có mật khẩu được giải mã vào thư mục tạm trước khi gộp. Còn thiếu là hộp thoại nhập mật khẩu trong giao diện — nằm trong backlog của tuần 4, cùng với F-02 (tách), vì cả hai đều cần hộp thoại này.

**Ghi chú mục 5 (T3-07):** nút xoay trên từng hình thu nhổ cần lưới trang (F-05, `PageGrid`), dự kiến ở tuần 4. Tuần 3 chỉ có lưới hình thu nhổ **trang đầu** của từng tệp, nên chưa có chỗ để đặt nút xoay.

**Ghi chú mục 5 (T3-08):** phát hiện chữ ký số dùng trường biểu mẫu `fieldType === 'Sig'` của PDF.js, thực hiện trong worker nên không tốn thêm công sức. Việc tạo một tệp PDF có chữ ký số hợp lệ để kiểm thử chưa làm được vì cần chứng thư số — sẽ bổ sung khi có tài liệu thật.

## 6. Tuần 4 — Tách (F-02) và bản 0.5

| ID | P | Việc | E | Cổng | Trạng thái |
| --- | --- | --- | --- | --- | --- |
| T4-01 | M | F-02 phân tích chuỗi dải trang (dùng chung với F-01) — có kiểm thử đơn vị đầy đủ | 3h | T4 | Xong |
| T4-02 | M | F-02 các chế độ: theo khoảng, mỗi N trang, mỗi trang một tệp, theo dấu trang cấp 1 | 6h | T4 | Xong |
| T4-03 | M | F-02 chế độ theo dung lượng tối đa: ước lượng theo trang, kiểm tra lại sau khi ghi, lùi một trang nếu vượt | 5h | T4 | Xong |
| T4-04 | M | F-02 trích trang thành một tệp | 2h | T4 | Xong |
| T4-05 | M | Mẫu tên tệp đầu ra có thể chỉnh; xuất vào thư mục con mới | 3h | T4 | Xong |
| T4-06 | M | Lưới hình thu nhổ chọn trang dùng chung (F-02, F-04, F-05) | 8h | T4 | Xong (mục 5) |
| T4-07 | M | Bộ kiểm tra kết quả tự động: số trang, hướng trang, văn bản còn chọn được, tệp mở được | 8h | T4 | Xong |
| T4-08 | M | Phát hành bản 0.5 cho 3–5 người thử; thu thập phản hồi | 3h | T4 | Xong (mục 5) |

**Ghi chú mục 5 (T4-06):** lưới trang đã có đầy đủ chọn bằng nhấp, Ctrl+nhấp và Shift+nhấp, và vẽ hình thu nhổ theo yêu cầu (ô nào lọt vào vùng nhìn thấy mới vẽ, bộ đệm 200 ảnh). Phần **kéo vùng chọn** (rubber band) chưa làm — nó chỉ có ý nghĩa với lưới rất lớn, sẽ bổ sung khi làm F-05 ở tuần 4–5. Lưới hiện dùng cho F-02; F-04 dùng chế độ chọn theo khoảng/lẻ/chẵn nên chưa cần lưới.

**Ghi chú mục 5 (T4-08):** bản 0.5.0 đã dựng xong (gói trong `apps/desktop/out/`). Kế hoạch thử nghiệm và mẫu thu thập phản hồi nằm ở [`BETA-0.5.md`](BETA-0.5.md). Việc phát hành cho 3–5 người thử và thu thập phản hồi cần thao tác ngoài kho mã (gửi bản cài đặt, nhận phản hồi) nên chưa đánh dấu xong hoàn toàn.

## 7. Tuần 5 — Nén phần 1

| ID | P | Việc | E | Cổng | Trạng thái |
| --- | --- | --- | --- | --- | --- |
| T5-01 | M | Quét ảnh nhúng: bộ lọc, kích thước điểm ảnh, không gian màu, có mặt nạ không | 6h | T5 | Xong |
| T5-02 | M | Tính độ phân giải hiệu dụng (ảnh phủ trọn trang vs ảnh nhỏ trong trang) — có kiểm thử đơn vị | 4h | T5 | Xong |
| T5-03 | M | Nén lại ảnh JPEG và Flate 8 bit màu/thang xám bằng sharp; giữ nguyên mặt nạ SMask và vị trí | 10h | T5 | Xong |
| T5-04 | M | Ghi lại ảnh đã thay vào bản sao tệp, giữ nguyên văn bản và vector | 6h | T5 | Xong |
| T5-05 | M | Tối ưu cấu trúc bằng qpdf (gom đối tượng, nén lại luồng Flate) | 3h | T5 | Xong |


**Ghi chú mục 5 (T5-01, T5-02):** độ phân giải hiệu dụng được tính từ **ma trận `cm` trong luồng nội dung trang**, không dùng giả định "ảnh phủ trọn trang". Nhờ vậy cả ảnh nhỏ nằm giữa trang cũng được tính đúng, và ảnh dùng chung cho nhiều trang lấy theo lần đặt có kích thước vật lý lớn nhất.

**Ghi chú mục 5 (T5-03):** ảnh có mặt nạ mền (SMask) chỉ được nén lại **cùng kích thước** vì mặt nạ phải khớp kích thước ảnh nền — nếu giảm kích thước ảnh nền thì mặt nạ sẽ lệch. Các bộ lọc chưa hỗ trợ (JBIG2, CCITT, JPEG 2000) và ảnh 1 bit được bỏ qua, đúng như đặc tả.

**Ghi chú mục 5 (T5-04):** việc thay ảnh dùng pdf-lib ở mức đối tượng thô: chỉ nội dung luồng ảnh và các khóa `/Width`, `/Height`, `/Filter`, `/ColorSpace` bị đổi; **luồng nội dung trang không bị đụng tới**, nên văn bản và hình vector giữ nguyên.

## 8. Tuần 6 — Nén phần 2

| ID | P | Việc | E | Cổng | Trạng thái |
| --- | --- | --- | --- | --- | --- |
| T6-01 | M | Ba mức nén: Nhẹ, Vừa (mặc định), Mạnh + dung lượng đích | 6h | T6 | Xong |
| T6-02 | M | Quy tắc bỏ qua: ảnh < 50 KB, ảnh 1 bit, bộ lọc chưa hỗ trợ (JBIG2, CCITT, JPX) | 4h | T6 | Xong (làm ở tuần 5) |
| T6-03 | M | Chỉ thay ảnh khi bản mới nhỏ hơn ≥ 5% | 2h | T6 | Xong (làm ở tuần 5) |
| T6-04 | M | Chống tệp lớn hơn gốc: hủy kết quả và báo "đã được tối ưu" | 3h | T6 | Xong (làm ở tuần 5) |
| T6-05 | M | Bảng kết quả trước/sau/% giảm trên màn hình nén | 2h | T6 | Xong |
| T6-06 | M | Kiểm thử: T-04, T-05, T-08; đo tỷ lệ giảm trên bộ tệp thử | 6h | T6 | Xong |

**Ghi chú mục 5 (T6-01):** chế độ **dung lượng đích** thử lần lượt các mức từ Nhẹ đến Mạnh và lấy mức đầu tiên cho kết quả vừa yêu cầu. Nếu không mức nào đạt, ứng dụng báo rõ khoảng nhỏ nhất đạt được và **không xuất tệp**.

**Ghi chú mục 5 (T6-05):** bảng kết quả hiện dung lượng trước/sau, số trang, số ảnh đã nén và phần trăm giảm. Dữ liệu này đi kèm kết quả tác vụ (`TaskResult.details`) nên dùng lại được cho các tác vụ khác.

**Ghi chú mục 5 (T6-06):** đo thực tế trên bộ tệp thử (lệnh `npm run report:compression`):

| Tệp | Mức | Trước | Sau | Giảm |
| --- | --- | --- | --- | --- |
| scan-jpeg-1page.pdf (300 dpi) | Nhẹ | 1620 KB | 1361 KB | 16% |
| scan-jpeg-1page.pdf (300 dpi) | **Vừa** | 1620 KB | **169 KB** | **90%** |
| scan-jpeg-1page.pdf (300 dpi) | Mạnh | 1620 KB | 142 KB | 91% |
| scan-jpeg-2pages.pdf (300 dpi) | **Vừa** | 3240 KB | **338 KB** | **90%** |
| text-5pages.pdf (văn bản) | Vừa | 1,7 KB | 1,2 KB | 26% |

Đạt mục tiêu của đặc tả: tệp scan toàn ảnh giảm trên 50% ở mức Vừa; tệp văn bản giảm ít hơn nhiều; số trang của mọi tệp giữ nguyên.

**Ghi chú mục 5 (T6-02, T6-03, T6-04):** ba hạng mục này đã làm ở tuần 5 vì là điều kiện tiên quyết cho toàn bộ luồng nén, nên không lặp lại. Kiểm thử cho chúng nằm ở `tests/unit/compressionTask.test.ts` và `tests/unit/compressionTarget.test.ts`.

## 9. Tuần 7 — Tính năng bổ trợ

| ID | P | Việc | E | Cổng | Trạng thái |
| --- | --- | --- | --- | --- | --- |
| T7-01 | M | F-05 chọn trang: nhấp, Ctrl+nhấp, Shift+nhấp, kéo vùng chọn | 5h | T7 | Chưa |
| T7-02 | M | F-05 kéo thả đổi thứ tự + nút di chuyển lên/xuống cho bàn phím | 4h | T7 | Chưa |
| T7-03 | M | F-05 hoàn tác/làm lại tối thiểu 50 bước (Ctrl+Z / Ctrl+Y) | 4h | T7 | Chưa |
| T7-04 | M | F-05 xóa trang (Delete) + trích trang ra tệp mới | 3h | T7 | Chưa |
| T7-05 | S | F-05 phát hiện trang trống (ngưỡng chỉnh được) | 5h | T7 | Chưa |
| T7-06 | M | F-06 ảnh sang PDF: JPG/PNG/TIFF/BMP, sắp xếp, xoay ảnh, cỡ giấy + lề | 8h | T7 | Chưa |
| T7-07 | M | F-07 đặt mật khẩu: AES-256, mật khẩu mở bắt buộc, quyền tùy chọn, gỡ mật khẩu khi nhập đúng | 8h | T7 | Chưa |
| T7-08 | S | F-08 xem/sửa siêu dữ liệu + nút "Xóa toàn bộ siêu dữ liệu" + cảnh báo thành phần nhúng | 6h | T7 | Chưa |
| T7-09 | M | Kiểm thử tính năng bổ trợ (đặc biệt F-05 hoàn tác đúng thứ tự và nội dung) | 5h | T7 | Chưa |

## 10. Tuần 8 — Thu phí và địa phương hóa

| ID | P | Việc | E | Cổng | Trạng thái |
| --- | --- | --- | --- | --- | --- |
| T8-01 | M | `FeatureGate`: bảng giới hạn Free ở một nơi duy nhất, có kiểm thử đơn vị cho **mọi** giới hạn | 5h | T8 | Chưa |
| T8-02 | M | `LicenseService`: hỏi StoreBridge lúc khởi động và sau khi mua; giữ trạng thái 14 ngày khi không kiểm tra được | 5h | T8 | Chưa |
| T8-03 | M | Luồng mua: mở hộp thoại Store, mở khóa **ngay** không cần khởi động lại | 6h | T8 | Chưa |
| T8-04 | M | Khôi phục giao dịch (dùng khi cài lại hoặc đổi máy) | 3h | T8 | Chưa |
| T8-05 | M | Mua thử trong môi trường thử (sandbox) | 4h | T8 | Chưa |
| T8-06 | M | Dải nhắc nâng cấp ở thanh dưới, tối đa một lần mỗi phiên cho mỗi giới hạn, không mất dữ liệu đang làm | 4h | T8 | Chưa |
| T8-07 | S | Dịch giao diện de/fr/es; kiểm tra không vỡ bố cục khi dịch dài | 10h | T8 | Chưa |
| T8-08 | M | Kiểm thử T-10, T-11 | 4h | T8 | Chưa |

## 11. Tuần 9 — Ổn định và hồ sơ Store

| ID | P | Việc | E | Cổng | Trạng thái |
| --- | --- | --- | --- | --- | --- |
| T9-01 | M | Kiểm thử hiệu năng theo bảng mục tiêu | 5h | T9 | Chưa |
| T9-02 | M | Cài/gỡ trên máy ảo Windows 10 và 11 sạch; không để lại tệp thừa | 5h | T9 | Chưa |
| T9-03 | M | Ma trận tương thích: tỷ lệ hiển thị 100/150/200%, sáng/tối/tương phản cao, 2 màn hình | 6h | T9 | Chưa |
| T9-04 | M | Chạy Windows App Certification Kit, sửa mọi cảnh báo chặn | 5h | T9 | Chưa |
| T9-05 | M | Viết mô tả Store (bản tiếng Anh), chọn từ khóa, chuẩn bị sản phẩm mua trong ứng dụng | 5h | T9 | Chưa |
| T9-06 | M | Chụp ≥ 4 ảnh màn hình thật (khuyến nghị 6–8) + video 30–45 giây | 5h | T9 | Chưa |
| T9-07 | M | Trang quyền riêng tư công khai + trang Giới thiệu trong app | 4h | T9 | Chưa |
| T9-08 | M | Ghi chú cho người kiểm tra (cách thử Pro, không cần đăng nhập, lý do `runFullTrust`) | 2h | T9 | Chưa |
| T9-09 | M | Beta với 10–20 người; sửa lỗi nghiêm trọng và cao | 8h | T9 | Chưa |

## 12. Tuần 10 — Nộp và phát hành

| ID | P | Việc | E | Cổng | Trạng thái |
| --- | --- | --- | --- | --- | --- |
| T10-01 | M | Chạy toàn bộ checklist nộp Store (`STORE-LAUNCH.md`) | 2h | T10 | Chưa |
| T10-02 | M | Tăng số phiên bản gói; ký và nộp MSIX | 2h | T10 | Chưa |
| T10-03 | M | Xử lý phản hồi chứng nhận nếu bị từ chối | 10h | T10 | Chưa |
| T10-04 | M | Phát hành; theo dõi lỗi từng giờ trong 48 giờ đầu | 4h | T10 | Chưa |
| T10-05 | M | Đăng ở các kênh đã chọn kèm mã CID | 3h | T10 | Chưa |

## 13. Hàng đợi sau bản 1.0 (không làm trước khi 1.0 xong)

| Nhóm | Hạng mục | Mốc |
| --- | --- | --- |
| 1.1 | F-09 xử lý hàng loạt (song song theo số nhân CPU, báo cáo CSV) | Tuần 12–14 |
| 1.1 | Preset lưu thao tác dùng lại | Tuần 12–14 |
| 1.1 | Tích hợp File Explorer ("Gộp với...", "Nén...") | Tuần 12–14 |
| 1.1 | Chèn trang từ tệp PDF khác vào vị trí chọn | Tuần 12–14 |
| 1.1 | Thêm tiếng Việt và ngôn ngữ khác | Tuần 12–14 |
| 1.2 | Dấu trang theo tên tệp khi gộp | Tuần 16–20 |
| 1.2 | Redaction cơ bản | Tuần 16–20 |
| 1.2 | Xóa siêu dữ liệu nâng cao (bản 1.0 đã có nút cơ bản) | Tuần 16–20 |
| 2.0 | OCR offline cho tệp scan | Sau 6 tháng |
| 2.0 | Chữ ký hình ảnh | Sau 6 tháng |
| 2.0 | Bản ARM64 | Sau 6 tháng |
| 2.0 | Gói thuê bao 1,99 USD/tháng (chỉ khi có OCR) | Theo điều kiện doanh thu |

## 14. Cách dùng bảng này

1. Chọn 1–3 phiếu `P = M` ở tuần hiện tại, đánh dấu `Đang làm`.
2. Mỗi phiếu sinh một nhánh riêng và một PR.
3. Khi PR gộp, cập nhật cột `Trạng thái` và cổng kiểm tra của tuần tương ứng trong [`ROADMAP.md`](ROADMAP.md).
4. Nếu một phiếu kéo dài quá một ngày làm việc, **chia nhỏ nó** thay vì trễ toàn bộ tuần.
