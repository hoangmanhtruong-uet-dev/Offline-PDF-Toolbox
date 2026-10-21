# Offline PDF Toolbox — Đặc tả sản phẩm và kế hoạch phát hành Microsoft Store

Oct 20, 2026 · @Hoàng Trường

Offline PDF Toolbox là ứng dụng Windows gộp, tách, nén, xoay PDF hoàn toàn trên máy, không tải tệp lên mạng, bán trên Microsoft Store theo kiểu dùng thử giới hạn rồi mua đứt.

## 1. Tóm tắt điều hành

Mục tiêu của dự án là phát hành trên Microsoft Store, trong 10 tuần, một bộ công cụ PDF chạy hoàn toàn trên máy với bốn việc cốt lõi: gộp, tách, nén và xoay. Sức bán của sản phẩm nằm ở một lời hứa duy nhất: tài liệu của khách hàng không bao giờ rời khỏi máy tính của họ.

| Hạng mục | Nội dung |
| --- | --- |
| Tên tạm | Offline PDF Toolbox (cần kiểm tra trùng tên khi giữ chỗ trên Store) |
| Nền tảng | Windows 10 (22H2) và Windows 11, x64 ở bản đầu, ARM64 ở bản sau |
| Tính năng lõi | Gộp, tách, nén, xoay PDF; thêm sắp xếp, xóa, trích trang |
| Khách hàng mục tiêu | Luật sư, kế toán, nhân sự, nhân viên y tế, phòng hành chính ở Mỹ và châu Âu |
| Thu phí | Dùng thử giới hạn, sau đó mua đứt 12,99 USD (đề xuất), có thể thêm gói 1,99 USD/tháng |
| Công nghệ đề xuất | Electron, React, TypeScript, pdf-lib, PDFium (chi tiết ở mục 9) |
| Nhân sự | 1 lập trình viên chính (bạn) có AI hỗ trợ viết mã |
| Chi phí khởi đầu | Gần như bằng 0: phí đăng ký tài khoản nhà phát triển đã được Microsoft miễn |

### Vì sao đáng làm

- Nhu cầu có thật và lặp lại hằng ngày: gộp hợp đồng, tách trang scan, nén tệp để gửi email.
- Lời hứa "offline" là thứ các web miễn phí không thể nói, và Adobe Acrobat nặng và đắt hơn nhiều so với nhu cầu của người chỉ cần bốn thao tác.
- Mua đứt một lần là mô hình khách văn phòng dễ chấp nhận, vì họ ngại thêm một khoản thuê bao nữa.
- Chi phí vận hành thấp: không máy chủ, không lưu dữ liệu người dùng, nên không có chi phí hạ tầng theo số người dùng.

### Điều cần nói thẳng ngay từ đầu

Ý tưởng được chấm "thu nhập cao nhất" trong danh sách của bạn, nhưng đây là thị trường rất đông đối thủ miễn phí. Doanh thu không tự đến chỉ vì từ khóa có lượng tìm kiếm lớn; nó đến từ việc app nén tốt hơn, gộp nhanh hơn và dễ tin hơn các lựa chọn miễn phí. Mục 2 phân tích kỹ phần này, và các con số doanh thu ở mục 17 là kịch bản giả định, không phải dự báo chắc chắn.

### Mục tiêu 90 ngày sau phát hành

| Chỉ số | Mức tối thiểu | Mức tốt |
| --- | --- | --- |
| Lượt cài đặt | 1.500 | 5.000 |
| Tỷ lệ chuyển đổi từ dùng thử sang trả tiền | 1,5% | 3% |
| Điểm đánh giá trên Store | 4,2 sao | 4,6 sao |
| Tỷ lệ phiên bị lỗi (crash) | dưới 1% | dưới 0,3% |
| Số đánh giá đã có | 25 | 80 |

### Năm nguyên tắc sản phẩm

1. **Offline thật sự**: không gửi tệp, không gửi nội dung tệp, không gọi mạng khi xử lý tài liệu.
2. **Ba cú nhấp là xong**: chọn tệp, chọn tùy chọn, bấm chạy.
3. **Không làm hỏng tệp gốc**: luôn ghi ra tệp mới, không bao giờ ghi đè.
4. **Nhanh và nhẹ**: mở app dưới 3 giây, gộp 100 trang dưới 5 giây trên máy tầm trung.
5. **Minh bạch về giới hạn**: bản dùng thử nói rõ giới hạn trước khi người dùng làm xong việc, không chặn ở bước cuối.

## 2. Đánh giá thực tế ý tưởng

Ý tưởng đúng hướng ở lý do cần có (riêng tư dữ liệu, không muốn thuê bao), nhưng "offline" không còn là điểm độc nhất: đã có công cụ PDF miễn phí chạy offline trên Windows. Sản phẩm chỉ bán được nếu thắng ở độ tin cậy, tốc độ, chất lượng nén và sự đơn giản.

### Bức tranh đối thủ

Bảng dưới là hiểu biết chung của mình về thị trường, chưa được kiểm chứng lại bằng số liệu mới. Trước khi viết mã, bạn nên cài từng đối thủ và tự đánh giá (xem checklist ở mục 15).

| Nhóm đối thủ | Ví dụ | Mô hình thu phí | Điểm yếu có thể khai thác | Mức đe dọa |
| --- | --- | --- | --- | --- |
| Web miễn phí | iLovePDF, Smallpdf | Miễn phí giới hạn, thuê bao | Phải tải tệp lên máy chủ; giới hạn dung lượng và số lần dùng | Trung bình (đúng nhóm "không dám tải lên") |
| Bộ công cụ nặng | Adobe Acrobat | Thuê bao hằng tháng | Giá cao, cài đặt nặng, thừa tính năng so với nhu cầu | Thấp với nhóm chỉ cần 4 thao tác |
| Ứng dụng desktop miễn phí | PDF24 Creator, PDFgear | Miễn phí, kiếm tiền từ cách khác | Giao diện nhiều tính năng, đôi khi rối; người dùng Mỹ và EU ít tin tưởng hãng lạ | Cao nhất |
| Trình duyệt và hệ điều hành | Microsoft Edge, in ra PDF | Miễn phí | Chỉ có thao tác cơ bản, nén hầu như không có | Trung bình |
| Ứng dụng trả phí trên Store | Nhiều app "PDF Merger" giá 5 đến 30 USD | Mua đứt hoặc thuê bao | Chất lượng không đều, đánh giá thấp, giao diện cũ | Trung bình (cạnh tranh trực tiếp trên từ khóa) |

### Điểm mạnh thật của hướng đi này

- Nhóm khách hàng có lý do hợp lý để trả tiền: họ xử lý hồ sơ nhạy cảm và không muốn thêm thuê bao.
- Một app nhỏ, rõ ràng, một mục đích dễ được hỏi, dễ được giới thiệu trong văn phòng.
- Bán qua Microsoft Store giải quyết thanh toán, cập nhật, và phần nào niềm tin (có chữ ký, có kiểm duyệt).
- Bạn không tốn chi phí máy chủ, nên điểm hòa vốn gần như bằng thời gian của bạn.

### Rủi ro doanh thu cần tính trước

1. **Đối thủ miễn phí chạy offline**: người dùng chỉ cần một lần gặp phải giới hạn của bản dùng thử là chuyển sang PDF24 hay PDFgear.
2. **Chuyển đổi từ dùng thử sang trả tiền thường thấp** với công cụ tiện ích; con số 1% đến 3% ở mục 1 là mục tiêu, không phải điều chắc chắn.
3. **Khả năng được tìm thấy**: từ khóa nhiều lượt tìm kiếm cũng có nghĩa là hàng chục app đang tranh nhau; thứ hạng phụ thuộc vào lượt cài, đánh giá và tốc độ cập nhật.
4. **Chênh lệch thị trường**: khách ở Mỹ và EU kỳ vọng ngôn ngữ, bản địa hóa, trang chính sách quyền riêng tư và hỗ trợ bằng tiếng Anh ở mức chuyên nghiệp.
5. **Cam kết tuân thủ**: một ứng dụng không thể tự gọi mình "tuân thủ HIPAA" hay "tuân thủ GDPR"; chỉ có thể nói rõ nó không gửi dữ liệu đi đâu (mục 11).

### Kết luận và cách giảm rủi ro

Nên làm, nhưng theo hướng kiểm chứng sớm và chi ít tiền thời gian nhất:

- Tuần 0: dùng thử 5 đối thủ, ghi lại 10 điểm họ làm kém (tốc độ, nén, giao diện, quảng cáo, yêu cầu tài khoản).
- Tuần 4: ra bản MVP gộp và xoay cho vài người thử thật (nhóm kế toán, luật, trường học quen biết).
- Tuần 10: phát hành bản đầy đủ lên Store, tiếp tục cập nhật hai tuần một lần trong hai tháng đầu để giữ thứ hạng.
- Đặt điều kiện dừng: nếu sau 90 ngày dưới 500 lượt cài tự nhiên và chưa có đơn trả tiền nào, đổi hướng định vị (ví dụ nhắm riêng một nghề) thay vì thêm tính năng.

## 3. Chân dung người dùng và tình huống sử dụng

Bốn nhóm người dùng đầu tiên cần phục vụ tốt, xếp theo khả năng trả tiền. Mọi quyết định về giao diện và tính năng ở các mục sau đều phải trả lời được câu hỏi: nhóm nào cần việc này, và họ làm nó bao lâu một lần?

### Bốn chân dung chính

| Chân dung | Nghề và bối cảnh | Việc hay làm với PDF | Nỗi lo chính | Sẵn sàng trả |
| --- | --- | --- | --- | --- |
| Dana, trợ lý pháp lý | Văn phòng luật nhỏ tại Mỹ, xử lý hợp đồng và hồ sơ vụ án | Gộp phụ lục vào hợp đồng, tách trích đoạn nộp tòa, nén để gửi email | Hồ sơ thuộc đặc quyền luật sư không được lên máy chủ lạ | 10 đến 20 USD một lần |
| Marco, kế toán độc lập | Công ty kế toán 3 người tại Đức, nhiều hóa đơn scan | Gộp hóa đơn theo tháng, tách báo cáo theo khách hàng, xoay trang scan bị ngược | Dữ liệu tài chính khách hàng, yêu cầu GDPR | 10 đến 15 USD một lần |
| Dr. Patel, nhân viên phòng khám | Phòng khám tư tại Mỹ, hồ sơ bệnh án scan | Gộp kết quả xét nghiệm, tách trang theo bệnh nhân, nén để gửi bảo hiểm | Thông tin sức khỏe bệnh nhân (quy định HIPAA) | 10 đến 15 USD một lần, thường do phòng khám chi trả |
| Linh, nhân sự hoặc hành chính | Công ty vừa, đóng gói hồ sơ nhân viên và hợp đồng lao động | Gộp hồ sơ ứng viên, nén tệp lớn, xoay trang | Hồ sơ cá nhân nhân viên; muốn công cụ nhanh, không rắc rối | 5 đến 10 USD một lần |

Con số "sẵn sàng trả" là giả định để định giá ban đầu; cần kiểm chứng bằng phản hồi thật sau khi có bản thử.

### Các tình huống sử dụng chính

| Mã | Tình huống | Tần suất | Tính năng liên quan |
| --- | --- | --- | --- |
| UC-01 | Gộp 10 đến 50 tệp thành một hồ sơ trọn gói theo thứ tự chọn trước | Hằng tuần | Gộp |
| UC-02 | Tách một tệp lớn thành từng chương hoặc từng bệnh nhân theo khoảng trang | Hằng tuần | Tách |
| UC-03 | Nén tệp 40 MB xuống dưới 10 MB để đính kèm email | Hằng ngày | Nén |
| UC-04 | Sửa trang scan bị xoay ngược hoặc nằm ngang | Hằng tuần | Xoay |
| UC-05 | Trích 3 trang cần thiết để gửi cho bên thứ ba | Hằng tuần | Trích trang |
| UC-06 | Xóa trang trống hoặc trang bìa thừa | Hằng tuần | Xóa trang |
| UC-07 | Đặt mật khẩu trước khi gửi hồ sơ nhạy cảm | Thỉnh thoảng | Mật khẩu |
| UC-08 | Chuyển nhiều ảnh scan thành một PDF | Thỉnh thoảng | Ảnh sang PDF |
| UC-09 | Xử lý hàng loạt cả một thư mục theo cùng một thao tác | Hằng tháng | Xử lý hàng loạt (bản Pro) |

### Điều người dùng kỳ vọng chung

- Kéo thả tệp vào cửa sổ là bắt đầu làm việc, không cần tạo tài khoản, không cần đăng nhập.
- Biết trước kết quả: xem trước từng trang, ước lượng dung lượng sau khi nén.
- Kết quả lưu cạnh tệp gốc với tên rõ nghĩa, tệp gốc luôn còn nguyên.
- Thấy rõ bằng chứng "không dùng mạng": một dòng trạng thái luôn hiển thị, cùng giải thích ngắn trong phần Giới thiệu.
- Bàn phím và trình đọc màn hình dùng được, vì khách văn phòng ở Mỹ và EU quan tâm đến khả năng tiếp cận.

## 4. Định vị sản phẩm và điểm khác biệt

Định vị cần ngắn đến mức đặt được trong tiêu đề trang Store: công cụ PDF cho người xử lý tài liệu nhạy cảm, chạy hoàn toàn trên máy, trả tiền một lần.

### Câu định vị

Dành cho người làm việc với hợp đồng, hồ sơ tài chính và hồ sơ y tế, Offline PDF Toolbox là bộ công cụ gộp, tách, nén, xoay PDF xử lý toàn bộ trên máy tính, không cần tài khoản, không tải tệp lên mạng và chỉ trả tiền một lần, khác với các web PDF miễn phí và các gói thuê bao đắt đỏ.

### Năm điểm khác biệt cần thể hiện được bằng sản phẩm

