# Đóng gói và phát hành Microsoft Store

Cập nhật: 2026-10-21 · Nguồn: mục 13, 19-C đặc tả gốc

> Partner Center thay đổi thường xuyên. Mọi thông tin dưới đây đã được kiểm tra với tài liệu công bố đến tháng 10/2026 — **đối chiếu lại ở mỗi bước**.

---

## 1. Con đường phát hành

Tạo tài khoản nhà phát triển → giữ chỗ tên → đóng gói MSIX → điền hồ sơ Partner Center → nộp → chờ chứng nhận.

## 2. Tài khoản nhà phát triển

| Hạng mục | Thông tin đã xác nhận | Việc của bạn |
| --- | --- | --- |
| Phí đăng ký | Tài khoản cá nhân đã miễn phí; Microsoft cũng đã bỏ phí 99 USD cho tài khoản công ty (thông báo 07/05/2026) | Không cần chuẩn bị tiền đăng ký |
| Xác minh danh tính | Tài khoản cá nhân cần tài khoản Microsoft, giấy tờ tùy thân và ảnh chân dung | Chuẩn bị giấy tờ còn hạn, ảnh rõ nét |
| Cá nhân hay công ty | Hướng dẫn của Microsoft nói tài khoản cá nhân dành cho người phát hành không liên quan đến nghề nghiệp kinh doanh; người làm tự do bán ứng dụng liên quan đến nghề của mình được hướng dẫn chọn tài khoản công ty | Đọc kỹ phần "Learn more" khi đăng ký; hỏi bộ phận hỗ trợ nếu chưa rõ |
| Thanh toán và thuế | Cần hồ sơ nhận tiền và biểu mẫu thuế trong Partner Center | Tra cứu nghĩa vụ thuế tại Việt Nam với người có chuyên môn |

## 3. Đóng gói

1. **Định dạng:** Store nhận gói MSIX (khuyến nghị) hoặc trình cài đặt EXE/MSI theo luồng riêng. Dự án này dùng **MSIX** vì gói được Microsoft ký khi nộp và chạy sạch khi gỡ.
2. **Với Electron:** dùng maker MSIX của Electron Forge hoặc Windows SDK. Khai báo khả năng `runFullTrust` trong manifest để ứng dụng chạy với quyền đầy đủ như ứng dụng máy tính thông thường.
3. **Định danh gói:** `Identity Name` và `Publisher` trong manifest phải khớp **chính xác** với trang App identity trong Partner Center sau khi giữ chỗ tên.
4. **Tài nguyên hình ảnh:** bộ logo ở các kích thước bắt buộc của manifest (44×44, 150×150, 310×150, 50×50 cho Store và các tỷ lệ phóng đại). Tạo từ **một tệp vector gốc**.
5. **Phiên bản:** theo dạng `Major.Minor.Build.0`; mỗi lần nộp phải tăng số phiên bản.
6. **Kiến trúc:** x64 ở bản 1.0; thêm ARM64 ở bản sau.
7. **Nộp gói:** tải lên thủ công trong Partner Center, hoặc tự động hóa bằng công cụ dòng lệnh `msstore` (chạy trên máy Windows với thông tin xác thực Azure AD đã cấu hình).
8. **Kiểm tra trước khi nộp:** chạy Windows App Certification Kit trên gói cuối cùng và sửa mọi cảnh báo.

### 3.1. Biểu mẫu AppxManifest (rút gọn)

```xml
<Package xmlns="http://schemas.microsoft.com/appx/manifest/foundation/windows10">
  <Identity Name="<Identity Name từ Partner Center>"
            Publisher="<Publisher từ Partner Center>"
            Version="1.0.0.0" />
  <Properties>
    <DisplayName>Offline PDF Toolbox</DisplayName>
    <PublisherDisplayName>...</PublisherDisplayName>
    <Logo>assets\StoreLogo.png</Logo>
  </Properties>
  <Dependencies>
    <TargetDeviceFamily Name="Windows.Desktop" MinVersion="10.0.19041.0" MaxVersionTested="10.0.22631.0" />
  </Dependencies>
  <Resources><Resource Language="en-us" /></Resources>
  <Applications>
    <Application Id="App" Executable="app\OfflinePdfToolbox.exe"
                 EntryPoint="Windows.FullTrustApplication">
      <uap:VisualElements DisplayName="Offline PDF Toolbox"
                          Description="..." BackgroundColor="transparent"
                          Square150x150Logo="assets\Square150x150Logo.png"
                          Square44x44Logo="assets\Square44x44Logo.png" />
    </Application>
  </Applications>
  <Capabilities>
    <rescap:Capability Name="runFullTrust" />
  </Capabilities>
</Package>
```

> `runFullTrust` là bắt buộc với ứng dụng desktop. Phải **ghi rõ lý do** trong ghi chú cho người kiểm tra: ứng dụng cần truy cập hệ thống tệp cục bộ để xử lý tài liệu của người dùng, và chạy qpdf như tiến trình con.

