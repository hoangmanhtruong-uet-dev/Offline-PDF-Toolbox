# Mô hình thu phí và giấy phép

Cập nhật: 2026-10-21 · Nguồn: mục 12, 5 đặc tả gốc

---

## 1. Mô hình đã chọn

**Ứng dụng tải miễn phí, có bản Free giới hạn, mở khóa Pro bằng một lần mua đứt 12,99 USD qua Microsoft Store.**

| Mô hình | Nhận định |
| --- | --- |
| Mua đứt 9,99–14,99 USD | **Chọn làm mô hình chính** |
| Thuê bao 1,99 USD/tháng | Để dành cho tính năng nặng sau này (OCR) |
| Cả hai song song | Không dùng ở bản 1.0 — làm rối trang Store và giao diện mua |
| Trả phí ngay từ đầu | Không dùng — giảm mạnh lượt cài, mà lượt cài là nhiên liệu cho thứ hạng |

**Vì sao chọn "miễn phí + mở khoá Pro":**
- Lượt cài cao hơn, mà lượt cài và đánh giá là nhiên liệu cho thứ hạng tìm kiếm trên Store.
- Giới hạn theo số lượng khớp với ý tưởng dùng thử.
- Trong Partner Center: ứng dụng miễn phí kèm một sản phẩm mua trong ứng dụng loại **"dùng một lần, không hết hạn" (durable add-on)**. Phải kiểm tra lại cấu hình hiện hành trong tài liệu Microsoft khi triển khai.

## 2. Lịch giá

| Giai đoạn | Giá Pro | Mục đích |
| --- | --- | --- |
| Ra mắt (tháng 1) | 12,99 USD | Giá tham chiếu, chờ dữ liệu chuyển đổi |
| Tháng 2 | Khuyến mãi 9,99 USD trong 2 tuần | Đo độ nhạy giá và kích thích đánh giá đầu tiên |
| Tháng 3 trở đi | Chọn mức có doanh thu mỗi lượt cài cao nhất | Ổn định |

Giá hiển thị theo từng thị trường theo bậc giá Partner Center cung cấp; xem lại riêng cho khu vực đồng euro và các thị trường có sức mua thấp hơn.

## 3. Thành phần

| Thành phần | Mô tả | Nơi đặt |
| --- | --- | --- |
| `FeatureGate` | Module duy nhất quyết định mỗi tính năng bị giới hạn thế nào ở Free hay mở hết ở Pro; đọc giới hạn từ một bảng cấu hình; **có kiểm thử đơn vị cho mọi giới hạn** | `src/shared/features.ts` |
| `LicenseService` | Hỏi StoreBridge về trạng thái Pro khi khởi động và sau khi mua; giữ kết quả cuối cùng trong bộ nhớ | `src/main/services/licenseService.ts` |
| `StoreBridge` | Chương trình .NET nhỏ gọi API Windows.Services.Store để lấy giấy phép và mở cửa sổ mua | `tools/StoreBridge/` |

## 4. Hợp đồng StoreBridge

Giao tiếp qua JSON trên stdin/stdout của tiến trình con. Không dùng cổng mạng, không dùng file tạm.

**Lệnh (input):**

```json
{ "id": "1", "cmd": "getLicense", "productId": "PRO_PRODUCT_ID" }
{ "id": "2", "cmd": "purchase",  "productId": "PRO_PRODUCT_ID" }
{ "id": "3", "cmd": "restore",   "productId": "PRO_PRODUCT_ID" }
```

**Kết quả (output):**

```json
{ "id": "1", "ok": true, "isPro": true, "licenseState": "active" }
{ "id": "2", "ok": true, "status": "completed", "isPro": true }
{ "id": "1", "ok": false, "errorCode": "E_STORE_UNAVAILABLE", "message": "..." }
```

Yêu cầu bắt buộc:
- StoreBridge **không bao giờ** được truyền đường dẫn tệp tài liệu của người dùng. Nó chỉ biết mã sản phẩm.
- Mọi lỗi phải là mã ổn định để app hiển thị thông báo thích hợp, không phụ thuộc chuỗi thông báo của hệ điều hành.
- `purchase` trả về trạng thái, không tự quyết định thành công — app luôn hỏi lại `getLicense` sau khi mua.

## 5. Luồng mua

1. Người dùng bấm "Nâng cấp" ở S-09 hoặc dải nhắc ở thanh dưới.
2. `LicenseService` gọi `StoreBridge.purchase` → StoreBridge mở hộp thoại mua của Microsoft.
3. Khi thành công, `LicenseService` gọi lại `getLicense`, cập nhật trạng thái, `FeatureGate` mở khóa **ngay, không cần khởi động lại**.
4. Nếu đóng hộp thoại → giữ nguyên trạng thái Free, không hiện lỗi đỏ.

**Khôi phục giao dịch**: nút "Khôi phục mua hàng" gọi lại `getLicense` — dùng khi cài lại app hoặc đổi máy.

## 6. Hành vi khi không kiểm tra được

