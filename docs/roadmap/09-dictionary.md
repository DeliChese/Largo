# 09 — Từ điển đa nguồn (sau engine/AI/triển khai)

## Baseline

`src/utils/chineseDict.ts` ưu tiên từ điển offline `CHINESE_WORDS` và extra lexicon, fallback trực tuyến MyMemory nếu không tìm thấy. `DecksView.tsx` có modal Trung–Việt và link Cambridge cho tiếng Anh (qua `cambridgeLookupUrl`). Chữ “Hanzii-style” trong code **không** là tích hợp API Hanzii. Chưa có xác nhận quyền dùng API Hanzii để tái bản nội dung trên Largo.

## Kiến trúc DictionaryProvider

`DictionaryProvider.search({term, language, locale, senseId?}) -> DictionaryResult[]`. Các provider:
- Built-in Largo (offline, được ưu tiên khi offline hoặc học theo giáo trình)
- Hanzii preferred for Chinese: mở trang tra cứu chính xác bằng URL được kiểm chứng; chỉ gọi API và render nội dung khi có giấy phép/cơ chế được chấp thuận.
- Cambridge preferred for English: giữ link hiện tại; API/data phải được cấp quyền theo điều khoản nhà cung cấp.
- Licensed/open dictionary fallback (ví dụ CC-CEDICT tuân thủ giấy phép và attribution), không sao chép nguyên website third-party tùy tiện.

## Phân tách dữ liệu

- Thẻ học `VocabWord` có một `wordId` ổn định và nghĩa mục tiêu của curriculum.
- `DictionaryResult` có `provider`, `sourceUrl`, `fetchedAt`, `license`, `senseId`, ví dụ và nghĩa riêng.
- Nội dung tra cứu **không** tự ghi vào `VocabWord`, SRS, Bloom hoặc override notes cá nhân.
- Nếu người dùng muốn nhập một nghĩa/ví dụ, phải chọn thủ công và ghi attribution, tránh vi phạm bản quyền.
- Caching chỉ với provider cho phép; offline data vẫn hiển thị nếu API không truy cập được.

## UX

Mở chi tiết từ → thông tin gốc ngay lập tức → “Tra Hanzii” (zh) / “Tra Cambridge” (en) → kết quả có nguồn khi được phép hoặc link ngoài; có nút “Thử nguồn khác”. Không để lỗi API chặn StudySession. Phân biệt HSK edition và Chinese giản/phồn; English en-GB/en-US.

## Acceptance

Nguồn và giấy phép được kiểm thực, fallback offline, từ nhiều nghĩa không bị ghép sai, URL được encode, không tự thay lịch ôn/tiến độ. Chưa có giấy phép Hanzii thì feature link ngoài vẫn hợp lệ, không scrape.