### 3.2. Tài nguyên cần có

| Tệp | Kích thước | Ghi chú |
| --- | --- | --- |
| `Square44x44Logo.png` | 44×44 | Bắt buộc |
| `Square150x150Logo.png` | 150×150 | Bắt buộc |
| `Wide310x150Logo.png` | 310×150 | Bắt buộc |
| `StoreLogo.png` | 50×50 | Bắt buộc |
| `SplashScreen.png` | 620×300 | Khuyến nghị |
| `LockScreenLogo.png` | 24×24 | Khuyến nghị |

Biểu tượng: đơn giản, nhìn rõ ở 44×44 — một tờ giấy có ổ khóa nhỏ để gợi sự riêng tư. Bảng màu một màu chủ đạo (xanh đậm) cộng màu nhấn.

## 4. Hồ sơ ứng dụng trong Partner Center

| Phần | Nội dung cần chuẩn bị |
| --- | --- |
| Giữ chỗ tên | Tên chứa từ khóa chính, kiểm tra trùng và nhãn hiệu của người khác |
| Giá và thị trường | Miễn phí để tải; chọn các thị trường (Mỹ, Canada, Anh, Đức, Pháp, Tây Ban Nha, Úc là ưu tiên); sản phẩm Pro là mua trong ứng dụng, giá 12,99 USD |
| Thuộc tính | Danh mục (Productivity — cần chọn đúng danh mục có sẵn), khai báo quy tắc kinh doanh nếu có |
| Xếp hạng độ tuổi | Hoàn tất bảng câu hỏi xếp hạng; ứng dụng không có nội dung nhạy cảm nên thường ở mức thấp nhất |
| Chính sách quyền riêng tư | Địa chỉ trang web công khai ([`SECURITY-PRIVACY.md`](SECURITY-PRIVACY.md) mục 8) |
| Mô tả ứng dụng | Tiêu đề, mô tả ngắn, mô tả đầy đủ, tính năng nổi bật, từ khóa (nội dung mẫu ở [`MARKETING.md`](MARKETING.md)) |
| Hình ảnh | Ít nhất 4 ảnh chụp màn hình rõ ràng (nên 6–8) kèm chú thích; logo ứng dụng; tùy chọn ảnh quảng bá |
| Yêu cầu hệ thống | Hệ điều hành tối thiểu, RAM, dung lượng; **ghi trung thực** |
| Ghi chú cho người kiểm tra | Hướng dẫn cách thử mọi tính năng, cách thử luồng mua Pro, nói rõ app không cần đăng nhập, và lý do khai báo `runFullTrust` |
| Sản phẩm mua trong ứng dụng | Tạo sản phẩm Pro với mã nhận dạng riêng, giá, mô tả và hình ảnh |

## 5. Quy trình chứng nhận

Sau khi nộp, gói qua bước kiểm tra bảo mật, tương thích kỹ thuật và tuân thủ nội dung. Với gói MSIX, khách thường thấy ứng dụng trong **khoảng 15 phút** sau khi chứng nhận xong (tùy khu vực); luồng EXE/MSI có thể mất tới ba ngày làm việc.

**Dự phòng vài ngày cho lần nộp đầu tiên** — đây là lần dễ bị từ chối nhất.

| Lý do thường gặp khiến bị từ chối | Cách tránh |
| --- | --- |
| Ứng dụng lỗi hoặc đóng đột ngột trong lúc kiểm tra | Chạy thử toàn bộ trên máy sạch, trên Windows 10 và 11 |
| Người kiểm tra không thử được tính năng Pro | Viết ghi chú kiểm tra rõ ràng, nêu cách kích hoạt luồng mua |
| Khai báo quyền không cần thiết hoặc không giải thích được | Chỉ khai báo những gì cần; ghi lý do cho `runFullTrust` |
| Mô tả gây hiểu lầm (ví dụ nói "tuân thủ HIPAA") | Dùng cách nói ở [`SECURITY-PRIVACY.md`](SECURITY-PRIVACY.md) mục 7 |
| Thiếu chính sách quyền riêng tư hoặc liên kết hỏng | Kiểm tra liên kết trước khi nộp |
| Dùng tên hoặc hình ảnh của hãng khác (Adobe) | Dùng nhận diện riêng |
| Ảnh chụp màn hình không đúng với ứng dụng thật | Chụp từ bản phát hành thật |

## 6. Sau khi phát hành

- Theo dõi trong Partner Center: lượt cài, báo cáo lỗi, đánh giá và từ khóa người dùng tìm thấy ứng dụng.
- Trả lời **mọi** đánh giá trong 48 giờ, đặc biệt đánh giá thấp: trả lời lịch sự, hỏi thêm thông tin, sửa lỗi rồi báo lại.
- Nộp bản cập nhật **hai tuần một lần** trong hai tháng đầu.

## 7. Checklist trước khi nộp

Bản sao từ mục 19-C đặc tả gốc, dùng làm phiếu nghiệm thu:

