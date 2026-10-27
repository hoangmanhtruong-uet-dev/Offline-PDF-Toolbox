# Tích hợp Bulk Converter & Compressor vào Offline PDF Toolbox

Oct 22, 2026 · Phụ lục tích hợp cho "Offline PDF Toolbox — Đặc tả sản phẩm và kế hoạch phát hành Microsoft Store"

Tài liệu này là bản vá: các mục mới (F-11 đến F-14, S-11 đến S-13, T-13 đến T-22, R-15 đến R-20) đánh số nối tiếp đặc tả gốc, và mục 9 liệt kê chính xác chỗ nào trong đặc tả gốc cần sửa.

## 1. Quyết định và cách làm

Ý tưởng #7 khớp rất tốt với app hiện tại: cùng khách hàng (người ngại tải file lên web), cùng lời hứa offline, cùng hạ tầng (hàng đợi tác vụ, worker, FeatureGate, báo cáo hàng loạt, Store). Nhưng ba phần của ý tưởng có độ khó và rủi ro rất khác nhau, nên không nên làm một lượt:

| Module | Độ khó | Rủi ro chính | Quyết định |
| --- | --- | --- | --- |
| Ảnh: chuyển đổi và nén (PNG, JPG, WebP, AVIF, HEIC) | Thấp: `sharp` đã nằm trong stack | HEIC cần bộ giải mã (xem mục 4) | Làm ở bản 1.1 cùng xử lý hàng loạt |
| Tài liệu: PDF sang ảnh, ảnh sang PDF, văn bản/Markdown sang PDF | Thấp đến vừa | Không hứa chuyển PDF sang Word | Làm ở bản 1.1 (phần ảnh sang PDF đã có F-06) |
| Video: đổi đuôi và nén nhẹ | Cao: cần FFmpeg | Giấy phép FFmpeg và codec, dung lượng gói tăng 60 đến 100 MB | Làm ở bản 1.2, sau khi có dữ liệu Store |

Lý do không đưa vào 1.0: kế hoạch 10 tuần đã khoảng 150 đến 200 giờ và nén PDF đã là phần rủi ro nhất. Giữ nguyên MVP, nếu không phát hành sẽ trượt. Nếu bạn vẫn muốn ảnh có ngay ở 1.0, phương án là kéo dài lộ trình thành 11 tuần (mục 7), không cắt kiểm thử.

Chuyển "document conversion" kiểu DOCX sang PDF hay PDF sang Word: không đưa vào kế hoạch. Chuyển DOCX/PDF chất lượng tốt cần LibreOffice (gói 300 MB trở lên) hoặc Word đã cài sẵn, còn PDF sang Word thường cho kết quả xấu và dễ nhận đánh giá thấp. Có thể cân nhắc sau 2.0.

### Lưu ý thị trường (như mục 2 gốc)

Câu "mỏ vàng" trong ý tưởng chưa được kiểm chứng. Đã có nhiều công cụ miễn phí chạy trên máy: Squoosh (web nhưng xử lý cục bộ), XnConvert, ImageMagick, HandBrake, FFmpeg, cùng các app trả phí trên Store. Sức bán vẫn đến từ giao diện kéo thả nhanh, xử lý cả thư mục, ước lượng dung lượng, xóa dữ liệu vị trí (EXIF) và lời hứa riêng tư, không đến từ việc có thêm định dạng. Thêm bước đánh giá đối thủ ảnh/video vào tuần 0 (mục 7).

### Tên sản phẩm

Tên "Offline PDF Toolbox" sẽ sai nghĩa khi có ảnh và video. Vì tên chưa được giữ chỗ, nên đổi ngay ở tuần 1. Gợi ý (cần kiểm tra trùng tên và nhãn hiệu):

- **Offline File Toolbox: PDF, Image, Video** (tên gốc giữ từ khóa "PDF", thêm phạm vi mới)
- Hoặc giữ **Offline PDF Toolbox** ở 1.0 rồi đổi tên khi ra 1.1; Store cho đổi tên hiển thị nhưng sẽ mất một phần thứ hạng từ khóa, nên cách đầu an toàn hơn.