| Tình huống | Hành vi |
| --- | --- |
| Kiểm tra thất bại, lần thành công gần nhất < 14 ngày | Giữ trạng thái Pro đã biết; hiển thị dấu hiệu nhỏ "không kiểm tra được lúc này" |
| Kiểm tra thất bại, chưa từng xác minh được | Xử lý như Free; hiện thông báo rõ ràng và cho nút "Khôi phục mua hàng" |
| Store thu hồi giấy phép | App trở về Free ở lần kiểm tra sau |

Bộ nhớ cache chỉ chứa: `isPro`, `lastVerifiedAt`, `licenseState`. Không chứa dữ liệu người dùng.

## 7. FeatureGate

```ts
// src/shared/features.ts — nguồn duy nhất của bảng giới hạn
export type FeatureLimits = {
  merge:   { maxFiles: number };
  split:   { maxPages: number };
  compress:{ maxFiles: number; maxInputBytes: number; levels: CompressionLevel[] };
  rotate:  { maxFiles: number; maxPages: number };
  pages:   { maxPages: number };
  images:  { maxImages: number };
  password:{ enabled: boolean };
  batch:   { enabled: boolean };
  presets: { enabled: boolean };
};

export const FREE_LIMITS: FeatureLimits = { /* xem bảng ở FEATURES.md */ };
export const PRO_LIMITS: FeatureLimits  = { /* không giới hạn */ };
```

Quy tắc kiểm thử bắt buộc cho `FeatureGate`:
- Mỗi giới hạn trong bảng Free có ít nhất một ca kiểm thử: đúng bằng ngưỡng (cho phép) và vượt ngưỡng (chặn).
- Ca "vượt ngưỡng" phải kiểm tra cả ba điều: **bị chặn**, **thông báo đúng**, và **không mất trạng thái người dùng đang làm**.
- Không giới hạn của Pro phải là `Infinity`/`null` chứ không phải số rất lớn — tránh trường hợp 2³¹ tệp.

## 8. Nhắc nâng cấp — quy tắc hành xử

Đây là điểm dễ làm mất đánh giá nhất. Quy tắc bắt buộc:

1. **Báo giới hạn trước khi người dùng làm xong việc** — ngay khi thêm tệp thứ ba vào ô gộp, không phải sau khi bấm "Gộp".
2. Không dùng hộp thoại bật lên giữa lúc làm việc. Dùng **dải thông báo nhỏ ở thanh dưới**.
3. Tối đa **một lần mỗi phiên làm việc** cho cùng một giới hạn.
4. Dải thông báo có nút "Xem gói Pro" — dẫn tới S-09.
5. **Không** xóa hay sửa danh sách tệp đã chọn khi chặn.
6. Không nhắc nhấp lại khi người dùng đang ở màn hình S-09.

## 9. Cấu hình trong Partner Center

| Mục | Giá trị |
| --- | --- |
| Sản phẩm mua trong ứng dụng | Tạo một sản phẩm có mã nhận dạng riêng, loại durable (mua một lần) |
| Giá | 12,99 USD (thang giá theo vùng) |
| Mô tả sản phẩm | Liệt kê đúng những gì Pro mở khóa, khớp bảng giới hạn |
| Ảnh sản phẩm | Không dùng logo hãng khác |

**Quy tắc:** mọi con số ghi trong mô tả Store phải khớp **đúng** với bảng giới hạn trong mã. Nếu đổi giới hạn, phải sửa mô tả Store cùng lúc.

## 10. Doanh thu thực nhận

- Microsoft xử lý thanh toán. Tỷ lệ chia sẻ cho ứng dụng không phải trò chơi đã được công bố từ 2018: **95%** nếu khách đến từ liên kết riêng có CID, **85%** nếu khách đến từ vị trí do Microsoft giới thiệu. Mức hiện hành phải xác nhận trong Hợp đồng nhà phát triển.
- Với tài khoản cá nhân, Microsoft cho phép dùng hệ thống thanh toán riêng, nhưng cách này kéo theo tự lo thuế và giấy phép → **không dùng ở bản 1.0**.
- Vấn đề thuế: cần người có chuyên môn tư vấn, không tự quyết.

## 11. Lưu ý về thông điệp "offline"

Việc mua hàng và kiểm tra giấy phép dùng kết nối của Microsoft Store, **không đụng tới tài liệu**. Ghi rõ điều này ở trang Giới thiệu và chính sách quyền riêng tư để câu "không dùng mạng" luôn chính xác:

> "Mọi thao tác trên tài liệu đều không cần mạng."

Không được viết "ứng dụng hoàn toàn không cần mạng" — vì luồng mua cần mạng.

## 12. Việc cần kiểm thử sớm (tuần 1–2)

- [ ] Giấy phép Store hoạt động ra sao khi máy **ngoại tuyến**.
- [ ] Quy trình thử mua trong môi trường thử (sandbox) trước khi gói được xuất bản.
- [ ] Mua xong có mở khóa ngay không cần khởi động lại (T-10).
- [ ] Khôi phục mua hàng sau khi cài lại app (T-11).

Hai điểm đầu là nơi thường gây bất ngờ nhất — kiểm tra ở tuần 1, không để tới tuần 8.