| Điểm khác biệt | Thể hiện bằng sản phẩm | Cách chứng minh với khách |
| --- | --- | --- |
| Offline thật | Không có mã gọi mạng trong luồng xử lý; có chế độ kiểm tra "Chạy khi ngắt mạng" | Dòng trạng thái "Xử lý trên máy bạn"; trang giải thích; ảnh chụp thao tác khi tắt Wi-Fi |
| Nén tốt, kiểm soát được | Ba mức nén và ước lượng dung lượng trước khi chạy | So sánh dung lượng trước và sau trong ảnh quảng bá |
| Nhanh và nhẹ | Xử lý song song nền, không đơ giao diện | Số liệu đo trong mô tả Store (ví dụ gộp 100 trang dưới 5 giây) |
| Không làm hỏng tệp | Luôn xuất ra tệp mới; kiểm tra tệp đầu ra trước khi báo thành công | Cam kết ghi trong mô tả |
| Mua đứt, không phiền | Không quảng cáo, không đăng nhập, không bắt thuê bao | Giá hiển thị rõ ngay trên trang Store |

### Điều không làm ở giai đoạn đầu

Giữ app nhỏ là một lợi thế. Các thứ sau cố ý để ngoài bản đầu để không thành bản sao của Acrobat:

- Chỉnh sửa nội dung văn bản trong PDF.
- Nhận dạng chữ (OCR) và chuyển PDF sang Word.
- Chữ ký số có chứng thư và điền biểu mẫu nâng cao.
- Tính năng đám mây, đồng bộ, tài khoản, cộng tác.

OCR và chữ ký là hai ứng viên tự nhiên cho bản 2.0 nếu khách yêu cầu nhiều (mục 5).

### Tên gọi và nhận diện

- Tên hiển thị trên Store nên chứa từ khóa chính bằng tiếng Anh, ví dụ "Offline PDF Toolbox: Merge, Split, Compress".
- Tránh dùng từ "Adobe", "Acrobat", "PDF" kèm logo gây nhầm lẫn; từ "PDF" là tên định dạng nên dùng được trong tên mô tả, nhưng không dùng thiết kế giống sản phẩm của hãng khác.
- Biểu tượng đơn giản, nhìn rõ ở kích thước 44x44 điểm ảnh: một tờ giấy có ổ khóa nhỏ để gợi sự riêng tư.
- Bảng màu một màu chủ đạo (xanh đậm gợi sự tin cậy) cộng màu nhấn cho nút hành động chính.

## 5. Phạm vi sản phẩm: Free, Pro, MVP và các bản sau

Bản 1.0 làm sáu việc thật tốt rồi mới mở rộng. Giới hạn của bản dùng thử được thiết kế để người dùng hoàn thành được một việc nhỏ và thấy chất lượng, nhưng chạm giới hạn ngay khi dùng cho công việc thật.

### Bảng Free và Pro

Bạn đề xuất giới hạn kiểu "gộp tối đa 2 tệp" hoặc "5 trang". Mình giữ ý đó và điều chỉnh để giới hạn nằm ở số lượng, không nằm ở chất lượng kết quả (không đóng dấu chìm lên tệp xuất ra, vì dấu chìm dễ gây đánh giá một sao).

| Tính năng | Free (dùng thử) | Pro (mua đứt hoặc thuê bao) |
| --- | --- | --- |
| Gộp PDF | Tối đa 2 tệp mỗi lần | Không giới hạn số tệp |
| Tách PDF | Xuất tối đa 5 trang mỗi lần | Không giới hạn |
| Nén PDF | 1 tệp mỗi lần, mức Nhẹ và Vừa, tệp đầu vào tối đa 20 MB | Cả ba mức, tệp lớn tới giới hạn bộ nhớ |
| Xoay PDF | Xoay trang trong 1 tệp, tối đa 10 trang mỗi lần | Không giới hạn |
| Sắp xếp, xóa, trích trang | Xem trước và sắp xếp được; xuất tối đa 5 trang | Không giới hạn |
| Đặt mật khẩu | Không có | Có (mã hóa AES-256) |
| Ảnh sang PDF | Tối đa 3 ảnh mỗi lần | Không giới hạn |
| Xử lý hàng loạt cả thư mục | Không có | Có |
| Cài đặt lưu thao tác dùng lại (preset) | Không có | Có |
| Hỗ trợ | Qua email, ưu tiên thấp | Qua email, ưu tiên cao |

### Phạm vi theo phiên bản

| Phiên bản | Mục tiêu | Nội dung chính | Tuần dự kiến |
| --- | --- | --- | --- |
| 0.5 (nội bộ) | Chứng minh xử lý đúng | Gộp, xoay, khung giao diện, xem trước trang | Tuần 4 |
| 1.0 (MVP phát hành) | Đủ để bán | Gộp, tách, nén, xoay, sắp xếp/xóa/trích trang, ảnh sang PDF, đặt và gỡ mật khẩu, giấy phép Pro, Store listing | Tuần 10 |
| 1.1 | Giữ thứ hạng, giảm lỗi | Sửa lỗi từ phản hồi thật, xử lý hàng loạt, preset, thêm tiếng Việt và các ngôn ngữ khác | Tuần 12 đến 14 |
| 1.2 | Mở rộng nhóm khách | Xóa siêu dữ liệu, che nội dung (redaction) cơ bản, dấu trang (bookmark) khi gộp | Tuần 16 đến 20 |
| 2.0 | Phiên bản lớn | OCR offline cho tệp scan, chữ ký hình ảnh, ARM64 | Sau 6 tháng nếu doanh thu hỗ trợ |

### Tiêu chí hoàn thành MVP (Definition of Done)

1. Sáu tính năng lõi chạy đúng trên bộ tệp kiểm thử ở mục 15, không làm hỏng tệp.
2. Cài và gỡ sạch qua Store, không để lại tệp rác.
3. Giới hạn Free hoạt động đúng, mua Pro mở khóa ngay mà không cần khởi động lại.
4. Không có mã gọi mạng trong luồng xử lý tài liệu (có bài kiểm tra tự động xác nhận).
5. Qua bộ kiểm tra Windows App Certification Kit và vượt kiểm duyệt của Store.
6. Có trang quyền riêng tư, trang hỗ trợ và ít nhất 4 ảnh chụp màn hình đúng yêu cầu Store.

## 6. Đặc tả chi tiết bốn tính năng lõi

Mỗi tính năng dưới đây có mã (F-01 đến F-04) để dùng trong backlog và kiểm thử. Quy tắc chung cho mọi tính năng: không ghi đè tệp gốc, xử lý trong luồng nền, hiện tiến độ theo phần trăm, cho phép hủy giữa chừng và dọn tệp tạm khi kết thúc hoặc hủy.

### F-01 Gộp PDF

| Mục | Đặc tả |
| --- | --- |
| Đầu vào | Kéo thả hoặc chọn nhiều tệp PDF, hoặc cả một thư mục; chấp nhận thêm tệp vào danh sách bất cứ lúc nào |
| Danh sách tệp | Mỗi dòng có tên, số trang, dung lượng, hình thu nhỏ trang đầu; kéo để đổi thứ tự; nút xóa khỏi danh sách; sắp xếp nhanh theo tên, ngày sửa, dung lượng |
| Chọn trang từng tệp | Ô nhập dải trang như `1-3, 7, 10-` ; mặc định là tất cả; báo lỗi ngay nếu dải trang vượt số trang |
| Tệp có mật khẩu | Hiện biểu tượng khóa, hỏi mật khẩu khi thêm tệp; mật khẩu chỉ giữ trong bộ nhớ, không lưu |
| Tệp lỗi | Báo tên tệp và lý do dễ hiểu (hỏng, không phải PDF, bị mã hóa chưa mở được); cho phép bỏ qua tệp đó và tiếp tục |
| Đầu ra | Một tệp mới; tên mặc định `Merged_YYYY-MM-DD.pdf`; chọn thư mục lưu; hộp kiểm "Mở thư mục sau khi xong" |
| Siêu dữ liệu | Tiêu đề lấy từ tên tệp đầu ra; tác giả để trống; không sao chép siêu dữ liệu từ tệp nguồn |
| Dấu trang | Bản 1.0 giữ trang nguyên vẹn; dấu trang theo tên tệp thêm ở bản 1.2 |
| Hiệu năng | Gộp 50 tệp, tổng 2.000 trang, dưới 30 giây trên máy 8 GB RAM; bộ nhớ đỉnh dưới 1 GB |

Tiêu chí chấp nhận:

1. Thứ tự trang trong tệp đầu ra đúng thứ tự trong danh sách.
2. Kích thước và hướng từng trang được giữ nguyên, kể cả khi các tệp khác khổ giấy.
3. Văn bản vẫn chọn và tìm kiếm được; phông chữ hiển thị đúng.
4. Giới hạn Free (2 tệp) chặn đúng lúc, có thông báo hướng dẫn nâng cấp và không mất danh sách đã chọn.

### F-02 Tách PDF

| Chế độ | Mô tả | Ví dụ |
| --- | --- | --- |
| Theo khoảng trang | Người dùng nhập các khoảng; mỗi khoảng thành một tệp | `1-3, 5, 8-10` ra 3 tệp |
| Mỗi N trang | Cắt đều theo số trang | Mỗi 10 trang một tệp |
| Mỗi trang một tệp | Tách rời hoàn toàn | 40 trang ra 40 tệp |
| Theo dấu trang cấp 1 | Dùng mục lục của tệp nếu có | Mỗi chương một tệp |
| Theo dung lượng tối đa | Mỗi phần không vượt quá giới hạn MB | Mỗi phần tối đa 10 MB để gửi email |
| Trích trang | Chỉ lấy các trang đã chọn thành một tệp duy nhất | Trang 4, 9, 12 thành một tệp |

Quy tắc: đặt tên đầu ra theo mẫu `{tên gốc}_{số thứ tự}` hoặc `{tên gốc}_p{từ}-{đến}`; cho phép sửa mẫu; xuất vào một thư mục con mới để không lẫn với tệp khác; xem trước bằng lưới hình thu nhỏ có thể nhấp để chọn trang. Chế độ "theo dung lượng" dùng ước lượng theo từng trang và kiểm tra lại sau khi ghi, nếu một phần vượt giới hạn thì lùi một trang rồi ghi lại.

Tiêu chí chấp nhận: tổng số trang của các tệp đầu ra bằng số trang đã chọn; không trang nào bị lặp hoặc mất; tệp đầu ra mở được bằng Edge, Chrome và Acrobat Reader.

### F-03 Nén PDF

Nén là tính năng khách trả tiền nhiều nhất nhưng khó làm đúng nhất, nên có phần thiết kế riêng ở mục 10. Phần này mô tả hành vi nhìn thấy được.

| Mức | Mục đích | Ảnh | Cấu trúc tệp | Kết quả kỳ vọng |
| --- | --- | --- | --- | --- |
| Nhẹ | Giữ gần như nguyên chất lượng | Giữ độ phân giải, chỉ nén lại không mất chất lượng khi có thể | Tối ưu cấu trúc, gộp đối tượng, bỏ dữ liệu thừa | Giảm ít nhưng an toàn |
| Vừa (mặc định) | Gửi email, lưu trữ | Giảm xuống khoảng 150 dpi, chất lượng JPEG khoảng 70 | Như trên | Giảm rõ rệt, vẫn đọc tốt |
| Mạnh | Dung lượng nhỏ nhất | Giảm xuống khoảng 100 dpi, chất lượng JPEG khoảng 50, ảnh màu thành thang xám nếu chọn | Như trên, bỏ siêu dữ liệu không cần | Giảm nhiều, chất lượng ảnh giảm thấy được |
| Dung lượng đích | Người dùng nhập "dưới X MB" | Thử lần lượt các mức từ nhẹ đến mạnh cho tới khi đạt | Như trên | Đạt hoặc báo rõ không thể đạt |

Các quy tắc quan trọng:

- Hiển thị ước lượng dung lượng trước khi chạy dựa trên mẫu vài trang đầu, và hiển thị dung lượng thật sau khi chạy (trước, sau, phần trăm giảm).
- Nếu tệp kết quả không nhỏ hơn tệp gốc, **không xuất tệp mới**, báo "Tệp này đã được tối ưu, không giảm thêm được".
- Không chuyển văn bản và hình vector thành ảnh; chỉ xử lý các ảnh nhúng, để văn bản vẫn chọn và tìm kiếm được.
- Tệp có chữ ký số: cảnh báo trước rằng thao tác sẽ làm chữ ký mất hiệu lực, cho phép tiếp tục hoặc hủy. Quy tắc này áp dụng cho mọi thao tác ghi tệp mới (gộp, tách, xoay, nén).
- Giới hạn Free: 1 tệp, mức Nhẹ hoặc Vừa, đầu vào tối đa 20 MB.

Mục tiêu chất lượng để đo trong kiểm thử (là mục tiêu, cần xác nhận bằng bộ tệp thật): tệp scan toàn ảnh giảm trung bình từ 50% trở lên ở mức Vừa; tệp văn bản thường giảm ít hơn nhiều, có thể chỉ vài phần trăm.

### F-04 Xoay PDF

| Mục | Đặc tả |
| --- | --- |
| Chế độ chọn trang | Tất cả trang; trang lẻ; trang chẵn; khoảng trang; chọn trực tiếp trên lưới hình thu nhỏ |
| Góc xoay | 90 độ theo chiều kim đồng hồ, 90 độ ngược chiều, 180 độ |
| Xoay nhanh từng trang | Nút xoay nằm ngay trên mỗi hình thu nhỏ; hình thu nhỏ xoay ngay để xem trước |
| Cách thực hiện | Cộng thêm vào thuộc tính xoay của trang (`/Rotate`) theo modulo 360; không thay đổi nội dung bên trong trang |
| Gợi ý hướng | Bản 1.0: đánh dấu các trang có chiều ngang trong tệp chủ yếu chiều dọc để người dùng xem nhanh; không tự xoay |
| Đầu ra | Tệp mới `{tên gốc}_rotated.pdf` |