## 2. Phạm vi sản phẩm mới (thay thế bảng mục 5 gốc ở phần liên quan)

### Bảng Free và Pro cho tính năng mới

| Tính năng | Free | Pro |
| --- | --- | --- |
| Chuyển đổi và nén ảnh (F-11) | Tối đa 5 ảnh mỗi lần; WebP và JPG; không có AVIF | Không giới hạn số ảnh; tất cả định dạng; cả thư mục |
| Đổi cỡ ảnh, xóa EXIF | Có (xóa EXIF là điểm nhấn riêng tư, để miễn phí) | Có |
| PDF sang ảnh (F-12) | Tối đa 5 trang mỗi lần | Không giới hạn |
| Video: đổi đuôi và nén (F-13) | 1 video mỗi lần, tối đa 200 MB | Không giới hạn, nhiều video, preset |
| Hàng loạt thư mục, preset | Không có | Có |

Giữ một giấy phép Pro duy nhất mở khóa mọi module. Giá: vẫn 12,99 USD ở 1.0 và 1.1; khi có video (1.2) thử tăng lên 14,99 USD ở tháng thử giá, vì giá trị tăng rõ.

### Phạm vi theo phiên bản (điều chỉnh bảng gốc)

| Phiên bản | Nội dung bổ sung |
| --- | --- |
| 1.0 | Không đổi; chỉ chừa sẵn kiến trúc (mục 5) và thêm khung màn hình chính có ô "Sắp có" nếu muốn thu email quan tâm (không bắt buộc) |
| 1.1 | Xử lý hàng loạt (F-09 gốc), Chuyển đổi và nén ảnh (F-11), PDF sang ảnh (F-12), tiếng Việt và các ngôn ngữ khác như gốc |
| 1.2 | Video (F-13), nhận diện loại file khi thả vào (F-14), dấu trang và xóa siêu dữ liệu PDF như gốc |
| 2.0 | OCR, chữ ký hình ảnh, ARM64 như gốc; cân nhắc thêm chuyển văn bản/Markdown sang PDF nếu có yêu cầu |

## 3. Đặc tả tính năng mới

### F-11 Chuyển đổi và nén ảnh

| Mục | Đặc tả |
| --- | --- |
| Đầu vào | Kéo thả nhiều ảnh hoặc cả thư mục (có tùy chọn gồm thư mục con); JPG, PNG, WebP, AVIF, BMP, TIFF một trang, GIF tĩnh; HEIC theo mục 4 |
| Đầu ra | JPG, PNG, WebP, AVIF; mặc định WebP |
| Chất lượng | Ba mức: Nhỏ nhất, Cân bằng (mặc định), Chất lượng cao; hoặc thanh trượt 1 đến 100; ảnh PNG có tùy chọn "không mất chất lượng" |
| Đổi cỡ | Không đổi (mặc định), theo cạnh dài tối đa (ví dụ 2048 px), theo phần trăm; không phóng to ảnh nhỏ |
| Siêu dữ liệu | Hộp kiểm "Xóa EXIF và vị trí GPS" (mặc định bật, nói rõ trong giao diện); giữ hướng ảnh bằng cách áp dụng xoay vào điểm ảnh trước khi xóa EXIF |
| Trong suốt | PNG/WebP/AVIF có alpha khi sang JPG: hiện cảnh báo và cho chọn màu nền (mặc định trắng) |
| Ước lượng | Xử lý thử ảnh lớn nhất để hiện khoảng dung lượng sau nén, như F-03 |
| Không làm lớn hơn | Nếu ảnh đầu ra không nhỏ hơn gốc (khi nén cùng định dạng) thì giữ ảnh gốc, ghi vào báo cáo "đã tối ưu" |
| Tên đầu ra | Mẫu `{tên gốc}` + đuôi mới, trong thư mục kết quả `Converted/` cạnh nguồn; trùng tên thì thêm hậu tố; không bao giờ ghi đè |
| Báo cáo | Bảng: tên file, định dạng trước và sau, dung lượng trước và sau, phần trăm giảm, lỗi; nút xuất CSV; tổng dung lượng tiết kiệm |
| Song song | Dùng nhóm luồng của F-09, tối đa số nhân CPU trừ một, không quá 4 |
| Hiệu năng (mục tiêu, cần đo) | 100 ảnh JPG 12 MP sang WebP Cân bằng dưới 60 giây trên máy 4 nhân; AVIF chậm hơn nhiều, hiển thị thời gian ước tính |

