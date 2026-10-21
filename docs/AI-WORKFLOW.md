# Quy trình làm việc với AI lập trình

Cập nhật: 2026-10-21 · Nguồn: mục 19-D đặc tả gốc

Dự án được xây bởi **một lập trình viên có AI hỗ trợ**. Quy trình dưới đây giảm rủi ro đặc thả trong tình huống đó.

---

## 1. Nguyên tắc

1. **Dán ngữ cảnh kèm theo.** Luôn gửi kèm phần đặc tả liên quan (`FEATURES.md`, `ARCHITECTURE.md`) — AI không có trí nhớ dài hạn về dự án.
2. **Một bước nhỏ mỗi lượt.** Yêu cầu AI làm từng bước nhỏ, chạy kiểm thử sau mỗi bước.
3. **Không thêm tính năng ngoài danh sách.** Nếu AI tự thêm, xem như lỗi.
4. **AI dừng lại và hỏi khi mơ hồ** thay vì tự đoán.
5. **Bạn đọc và xác nhận mọi thay đổi.** Không merge PR mà chưa chạy kiểm thử.
6. **Kiểm thử trước khi tin.** Kết quả "đã xong" của AI phải có bằng chứng: output kiểm thử.

## 2. Vòng lặp làm việc

```
Chọn 1 phiếu trong BACKLOG
        ↓
Đọc tiêu chí chấp nhận trong FEATURES.md
        ↓
Nhắn AI: bối cảnh + yêu cầu cụ thể + yêu cầu viết kiểm thử
        ↓
AI sửa code → chạy kiểm thử → báo cáo output
        ↓
Bạn kiểm tra lại: đọc diff, chạy kiểm thử cục bộ, thử tay trên tệp thật
        ↓
Đạt → commit + cập nhật BACKLOG. Không đạt → nhắn lại AI với lỗi cụ thể
```

**Quy tắc báo cáo của AI:** mỗi lượt trả lời phải kèm **output thật** của lệnh kiểm thử (không tóm tắt bằng lời). Không chấp nhận câu "đã kiểm tra, mọi thứ ổn" mà không có output.

## 3. Bối cảnh tối thiểu cần dán

Tùy loại việc, dán các phần sau:

| Loại việc | Dán |
| --- | --- |
| Khung ứng dụng | `README.md` mục 2, 4, 5 + `ARCHITECTURE.md` mục 2, 3, 4 |
| Một tính năng | `FEATURES.md` mục của tính năng đó + `ARCHITECTURE.md` mục 5, 6 |
| Giao diện | `UX.md` mục 2, 4, 5, 6 + `FEATURES.md` |
| Giấy phép | `LICENSING.md` mục 3, 4, 5, 7 |
| Bảo mật | `SECURITY-PRIVACY.md` mục 2, 3, 4, 5 |
| Kiểm thử | `TESTING.md` mục 1, 2, 4, 5 |

## 4. Mẫu lời nhắp (theo đặc tả gốc, mục 19-D)

### Prompt 1: Dựng khung dự án

```text
Vai trò: kỹ sư phần mềm Windows desktop.
Mục tiêu: dựng khung ứng dụng "Offline PDF Toolbox" bằng Electron + React + TypeScript theo mục 9 và mục 8 của tài liệu đặc tả.
Yêu cầu:
1. Cấu trúc thư mục đúng như mục 9. Dùng Vite cho renderer, Electron Forge cho đóng gói.
2. Bảo mật: contextIsolation bật, nodeIntegration tắt, sandbox bật, CSP chặt, bộ lọc chặn mọi yêu cầu mạng từ renderer.
3. Hàng đợi tác vụ trong main với trạng thái queued/running/succeeded/failed/cancelled, hủy được, tiến độ theo phần trăm, thư mục tạm riêng mỗi tác vụ.
4. Màn hình chính S-01 và bố cục chuẩn của màn hình công cụ (mục 8), giao diện Fluent UI, i18n sẵn cho en/de/fr/es/vi.
5. Mỗi bước dừng lại, chạy kiểm thử và báo kết quả trước khi sang bước tiếp.
Không thêm tính năng ngoài danh sách. Hỏi lại nếu có điểm mơ hồ.
```

### Prompt 2: Gộp, tách, xoay bằng qpdf

```text
Cài đặt F-01, F-02, F-04 theo mục 6. Dùng qpdf đóng kèm như tiến trình con (spawn, không shell), không nạp cả tệp vào bộ nhớ JavaScript.
Quy tắc: ghi ra tệp tạm, kiểm tra lại (mở được, đủ số trang), rồi đổi tên vào đích; không bao giờ ghi đè; làm sạch tên tệp; hủy được và dọn tệp tạm.
Viết kiểm thử tự động bằng bộ tệp trong tests/fixtures cho các ca T-01, T-02, T-03, T-06, T-07, T-12.
```

