# Hồ sơ nộp Microsoft Store — Offline PDF Toolbox 1.0

Cập nhật: 2026-11-07 · Áp dụng cho bản có ưu đãi ra mắt (Pro miễn phí đến 15/12/2026, chưa có Add-on trả phí)

> Partner Center đổi nhãn thường xuyên. Làm theo **ý nghĩa** từng ô nếu tên ô khác.
> Mọi đường dẫn bên dưới tính từ thư mục `apps/desktop/`.

---

## 0. Thông tin cố định

| Mục | Giá trị |
| --- | --- |
| Tên sản phẩm | Offline PDF Toolbox |
| Identity Name | `MTDStudio.OfflinePDFToolbox` |
| Publisher | `CN=F6CFEAEE-C755-4C7E-BDC5-FD89DA169656` |
| Publisher display name | MTD Studio |
| Store ID | `9P0G6ZR05JHK` |
| Loại | MSIX / PWA app (đã chọn khi tạo sản phẩm) |
| Giá | Miễn phí |
| Add-on Pro | **Chưa tạo** (chờ xong hồ sơ thuế). Product ID dự kiến: `pro_lifetime` |

---

## 1. Tệp cần chuẩn bị và để ở đâu

### 1.1. Gói cài đặt

| Việc | Cách làm | Kết quả |
| --- | --- | --- |
| Tăng version lên `1.0.0` | Sửa `version` trong `apps/desktop/package.json` và `package.json` gốc | — |
| Build MSIX | PowerShell: `npm run make` | `out/make/msix/.../*.msix` (đường dẫn chính xác do Forge in ra) |
| Kiểm tra gói | Windows App Certification Kit | Không còn lỗi chặn |

Tải file `.msix` lên mục **Packages**.

### 1.2. Logo cho trang Store

Sinh tự động bằng `node scripts/generate-assets.mjs` (lệnh `npm run dev` cũng tự chạy). File nằm ở **`store-assets/logos/`**:

| File | Kích thước | Dán vào ô nào của Store listing |
| --- | --- | --- |
| `store-assets/logos/Logo-1x1-300x300.png` | 300×300 | **App tile icon / Logo 1:1 (300×300)**. Bắt buộc |
| `store-assets/logos/PosterArt-2x3-720x1080.png` | 720×1080 | **Poster art 2:3**. Nên có |
| `store-assets/logos/BoxArt-1x1-1080x1080.png` | 1080×1080 | **Box art 1:1**. Nên có |

Logo **bên trong gói MSIX** (không phải tải thủ công, đã nằm sẵn trong `assets/`): `Square44x44Logo.png`, `Square150x150Logo.png`, `Square310x310Logo.png`, `Wide310x150Logo.png`, `StoreLogo.png`, `SplashScreen.png`, `LockScreenLogo.png`, `icon.ico`. Đừng sửa tay các PNG này: mỗi lần chạy `npm run dev` chúng bị sinh lại từ `scripts/generate-assets.mjs`. Muốn đổi logo thì sửa script đó.

### 1.3. Ảnh chụp màn hình

Chụp tự động từ app thật bằng `node scripts/capture-store-screenshots.mjs` (cần `npm run dev` đang chạy ở cửa sổ khác, chạy trong PowerShell). Ảnh PNG 2400×1350 (tỷ lệ 16:9, nằm trong khoảng Store cho phép 1366×768 đến 3840×2160) nằm ở **`store-assets/screenshots/`**. PDF mẫu dùng để chụp nằm ở `store-assets/demo-pdfs/` (tạo bằng `node scripts/make-demo-pdfs.mjs`).

Tải lên theo **đúng thứ tự** này (ảnh đầu quan trọng nhất):

| # | File | Caption (tiếng Anh, dán vào ô chú thích) |
| --- | --- | --- |
| 1 | `01-home.png` | Your files never leave your PC |
| 2 | `02-merge.png` | Merge PDFs in the order you choose |
| 3 | `03-compress.png` | Shrink big scans before you email them |
| 4 | `04-split.png` | Split by range, every N pages or bookmarks |
| 5 | `05-watermark-page-numbers.png` | Add a watermark and page numbers |
| 6 | `06-pdf-to-images.png` | Turn pages into PNG or JPG pictures |
| 7 | `07-password-lock.png` | Lock a PDF with AES-256 encryption |
| 8 | `08-home-dark.png` | Light and dark themes |
| 9 | `09-merge-dark.png` | Fast and private, with the network off |