Tiêu chí chấp nhận:
1. Số file đầu ra bằng số file đầu vào trừ các file lỗi hoặc được giữ nguyên, và báo cáo giải thích mọi chênh lệch.
2. Hướng ảnh đúng sau khi xóa EXIF (bộ ảnh thử có đủ 8 giá trị EXIF Orientation).
3. Ảnh trong suốt giữ nguyên độ trong suốt khi sang PNG, WebP, AVIF.
4. Hủy giữa chừng dừng trong vài giây và không để lại file nửa chừng.

### F-12 PDF sang ảnh

- Vẽ từng trang bằng PDF.js trong worker; xuất PNG hoặc JPG; chọn độ phân giải 72, 150, 300 dpi.
- Chọn dải trang như F-02; tên đầu ra `{tên gốc}_p{số trang}`; xuất vào thư mục con mới.
- Trang rất lớn (khổ A0, 600 dpi) phải được giới hạn kích thước điểm ảnh tối đa (ví dụ 16.000 px cạnh dài) và cảnh báo trước để tránh hết bộ nhớ.
- Không cố làm ngược lại "ảnh sang PDF có lớp chữ" (OCR là việc của 2.0).

### F-13 Video: đổi đuôi và nén nhẹ (bản 1.2)

| Chế độ | Mô tả | Ghi chú |
| --- | --- | --- |
| Đổi đuôi không mã hóa lại (remux) | Chuyển MKV, MOV, AVI sang MP4 khi codec bên trong tương thích | Gần như tức thì, không giảm chất lượng; nếu codec không tương thích thì báo rõ và gợi ý chế độ nén |
| Nén | Ba mức; chọn độ phân giải đích (gốc, 1080p, 720p); mã hóa H.264 bằng bộ mã hóa phần cứng nếu có | Phụ thuộc máy; có phương án dự phòng phần mềm |
| Chỉ lấy âm thanh | Trích âm thanh ra MP3 hoặc AAC | Tùy chọn, chi phí thấp khi đã có FFmpeg |

Quy tắc:
- FFmpeg chạy như tiến trình con đóng kèm (spawn, không dùng shell), đọc tiến độ từ đầu ra tiến độ của nó, hủy bằng cách giết tiến trình rồi dọn file tạm.
- Hiện ước lượng thời gian và dung lượng; nén video có thể mất nhiều phút nên phải có tiến độ thật và khả năng chạy nền khi cửa sổ thu nhỏ.
- Chỉ ghi file mới, kiểm tra đầu ra (mở được, thời lượng chênh lệch dưới 1 giây so với gốc) trước khi đổi tên vào đích.
- Giới hạn Free: 1 video mỗi lần, tối đa 200 MB.
- Không hứa hỗ trợ mọi định dạng; liệt kê rõ danh sách hỗ trợ trong giao diện và mô tả Store.

### F-14 Nhận diện loại file và đề xuất công cụ

Khi người dùng thả file vào màn hình chính, app đọc phần đầu file (không dựa riêng vào đuôi) và đề xuất công cụ phù hợp: PDF thì Gộp, Nén, Tách; ảnh thì Chuyển đổi ảnh, Ảnh sang PDF; video thì Nén video. Thả lẫn nhiều loại thì nhóm lại theo loại và hỏi muốn xử lý nhóm nào. Đây là tính năng làm cho app có cảm giác một công cụ thống nhất thay vì ba app dán lại.

## 4. Kiến trúc và giấy phép

### Thay đổi kiến trúc (bổ sung mục 9 và 10 gốc)

