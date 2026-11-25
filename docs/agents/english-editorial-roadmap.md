# Largo — Roadmap biên tập tiếng Anh, giai đoạn 2

Đây là kế hoạch làm việc qua nhiều phiên, không phải thông báo đã hoàn tất. Giai đoạn 2 chỉ cải thiện chất lượng học liệu; việc xác minh CEFR và phân bổ lại bộ thuộc giai đoạn 3. Không nhầm với các phase của master roadmap về engine.

## Bắt đầu mỗi phiên

1. Đọc [AGENTS.md](../../AGENTS.md), tài liệu này, [tiến độ thực tế](english-editorial-progress.md), [quy chuẩn học liệu](language-curriculum.md) và [kiểm chứng](verification.md).
2. Kiểm tra HEAD của main, trạng thái workspace (nếu có), seed version và số ID trong English/englishEditorial.json. Không dựa vào số liệu chat cũ.
3. Chọn đợt chưa hoàn thành đầu tiên, kiểm kê ID nguồn và trừ các overlay đã có. Nếu phát hiện đợt dở dang, tiếp tục đợt đó thay vì nhảy chữ cái.
4. Chia phạm vi theo bài/bộ và ID duy nhất; mục tiêu khoảng 250–350 ID mới mỗi đợt, điều chỉnh theo độ khó. Nếu vượt phạm vi, chia thành 2E.1, 2E.2…; không ép khớp số lượng. Không đếm lặp ID dùng chung.

## Mốc bàn giao sau 2D (Seed v17)