### Prompt 3: Nén PDF

```text
Cài đặt F-03 theo quy trình 8 bước ở mục 10. Chỉ hỗ trợ ảnh JPEG và Flate 8 bit màu hoặc thang xám ở bản 1.0; bỏ qua ảnh nhỏ, ảnh 1 bit và bộ lọc chưa hỗ trợ.
Ba mức Nhẹ/Vừa/Mạnh và dung lượng đích. Nếu kết quả không nhỏ hơn tệp gốc thì không xuất và báo "đã được tối ưu". Phát hiện chữ ký số và cảnh báo.
Đo và báo cáo tỷ lệ giảm trên bộ tệp thử; kiểm tra tự động rằng văn bản vẫn chọn được và số trang không đổi.
```

### Prompt 4: Giấy phép Store

```text
Tạo chương trình .NET nhỏ StoreBridge dùng Windows.Services.Store để (1) lấy trạng thái sản phẩm Pro (durable add-on), (2) mở luồng mua, (3) khôi phục mua hàng. Giao tiếp với main qua JSON trên stdin/stdout.
Trong app, viết LicenseService và FeatureGate theo mục 12: bảng giới hạn Free ở một nơi, có kiểm thử đơn vị cho mọi giới hạn, mở khóa ngay sau khi mua, giữ trạng thái Pro 14 ngày nếu không kiểm tra được.
```

### Prompt 5: Chất lượng đầu ra (dùng cho mọi thao tác ghi tệp)

```text
Bắt buộc mọi thao tác ghi tệp đi qua chuỗi: ghi vào thư mục tạm của tác vụ → kiểm tra tệp (mở được bằng qpdf, đúng số trang mong đợi, văn bản vẫn chọn được nếu tệp có lớp chữ) → nếu đạt mới đổi tên sang thư mục đích.
Không bao giờ ghi đè tệp tồn tại: nếu trùng tên thì thêm hậu tố số.
Tên tệp phải được làm sạch: chặn "..", ký tự điều khiển, và tên thiết bị đặc biệt của Windows (CON, PRN, AUX, NUL, COM1-9, LPT1-9).
Viết kiểm thử cho cả ba trường hợp.
```

## 5. Những lỗi AI hay mắc — kiểm tra thủ công

| Lỗi thường gặp | Cách phát hiện |
| --- | --- |
| Viết chuỗi hiển thị cứng trong mã | `grep` cho ký tự tiếng Việt/Anh trong `.tsx`, `.ts` ngoài `i18n/` |
| Ghi đè tệp tồn tại | Đọc `outputVerifier.ts` và `safePath.ts` |
| Chạy việc nặng ở luồng giao diện | Kiểm tra không có xử lý PDF trong component |
| Dùng `shell: true` khi gọi qpdf | `grep "shell: true"` |
| Bỏ qua kiểm tra đầu ra | Tìm chỗ báo "thành công" — phải có bước verify trước |
| Thêm dependency không kiểm tra giấy phép | Kiểm tra SBOM trong diff |
| Viết test yếu (chỉ assert "không lỗi") | Đọc lại test: có khẳng định hành vi thật không |
| Bỏ qua tiêu chí chấp nhận trong `FEATURES.md` | Đối chiếu checklist từng dòng |

## 6. Quy tắc commit

- Một PR = một phiếu backlog.
- Tên nhánh: `T<tuần>-<số>-<mô-ta-ngan>` (ví dụ `T3-04-merge-page-range`).
- Nội dung commit nêu mã phiếu và mã ca kiểm thử liên quan.
- Không commit file tạm, tệp nhật ký cục bộ, hay tệp tài liệu nhạy cảm.

## 7. Khi AI bị kẹt

1. **Thu hẹp yêu cầu**: chia một yêu cầu lớn thành ba yêu cầu nhỏ.
2. **Cung cấp đầu ra thật**: dán lỗi thật từ terminal, không mô tả bằng lời.
3. **Chỉ ra file liên quan**: "sửa `src/shared/pageRange.ts`, không đụng file khác".
4. **Tự viết phần khó**: nếu AI vòng lặp 3 lượt không giải quyết được, hãy tự viết rồi nhờ AI viết kiểm thử.
5. **Ghi lại**: nếu lỗi lặp lại với loại việc đó, bổ sung vào mục 5 để phòng ngừa.