| Thành phần | Thay đổi |
| --- | --- |
| Hàng đợi tác vụ | Dùng nguyên; thêm loại tác vụ `image-convert`, `pdf-to-image`, `video-transcode` |
| `image-worker` | Mở rộng cho F-11 bằng sharp; PDF.js vẽ trang cho F-12 |
| Tiến trình con FFmpeg (mới, bản 1.2) | Đóng kèm trong `resources/ffmpeg/`; chạy riêng một tiến trình mỗi video, tối đa 1 đến 2 tiến trình song song vì rất nặng CPU/GPU |
| `FeatureGate` | Thêm bảng giới hạn mục 2; vẫn một nơi duy nhất |
| Báo cáo hàng loạt | Dùng chung bảng và xuất CSV của F-09 |
| Cấu trúc thư mục | Thêm `src/renderer/features/images`, `features/video`, `resources/ffmpeg` |

Quy tắc chung của mục 10 (thư mục tạm riêng, ghi tạm rồi kiểm tra rồi đổi tên, không ghi đè, hủy được) áp dụng nguyên cho các tính năng mới.

### Giấy phép và bằng sáng chế (cần xác minh trước khi đưa vào gói)

| Thành phần | Điểm cần kiểm tra |
| --- | --- |
| FFmpeg | Chỉ dùng bản dựng LGPL, chạy như tiến trình riêng, kèm thông báo và cách lấy mã nguồn. **Không** dùng bản dựng GPL (ví dụ có libx264) trong app bán đóng kín. Vì vậy dùng bộ mã hóa phần cứng (Media Foundation, NVENC, QuickSync, AMF) thay cho x264 |
| Bằng sáng chế codec | H.264 và HEVC có thể liên quan phí bản quyền khi phân phối bộ mã hóa riêng; dùng bộ mã hóa có sẵn của hệ điều hành/phần cứng giảm rủi ro nhưng không loại bỏ hoàn toàn. Nên tìm ý kiến người có chuyên môn pháp lý trước khi bán video. Mình không phải luật sư |
| HEIC | Bộ giải mã HEIC thường dựa trên HEVC, nhiều bản dựng sharp/libvips không có sẵn. Phương án: dùng bộ giải mã HEIF của Windows nếu máy đã cài tiện ích mở rộng, hoặc đưa HEIC sang bản sau và ghi rõ "HEIC cần tiện ích Windows" |
| AVIF | Mã hóa được trong sharp; chậm hơn, nên báo thời gian ước tính |
| libvips, sharp | Như đã ghi ở mục 9 gốc |
| Tránh | ImageMagick/Ghostscript/MuPDF nếu không đọc kỹ giấy phép từng bản dựng |

Dung lượng gói tăng đáng kể khi có FFmpeg; xem xét làm FFmpeg thành thành phần tải thêm sau khi người dùng bật tính năng video, nhưng việc tải đó là kết nối mạng và phải được nói rõ trong chính sách quyền riêng tư để câu "không dùng mạng khi xử lý tài liệu" vẫn đúng. Phương án đơn giản hơn: đóng kèm sẵn, chấp nhận gói lớn.

## 5. Giao diện

### Màn hình mới (bổ sung bảng mục 8)

| Mã | Màn hình | Mục đích | Thành phần chính |
| --- | --- | --- | --- |
| S-11 | Chuyển đổi và nén ảnh | F-11 | Danh sách ảnh có hình thu nhỏ và dung lượng; bảng bên phải: định dạng, chất lượng, đổi cỡ, xóa EXIF; ước lượng tổng dung lượng; nút Chuyển đổi |
| S-12 | PDF sang ảnh | F-12 | Lưới trang, chọn dpi và định dạng, nút Xuất |
| S-13 | Nén video | F-13 | Danh sách video, chế độ (đổi đuôi, nén), độ phân giải, mức chất lượng, thời gian ước tính, tiến độ |

### Màn hình chính S-01 mới

- Ba tab theo nhóm: **PDF**, **Ảnh**, **Video** (tab Video ẩn đến bản 1.2). Mỗi tab hiện lưới ô công cụ của nhóm.
- Vùng thả tệp lớn dùng chung theo F-14.
- Dải ghi "Xử lý trên máy bạn" giữ nguyên ở mọi màn hình.