Ghi chú: ảnh tool 05 đến 07 hiện hình xem trước trang đầu của tài liệu mẫu, ảnh 02 hiện 3 tệp xếp sẵn. Nếu muốn đổi nội dung thì sửa `scripts/capture-store-screenshots.mjs` rồi chạy lại.

---

## 2. Điền từng mục trong Partner Center

### 2.1. Pricing and availability

| Ô | Điền |
| --- | --- |
| Markets | Tất cả thị trường (tối thiểu: US, CA, GB, DE, FR, ES, AU, VN) |
| Visibility | Public |
| Price | Free |
| Free trial | Không |
| Publish | Ngay sau khi qua chứng nhận (hoặc Manual nếu muốn chọn ngày ra mắt) |

### 2.2. Properties

| Ô | Điền |
| --- | --- |
| Category | Productivity |
| Sub-category | Chọn mục gần nhất với "Document" nếu có |
| Privacy policy URL | `https://hoangmanhtruong-uet-dev.github.io/Offline-PDF-Toolbox/privacy/` (GitHub Pages đã bật cho `/docs` ngày 2026-11-07, đã mở thử được, trả về 200). **Bắt buộc mở được** |
| Website (tùy chọn) | Trang GitHub của dự án |
| Support contact | `developerhoangtruong@gmail.com` |
| System requirements | Windows 10 version 2004 (19041) trở lên, x64 · RAM tối thiểu 4 GB · Trống khoảng 300 MB |
| Declarations | Không quảng cáo, không đăng nhập, không thu dữ liệu |

### 2.3. Age ratings

Bấm *Start questionnaire* và chọn **Utility, Productivity, Collaboration or Other**. Trả lời **No** cho mọi câu về bạo lực, nội dung người lớn, cờ bạc, chat, chia sẻ vị trí, thu mua nội dung do người dùng tạo. Câu về "mua trong ứng dụng": ở bản này **chưa có**, chọn No (khi thêm Add-on ở bản sau, làm lại bảng câu hỏi). Kết quả thường là 3+ / Everyone.

### 2.4. Packages

1. Kéo thả file `.msix` đã build (mục 1.1).
2. Chọn hỗ trợ Windows 10/11 Desktop, kiến trúc x64.
3. Kiểm tra Identity khớp mục 0. Nếu lệch, Store từ chối ngay.

### 2.5. Store listings — English (United States)

**Product name**

```
Offline PDF Toolbox: Merge, Split, Compress
```

**Short description** (tối đa 1000 ký tự, dùng bản này)

```
Merge, split, compress and rotate PDFs entirely on your PC. No uploads. No account.
```

**Description**

```
LAUNCH OFFER: every Pro feature is free until December 15, 2026.

Your documents never leave your computer.

Offline PDF Toolbox is a fast, private PDF toolkit for Windows. Merge several
files into one, split a large PDF into parts, shrink file size for email, and
fix pages that are upside down or sideways. Everything runs locally on your PC.
There is nothing to upload and no account to create.

WHAT YOU CAN DO
- Merge PDFs: combine files in the order you choose, with optional page ranges
- Split PDFs: by page range, every N pages, by bookmark, or by maximum file size
- Compress PDFs: three levels or a target size, with a before and after comparison
- Rotate pages: rotate selected pages or the whole document
- Organize pages: reorder, delete and extract pages with a visual grid
- Images to PDF: turn photos and scans into a single PDF
- Watermark and page numbers: stamp text and number every page
- PDF to images: export each page as PNG or JPG
- Clean metadata: remove author, title and hidden info before sharing
- Password lock: AES-256 encryption, or remove a password you know
- Batch processing and presets: run one action on many PDFs

BUILT FOR SENSITIVE DOCUMENTS
Contracts, financial records, medical files, HR paperwork: handle them without
sending a single byte to a website. Document processing works with the network
turned off.

FREE AND PRO
Free to download with generous limits. During the launch offer every Pro
feature is unlocked. After the offer ends the free version keeps these limits:
- Merge up to 2 files at a time
- Split or organize up to 5 pages
- Compress 1 file at a time (up to 20 MB, Light and Medium levels)
- Rotate 1 file, up to 10 pages
- Images to PDF: up to 3 images
- Watermark and page numbers: up to 10 pages
- PDF to images: up to 5 pages, 1600 px wide
- Clean metadata: 1 file at a time
- Password lock and batch processing are Pro features
No subscription, no ads.
```