Tiêu chí chấp nhận: trang đã xoay hiển thị đúng hướng trên Edge, Chrome và Acrobat Reader; trang không chọn giữ nguyên; xoay hai lần liên tiếp 90 độ cho kết quả giống xoay 180 độ.

## 7. Đặc tả tính năng bổ trợ

Các tính năng dưới đây dùng lại gần như toàn bộ hạ tầng của bốn tính năng lõi (đọc trang, hình thu nhỏ, ghi tệp), nên chi phí làm thêm thấp nhưng giúp người dùng giải quyết trọn một công việc trong một app.

### F-05 Sắp xếp, xóa, trích trang

| Mục | Đặc tả |
| --- | --- |
| Giao diện | Lưới hình thu nhỏ của mọi trang; chọn một hoặc nhiều trang bằng nhấp, Ctrl+nhấp, Shift+nhấp và kéo vùng chọn |
| Sắp xếp | Kéo thả trang để đổi thứ tự; nút di chuyển lên, xuống cho bàn phím |
| Xóa | Phím Delete hoặc nút Xóa; có thao tác Hoàn tác và Làm lại (Ctrl+Z, Ctrl+Y) với tối thiểu 50 bước |
| Chèn | Chèn trang từ tệp PDF khác tại vị trí chọn (bản 1.1) |
| Trích | "Lưu các trang đã chọn thành tệp mới" |
| Phát hiện trang trống | Gợi ý các trang gần như trắng toàn bộ để xóa nhanh (ngưỡng độ trắng chỉnh được) |
| Xuất | Chỉ xuất khi người dùng bấm Lưu; mọi thay đổi trước đó chỉ là trạng thái trong bộ nhớ |

Tiêu chí chấp nhận: hoàn tác khôi phục đúng thứ tự và nội dung; trang trống được phát hiện đúng trên bộ tệp thử với tỷ lệ bỏ sót dưới 2% và không đề xuất nhầm trang có chữ nhỏ.

### F-06 Ảnh sang PDF

- Chấp nhận JPG, PNG, TIFF một trang và BMP (HEIC để bản sau nếu bộ giải mã hỗ trợ trên máy).
- Sắp xếp thứ tự ảnh bằng kéo thả; xoay từng ảnh trước khi ghi.
- Cỡ giấy: Vừa theo ảnh, A4, Letter (mặc định theo vùng của Windows: Letter cho Mỹ, A4 cho châu Âu), căn lề 0, 10 hoặc 20 mm.
- Chất lượng ảnh: Gốc (không nén lại) hoặc Giảm dung lượng (JPEG chất lượng 75).
- Mỗi ảnh một trang; giữ nguyên tỷ lệ, không kéo giãn.
- Giới hạn Free: tối đa 3 ảnh mỗi lần.

### F-07 Đặt và gỡ mật khẩu

| Mục | Đặc tả |
| --- | --- |
| Đặt mật khẩu | Mật khẩu mở tệp (user password) bắt buộc; mật khẩu quyền (owner password) tùy chọn; mã hóa AES-256 |
| Quyền hạn | Tùy chọn cấm in, cấm sao chép văn bản, cấm chỉnh sửa (lưu ý rằng quyền hạn chỉ có tác dụng với phần mềm tôn trọng chúng) |
| Gỡ mật khẩu | Chỉ khi người dùng nhập đúng mật khẩu mở tệp; app **không** bẻ khóa hay dò mật khẩu |
| Kiểm tra độ mạnh | Gợi ý độ dài tối thiểu 10 ký tự; cảnh báo mật khẩu yếu nhưng không ép buộc |
| Lưu ý hiển thị | Nhắc người dùng rằng mất mật khẩu thì không khôi phục được tệp; app không lưu mật khẩu |

Đây là tính năng Pro, vì giá trị cao với nhóm pháp lý và y tế.

### F-08 Siêu dữ liệu và làm sạch tệp

- Xem và sửa Tiêu đề, Tác giả, Chủ đề, Từ khóa, Ứng dụng tạo tệp.
- Nút "Xóa toàn bộ siêu dữ liệu" trước khi gửi ra ngoài (phù hợp với nhóm quan tâm quyền riêng tư).
- Hiển thị cảnh báo nếu tệp có tệp đính kèm, chú thích, hoặc JavaScript nhúng; cho phép gỡ bỏ các thành phần này khi người dùng chọn.
- Không tự động xóa bất cứ thứ gì nếu người dùng chưa xác nhận.

### F-09 Xử lý hàng loạt (Pro, bản 1.1)

| Mục | Đặc tả |
| --- | --- |
| Đầu vào | Một thư mục hoặc nhiều tệp |
| Thao tác hỗ trợ | Nén, xoay, đặt mật khẩu, xóa siêu dữ liệu (áp dụng cùng một cài đặt cho mọi tệp) |
| Kết quả | Tạo thư mục kết quả cạnh thư mục gốc; tệp lỗi được ghi vào báo cáo cuối, không dừng cả mẻ |
| Báo cáo | Bảng: tên tệp, trạng thái, dung lượng trước và sau, lỗi nếu có; có nút xuất CSV |
| Song song | Xử lý nhiều tệp cùng lúc theo số nhân CPU (tối đa 4 luồng mặc định) |

### F-10 Cài đặt chung và tiện ích

- Chọn ngôn ngữ giao diện: bản 1.0 có tiếng Anh, tiếng Đức, tiếng Pháp, tiếng Tây Ban Nha; tiếng Việt thêm cho cộng đồng trong nước.
- Chủ đề sáng, tối hoặc theo hệ thống.
- Thư mục lưu mặc định: cạnh tệp gốc hoặc một thư mục cố định.
- Mẫu tên tệp đầu ra có thể chỉnh.
- Mở bằng chuột phải trên tệp PDF trong File Explorer ("Gộp với...", "Nén...") là tính năng ưu tiên cao cho bản 1.1, vì giúp tăng thói quen dùng hằng ngày.
- Trang Giới thiệu và Quyền riêng tư nằm trong app, nêu rõ app không gửi dữ liệu tài liệu ra ngoài.

## 8. Luồng người dùng và thiết kế giao diện

Giao diện theo nguyên tắc "một màn hình, một việc": người dùng chọn công cụ ở màn hình chính, vào màn hình công cụ, hoàn thành việc và quay lại. Thiết kế theo phong cách Fluent của Windows 11 để app trông quen thuộc và đáng tin.

### Danh sách màn hình

| Mã | Màn hình | Mục đích | Thành phần chính |
| --- | --- | --- | --- |
| S-01 | Màn hình chính | Chọn công cụ nhanh | Lưới 6 ô công cụ (Gộp, Tách, Nén, Xoay, Sắp xếp trang, Ảnh sang PDF); vùng kéo thả lớn "Thả tệp vào đây"; danh sách tệp gần đây (chỉ tên và đường dẫn, có thể tắt) |
| S-02 | Công cụ Gộp | F-01 | Danh sách tệp kéo thả, ô dải trang, nút Gộp, thanh tiến độ |
| S-03 | Công cụ Tách | F-02 | Chọn chế độ, lưới hình thu nhỏ, mẫu tên, nút Tách |
| S-04 | Công cụ Nén | F-03 | Chọn mức nén, ước lượng dung lượng, nút Nén, bảng kết quả trước và sau |
| S-05 | Công cụ Xoay | F-04 | Lưới hình thu nhỏ, nút xoay, chọn nhóm trang |
| S-06 | Sắp xếp trang | F-05 | Lưới hình thu nhỏ lớn, thanh công cụ xóa, trích, hoàn tác |
| S-07 | Ảnh sang PDF | F-06 | Danh sách ảnh, chọn cỡ giấy và lề |
| S-08 | Hàng loạt | F-09 | Chọn thư mục, chọn thao tác, bảng báo cáo |
| S-09 | Nâng cấp Pro | Bán hàng | So sánh Free và Pro, nút Mua, nút Khôi phục giao dịch |
| S-10 | Cài đặt và Giới thiệu | F-10 | Ngôn ngữ, chủ đề, thư mục lưu, quyền riêng tư, hỗ trợ, phiên bản, giấy phép |

### Bố cục chuẩn của màn hình công cụ

Mọi màn hình công cụ dùng chung một bố cục để học một lần dùng được cho tất cả:

1. **Thanh trên**: nút quay lại, tên công cụ, biểu tượng khóa và chữ "Xử lý trên máy bạn".
2. **Vùng giữa**: vùng thả tệp khi trống; sau khi có tệp thì chuyển thành danh sách hoặc lưới hình thu nhỏ.
3. **Bảng bên phải**: các tùy chọn của công cụ (chiều rộng cố định khoảng 320 điểm ảnh).
4. **Thanh dưới**: nút hành động chính (một nút duy nhất, màu nhấn), thông tin tóm tắt (ví dụ "3 tệp, 42 trang"), và nút Hủy khi đang chạy.

### Luồng chính (ví dụ: gộp PDF)

1. Người dùng thả 3 tệp vào cửa sổ hoặc bấm "Chọn tệp".
2. App đọc nhanh số trang và hình thu nhỏ trang đầu của từng tệp, danh sách hiện ra trong dưới 1 giây cho mỗi tệp thông thường.
3. Người dùng kéo để đổi thứ tự, tùy chọn nhập dải trang.
4. Bấm "Gộp"; thanh tiến độ hiện phần trăm; nút Hủy khả dụng.
5. Hoàn tất: hiện "Đã lưu 120 trang, 4,2 MB" cùng ba nút: Mở tệp, Mở thư mục, Làm việc khác.
6. Nếu chạm giới hạn Free, thông báo xuất hiện **trước** khi bấm Gộp (ngay khi thêm tệp thứ ba), không phải sau khi chờ xong.

### Quy tắc giao diện

| Chủ đề | Quy tắc |
| --- | --- |
| Nhắc nâng cấp | Không cửa sổ bật lên giữa lúc làm việc; chỉ hiện dải thông báo nhỏ ở thanh dưới khi chạm giới hạn, kèm nút "Xem gói Pro"; tối đa một lần mỗi phiên làm việc cho cùng một giới hạn |
| Lỗi | Câu lỗi nói rõ chuyện gì xảy ra và cách xử lý, không dùng mã lỗi trần; có nút "Sao chép chi tiết" cho hỗ trợ (không chứa nội dung tài liệu) |
| Tiến độ | Phần trăm thật cho thao tác biết trước độ dài; thanh chạy liên tục chỉ dùng khi không thể ước lượng |
| Trạng thái trống | Câu hướng dẫn ngắn và biểu tượng, không dùng ảnh minh họa nặng |
| Phản hồi | Mọi thao tác chạy trên 1 giây phải có phản hồi thị giác ngay lập tức |
| Khả năng tiếp cận | Mọi điều khiển dùng được bằng bàn phím; tên điều khiển đọc được bởi Narrator; tỷ lệ tương phản tối thiểu 4,5:1; hỗ trợ phóng to chữ 200% |
| Ngôn ngữ | Mọi chuỗi chữ nằm trong tệp ngôn ngữ, không viết cứng trong mã; chuỗi ngắn gọn để không vỡ bố cục khi dịch sang tiếng Đức |

### Phím tắt

| Phím | Chức năng |
| --- | --- |
| Ctrl+O | Chọn tệp |
| Ctrl+S hoặc Enter | Thực hiện thao tác chính |
| Ctrl+Z, Ctrl+Y | Hoàn tác, làm lại (màn hình sắp xếp trang) |
| Delete | Xóa trang hoặc tệp đang chọn |
| Ctrl+A | Chọn tất cả |
| Esc | Hủy thao tác đang chạy hoặc quay lại |
| F1 | Mở trợ giúp |

### Các trạng thái cần thiết kế cho mỗi màn hình

Trống, đang đọc tệp, sẵn sàng, đang chạy, thành công, lỗi một phần (một số tệp thất bại), lỗi toàn bộ, và chạm giới hạn Free. Đây là danh sách kiểm tra cho người thiết kế giao diện trước khi coi một màn hình là xong.

## 9. Kiến trúc kỹ thuật và lựa chọn công nghệ

Đề xuất: Electron kết hợp React và TypeScript, xử lý PDF trong các luồng nền, thêm một chương trình nhỏ bằng .NET để nói chuyện với hệ thống giấy phép của Microsoft Store. Lý do chính là tận dụng kỹ năng web sẵn có và tốc độ làm giao diện; cái giá phải trả là dung lượng cài đặt lớn hơn và phần giấy phép Store phức tạp hơn.

### So sánh ba hướng