Mọi quy tắc giao diện cũ (nhắc nâng cấp một lần mỗi phiên, thông báo giới hạn trước khi chạy, lỗi dễ hiểu, phím tắt, tiếp cận) giữ nguyên. Thêm một nguyên tắc: khi nén hoặc chuyển đổi, luôn hiện dung lượng trước, sau và tổng tiết kiệm; đây là phần thưởng thị giác mạnh nhất của loại công cụ này và là nội dung ảnh quảng bá tốt.

## 6. Kiểm thử, rủi ro, Store

### Bộ file kiểm thử thêm (bổ sung mục 15)

| Nhóm | Mô tả | Số tệp tối thiểu |
| --- | --- | --- |
| Ảnh đời thực | JPG từ điện thoại có đủ 8 hướng EXIF, có GPS; PNG có và không có alpha; WebP, AVIF, GIF tĩnh; TIFF; ảnh rất lớn (100 MP); ảnh hỏng | 20 |
| HEIC | Nếu hỗ trợ (mục 4) | 3 |
| Video | MP4 H.264, MKV, MOV, AVI; có và không có âm thanh; 4K; file hỏng; tên tiếng Việt | 8 |

### Ca kiểm thử chấp nhận mới

| Mã | Kịch bản | Kết quả mong đợi |
| --- | --- | --- |
| T-13 | Chuyển 50 ảnh JPG sang WebP ở mức Cân bằng | Đủ 50 file, tổng dung lượng giảm, báo cáo đúng |
| T-14 | Ảnh điện thoại có EXIF xoay, xóa EXIF | Hướng đúng, không còn GPS (kiểm bằng công cụ đọc EXIF) |
| T-15 | PNG trong suốt sang JPG | Cảnh báo, nền đúng màu đã chọn |
| T-16 | Nén lại ảnh đã tối ưu | Giữ nguyên ảnh gốc, ghi "đã tối ưu" |
| T-17 | Hủy khi đang xử lý 500 ảnh | Dừng trong vài giây, không file nửa chừng |
| T-18 | PDF 20 trang sang PNG 150 dpi | Đủ 20 ảnh, đúng thứ tự và kích thước |
| T-19 | Ngắt mạng rồi chạy mọi công cụ ảnh | Hoạt động bình thường, không yêu cầu mạng |
| T-20 | Remux MKV sang MP4 (bản 1.2) | Nhanh, thời lượng khớp, phát được trên Edge và Windows Media Player |
| T-21 | Nén video 1 GB (bản 1.2) | Nhỏ hơn rõ rệt, hủy được, không để file tạm |
| T-22 | Thả lẫn PDF, ảnh, video | Đề xuất đúng công cụ theo nhóm |

### Rủi ro mới (bổ sung bảng mục 18)

| Mã | Rủi ro | Xác suất | Tác động | Biện pháp |
| --- | --- | --- | --- | --- |
| R-15 | Giấy phép FFmpeg hoặc bằng sáng chế codec không phù hợp bán đóng kín | Vừa | Cao | Chỉ dùng bản LGPL; mã hóa phần cứng; xin ý kiến pháp lý trước khi phát hành video |
| R-16 | Mở rộng phạm vi làm trễ bản 1.0 | Cao | Cao | Chỉ làm ảnh và video sau 1.0; giữ thứ tự cắt giảm mục 16 gốc |
| R-17 | Thông điệp loãng: người dùng không hiểu app làm gì | Vừa | Vừa | Ba tab rõ ràng; trang Store nói PDF trước, ảnh sau; mỗi ảnh chụp một lợi ích |
| R-18 | Thiếu bộ mã hóa phần cứng trên máy khách, video nén rất chậm | Vừa | Vừa | Phát hiện bộ mã hóa khi khởi chạy; cảnh báo thời gian; cho phép hủy |
| R-19 | Hết bộ nhớ với ảnh hoặc trang cực lớn | Vừa | Vừa | Giới hạn kích thước điểm ảnh, xử lý tuần tự file lớn, cảnh báo trước |
| R-20 | Cạnh tranh trực tiếp với công cụ ảnh/video miễn phí | Cao | Vừa | Định vị theo riêng tư và thao tác hàng loạt đơn giản; đánh giá đối thủ ở tuần 0 |

### Store và từ khóa (bổ sung mục 14)