**What's new in this version**

```
First release: merge, split, compress, rotate, organize pages, images to PDF, watermark and page numbers, PDF to images, metadata cleaner, password lock and batch processing.
```

**Search terms** (tối đa 7 cụm, không lặp từ trong tên)

```
offline pdf
combine pdf
reduce pdf size
pdf watermark
password protect pdf
pdf to jpg
images to pdf
```

**Hình ảnh**

| Ô trong form | Dán file |
| --- | --- |
| Screenshots (desktop) | 9 ảnh ở mục 1.3, đúng thứ tự, kèm caption |
| App tile icon / Logo 1:1 | `store-assets/logos/Logo-1x1-300x300.png` |
| Poster art 2:3 | `store-assets/logos/PosterArt-2x3-720x1080.png` |
| Box art 1:1 | `store-assets/logos/BoxArt-1x1-1080x1080.png` |
| Trailer | Bỏ trống ở bản đầu |

**Copyright and trademark info**: `© 2026 MTD Studio`

### 2.6. Notes for certification

Dán nguyên đoạn này vào ô *Notes for certification*:

```
No sign-in or account is required. All processing is local; the app works with
the network disabled.

runFullTrust: the app is an Electron desktop app. It needs full-trust to read the
PDF files the user selects, write results next to them, and run the bundled qpdf
command-line tool as a child process. No files are uploaded.

How to test: open the app, choose any tool, add one or more PDF files (any PDFs
work), then press the main button. Output is saved next to the original file.
Password lock needs the password you set, and batch processing accepts several files.

Launch promotion: all Pro features are unlocked for everyone until 2026-12-15, so
every tool can be tested without any purchase. There is no in-app purchase in this
version; it will be added in a later update.

Free-version limits (after the promotion ends): merge 2 files, split/organize 5
pages, compress 1 file up to 20 MB, watermark/page numbers 10 pages, PDF to images
5 pages.
```

---

## 3. Nộp hồ sơ

1. Mọi mục trên trang tổng quan chuyển sang **Complete**.
2. Kiểm tra lại: ảnh khớp thứ tự, URL quyền riêng tư mở được, Identity khớp.
3. Bấm **Submit for certification**. Dự phòng vài ngày cho lần nộp đầu.

## 4. Việc phải làm trước 15/12/2026

Ưu đãi hết hạn sau ngày này (hằng số `PRO_PROMO_ENDS_AT` trong `src/shared/promo.ts`). Trước đó:

1. Hoàn tất hồ sơ thuế và thanh toán trong Partner Center.
2. Tạo Add-on **Durable** có Product ID `pro_lifetime`, giá 12,99 USD.
3. Phát hành bản cập nhật (1.0.1 trở lên): thêm Add-on, làm lại bảng câu hỏi tuổi nếu Store yêu cầu, sửa mô tả và ghi chú kiểm tra (bỏ dòng "LAUNCH OFFER", thêm nút mua Pro).
4. Hoặc gia hạn ưu đãi: sửa ngày trong `promo.ts` rồi phát hành bản mới.

## 5. Checklist cuối

- [ ] `package.json` đã là `1.0.0`; build `npm run make` thành công
- [ ] Windows App Certification Kit không còn lỗi chặn
- [ ] Identity khớp mục 0
- [ ] 9 ảnh chụp tải đúng thứ tự, có caption
- [ ] 3 logo (1:1, 2:3, box art) đã tải
- [ ] URL quyền riêng tư mở được
- [ ] Email hỗ trợ hoạt động
- [ ] Mô tả khớp giới hạn trong `src/shared/features.ts`
- [ ] Ghi chú kiểm tra đã dán, nhắc ưu đãi và lý do `runFullTrust`
- [ ] Bảng câu hỏi tuổi đã hoàn tất