| Tiêu chí | Electron + React + TypeScript | Tauri (Rust + web) | .NET WinUI 3 (C#) |
| --- | --- | --- | --- |
| Tốc độ làm giao diện | Rất nhanh, nhiều thư viện | Nhanh | Chậm hơn nếu chưa quen XAML |
| Dung lượng cài đặt | Lớn (thường trên 100 MB) | Nhỏ | Trung bình |
| Đóng gói MSIX cho Store | Có công cụ hỗ trợ (ví dụ maker MSIX của Electron Forge); cần cấu hình tài nguyên và manifest | Không hỗ trợ MSIX sẵn, phải tự dựng quy trình đóng gói | Mặc định đóng gói MSIX |
| Truy cập API Store (mua hàng, giấy phép) | Qua chương trình trợ giúp .NET hoặc mô-đun gốc | Qua mô-đun Rust gọi WinRT, khó hơn | Gọi trực tiếp |
| Thư viện PDF | Hệ sinh thái JavaScript phong phú | Thư viện Rust, ít ví dụ hơn | Có nhiều thư viện .NET, vài thư viện có giấy phép thương mại |
| Rủi ro lớn nhất | Dung lượng, và cầu nối giấy phép | Tự dựng đóng gói Store | Đường học cho giao diện mới |

Tuần 1 nên có một bản thử nhỏ (spike) chứng minh được hai việc rủi ro nhất của hướng Electron: đóng gói MSIX cài được từ máy sạch, và gọi được kiểm tra giấy phép Store từ chương trình trợ giúp. Nếu một trong hai không qua, chuyển sang WinUI 3 khi chi phí đổi hướng còn thấp.

### Thư viện đề xuất

Bảng giấy phép ghi theo hiểu biết của mình, cần xác minh lại đúng phiên bản bạn dùng trước khi phát hành.

| Nhiệm vụ | Thư viện | Giấy phép (cần xác minh) | Ghi chú |
| --- | --- | --- | --- |
| Ảnh sang PDF, siêu dữ liệu, phương án dự phòng khi qpdf không xử lý được | pdf-lib hoặc nhánh phát triển tiếp của nó | MIT | Bản gốc ít cập nhật, nên kiểm thử kỹ và cân nhắc nhánh còn được bảo trì |
| Vẽ hình thu nhỏ và xem trước | pdfjs-dist (PDF.js) | Apache-2.0 | Chạy trong luồng nền, vẽ ra canvas rời |
| Động cơ chính cho gộp, tách, xoay, tối ưu cấu trúc, mã hóa AES-256, kiểm tra tệp | qpdf (đi kèm dạng chương trình dòng lệnh) | Apache-2.0 | Chạy như tiến trình con, không cần mạng |
| Nén lại ảnh nhúng | sharp (libvips) | Apache-2.0 cho sharp; libvips theo LGPL | Dùng liên kết động theo gói chính thức |
| Giao diện | React, Fluent UI React | MIT | Phù hợp phong cách Windows 11 |
| Kiểm thử | Vitest, Playwright cho Electron | MIT, Apache-2.0 | Chạy trên GitHub Actions bằng máy Windows |

Nên tránh trong sản phẩm đóng kín nếu không mua giấy phép thương mại: Ghostscript và MuPDF, vì cả hai thường phát hành theo AGPL hoặc giấy phép thương mại song song. Đây là điều quan trọng với app bán trả phí; hãy đọc kỹ giấy phép trước khi đưa bất kỳ thư viện nào vào gói.

### Các tầng của hệ thống

| Tầng | Thành phần | Trách nhiệm |
| --- | --- | --- |
| Giao diện (renderer) | React, trạng thái bằng Zustand | Hiển thị, nhận thao tác, gửi lệnh qua cầu nối an toàn; không đọc tệp trực tiếp |
| Cầu nối (preload) | API tối thiểu qua `contextBridge` | Chỉ lộ ra các hàm cần thiết như chọn tệp, chạy tác vụ, hủy, đọc trạng thái |
| Tiến trình chính (main) | Cửa sổ, hộp thoại tệp, cài đặt, định tuyến lệnh | Quản lý vòng đời app và hàng đợi tác vụ |
| Nhóm luồng xử lý (worker pool) | Luồng nền chạy pdf-lib, pdfjs, sharp | Làm toàn bộ việc nặng; mỗi tác vụ có thể hủy và có tiến độ |
| Tiến trình con qpdf | Chương trình dòng lệnh đóng gói kèm | Tối ưu cấu trúc, mã hóa, kiểm tra |
| Trợ giúp Store (StoreBridge) | Chương trình .NET nhỏ chạy cùng gói MSIX | Hỏi trạng thái giấy phép, mở luồng mua, khôi phục giao dịch; trao đổi với main qua tiến trình con và JSON |
| Dữ liệu cục bộ | Tệp JSON trong thư mục dữ liệu ứng dụng | Cài đặt, danh sách tệp gần đây (tùy chọn); không lưu nội dung tài liệu |

### Cấu trúc thư mục mã nguồn

```text
offline-pdf-toolbox/
  apps/
    desktop/
      src/main/          # tiến trình chính, hộp thoại, hàng đợi tác vụ
      src/preload/       # cầu nối contextBridge
      src/renderer/      # giao diện React
        features/        # merge, split, compress, rotate, pages, images, password
        components/      # thành phần dùng chung
        i18n/            # en, de, fr, es, vi
      src/workers/       # pdf-worker, thumbnail-worker, image-worker
      resources/qpdf/    # chương trình qpdf đóng kèm
  tools/StoreBridge/     # chương trình .NET cho giấy phép Store
  packaging/msix/        # manifest, tài nguyên logo, kịch bản đóng gói
  tests/
    fixtures/            # bộ tệp PDF kiểm thử (xem mục 15)
    e2e/                 # Playwright
  docs/                  # tài liệu, trang quyền riêng tư
```

### Cấu hình Electron để giữ lời hứa offline

1. Bật `contextIsolation`, tắt `nodeIntegration`, bật sandbox cho renderer.
2. Đặt chính sách bảo mật nội dung (CSP) chỉ cho phép tài nguyên cục bộ.
3. Chặn mọi yêu cầu mạng từ renderer và main trong lúc xử lý tài liệu bằng bộ lọc yêu cầu của phiên Electron; chỉ khi người dùng bấm mở liên kết trợ giúp thì mới mở trình duyệt hệ thống.
4. Không dùng dịch vụ báo lỗi hay thống kê gửi dữ liệu ra ngoài ở bản 1.0; nếu sau này thêm thì phải mặc định tắt, ghi rõ trong chính sách quyền riêng tư và không bao giờ chứa tên tệp hay nội dung.
5. Một bài kiểm thử tự động chạy app với mạng bị chặn và xác nhận mọi tính năng vẫn hoạt động.

## 10. Thiết kế pipeline xử lý PDF

Quyết định kỹ thuật quan trọng nhất: dùng qpdf làm động cơ chính cho gộp, tách, xoay, mã hóa và tối ưu cấu trúc, vì nó làm việc trực tiếp trên cấu trúc tệp, tiết kiệm bộ nhớ và xử lý tốt các tệp lỗi nhẹ. Mã JavaScript chỉ đảm nhiệm hình thu nhỏ, nén lại ảnh nhúng, ảnh sang PDF và siêu dữ liệu. Cách chia này vừa giảm rủi ro lỗi vừa giữ được hiệu năng với tệp lớn.

### Mô hình tác vụ

| Trạng thái | Ý nghĩa | Chuyển sang |
| --- | --- | --- |
| `queued` | Đã nhận, chờ luồng rảnh | `running`, `cancelled` |
| `running` | Đang xử lý, phát sự kiện tiến độ | `succeeded`, `failed`, `cancelled` |
| `succeeded` | Tệp đầu ra đã kiểm tra và di chuyển vào đích | kết thúc |
| `failed` | Có lỗi đã được phân loại (bảng bên dưới) | kết thúc |
| `cancelled` | Người dùng hủy, tệp tạm đã dọn | kết thúc |

Quy tắc chung cho mọi tác vụ:

1. Mỗi tác vụ có thư mục tạm riêng trong thư mục tạm của hệ thống, xóa khi kết thúc và quét dọn khi app khởi động lại.
2. Ghi kết quả ra tệp tạm trước, **kiểm tra lại** (mở được, đủ số trang mong đợi), rồi mới đổi tên vào đích. Nếu tên đã tồn tại thì thêm hậu tố số, không bao giờ ghi đè.
3. Chạy trong luồng hoặc tiến trình con, không bao giờ trong luồng giao diện.
4. Hủy được ở mọi lúc: gửi tín hiệu dừng, giết tiến trình con qpdf nếu có, dọn tệp tạm.
5. Số tác vụ chạy song song tối đa bằng số nhân CPU trừ một, không quá 4.

### Quy trình nén chi tiết

Đây là phần khó nhất, nên mô tả từng bước để dễ chia việc cho AI lập trình:

1. **Kiểm tra đầu vào** bằng qpdf: mở được, có mật khẩu hay không, có chữ ký số hay không (tìm trường chữ ký và dải byte của chữ ký).
2. **Quét ảnh nhúng**: duyệt các đối tượng ảnh, ghi lại bộ lọc (JPEG, Flate, loại khác), kích thước điểm ảnh, không gian màu, có mặt nạ hay không.
3. **Tính độ phân giải hiệu dụng**: với trang scan một ảnh phủ trọn trang, độ phân giải = số điểm ảnh chia kích thước trang tính bằng inch. Với ảnh nhỏ nằm trong trang, dùng giới hạn cạnh dài tối đa thay vì độ phân giải.
4. **Quyết định xử lý từng ảnh**:
   - Bỏ qua ảnh dưới khoảng 50 KB, ảnh 1 bit (đen trắng), ảnh dùng bộ lọc chưa hỗ trợ (ví dụ JBIG2, CCITT, JPEG 2000 ở bản 1.0).
   - Ảnh JPEG và ảnh Flate màu hoặc thang xám 8 bit: giải mã, thu nhỏ tới độ phân giải đích nếu cao hơn, mã hóa lại JPEG theo chất lượng của mức nén đã chọn.
   - Giữ nguyên mặt nạ trong suốt (SMask) và thông tin vị trí, chỉ thay phần dữ liệu ảnh nền.
   - Chỉ thay ảnh khi bản mới nhỏ hơn ít nhất 5% so với bản cũ.
5. **Ghi lại** các ảnh đã thay vào bản sao tệp, giữ nguyên văn bản và vector.
6. **Tối ưu cấu trúc** bằng qpdf (gom đối tượng vào luồng đối tượng, nén lại luồng Flate ở mức cao).
7. **So sánh dung lượng**; nếu không nhỏ hơn tệp gốc thì hủy kết quả và báo "đã được tối ưu".
8. **Ước lượng trước khi chạy**: xử lý thử một mẫu ảnh lớn nhất để suy ra tỷ lệ giảm, hiển thị dưới dạng khoảng (ví dụ "khoảng 55% đến 70%").

Lưu ý kỹ thuật: bước 2 đến 5 cần thử nghiệm kỹ với tệp thật vì cách PDF lưu ảnh rất đa dạng (bộ dự đoán Flate, ảnh đảo màu, không gian màu ICC, CMYK). Hãy đặt thời gian riêng cho nó trong lộ trình (mục 16) và chấp nhận bản 1.0 chỉ hỗ trợ những trường hợp phổ biến.

### Bộ nhớ và tệp lớn

| Tình huống | Cách xử lý |
| --- | --- |
| Gộp, tách, xoay tệp lớn | Dùng qpdf, không nạp cả tệp vào bộ nhớ JavaScript |
| Nén tệp scan hàng trăm MB | Xử lý từng ảnh một, giải phóng bộ nhớ sau mỗi ảnh; giới hạn bộ nhớ của luồng nền |
| Tệp trên 300 MB hoặc trên 3.000 trang | Cảnh báo "có thể mất nhiều phút" nhưng vẫn cho chạy |
| Hình thu nhỏ cho tệp nhiều trang | Vẽ theo yêu cầu khi cuộn tới, có bộ đệm tối đa 200 hình, hủy vẽ khi rời khỏi vùng nhìn thấy |

### Phân loại lỗi và thông báo

| Loại lỗi | Nhận biết | Thông báo cho người dùng | Hành động |
| --- | --- | --- | --- |
| Cần mật khẩu | qpdf báo tệp mã hóa | "Tệp này được bảo vệ bằng mật khẩu" | Hộp nhập mật khẩu |
| Tệp hỏng nhẹ | qpdf báo cảnh báo cấu trúc | "Tệp có lỗi nhỏ, app đã thử sửa" | Tiếp tục với bản đã khôi phục, ghi chú trong báo cáo |
| Tệp hỏng nặng | Không đọc được | "Không đọc được tệp này" | Bỏ qua hoặc dừng |
| Không phải PDF | Thiếu phần đầu PDF | "Đây không phải tệp PDF" | Loại khỏi danh sách |
| Chữ ký số | Có trường chữ ký | "Thao tác này sẽ làm mất hiệu lực chữ ký" | Cho chọn tiếp tục hoặc hủy |
| Hết dung lượng đĩa | Lỗi ghi | "Ổ đĩa không đủ chỗ trống" | Chọn thư mục khác |
| Không có quyền ghi | Lỗi quyền | "Không ghi được vào thư mục này" | Chọn thư mục khác |
| Đường dẫn quá dài hoặc ký tự lạ | Lỗi đường dẫn | "Tên tệp hoặc đường dẫn không hợp lệ" | Gợi ý tên khác |
| Lỗi không xác định | Còn lại | "Có lỗi không mong muốn" | Nút "Sao chép chi tiết" (không chứa nội dung tài liệu) |

### Mục tiêu hiệu năng

Các số này là mục tiêu thiết kế trên máy tầm trung (4 nhân, 8 GB RAM, ổ SSD), cần đo lại khi có bản chạy được:

| Thao tác | Mục tiêu |
| --- | --- |
| Khởi động app đến lúc dùng được | Dưới 3 giây |
| Đọc và hiện hình thu nhỏ trang đầu của một tệp thường | Dưới 1 giây |
| Gộp 100 trang từ 5 tệp | Dưới 5 giây |
| Tách tệp 500 trang thành từng trang | Dưới 20 giây |
| Nén tệp scan 50 trang, 40 MB | Dưới 30 giây |
| Bộ nhớ đỉnh khi gộp 2.000 trang | Dưới 1 GB |

## 11. Bảo mật và quyền riêng tư

Quyền riêng tư là lý do khách trả tiền, nên đây là phần được thiết kế như một tính năng, không phải thủ tục. Điều quan trọng nhất là chỉ cam kết những gì có thể chứng minh được bằng kiểm thử, và không dùng các từ gây hiểu nhầm về tuân thủ pháp luật.

### Cam kết với người dùng

| Cam kết | Cách bảo đảm trong sản phẩm |
| --- | --- |
| Tệp không rời khỏi máy | Không có mã gửi dữ liệu tài liệu qua mạng; bộ lọc chặn yêu cầu mạng; kiểm thử tự động khi tắt mạng |
| Không cần tài khoản | Không có màn hình đăng nhập; giấy phép Pro gắn với tài khoản Microsoft qua Store |
| Không theo dõi nội dung | Bản 1.0 không có thống kê sử dụng; nếu thêm sau này thì mặc định tắt và không bao giờ ghi tên tệp hay nội dung |
| Không giữ lại dữ liệu | Tệp tạm bị xóa khi tác vụ kết thúc hoặc khi app khởi động lại; danh sách tệp gần đây chỉ lưu đường dẫn, có nút xóa và có thể tắt |
| Mật khẩu không bị lưu | Mật khẩu chỉ tồn tại trong bộ nhớ tới khi tác vụ xong |

Một giới hạn cần nói thật: xóa tệp tạm trên ổ SSD không bảo đảm dữ liệu không thể khôi phục bằng công cụ chuyên dụng. App sẽ không dùng cụm từ "xóa an toàn tuyệt đối".

### Cách nói về HIPAA và GDPR

- Không ghi "tuân thủ HIPAA" hay "tuân thủ GDPR" trong mô tả Store hay trên giao diện: đây là nghĩa vụ của tổ chức sử dụng phần mềm, không phải thuộc tính của một công cụ.
- Cách nói đúng: "Tài liệu của bạn được xử lý hoàn toàn trên máy tính của bạn. Chúng tôi không nhận, không lưu và không truyền tải nội dung tài liệu." Câu này giúp khách tự đánh giá việc dùng app trong quy trình của họ.
- Nên nhờ một người có chuyên môn pháp lý đọc lại trang quyền riêng tư và phần mô tả trước khi phát hành, nhất là nếu bán cho khách doanh nghiệp. Mình không phải luật sư và đây không phải tư vấn pháp lý.

### Mô hình mối đe dọa

| Mối đe dọa | Rủi ro | Biện pháp |
| --- | --- | --- |
| Tệp PDF độc hại làm lỗi trình đọc | Chạy mã ngoài ý muốn, làm sập app | Renderer bật sandbox; xử lý PDF trong tiến trình nền; tắt tính năng JavaScript của PDF; cập nhật thư viện thường xuyên |
| Tên tệp hoặc đường dẫn độc hại | Ghi ra ngoài thư mục đích | Làm sạch tên tệp, chặn ký tự `..`, ký tự điều khiển và tên thiết bị đặc biệt của Windows |
| Tệp tạm bị lộ | Người khác đọc được tài liệu còn sót | Thư mục tạm riêng theo tác vụ, dọn sạch khi kết thúc và khi khởi động |
| Nhật ký chứa thông tin nhạy cảm | Lộ tên tệp, đường dẫn | Nhật ký chỉ ghi mã lỗi và thông số kỹ thuật, tên tệp được băm hoặc cắt bớt |
| Thư viện bên thứ ba có lỗ hổng | Rủi ro dây chuyền | Khóa phiên bản, kiểm tra lỗ hổng định kỳ, lập danh sách thành phần (SBOM), cập nhật Electron, PDF.js, qpdf, sharp theo lịch |
| Giả mạo gói cài đặt | Người dùng cài bản độc | Chỉ phân phối qua Store, gói được Microsoft ký |
| Bẻ khóa giấy phép Pro | Mất doanh thu | Chấp nhận mức rủi ro thấp; kiểm tra giấy phép qua Store, không đầu tư vào cơ chế chống bẻ khóa phức tạp |

### Dữ liệu lưu cục bộ

| Dữ liệu | Nơi lưu | Nội dung | Có thể xóa |
| --- | --- | --- | --- |
| Cài đặt | Thư mục dữ liệu ứng dụng | Ngôn ngữ, chủ đề, thư mục mặc định, mẫu tên | Có, trong Cài đặt |
| Tệp gần đây | Thư mục dữ liệu ứng dụng | Đường dẫn và thời điểm dùng | Có, một nút; có công tắc tắt |
| Trạng thái giấy phép | Do Store quản lý | Tình trạng Pro | Không (do hệ thống) |
| Nhật ký lỗi | Thư mục dữ liệu ứng dụng | Mã lỗi, phiên bản, thông số kỹ thuật | Có, một nút |

### Nội dung trang chính sách quyền riêng tư

1. Ứng dụng xử lý những loại dữ liệu nào và xử lý ở đâu (trên máy người dùng).
2. Ứng dụng không thu thập hay truyền tải nội dung tài liệu.
3. Dữ liệu cục bộ nào được lưu và cách xóa.
4. Thông tin do Microsoft Store thu thập (như thanh toán, lượt cài, báo cáo lỗi) thuộc chính sách của Microsoft.
5. Cách liên hệ để hỏi về quyền riêng tư.
6. Ngày hiệu lực và lịch sử thay đổi.

Trang này cần có địa chỉ web công khai (có thể là một trang tĩnh miễn phí) và được ghi vào hồ sơ Store; hãy kiểm tra yêu cầu hiện hành trong Partner Center khi nộp.

## 12. Mô hình thu phí và cơ chế giấy phép

Đề xuất: ứng dụng tải miễn phí, có bản Free giới hạn, mở khóa Pro bằng một lần mua đứt 12,99 USD qua Microsoft Store. Gói thuê bao 1,99 USD mỗi tháng chỉ nên thêm sau, nếu có tính năng giá trị liên tục (như OCR) cần đến chi phí duy trì.

### So sánh các mô hình

| Mô hình | Ưu điểm | Nhược điểm | Nhận định |
| --- | --- | --- | --- |
| Mua đứt 9,99 đến 14,99 USD | Hợp với khách ngại thuê bao; khớp với lời hứa "không phiền"; dễ giải thích | Doanh thu một lần, không có thu nhập lặp lại | Chọn làm mô hình chính |
| Thuê bao 1,99 USD mỗi tháng | Thu nhập lặp lại; giá vào cửa thấp | Mâu thuẫn với thông điệp "không thuê bao"; dễ bị đánh giá thấp nếu khách quên hủy; hòa vốn với mua đứt sau khoảng 6,5 tháng | Để dành cho tính năng nặng sau này |
| Cả hai song song | Cho khách chọn | Làm rối trang Store và giao diện mua | Không dùng ở bản 1.0 |
| Ứng dụng trả phí ngay từ đầu (có bản dùng thử theo thời gian) | Đơn giản | Giảm mạnh lượt cài; thuật toán xếp hạng ưu tiên lượt cài | Không dùng |

### Vì sao chọn "ứng dụng miễn phí và mở khóa Pro"

- Lượt cài cao hơn, mà lượt cài và đánh giá là nhiên liệu cho thứ hạng tìm kiếm trên Store.
- Giới hạn theo số lượng (mục 5) khớp với ý tưởng dùng thử bạn đưa ra.
- Trong Partner Center, đây là ứng dụng miễn phí kèm một sản phẩm mua trong ứng dụng loại "dùng một lần, không hết hạn" (durable add-on). Thông tin cấu hình cần được kiểm tra lại trong tài liệu hiện hành của Microsoft khi triển khai.

### Mức giá và thử nghiệm giá

| Giai đoạn | Giá Pro | Mục đích |
| --- | --- | --- |
| Ra mắt (tháng 1) | 12,99 USD | Giá tham chiếu, chờ dữ liệu chuyển đổi |
| Tháng 2 | Khuyến mãi 9,99 USD trong 2 tuần | Đo độ nhạy giá và kích thích đánh giá đầu tiên |
| Tháng 3 trở đi | Chọn mức có doanh thu mỗi lượt cài cao nhất | Ổn định |

Giá hiển thị theo từng thị trường theo bậc giá mà Partner Center cung cấp; nên xem lại giá riêng cho khu vực đồng euro và các thị trường có sức mua thấp hơn.

### Cơ chế giấy phép trong app

| Thành phần | Mô tả |
| --- | --- |
| `FeatureGate` | Một module duy nhất quyết định mỗi tính năng bị giới hạn thế nào ở Free hay mở hết ở Pro; giới hạn đọc từ một bảng cấu hình (mục 5), có kiểm thử đơn vị cho mọi giới hạn |
| `LicenseService` | Hỏi StoreBridge về trạng thái Pro khi khởi động và sau khi mua; lưu kết quả cuối cùng vào bộ nhớ |
| `StoreBridge` | Chương trình .NET nhỏ gọi API Windows.Services.Store để lấy giấy phép và mở cửa sổ mua |
| Luồng mua | Người dùng bấm "Nâng cấp", StoreBridge mở hộp thoại mua của Microsoft; khi thành công, `LicenseService` cập nhật và `FeatureGate` mở khóa ngay, không cần khởi động lại |
| Khôi phục giao dịch | Nút "Khôi phục mua hàng" gọi lại kiểm tra giấy phép, dùng khi cài lại hoặc đổi máy |
| Khi không kiểm tra được | Giữ trạng thái Pro đã biết nếu lần kiểm tra thành công gần nhất trong 14 ngày; nếu chưa từng xác minh được thì xử lý như Free và hiện thông báo rõ ràng |
| Hoàn tiền | Khi Store thu hồi giấy phép, app trở về Free ở lần kiểm tra sau |

Hai điểm cần kiểm thử sớm (ở tuần 1 đến 2): giấy phép Store hoạt động ra sao khi máy ngoại tuyến, và quy trình thử mua trong môi trường kiểm thử trước khi gói được xuất bản. Đây là hai điểm thường gây bất ngờ.

### Lưu ý về thông điệp "offline"

Việc mua hàng và kiểm tra giấy phép dùng kết nối của Microsoft Store, không đụng tới tài liệu. Cần ghi rõ điều này ở trang Giới thiệu và chính sách quyền riêng tư để câu "không dùng mạng" luôn chính xác: "mọi thao tác trên tài liệu đều không cần mạng".

### Doanh thu thực nhận

Microsoft xử lý thanh toán cho giao dịch trong Store. Tỷ lệ chia sẻ doanh thu cho ứng dụng không phải trò chơi đã được Microsoft công bố từ năm 2018 là nhà phát triển nhận 95% nếu khách đến từ liên kết riêng của bạn và 85% nếu khách đến từ các vị trí do Microsoft giới thiệu; mức hiện hành cần xác nhận trong Hợp đồng nhà phát triển ứng dụng khi bạn đăng ký. Với tài khoản cá nhân, Microsoft cũng cho phép dùng hệ thống thanh toán riêng cho ứng dụng không phải trò chơi, nhưng cách này kéo theo việc tự lo thuế và giấy phép nên không dùng ở bản 1.0.

## 13. Microsoft Store: tài khoản, đóng gói, hồ sơ và chứng nhận

Con đường phát hành là: tạo tài khoản nhà phát triển, giữ chỗ tên ứng dụng, đóng gói MSIX, điền hồ sơ trong Partner Center, nộp và chờ chứng nhận. Các thông tin dưới đây được kiểm tra với tài liệu và tin tức đã công bố đến tháng 10 năm 2026, nhưng Partner Center thay đổi thường xuyên, nên hãy đối chiếu lại ở mỗi bước.

### Tài khoản nhà phát triển

| Hạng mục | Thông tin đã xác nhận | Việc của bạn |
| --- | --- | --- |
| Phí đăng ký | Tài khoản cá nhân đã miễn phí; Microsoft cũng đã bỏ phí 99 USD cho tài khoản công ty (thông báo ngày 7 tháng 5 năm 2026) | Không cần chuẩn bị tiền đăng ký |
| Xác minh danh tính | Tài khoản cá nhân cần tài khoản Microsoft, giấy tờ tùy thân và ảnh chân dung | Chuẩn bị giấy tờ còn hạn, ảnh rõ nét |
| Cá nhân hay công ty | Hướng dẫn của Microsoft nói tài khoản cá nhân dành cho người phát hành không liên quan đến nghề nghiệp kinh doanh; người làm tự do bán ứng dụng liên quan đến nghề của mình được hướng dẫn chọn tài khoản công ty | Đọc kỹ phần "Learn more" khi đăng ký; hỏi bộ phận hỗ trợ nếu chưa rõ trường hợp của bạn |
| Thanh toán và thuế | Cần hồ sơ nhận tiền và biểu mẫu thuế trong Partner Center để nhận doanh thu | Tra cứu nghĩa vụ thuế tại Việt Nam với người có chuyên môn; mình không thể tư vấn thuế |

### Đóng gói

1. **Định dạng**: Store nhận gói MSIX (khuyến nghị) hoặc trình cài đặt EXE/MSI theo luồng riêng; kế hoạch này dùng MSIX vì gói được Microsoft ký khi nộp và chạy sạch khi gỡ.
2. **Với Electron**: đóng gói bằng công cụ MSIX của Electron Forge hoặc Windows SDK; khai báo khả năng `runFullTrust` trong manifest để ứng dụng chạy với quyền đầy đủ như ứng dụng máy tính thông thường.
3. **Định danh gói**: giá trị `Identity Name` và `Publisher` trong manifest phải khớp chính xác với trang App identity trong Partner Center sau khi giữ chỗ tên.
4. **Tài nguyên hình ảnh**: bộ logo ở các kích thước bắt buộc của manifest (44x44, 150x150, 310x150, 50x50 cho Store và các tỷ lệ phóng đại); nên tạo từ một tệp vector gốc.
5. **Phiên bản**: đặt theo dạng `Major.Minor.Build.0`; mỗi lần nộp phải tăng số phiên bản.
6. **Kiến trúc**: x64 ở bản 1.0; thêm ARM64 ở bản sau.
7. **Nộp gói**: có thể tải lên thủ công trong Partner Center; nếu muốn tự động hóa thì dùng công cụ dòng lệnh Microsoft Store (`msstore`), chạy được trên máy Windows với thông tin xác thực Azure AD đã cấu hình.
8. **Kiểm tra trước khi nộp**: chạy Windows App Certification Kit trên gói cuối cùng và sửa mọi cảnh báo.

### Hồ sơ ứng dụng trong Partner Center

| Phần | Nội dung cần chuẩn bị |
| --- | --- |
| Giữ chỗ tên | Tên chứa từ khóa chính, kiểm tra trùng và nhãn hiệu của người khác |
| Giá và thị trường | Miễn phí để tải; chọn các thị trường (Mỹ, Canada, Anh, Đức, Pháp, Tây Ban Nha, Úc là ưu tiên); sản phẩm Pro là mua trong ứng dụng, giá 12,99 USD |
| Thuộc tính | Danh mục (Productivity là ứng dụng cho năng suất, cần chọn đúng danh mục có sẵn), khai báo quy tắc kinh doanh nếu có |
| Xếp hạng độ tuổi | Hoàn tất bảng câu hỏi xếp hạng; ứng dụng này không có nội dung nhạy cảm nên thường ở mức thấp nhất |
| Chính sách quyền riêng tư | Địa chỉ trang web công khai (mục 11) |
| Mô tả ứng dụng | Tiêu đề, mô tả ngắn, mô tả đầy đủ, tính năng nổi bật, từ khóa (nội dung mẫu ở mục 19) |
| Hình ảnh | Ít nhất 4 ảnh chụp màn hình rõ ràng (nên 6 đến 8) kèm chú thích; logo ứng dụng; tùy chọn ảnh quảng bá |
| Yêu cầu hệ thống | Hệ điều hành tối thiểu, RAM, dung lượng; ghi trung thực |
| Ghi chú cho người kiểm tra | Hướng dẫn cách thử mọi tính năng, cách thử luồng mua Pro, và nói rõ app không cần tài khoản đăng nhập |
| Sản phẩm mua trong ứng dụng | Tạo sản phẩm Pro với mã nhận dạng riêng, giá, mô tả và hình ảnh |

### Quy trình chứng nhận

Sau khi nộp, gói qua bước kiểm tra bảo mật, tương thích kỹ thuật và tuân thủ nội dung. Tài liệu của Microsoft cho biết với gói MSIX khách thường thấy ứng dụng trong khoảng 15 phút sau khi chứng nhận xong (tùy khu vực), còn luồng EXE/MSI có thể mất đến ba ngày làm việc. Hãy dự phòng vài ngày cho lần nộp đầu tiên, vì đây là lần dễ bị từ chối nhất.

| Lý do thường gặp khiến bị từ chối | Cách tránh |
| --- | --- |
| Ứng dụng lỗi hoặc đóng đột ngột trong lúc kiểm tra | Chạy thử toàn bộ trên máy sạch, trên Windows 10 và 11 |
| Người kiểm tra không thử được tính năng Pro | Viết ghi chú kiểm tra rõ ràng, nêu cách kích hoạt luồng mua |
| Khai báo quyền không cần thiết hoặc không giải thích được | Chỉ khai báo những gì cần; ghi lý do cho `runFullTrust` |
| Mô tả gây hiểu nhầm (ví dụ nói "tuân thủ HIPAA") | Dùng cách nói ở mục 11 |
| Thiếu chính sách quyền riêng tư hoặc liên kết hỏng | Kiểm tra liên kết trước khi nộp |
| Dùng tên hoặc hình ảnh của hãng khác (Adobe) | Dùng nhận diện riêng |
| Ảnh chụp màn hình không đúng với ứng dụng thật | Chụp từ bản phát hành thật |

### Sau khi phát hành

- Theo dõi trong Partner Center: lượt cài, báo cáo lỗi, đánh giá và từ khóa người dùng tìm thấy ứng dụng.
- Trả lời mọi đánh giá trong 48 giờ, đặc biệt đánh giá thấp: trả lời lịch sự, hỏi thêm thông tin, sửa lỗi rồi báo lại.
- Nộp bản cập nhật hai tuần một lần trong hai tháng đầu.

## 14. Từ khóa, tối ưu hiển thị trên Store và marketing

Bạn cho rằng các từ khóa như "PDF Merger", "Offline PDF", "PDF Splitter" có lượng tìm kiếm lớn. Đây là giả định hợp lý nhưng chưa được kiểm chứng ở đây, vì mình không có dữ liệu tìm kiếm của Store. Việc đầu tiên là tự kiểm tra: gõ từng từ khóa vào ô tìm kiếm của Microsoft Store, ghi lại 10 kết quả đầu, số đánh giá, giá và mức độ cập nhật của từng app.

### Bộ từ khóa ưu tiên

| Nhóm | Từ khóa tiếng Anh | Dùng ở đâu |
| --- | --- | --- |
| Chức năng chính | merge pdf, combine pdf, split pdf, compress pdf, reduce pdf size, rotate pdf | Tiêu đề, mô tả ngắn, mô tả đầy đủ |
| Điểm khác biệt | offline pdf, private pdf, pdf no upload, secure pdf tools | Tiêu đề phụ, đoạn đầu mô tả |
| Công việc cụ thể | extract pdf pages, delete pdf pages, reorder pdf pages, images to pdf, password protect pdf | Danh sách tính năng, từ khóa tìm kiếm |
| Nhóm nghề | legal pdf, medical records pdf, accounting documents | Chỉ dùng trong mô tả, không nhồi nhét |

Partner Center có ô nhập từ khóa tìm kiếm với giới hạn số lượng và độ dài; hãy chọn các cụm có nhu cầu thật và chưa bị chiếm hết, và không lặp lại những từ đã có trong tiêu đề.

### Các yếu tố hiển thị trên trang Store

| Yếu tố | Hướng dẫn |
| --- | --- |
| Tên | Dạng "Offline PDF Toolbox: Merge, Split, Compress"; gọn, chứa từ khóa chính |
| Mô tả ngắn | Một câu nêu lợi ích: "Merge, split, compress and rotate PDFs entirely on your PC. No uploads, no account." |
| Ảnh chụp màn hình | Ảnh đầu nói lời hứa chính ("Your files never leave your PC"); các ảnh sau mỗi ảnh một tính năng, có chú thích lớn; dùng cả chế độ tối và sáng |
| Video | Video ngắn 30 đến 45 giây: kéo thả, gộp, nén, hiện dung lượng trước và sau |
| Đánh giá | Là yếu tố xếp hạng và là yếu tố niềm tin; xin đánh giá đúng lúc (bên dưới) |
| Cập nhật | Đăng bản cập nhật đều đặn, ghi chú thay đổi rõ ràng bằng tiếng Anh |
| Ngôn ngữ trang Store | Làm tiếng Anh trước; thêm Đức, Pháp, Tây Ban Nha cho trang Store ở bản 1.1 vì đây là các thị trường chính |

### Xin đánh giá đúng cách

- Hiện lời nhắc đánh giá tối đa một lần, sau khi người dùng hoàn thành thành công ít nhất 3 tác vụ và đã dùng app ít nhất 3 ngày.
- Không nhắc ngay sau lỗi, không nhắc khi đang chạm giới hạn Free.
- Không mua đánh giá, không trao quà để đổi lấy đánh giá tích cực; Store có thể gỡ ứng dụng vi phạm.
- Dùng cách mở trang đánh giá do Store hỗ trợ cho ứng dụng đóng gói; kiểm tra tài liệu hiện hành khi cài đặt.

### Kênh tiếp cận

| Kênh | Hành động | Công sức | Hiệu quả kỳ vọng |
| --- | --- | --- | --- |
| Tìm kiếm trên Store | Tối ưu theo bảng trên | Thấp | Chủ lực |
| Trang web giới thiệu đơn giản | Một trang tĩnh có video, nút tới Store, trang quyền riêng tư; kèm 3 bài hướng dẫn như "How to merge PDFs without uploading them" | Trung bình | Kéo khách tìm kiếm trên web, tăng tin cậy |
| Cộng đồng nghề nghiệp | Chia sẻ có ích (không chỉ quảng cáo) ở nhóm kế toán, trợ lý pháp lý, quản trị văn phòng; đọc kỹ quy định từng nhóm về quảng bá | Trung bình | Khách trả tiền chất lượng cao |
| LinkedIn | Bài ngắn kể về lỗ hổng riêng tư của web PDF miễn phí và cách app giải quyết | Thấp | Tiếp cận nhân sự, văn phòng |
| Video ngắn | Clip 20 giây "nén 40 MB xuống 6 MB không cần internet" | Trung bình | Lan truyền không đều, nhưng chi phí thấp |
| Product Hunt, các cộng đồng công cụ Windows | Một đợt ra mắt có chuẩn bị | Trung bình | Một đợt lượt cài ban đầu |
| Đối tác nhỏ | Nhờ các blog công cụ văn phòng đánh giá | Cao | Không chắc, để sau |

### Liên kết theo dõi nguồn khách

Khi đưa liên kết tới trang Store ở mọi nơi bên ngoài, gắn thêm mã chiến dịch (CID) theo hướng dẫn của Microsoft. Theo các thông báo năm 2018 về chia sẻ doanh thu, liên kết có CID là điều kiện để nhận mức chia sẻ cao nhất cho giao dịch đến từ kênh của bạn, đồng thời giúp bạn biết kênh nào hiệu quả. Hãy xác nhận cách làm hiện hành trong tài liệu Partner Center.

### Lịch tám tuần quanh ngày phát hành

| Tuần | Việc |
| --- | --- |
| T-4 | Dựng trang giới thiệu, thu thập email những người quan tâm (không bắt buộc), viết bài hướng dẫn đầu tiên |
| T-2 | Mời 10 đến 20 người dùng thử bản kiểm thử; sửa lỗi lớn; hoàn thiện ảnh và video Store |
| T-1 | Nộp chứng nhận |
| T0 | Phát hành; đăng ở các kênh đã chọn; theo dõi lỗi từng giờ ở 48 giờ đầu |
| T+1 | Phát hành bản vá; trả lời mọi đánh giá |
| T+2 | Bản 1.0.x với sửa lỗi từ phản hồi; thử khuyến mãi 9,99 USD |
| T+4 | Bài hướng dẫn thứ hai và thứ ba; đánh giá lại từ khóa dựa trên báo cáo Store |
| T+8 | Đánh giá theo mục tiêu 90 ngày ở mục 1 và quyết định hướng đi tiếp |

## 15. Kiểm thử và chất lượng

Với công cụ xử lý tệp, một lỗi làm hỏng tài liệu của khách đủ để mất khách và nhận đánh giá một sao. Kế hoạch kiểm thử dồn công sức vào ba thứ: bộ tệp PDF đa dạng, kiểm tra tự động kết quả đầu ra, và thử trên máy sạch.

### Bộ tệp kiểm thử (fixtures)

Tự tạo hoặc lấy tệp có bản quyền cho phép (tài liệu công khai, tệp tự sinh bằng công cụ khác); tuyệt đối không dùng hợp đồng hay hồ sơ thật của người khác.

| Nhóm | Mô tả | Số tệp tối thiểu |
| --- | --- | --- |
| Văn bản thuần | Vài trang đến 500 trang, phông chữ nhúng và không nhúng | 6 |
| Scan toàn ảnh | JPEG màu, thang xám, 1 bit; 300 dpi và 600 dpi | 6 |
| Hỗn hợp | Văn bản kèm ảnh, bảng, biểu đồ vector | 4 |
| Có mật khẩu | Mật khẩu mở; mật khẩu quyền; mã hóa AES-128 và AES-256 | 4 |
| Có chữ ký số | Chữ ký hợp lệ | 2 |
| Có biểu mẫu | Trường điền, chú thích, liên kết, dấu trang | 4 |
| Khổ trang lạ | A3, Letter, trang ngang xen trang dọc, trang đã xoay sẵn | 4 |
| Hỏng nhẹ và hỏng nặng | Thiếu bảng tham chiếu, cắt cụt tệp, không phải PDF đổi đuôi | 5 |
| Lớn | 300 MB, 3.000 trang | 2 |
| Ký tự đặc biệt | Tên tệp tiếng Việt, tiếng Đức có dấu, đường dẫn dài | 3 |
| Ảnh nguồn | JPG, PNG, TIFF, BMP các kích cỡ | 6 |

### Các lớp kiểm thử

| Lớp | Công cụ | Nội dung |
| --- | --- | --- |
| Đơn vị | Vitest | Phân tích dải trang, đặt tên đầu ra, `FeatureGate`, tính độ phân giải ảnh, phân loại lỗi |
| Kiểm tra kết quả tự động | Chương trình kiểm tra riêng dùng qpdf và PDF.js | Số trang, hướng trang, văn bản còn chọn được, tệp mở được, hình vẽ ra khác biệt dưới ngưỡng so với bản mong đợi |
| Đầu cuối (E2E) | Playwright cho Electron | Luồng chính của từng công cụ; luồng chạm giới hạn Free; luồng hủy |
| Offline | Playwright với mạng bị chặn | Mọi tính năng trên tài liệu vẫn chạy; xác nhận không có yêu cầu mạng nào phát sinh |
| Hiệu năng | Kịch bản đo | So với bảng mục tiêu ở mục 10 |
| Cài đặt | Máy ảo Windows 10 và 11 sạch | Cài từ gói, chạy, gỡ cài đặt, không để lại tệp thừa |
| Chứng nhận | Windows App Certification Kit | Không còn cảnh báo chặn |

### Ma trận tương thích

| Chiều | Giá trị cần thử |
| --- | --- |
| Hệ điều hành | Windows 10 22H2, Windows 11 (bản hiện hành) |
| Phần cứng | 4 GB RAM (thấp), 8 GB (trung bình), 16 GB (cao) |
| Màn hình | 100%, 150%, 200% tỷ lệ hiển thị; hai màn hình |
| Ngôn ngữ hệ điều hành | Anh (Mỹ), Đức, Pháp, Tây Ban Nha, Việt |
| Trình xem để kiểm tra kết quả | Edge, Chrome, Adobe Acrobat Reader, và một trình xem khác |
| Chế độ hiển thị | Sáng, tối, độ tương phản cao |

### Ca kiểm thử chấp nhận tiêu biểu

| Mã | Kịch bản | Kết quả mong đợi |
| --- | --- | --- |
| T-01 | Gộp 3 tệp khác khổ giấy theo thứ tự đã sắp | Đúng thứ tự, khổ trang giữ nguyên |
| T-02 | Gộp khi một tệp bị hỏng nặng | Báo lỗi đúng tệp, các tệp còn lại vẫn gộp được nếu người dùng chọn bỏ qua |
| T-03 | Tách theo `1-3, 5, 8-10` | Ba tệp, đúng số trang |
| T-04 | Nén tệp scan 40 MB ở mức Vừa | Nhỏ hơn rõ rệt, văn bản (nếu có lớp chữ) còn chọn được |
| T-05 | Nén tệp đã được tối ưu | Báo "đã được tối ưu", không xuất tệp lớn hơn |
| T-06 | Xoay trang 3 và 5 thêm 90 độ | Chỉ hai trang đổi hướng |
| T-07 | Hủy giữa lúc nén tệp lớn | Dừng trong vài giây, không để lại tệp tạm |
| T-08 | Thao tác trên tệp có chữ ký số | Hiện cảnh báo, chỉ tiếp tục khi người dùng đồng ý |
| T-09 | Ngắt Wi-Fi rồi chạy lần lượt mọi công cụ | Tất cả hoạt động bình thường |
| T-10 | Dùng Free rồi mua Pro rồi dùng tiếp | Giới hạn mở ngay, không cần khởi động lại |
| T-11 | Cài lại app, bấm Khôi phục mua hàng | Pro được khôi phục |
| T-12 | Tên tệp tiếng Việt và đường dẫn dài | Đọc và ghi đúng |

### Danh sách việc đánh giá đối thủ (làm ở tuần 0)

Cài 5 ứng dụng cạnh tranh và ghi lại từng mục sau để định hình ưu tiên:

1. Thời gian khởi động và thời gian gộp cùng một bộ tệp mẫu.
2. Dung lượng sau nén cùng một tệp scan ở mức mặc định.
3. Số bước để hoàn thành việc gộp hai tệp.
4. Có quảng cáo, yêu cầu tài khoản hay yêu cầu mạng không.
5. Giá và giới hạn của bản miễn phí.
6. Điểm đánh giá và những lời phàn nàn lặp lại nhiều nhất trong đánh giá thấp.

### Mức độ lỗi và quy tắc phát hành

| Mức | Ví dụ | Quy tắc |
| --- | --- | --- |
| Nghiêm trọng | Làm hỏng tệp, mất dữ liệu, lộ dữ liệu ra mạng, không cài được | Chặn phát hành; sửa ngay |
| Cao | Một công cụ chạy sai với loại tệp phổ biến, sập app | Sửa trước khi nộp |
| Trung bình | Giao diện lệch ở một tỷ lệ hiển thị, thông báo khó hiểu | Sửa nếu kịp, còn không đưa vào bản cập nhật kế tiếp |
| Thấp | Lỗi chính tả, căn lề nhỏ | Đưa vào danh sách chờ |

## 16. Lộ trình 10 tuần

Lộ trình giả định bạn làm khoảng 15 đến 20 giờ mỗi tuần, có AI hỗ trợ viết mã. Nếu thời gian ít hơn, kéo dài tương ứng thay vì cắt kiểm thử. Mỗi tuần kết thúc bằng một cổng kiểm tra (gate): chưa qua cổng thì không sang tuần sau.

| Tuần | Mục tiêu | Công việc chính | Sản phẩm bàn giao | Cổng kiểm tra |
| --- | --- | --- | --- | --- |
| 1 | Giảm rủi ro nền tảng | Đánh giá 5 đối thủ; đăng ký tài khoản nhà phát triển và hoàn tất xác minh; giữ chỗ tên; bản thử (spike) đóng gói MSIX bằng Electron cài được trên máy sạch; bản thử StoreBridge gọi được kiểm tra giấy phép | Báo cáo đối thủ, gói MSIX thử, StoreBridge chạy được | Cài từ gói thành công; gọi được API Store. Nếu không, đánh giá chuyển sang WinUI 3 |
| 2 | Khung ứng dụng | Dựng cấu trúc thư mục, giao diện nền, hàng đợi tác vụ, nhóm luồng nền, i18n, hộp thoại chọn tệp, hình thu nhỏ bằng PDF.js | Ứng dụng mở được tệp và hiện hình thu nhỏ | Hình thu nhỏ hiện đúng với bộ tệp thử |
| 3 | Gộp và xoay | F-01 và F-04 hoàn chỉnh; tích hợp qpdf; ghi tệp an toàn và kiểm tra đầu ra | Gộp và xoay chạy tốt | Qua ca kiểm thử T-01, T-02, T-06 |
| 4 | Tách và bản 0.5 | F-02; lưới trang chung; bộ kiểm tra kết quả tự động; giao cho 3 đến 5 người thử | Bản 0.5 nội bộ | Không còn lỗi nghiêm trọng ở gộp, tách, xoay trên bộ tệp thử |
| 5 | Nén, phần 1 | F-03: quét ảnh, tính độ phân giải, nén lại ảnh JPEG và Flate phổ biến; tối ưu cấu trúc bằng qpdf | Nén chạy được với tệp scan thường gặp | Đạt mục tiêu giảm dung lượng ở mức Vừa trên tệp scan thử |
| 6 | Nén, phần 2 | Mức Nhẹ và Mạnh, dung lượng đích, ước lượng trước khi chạy, xử lý trường hợp bỏ qua, chống tệp lớn hơn gốc, cảnh báo chữ ký số | Nén hoàn chỉnh | Qua T-04, T-05, T-08; không làm hỏng tệp nào trong bộ thử |
| 7 | Tính năng bổ trợ | F-05 (sắp xếp, xóa, trích, hoàn tác), F-06, F-07, F-08 | Bộ tính năng hoàn chỉnh | Qua kiểm thử tính năng bổ trợ |
| 8 | Thu phí và địa phương hóa | `FeatureGate`, `LicenseService`, luồng mua, khôi phục, kiểm thử mua trong môi trường thử; dịch giao diện tiếng Đức, Pháp, Tây Ban Nha | Bản có Free và Pro | Qua T-10, T-11; mua thử thành công |
| 9 | Ổn định và hồ sơ Store | Kiểm thử hiệu năng, máy sạch, ma trận tương thích, WACK; viết mô tả, chụp ảnh, quay video, trang quyền riêng tư; beta với 10 đến 20 người | Gói ứng viên phát hành, bộ hồ sơ Store | Không còn lỗi nghiêm trọng và cao; WACK sạch |
| 10 | Nộp và phát hành | Nộp chứng nhận; sửa nếu bị từ chối; phát hành; theo dõi 48 giờ đầu | Bản 1.0 trên Store | Được chứng nhận và hiển thị trên Store |

### Thứ tự cắt giảm khi trễ tiến độ

Nếu chậm hơn một tuần ở bất kỳ mốc nào, cắt theo thứ tự này (mục 1 cắt đầu tiên), không cắt kiểm thử hay chống làm hỏng tệp:

1. Ngôn ngữ Đức, Pháp, Tây Ban Nha (đưa sang bản 1.1, bản 1.0 chỉ có tiếng Anh).
2. F-08 Siêu dữ liệu.
3. Phát hiện trang trống trong F-05.
4. F-06 Ảnh sang PDF.
5. F-07 Mật khẩu (nhưng đây là tính năng Pro có giá trị cao, nên là lựa chọn cuối cùng để cắt).

### Quy trình làm việc đề xuất

- Mỗi tính năng viết thành một phiếu việc có tiêu chí chấp nhận lấy từ mục 6 và 7.
- Mọi nhánh mã đi qua kiểm thử tự động trên GitHub Actions bằng máy Windows trước khi gộp.
- Mỗi cuối tuần: dựng gói, cài trên máy sạch, chạy bộ kiểm thử chấp nhận; ghi lại điểm yếu vào nhật ký.
- Giữ một danh sách quyết định kỹ thuật (lý do chọn thư viện, giấy phép) để tra cứu khi cần giải thích hoặc đổi hướng.

## 17. Chi phí, doanh thu dự phóng và chỉ số theo dõi

Chi phí tiền mặt rất thấp; chi phí thật là thời gian của bạn, ước tính 150 đến 200 giờ cho bản 1.0. Doanh thu dưới đây là ba kịch bản giả định để hình dung biên độ, không phải dự báo, vì lượt cài và tỷ lệ chuyển đổi chỉ biết được sau khi phát hành.

### Chi phí khởi đầu và vận hành

| Khoản | Ước tính | Ghi chú |
| --- | --- | --- |
| Phí tài khoản nhà phát triển | 0 USD | Đã miễn phí theo thông báo; kiểm tra lại khi đăng ký |
| Chứng thư ký mã (code signing) | 0 USD | Gói MSIX được Microsoft ký khi nộp lên Store |
| Tên miền cho trang giới thiệu | Khoảng 10 đến 20 USD mỗi năm | Giá tùy nhà cung cấp |
| Lưu trữ trang web tĩnh | 0 USD | Dùng dịch vụ miễn phí cho trang tĩnh |
| Email hỗ trợ | 0 USD | Địa chỉ riêng trên tên miền hoặc hộp thư miễn phí |
| Máy ảo Windows 10 và 11 để kiểm thử | 0 USD | Tự tạo bằng công cụ ảo hóa sẵn có |
| Công cụ AI hỗ trợ lập trình | Theo gói bạn đang dùng | Khoản thay đổi theo lựa chọn của bạn |
| Dịch giao diện sang 3 ngôn ngữ | 0 đến 100 USD | Tự dịch có hỗ trợ máy rồi nhờ người bản ngữ đọc lại là cách tốt nhất |

Tổng tiền mặt dự kiến cho năm đầu: khoảng 10 đến 120 USD, chưa tính công cụ AI. Điểm hòa vốn về tiền mặt chỉ cần vài người mua.

### Ba kịch bản doanh thu trong 12 tháng đầu

Giả định chung: giá Pro 12,99 USD, nhà phát triển nhận 85% (mức thận trọng theo chia sẻ doanh thu đã công bố), bỏ qua hoàn tiền, thuế và chênh lệch giá theo vùng.

| Kịch bản | Lượt cài | Chuyển đổi sang Pro | Số người mua | Doanh thu gộp (USD) | Thực nhận (USD) |
| --- | --- | --- | --- | --- | --- |
| Thận trọng | 6.000 | 1,0% | 60 | 779 | 662 |
| Cơ sở | 20.000 | 2,0% | 400 | 5.196 | 4.417 |
| Tốt | 60.000 | 3,0% | 1.800 | 23.382 | 19.875 |

Cách đọc: kịch bản thận trọng cho thấy nếu ứng dụng không nổi bật được trên Store thì thu nhập năm đầu chỉ ở mức vài trăm đô la. Muốn vào kịch bản cơ sở trở lên cần thứ hạng tìm kiếm tốt, đánh giá cao và một vài kênh chủ động ở mục 14. Ba biến quan trọng nhất là lượt cài, tỷ lệ chuyển đổi và giá; ba biến này đều có thể cải thiện sau phát hành.

### Chỉ số theo dõi

| Chỉ số | Nguồn | Mục tiêu 30 ngày | Mục tiêu 90 ngày |
| --- | --- | --- | --- |
| Lượt xem trang Store | Partner Center | 3.000 | 15.000 |
| Lượt cài | Partner Center | 400 | 1.500 |
| Tỷ lệ cài trên lượt xem | Tính từ hai số trên | 10% | 10% |
| Tỷ lệ chuyển đổi Free sang Pro | Partner Center (số lượt mua trên lượt cài) | 1% | 1,5% đến 3% |
| Điểm đánh giá | Store | 4,0 | 4,2 |
| Số đánh giá | Store | 8 | 25 |
| Tỷ lệ phiên lỗi | Báo cáo sức khỏe của Store | Dưới 1,5% | Dưới 1% |
| Thư hỗ trợ mỗi 100 lượt cài | Hộp thư | Dưới 5 | Dưới 3 |

Bản 1.0 không có thống kê sử dụng trong app (mục 11), nên mọi chỉ số ở trên lấy từ Partner Center và hộp thư hỗ trợ. Nếu cần hiểu tính năng nào được dùng nhiều, hãy hỏi trực tiếp người dùng bằng khảo sát tùy chọn có liên kết ra ngoài, thay vì thu thập dữ liệu ngầm.

### Quy tắc quyết định sau 90 ngày

| Tình huống | Quyết định |
| --- | --- |
| Lượt cài dưới 500, chuyển đổi dưới 1% | Đổi định vị (nhắm riêng một nghề, ví dụ kế toán), cải thiện ảnh và mô tả Store, đo lại 30 ngày |
| Lượt cài tốt nhưng chuyển đổi dưới 1% | Điều chỉnh giới hạn Free và giá; xem lại thời điểm hiện thông báo nâng cấp |
| Chuyển đổi tốt nhưng lượt cài thấp | Đầu tư vào từ khóa, trang web, nội dung hướng dẫn |
| Cả hai đều tốt | Làm bản 1.2 và 2.0, cân nhắc gói thuê bao cho OCR |
| Đánh giá dưới 4,0 | Dừng thêm tính năng, sửa các lỗi lặp lại trong đánh giá thấp |

## 18. Rủi ro và phương án giảm thiểu

Ba rủi ro lớn nhất là: nén làm hỏng hoặc không đạt chất lượng, giấy phép Store khó tích hợp với Electron, và thị trường không đủ chú ý đến một app mới giữa nhiều đối thủ miễn phí. Phần còn lại là rủi ro vận hành thông thường của một dự án một người.

### Bảng rủi ro

Xác suất và tác động chấm theo ba mức: Thấp, Vừa, Cao.

| Mã | Rủi ro | Xác suất | Tác động | Biện pháp giảm thiểu | Tín hiệu cảnh báo |
| --- | --- | --- | --- | --- | --- |
| R-01 | Nén làm hỏng tệp hoặc cho kết quả kém | Vừa | Cao | Chỉ xử lý các loại ảnh phổ biến; kiểm tra tệp đầu ra; không xuất nếu không nhỏ hơn; bộ tệp thử đa dạng; cho phép dùng mức Nhẹ | Tệp thử bị lỗi hiển thị, người thử báo mất ảnh |
| R-02 | Giấy phép Store không chạy tốt với Electron | Vừa | Cao | Bản thử ở tuần 1; phương án chuyển sang WinUI 3 nếu thất bại | StoreBridge không lấy được giấy phép ở tuần 1 |
| R-03 | Thư viện có giấy phép không phù hợp với bán đóng kín | Thấp | Cao | Chỉ dùng thư viện đã xác minh giấy phép; lập danh sách thành phần; tránh AGPL | Thư viện mới được thêm mà chưa kiểm tra giấy phép |
| R-04 | Bị từ chối chứng nhận lần đầu | Vừa | Thấp | Chạy WACK, viết ghi chú kiểm tra, dự phòng vài ngày | Cảnh báo WACK chưa xử lý |
| R-05 | Đối thủ miễn phí chiếm thị phần | Cao | Vừa | Tập trung vào lời hứa riêng tư, tốc độ, nén tốt; nhắm một nghề cụ thể | Lượt cài thấp, đánh giá so sánh bất lợi |
| R-06 | Chuyển đổi sang Pro thấp | Cao | Cao | Giới hạn Free hợp lý; thông báo nâng cấp đúng lúc; thử giá; thêm tính năng Pro có giá trị (mật khẩu, hàng loạt) | Dưới 1% sau 30 ngày |
| R-07 | Đánh giá thấp vì giới hạn Free gây khó chịu | Vừa | Vừa | Báo giới hạn trước khi người dùng làm xong; ghi rõ giới hạn trong mô tả Store | Lời nhận xét lặp lại "phải trả tiền mới dùng được" |
| R-08 | Dùng từ ngữ tuân thủ gây hiểu nhầm | Thấp | Cao | Dùng cách nói ở mục 11; nhờ người có chuyên môn đọc lại | Khách hỏi "có chứng nhận HIPAA không" |
| R-09 | Khiếu nại nhãn hiệu về tên ứng dụng | Thấp | Vừa | Kiểm tra tên trước khi giữ chỗ; tránh tên giống Adobe và các hãng khác | Thư khiếu nại từ Store hoặc hãng khác |
| R-10 | Lỗ hổng bảo mật trong thư viện PDF | Vừa | Cao | Cập nhật theo lịch hằng tháng; theo dõi thông báo lỗ hổng; renderer bật sandbox | Thông báo lỗ hổng về PDF.js, qpdf, sharp, Electron |
| R-11 | Quá tải hỗ trợ khách khi chỉ có một người | Vừa | Vừa | Trang hướng dẫn thường gặp; thông báo lỗi rõ ràng; mẫu trả lời có sẵn | Nhiều thư lặp lại một câu hỏi |
| R-12 | Làm chậm tiến độ do mở rộng tính năng | Cao | Vừa | Giữ MVP; có thứ tự cắt giảm ở mục 16 | Trễ hơn một tuần ở bất kỳ mốc |
| R-13 | Vấn đề thuế và nhận tiền | Vừa | Vừa | Hoàn tất hồ sơ thanh toán sớm; hỏi người có chuyên môn thuế | Hồ sơ Partner Center bị yêu cầu bổ sung |
| R-14 | Dung lượng cài đặt lớn khiến khách ngại | Vừa | Thấp | Cắt tài nguyên không dùng; nén tài nguyên; ghi rõ dung lượng trong mô tả | Tỷ lệ cài trên lượt xem thấp |

### Ba kịch bản thất bại cần nghĩ trước

1. **"Ứng dụng chạy tốt nhưng không ai tìm thấy"**: lượt xem trang rất thấp. Cách xử lý: đổi tiêu đề và từ khóa, tăng nội dung ngoài Store, nhắm một nghề cụ thể và viết nội dung riêng cho nghề đó.
2. **"Nhiều người cài nhưng không ai mua"**: khách chỉ cần một lần gộp hai tệp. Cách xử lý: nâng giá trị Pro ở các việc lặp lại (hàng loạt, preset, tệp lớn, mật khẩu), giảm giá thử, xem lại giới hạn Free.
3. **"Một tệp của khách bị hỏng và họ viết đánh giá một sao"**: Cách xử lý: kiểm tra đầu ra nghiêm ngặt, ưu tiên sửa lỗi này trước mọi việc khác, phản hồi công khai và sửa trong vòng 48 giờ.

### Phương án B nếu hướng chính không thành

- Chuyển trọng tâm từ "bộ công cụ chung" sang "công cụ PDF cho một nghề" (ví dụ gói cho kế toán: gộp hóa đơn theo tháng, che thông tin nhạy cảm).
- Dùng nền tảng mã đã có để làm ứng dụng thứ hai nhỏ hơn trong cùng loại (ví dụ chỉ nén PDF) với một từ khóa riêng.
- Cân nhắc bán trực tiếp bản cài đặt có khóa cấp phép cho doanh nghiệp nhỏ ngoài Store, nếu đã có khách hỏi mua số lượng.

## 19. Phụ lục

### A. Yêu cầu phi chức năng

| Nhóm | Yêu cầu |
| --- | --- |
| Hiệu năng | Theo bảng mục tiêu ở mục 10 |
| Độ tin cậy | Không làm hỏng tệp gốc; kiểm tra đầu ra trước khi báo thành công; không để lại tệp tạm sau khi kết thúc hoặc hủy |
| Khả năng tiếp cận | Dùng được bằng bàn phím; tương thích Narrator; tương phản tối thiểu 4,5:1; hỗ trợ chế độ tương phản cao của Windows |
| Địa phương hóa | Chuỗi chữ tách khỏi mã; hỗ trợ tiếng Anh (Mỹ), Đức, Pháp, Tây Ban Nha, Việt; định dạng ngày và số theo vùng; mặc định cỡ giấy Letter hoặc A4 theo vùng |
| Bảo mật | Theo mục 11; renderer bật sandbox; không có yêu cầu mạng trong luồng xử lý tài liệu |
| Tương thích | Windows 10 22H2 và Windows 11, x64 |
| Khả năng hỗ trợ | Nút "Sao chép chi tiết lỗi" không chứa nội dung tài liệu; trang trợ giúp trong app |
| Dung lượng | Mục tiêu gói cài đặt gọn nhất có thể; theo dõi và ghi vào mô tả Store |

### B. Nội dung mẫu cho trang Store (tiếng Anh)

**Tên:** Offline PDF Toolbox: Merge, Split, Compress

**Mô tả ngắn:** Merge, split, compress and rotate PDFs entirely on your PC. No uploads. No account.

**Mô tả đầy đủ (bản nháp):**

```text
Your documents never leave your computer.

Offline PDF Toolbox is a fast, private PDF toolkit for Windows. Merge several files into one, split a large PDF into parts, shrink file size for email, and fix pages that are upside down or sideways. Everything runs locally on your PC. There is nothing to upload and no account to create.

WHAT YOU CAN DO
- Merge PDFs: combine files in the order you choose, with optional page ranges
- Split PDFs: by page range, every N pages, by bookmark, or by maximum file size
- Compress PDFs: three levels or a target size, with a before and after comparison
- Rotate pages: rotate selected pages or the whole document
- Organize pages: reorder, delete and extract pages with a visual grid
- Images to PDF: turn photos and scans into a single PDF
- Protect with a password (Pro): AES-256 encryption

BUILT FOR SENSITIVE DOCUMENTS
Contracts, financial records, medical files, HR paperwork: handle them without sending a single byte to a website. Document processing works with the network turned off.

SIMPLE PRICING
Free to download with generous limits. Unlock everything with a one-time Pro purchase. No subscription, no ads.

FREE VERSION LIMITS
- Merge up to 2 files at a time
- Export up to 5 pages when splitting or extracting
- Compress 1 file at a time (files up to 20 MB, Light and Medium levels)

PRO UNLOCKS
- Unlimited merging, splitting and rotating
- Strong compression and target size
- Password protection (AES-256)
```

**Gợi ý cập nhật "What's new" cho bản 1.0:** `First release: merge, split, compress, rotate, organize pages, images to PDF.`

Lưu ý: mọi con số giới hạn trong mô tả phải khớp đúng với bản phát hành thật; không ghi "HIPAA compliant" hay "GDPR compliant".

### C. Danh sách kiểm tra trước khi nộp

- [ ] Tài khoản nhà phát triển đã xác minh; hồ sơ thanh toán và thuế đã hoàn tất
- [ ] Tên ứng dụng đã giữ chỗ; đã kiểm tra trùng và nhãn hiệu
- [ ] `Identity Name` và `Publisher` trong manifest khớp với Partner Center
- [ ] Phiên bản gói đã tăng so với lần nộp trước
- [ ] Gói MSIX cài, chạy và gỡ sạch trên Windows 10 và 11 sạch
- [ ] Windows App Certification Kit không còn lỗi chặn
- [ ] Bộ kiểm thử chấp nhận (mục 15) đạt hết; bài kiểm thử ngoại tuyến đạt
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

### D. Lời nhắc (prompt) mẫu cho AI lập trình

Các lời nhắc dưới đây dành cho công cụ AI viết mã. Hãy dán kèm mục tương ứng của tài liệu này làm ngữ cảnh, và yêu cầu AI làm từng bước nhỏ, chạy kiểm thử sau mỗi bước.

**Prompt 1: Dựng khung dự án**

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

**Prompt 2: Gộp, tách, xoay bằng qpdf**

```text
Cài đặt F-01, F-02, F-04 theo mục 6. Dùng qpdf đóng kèm như tiến trình con (spawn, không shell), không nạp cả tệp vào bộ nhớ JavaScript.
Quy tắc: ghi ra tệp tạm, kiểm tra lại (mở được, đủ số trang), rồi đổi tên vào đích; không bao giờ ghi đè; làm sạch tên tệp; hủy được và dọn tệp tạm.
Viết kiểm thử tự động bằng bộ tệp trong tests/fixtures cho các ca T-01, T-02, T-03, T-06, T-07, T-12.
```

**Prompt 3: Nén PDF**

```text
Cài đặt F-03 theo quy trình 8 bước ở mục 10. Chỉ hỗ trợ ảnh JPEG và Flate 8 bit màu hoặc thang xám ở bản 1.0; bỏ qua ảnh nhỏ, ảnh 1 bit và bộ lọc chưa hỗ trợ.
Ba mức Nhẹ/Vừa/Mạnh và dung lượng đích. Nếu kết quả không nhỏ hơn tệp gốc thì không xuất và báo "đã được tối ưu". Phát hiện chữ ký số và cảnh báo.
Đo và báo cáo tỷ lệ giảm trên bộ tệp thử; kiểm tra tự động rằng văn bản vẫn chọn được và số trang không đổi.
```

**Prompt 4: Giấy phép Store**

```text
Tạo chương trình .NET nhỏ StoreBridge dùng Windows.Services.Store để (1) lấy trạng thái sản phẩm Pro (durable add-on), (2) mở luồng mua, (3) khôi phục mua hàng. Giao tiếp với main qua JSON trên stdin/stdout.
Trong app, viết LicenseService và FeatureGate theo mục 12: bảng giới hạn Free ở một nơi, có kiểm thử đơn vị cho mọi giới hạn, mở khóa ngay sau khi mua, giữ trạng thái Pro 14 ngày nếu không kiểm tra được.
```

### E. Thuật ngữ

| Thuật ngữ | Giải nghĩa |
| --- | --- |
| MSIX | Định dạng đóng gói ứng dụng hiện đại của Windows, dùng để nộp lên Microsoft Store |
| Partner Center | Trang quản lý ứng dụng, giá, chứng nhận và doanh thu của nhà phát triển trên Store |
| Add-on (mua trong ứng dụng) | Sản phẩm bán kèm ứng dụng; loại "durable" là mua một lần, dùng lâu dài |
| WACK | Windows App Certification Kit, bộ công cụ kiểm tra gói trước khi nộp |
| CID | Mã chiến dịch gắn vào liên kết để theo dõi nguồn khách |
| qpdf | Công cụ dòng lệnh mã nguồn mở để xử lý cấu trúc PDF |
| Fixture | Tệp mẫu dùng cho kiểm thử |

### F. Nguồn tham khảo

Các nguồn dưới đây là kết quả tìm kiếm ngày 20 tháng 10 năm 2026, mình dùng nội dung trích trong kết quả tìm kiếm, chưa mở và đọc từng trang đầy đủ. Hãy đối chiếu lại với tài liệu chính thức khi thực hiện.

- [Microsoft Windows Developer Blog: Publish to Microsoft Store as a company, with free registration and faster onboarding (7/5/2026)](https://blogs.windows.com/windowsdeveloper/2026/05/07/publish-to-microsoft-store-as-a-company-now-with-free-registration-and-faster-onboarding/)
- [Windows Central: Microsoft Store drops fees for individual developers](https://www.windowscentral.com/microsoft/windows-11/microsoft-store-drops-fees-for-individual-developers-apple-still-charges-usd99-per-year/)
- [AlternativeTo: Microsoft drops Store publishing fee for individual developers globally](https://alternativeto.net/news/2025/9/microsoft-finally-drops-microsoft-store-publishing-fee-for-individual-developers-globally)
- [Microsoft Learn: Sign up for a developer account](https://learn.microsoft.com/en-us/windows/apps/get-started/sign-up)
- [Microsoft Developer: Enroll as a developer for Microsoft Store](https://developer.microsoft.com/programs/join)
- [Microsoft Developer: Get started, publish your first app](https://developer.microsoft.com/en-us/windows/publish)
- [Windows Blog (2018): A new Microsoft Store revenue share is coming](https://blogs.windows.com/buildingapps/2018/05/07/a-new-microsoft-store-revenue-share-is-coming/)
- [Hướng dẫn xuất bản ứng dụng Electron lên Microsoft Store (MSIX)](https://docs.hagicode.com/en-US/blog/2026-06-18-electron-app-publish-to-microsoft-store/)
- [Kinh nghiệm đóng gói Tauri cho Microsoft Store](https://scour.ing/@hello/p/https://dev.to/octasoft-ltd/building-wsl-ui-the-microsoft-store-journey-2428)