Từ khóa thêm cho 1.1 (kiểm tra lượng tìm kiếm thật trong Store trước): `image converter`, `compress image`, `png to webp`, `jpg to webp`, `avif converter`, `heic to jpg` (chỉ khi hỗ trợ), `bulk image converter`, `pdf to jpg`, `pdf to png`. Cho 1.2: `video compressor`, `mp4 converter`, `compress video`, `mkv to mp4`. Không nhồi từ khóa của tính năng chưa có: mô tả phải khớp đúng với bản phát hành thật.

Mô tả Store 1.1 nên nhắc ý: "Convert and compress images in bulk. EXIF and GPS data can be removed. Everything stays on your PC."

## 7. Lộ trình điều chỉnh

### Phương án khuyến nghị: 1.0 giữ nguyên 10 tuần, thêm hai giai đoạn sau

| Giai đoạn | Tuần | Việc | Cổng kiểm tra |
| --- | --- | --- | --- |
| Tuần 0 (làm cùng tuần 1) | 1 | Thêm vào báo cáo đối thủ: cài 3 app đổi ảnh và 3 app nén video; ghi tốc độ, dung lượng sau nén, giao diện, giá, phàn nàn lặp lại | Báo cáo đối thủ có phần ảnh/video; quyết định tên sản phẩm |
| Bản 1.1: Hàng loạt và ảnh | 11 đến 14 | F-09 xử lý hàng loạt; F-11; F-12; giao diện tab; thêm ngôn ngữ; cập nhật mô tả Store | Qua T-13 đến T-19; WACK sạch; kiểm thử ngoại tuyến |
| Bản 1.2: Video | 15 đến 20 | Đánh giá giấy phép FFmpeg; F-13; F-14; thử tăng giá | Qua T-20 đến T-22; xác nhận pháp lý về codec |

### Phương án B: đưa ảnh vào 1.0 (11 tuần)

Thêm một tuần giữa tuần 7 và 8 cho F-11 bản rút gọn (chuyển đổi, nén, đổi cỡ, xóa EXIF; chưa có thư mục hàng loạt vì F-09 vẫn ở 1.1). Cái giá: dồn thêm rủi ro vào mốc phát hành đầu và kéo thêm nhiều ca kiểm thử. Chỉ nên chọn nếu bạn đã hoàn tất F-03 (nén PDF) đúng hạn.

### Ước tính công sức thêm (không tính trong 150 đến 200 giờ của 1.0)

| Hạng mục | Giờ ước tính |
| --- | --- |
| F-11 ảnh (không tính F-09) | 25 đến 35 |
| F-12 PDF sang ảnh | 10 đến 15 |
| F-14 nhận diện loại file | 8 đến 12 |
| F-13 video, gồm giấy phép và kiểm thử | 40 đến 60 |
| Cập nhật Store, ảnh chụp, bản dịch cho phạm vi mới | 10 đến 15 |

Đây là ước tính thô, cần chỉnh sau khi làm xong 1.0.

## 8. Doanh thu

Ba kịch bản ở mục 17 gốc không đổi và không tính phần tăng thêm. Hai tác động có thể xảy ra nhưng chưa thể đo trước: lượt cài tăng nhờ từ khóa mới (ảnh có nhu cầu tìm kiếm lớn nhưng cạnh tranh cao), và giá Pro có thể tăng lên 14,99 USD khi có video. Đừng cộng thêm doanh thu vào kế hoạch cho đến khi có dữ liệu Partner Center của bản 1.0.

## 9. Danh sách sửa từng mục của đặc tả gốc