- HEAD khi lập kế hoạch: [0113d6e](https://github.com/DeliChese/Largo/commit/0113d6ee4b3ba6bf5978587c1fef728e827727ca).
- 1.391/7.000 ID có overlay (19,87%); còn 5.609 ID chưa có overlay. Đây là độ phủ biên tập, không phải tỷ lệ đã kiểm định.
- Đợt 1: 192; 2A: 257; 2B: 310; 2C: 370; 2D: 262 ID mới.
- A1: 966; A2: 71; B1: 0; B2: 61; C1: 268; phrasal ID riêng: 25. Bốn ID phrasal dùng chung A2 đã nằm trong A2.
- A1 nguồn chính 800/800, extra 94/94 và collocations 72/72 có overlay; vẫn còn giao tiếp gốc, biến thể và cần kiểm kê nguồn expansion A1.
- A2 nguồn chính đã sửa 67/900; C1 đã phủ nghĩa/ghi chú, chưa kiểm tra hết ví dụ và quan hệ từ.
- Chưa chạy lint/test/build/browser cho 2D. **Đợt tiếp theo: 2E.** Số liệu sống nằm trong tài liệu tiến độ, không sửa mốc lịch sử này.

## Kế hoạch các đợt

| Đợt | Trạng thái hiện tại | Phạm vi / đầu ra |
| --- | --- | --- |
| 2A–2D | Đã có overlay; chưa nghiệm thu toàn trường | Xem nhật ký tiến độ |
| 2E | Đã phủ (v18); chưa nghiệm thu | Giao tiếp gốc A1, biến thể A1, kiểm kê/biên tập expansion A1 còn lại; tiếp tục A2 nguồn chính nếu còn sức chứa |
| 2F | Đã phủ phạm vi đợt (v19); chưa nghiệm thu | A2 nguồn chính: sinh hoạt, con người, hành động |
| 2G | Đã phủ phạm vi đợt (v20); chưa nghiệm thu | A2 nguồn chính: công việc, xã hội, tính từ và các bài còn lại |
| 2G-POS | Đã bổ sung cơ chế và đợt mẫu (v21); chưa nghiệm thu | Phân nghĩa theo từ loại cho 61 ID A1–A2 (72 nhóm); duy trì quy chuẩn này từ 2H |
| 2H | Đã phủ 393 ID (v24); A2 1.297/1.297, chưa nghiệm thu | A2 extra, collocations, giao tiếp, regional, expansion chưa phủ; bổ sung nghĩa/từ loại khác phù hợp |
| 2I | Đã phủ 551/551 danh từ nguồn chính B1 (v27); chưa nghiệm thu | B1 nguồn chính: danh từ |
| 2J | Đã phủ 104/104 động từ nguồn chính B1 (v28); chưa nghiệm thu | B1 nguồn chính: động từ |
| 2K | Đã phủ 295/295 ID (v30); B1 nguồn chính 950/950, chưa nghiệm thu | B1 nguồn chính: tính từ, trạng từ và các mục nguồn chính còn lại |
| 2L | Đã phủ 310/310 (v32); chưa nghiệm thu | B1 extra |
| 2M | Đã phủ 108/108 ID (v33); chưa nghiệm thu | B1 collocations, giao tiếp, regional |
| 2N | Chưa làm | B1 expansion |
| 2O | Chưa làm | B2 nguồn chính: danh từ |
| 2P | Chưa làm | B2 nguồn chính: động từ |
| 2Q | Chưa làm | B2 nguồn chính: tính từ, trạng từ và các mục nguồn chính còn lại |
| 2R | Chưa làm | B2 extra |
| 2S | Chưa làm | B2 collocations, cấu trúc, regional |
| 2T | Chưa làm | B2 chuyên ngành; bảo toàn 61 overlay công nghệ/kinh tế đã có |
| 2U | Chưa làm | B2 expansion chưa phủ |
| 2V | Chưa làm | Cụm động từ, thành ngữ, biến thể và nhóm còn sót |
| 2W | Chưa làm | Kiểm kê toàn kho, xử lý hết ID thiếu overlay, đối chiếu tổng 7.000 ID |
| 2X | Chưa làm | Rà lại ví dụ, bản dịch và độ tự nhiên toàn kho A1–C1, bao gồm C1 đã có overlay |
| 2Y | Chưa làm | Rà IPA, biến thể, từ loại, nghĩa bổ sung theo từ loại, collocations, cấu trúc, đồng/trái nghĩa và ghi chú toàn kho |
| 2Z | Chưa làm | Nghiệm thu toàn bộ, kiểm thử migration và UI; ghi hạn chế còn lại |

Các nhóm từ loại là ưu tiên biên tập, không phải thay đổi thành viên bài. Các đợt có thể chia nhỏ, chuyển phần dư sang đợt sau khi ghi rõ ID/bộ còn thiếu; không đánh dấu hoàn thành chỉ vì đạt quota. Nếu 2W còn hàng nghìn ID, phải chia thêm đợt con. 2X–2Z là kiểm định, không phải quota ID mới.

## Quy trình biên tập

- Nguồn: English/englishVocabulary.json, englishExtraVocabulary.json, englishCollocations.json, englishRegional.json, englishPhrasalVerbs.json, englishExpansion.json và các bộ giao tiếp trong src/data/englishDecks.ts. Đọc cách tạo ID, merge enrichment/overlay và quan hệ từ trong mã trước khi sửa. Nếu tệp quá lớn, truy xuất theo blob/phần hoặc dùng checkout; không suy đoán số mục từ dữ liệu bị cắt.
- Ghi nghĩa chính vào English/englishEditorial.json, nghĩa bổ sung theo từ loại vào English/englishAdditionalSenses.json, bằng ID hiện có khi schema hỗ trợ. Giữ nguyên dữ liệu nguồn, CEFR, bộ, số thẻ và SRS/Bloom. Không ghi đè overlay cũ trong đợt phủ mới; sửa lại có chủ đích ở đợt kiểm định và ghi rõ.
- Kiểm tra từng mục: nghĩa ngắn đúng từ loại/ngữ cảnh, hai câu song ngữ tự nhiên và sát nghĩa (ghi số viết mới/giữ lại), collocation hữu ích, cấu trúc và ghi chú phân biệt nếu cần. Kiểm tra khả năng tách phrasal verb, vị trí đại từ, giới từ. Không tạo đồng/trái nghĩa thiếu căn cứ.
- Từ đồng tự đa từ loại: giữ nghĩa/từ loại chính đúng phạm vi thẻ, không trộn nghĩa khác loại vào đáp án; thêm `additionalSenses` theo từ loại/nghĩa, với hai câu song ngữ riêng, cấu trúc và cách đọc khi khác. Không tự tạo ID hoặc lịch ôn riêng, không đưa nghĩa phụ vào đáp án/đánh giá Bloom. Khi headword vùng miền khác, không tự suy ra nghĩa phụ dùng chung. Xem [quy chuẩn học liệu](language-curriculum.md).
- Với IPA và ví dụ theo vùng: schema overlay hiện chưa hỗ trợ mọi trường (như phonetic/englishForms/formExamples). Kiểm tra nguồn và cơ chế hợp nhất; nếu cần thay đổi schema hoặc nguồn, lập phạm vi riêng, kiểm thử và ghi rõ. Không tuyên bố đã sửa trường không được lưu/hiển thị.
- Phân biệt nội dung Largo biên soạn với nội dung được đối chiếu từ điển. Ghi nguồn khi sử dụng; không sao chép ví dụ có bản quyền hàng loạt.
- Khi có thay đổi học liệu cần migration, tăng CURRENT_DATA_VERSION trong src/data/seedVocab.ts theo phiên bản thực tế; không tăng seed cho commit chỉ có tài liệu.

## Quality gates

Mỗi đợt:
- JSON parse thành công; phát hiện khóa trùng trước khi parse làm mất dấu; mọi ID mới tồn tại trong seed, không tạo ID ngoài danh mục.
- Nghĩa bổ sung: kiểm tra ID tồn tại, từ loại/ý nghĩa không rỗng, ví dụ đúng nhóm, phát âm khác được ghi rõ, nghĩa chính và SRS/Bloom không đổi; kiểm tra hiển thị ở thư viện/flashcard, tra cứu, backup và migration.
- Đối chiếu tập ID trước/sau, tổng ID duy nhất và số ID theo nhóm; kiểm tra overlay cũ không đổi (trừ sửa chủ đích có báo cáo).
- Kiểm tra nghĩa, ví dụ không rỗng, tương thích schema và đúng hiển thị; hai câu song ngữ/mục mới hoặc ghi rõ ngoại lệ có lý do.
- Chạy khi môi trường cho phép: npm run lint, npm test, npm run build; kiểm tra UI thực tế và migration từ bản seed trước, chạy cập nhật hai lần, bảo toàn tiến độ, thẻ đã xóa và dữ liệu cá nhân. Không báo pass cho lệnh chưa chạy. Nếu chỉ truy cập qua GitHub API, ghi rõ giới hạn và các kiểm tra còn nợ.

Nghiệm thu 2Z: 7.000/7.000 ID đã rà soát, kiểm tra tất cả trường hoặc ghi lý do không áp dụng, xử lý lỗi và quality gates bắt buộc đạt. Phủ overlay 100% không đủ. Nếu còn blocker, giữ trạng thái chưa nghiệm thu, chưa chuyển sang giai đoạn 3.

## Bàn giao cuối mỗi phiên

Cập nhật [tiến độ thực tế](english-editorial-progress.md) cùng commit học liệu; cập nhật trạng thái đợt ở roadmap (giữ nguyên mốc v17). Ghi tối thiểu:

- Đợt, trạng thái (chưa làm / đang làm / đã phủ / đã kiểm định), seed version, ref/commit bàn giao (nếu có).
- Phạm vi bộ/bài, số ID mới và số ID rà lại; số ID có nghĩa bổ sung, số nhóm nghĩa và câu ví dụ (thống kê riêng, không tăng tổng ID); tổng overlay, mẫu số toàn kho, số chưa có overlay; thống kê theo cấp không đếm trùng.
- Những lỗi sửa đáng kể; số ví dụ mới/giữ lại; các trường chưa kiểm tra.
- Kiểm tra đã chạy, kết quả thực tế, kiểm tra chưa chạy, rủi ro và phạm vi còn dở (ID hoặc bộ cụ thể).
- Đợt và việc đầu tiên cho phiên tiếp theo.

Commit theo phạm vi nhỏ, ưu tiên một commit nhất quán gồm dữ liệu, seed, test liên quan và docs. Chỉ đưa trực tiếp main khi được chủ dự án cho phép; không force-push. Đọc lại HEAD và xác minh commit sau khi ghi.

### Prompt khởi động phiên mới

> Tiếp tục biên tập tiếng Anh Largo theo AGENTS.md và docs/agents/english-editorial-roadmap.md. Đọc english-editorial-progress.md và HEAD main để chọn đợt tiếp theo; không dựa vào số liệu cũ. Giữ ID/tiến độ học, kiểm tra dữ liệu, cập nhật tài liệu bàn giao và báo chính xác kiểm thử đã chạy.