- [ ] Tài khoản nhà phát triển đã xác minh; hồ sơ thanh toán và thuế đã hoàn tất
- [ ] Tên ứng dụng đã giữ chỗ; đã kiểm tra trùng và nhãn hiệu
- [ ] `Identity Name` và `Publisher` trong manifest khớp với Partner Center
- [ ] Phiên bản gói đã tăng so với lần nộp trước
- [ ] Gói MSIX cài, chạy và gỡ sạch trên Windows 10 và 11 sạch
- [ ] Windows App Certification Kit không còn lỗi chặn
- [ ] Bộ kiểm thử chấp nhận đạt hết; bài kiểm thử ngoại tuyến đạt
- [ ] Giới hạn Free hoạt động đúng; mua Pro trong môi trường thử thành công; khôi phục mua hàng thành công
- [ ] Sản phẩm mua trong ứng dụng đã tạo với giá 12,99 USD
- [ ] Ít nhất 4 ảnh chụp màn hình thật, có chú thích; video quảng bá nếu có
- [ ] Mô tả không chứa tuyên bố tuân thủ pháp luật; giới hạn Free ghi đúng
- [ ] Chính sách quyền riêng tư công khai, liên kết hoạt động
- [ ] Bảng câu hỏi xếp hạng độ tuổi đã hoàn tất
- [ ] Ghi chú cho người kiểm tra đã viết (cách thử Pro, không cần đăng nhập, lý do khai báo `runFullTrust`)
- [ ] Email hỗ trợ hoạt động, trang hướng dẫn cơ bản có sẵn
- [ ] Liên kết theo dõi chiến dịch (CID) đã chuẩn bị cho các kênh bên ngoài
- [ ] Kế hoạch trả lời đánh giá và lịch bản cập nhật hai tuần đã chốt

## 8. Lịch tám tuần quanh ngày phát hành

| Tuần | Việc |
| --- | --- |
| T-4 | Dựng trang giới thiệu, thu thập email những người quan tâm (không bắt buộc), viết bài hướng dẫn đầu tiên |
| T-2 | Mời 10–20 người dùng thử bản kiểm thử; sửa lỗi lớn; hoàn thiện ảnh và video Store |
| T-1 | Nộp chứng nhận |
| T0 | Phát hành; đăng ở các kênh đã chọn; theo dõi lỗi từng giờ ở 48 giờ đầu |
| T+1 | Phát hành bản vá; trả lời mọi đánh giá |
| T+2 | Bản 1.0.x với sửa lỗi từ phản hồi; thử khuyến mãi 9,99 USD |
| T+4 | Bài hướng dẫn thứ hai và thứ ba; đánh giá lại từ khóa dựa trên báo cáo Store |
| T+8 | Đánh giá theo mục tiêu 90 ngày và quyết định hướng đi tiếp |

## 9. Sau khi phát hành — bảng theo dõi

| Chỉ số | Nguồn | Mục tiêu 30 ngày | Mục tiêu 90 ngày |
| --- | --- | --- | --- |
| Lượt xem trang Store | Partner Center | 3.000 | 15.000 |
| Lượt cài | Partner Center | 400 | 1.500 |
| Tỷ lệ cài trên lượt xem | Tính từ hai số trên | 10% | 10% |
| Tỷ lệ chuyển đổi Free → Pro | Partner Center (số lượt mua / lượt cài) | 1% | 1,5%–3% |
| Điểm đánh giá | Store | 4,0 | 4,2 |
| Số đánh giá | Store | 8 | 25 |
| Tỷ lệ phiên lỗi | Báo cáo sức khỏe của Store | Dưới 1,5% | Dưới 1% |
| Thư hỗ trợ mỗi 100 lượt cài | Hộp thư | Dưới 5 | Dưới 3 |

Bản 1.0 **không có thống kê sử dụng trong app**, nên mọi chỉ số ở trên lấy từ Partner Center và hộp thư hỗ trợ. Nếu cần hiểu tính năng nào được dùng nhiều, hãy hỏi trực tiếp người dùng bằng khảo sát tùy chọn có liên kết ra ngoài, thay vì thu thập dữ liệu ngầm.

## 10. Quy tắc quyết định sau 90 ngày

| Tình huống | Quyết định |
| --- | --- |
| Lượt cài dưới 500, chuyển đổi dưới 1% | Đổi định vị (nhắm riêng một nghề, ví dụ kế toán), cải thiện ảnh và mô tả Store, đo lại 30 ngày |
| Lượt cài tốt nhưng chuyển đổi dưới 1% | Điều chỉnh giới hạn Free và giá; xem lại thời điểm hiện thông báo nâng cấp |
| Chuyển đổi tốt nhưng lượt cài thấp | Đầu tư vào từ khóa, trang web, nội dung hướng dẫn |
| Cả hai đều tốt | Làm bản 1.2 và 2.0, cân nhắc gói thuê bao cho OCR |
| Đánh giá dưới 4,0 | Dừng thêm tính năng, sửa các lỗi lặp lại trong đánh giá thấp |