| Mục gốc | Cần sửa |
| --- | --- |
| Tiêu đề, mục 1 | Tên sản phẩm theo quyết định mục 1; thêm một dòng nói sản phẩm mở rộng sang ảnh và video sau 1.0; không đổi mục tiêu 1.0 |
| 1, nguyên tắc "Offline thật sự" | Giữ nguyên, thêm "áp dụng cho mọi loại file" |
| 2 | Thêm nhóm đối thủ công cụ ảnh/video (Squoosh, XnConvert, HandBrake, FFmpeg) và dòng R-20 |
| 3 | Thêm hai chân dung: người làm sáng tạo/chủ shop online (nén và đổi ảnh hàng loạt, cần xóa vị trí GPS), nhân viên bất động sản hoặc nhiếp ảnh (nhiều ảnh, gửi khách); thêm UC-10 đến UC-12: nén thư mục ảnh, đổi HEIC/PNG sang JPG/WebP, PDF sang ảnh |
| 4 | Câu định vị 1.0 giữ nguyên; thêm câu định vị cho bản 1.1 "PDF và ảnh"; mục "Điều không làm" thêm: chuyển DOCX/PDF sang Word, chỉnh sửa video |
| 5 | Thêm bảng mục 2 và phạm vi theo phiên bản của mục này |
| 6, 7 | Thêm F-11 đến F-14 (mục 3 của tài liệu này) |
| 8 | Thêm S-11 đến S-13; sửa S-01 thành ba tab |
| 9 | Thêm các dòng ở bảng "Thay đổi kiến trúc"; thêm FFmpeg và HEIC vào bảng giấy phép |
| 10 | Mô hình tác vụ và quy tắc chung áp dụng nguyên; thêm mục tiêu hiệu năng ảnh/video khi đo được |
| 11 | Cập nhật bảng cam kết: "mọi file", không chỉ tài liệu; thêm mối đe dọa: file ảnh/video độc hại làm sập bộ giải mã, biện pháp như với PDF (tiến trình riêng, sandbox) |
| 12 | Thêm giới hạn Free mới; một giấy phép Pro duy nhất; thử giá 14,99 USD khi có video |
| 13 | Cập nhật mô tả và ảnh chụp theo từng bản; kiểm tra xem Store có yêu cầu khai báo gì thêm khi đóng kèm FFmpeg |
| 14 | Thêm từ khóa mục 6; ba tab trong ảnh chụp màn hình |
| 15 | Thêm bộ file và ca kiểm thử mục 6 |
| 16 | Thêm giai đoạn 1.1 và 1.2 mục 7; thứ tự cắt giảm giữ nguyên |
| 17 | Giữ nguyên số liệu; thêm ghi chú mục 8 |
| 18 | Thêm R-15 đến R-20 |
| 19.D | Thêm Prompt 5 (ảnh) và Prompt 6 (video) bên dưới |

## 10. Lời nhắc mẫu cho AI lập trình

**Prompt 5: Chuyển đổi và nén ảnh (F-11, F-12)**

```text
Cài đặt F-11 và F-12 theo mục 3 của tài liệu tích hợp, dùng lại hàng đợi tác vụ, nhóm worker, FeatureGate và báo cáo hàng loạt đã có.
Dùng sharp trong image-worker; PDF.js trong worker cho PDF sang ảnh. Không nạp cả thư mục vào bộ nhớ: xử lý tuần tự với giới hạn song song.
Quy tắc: ghi file tạm rồi kiểm tra rồi đổi tên; không bao giờ ghi đè; không xuất nếu không nhỏ hơn gốc; áp dụng xoay EXIF vào điểm ảnh trước khi xóa EXIF; cảnh báo khi ảnh có alpha sang JPG.
Viết kiểm thử tự động cho T-13 đến T-19 bằng bộ file tests/fixtures/images, gồm kiểm tra hướng ảnh và kiểm tra không còn GPS.
```

**Prompt 6: Video (F-13), chỉ làm sau khi giấy phép được xác nhận**

```text
Cài đặt F-13 theo mục 3 của tài liệu tích hợp. FFmpeg là bản dựng LGPL đóng kèm, chạy như tiến trình con (spawn, không shell), tối đa 2 tiến trình song song.
Chế độ remux và nén bằng bộ mã hóa phần cứng; phát hiện bộ mã hóa khi khởi chạy và có phương án dự phòng.
Tiến độ lấy từ đầu ra tiến độ của FFmpeg; hủy bằng cách dừng tiến trình và dọn file tạm; kiểm tra đầu ra (mở được, thời lượng khớp) trước khi đổi tên vào đích.
Viết kiểm thử cho T-20 và T-21; không thêm định dạng ngoài danh sách đã công bố.
```
