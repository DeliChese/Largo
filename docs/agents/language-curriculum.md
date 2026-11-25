# Quy chuẩn học liệu đa ngôn ngữ của Largo

Áp dụng khi thêm ngôn ngữ, giáo trình, cấp độ hoặc bộ thẻ có sẵn. Dùng [mẫu và checklist](language-curriculum-checklist.md) khi chuẩn bị thay đổi.

## Cách tổ chức thư viện

Người học chọn ngôn ngữ, phiên bản nếu chương trình có nhiều phiên bản, rồi lọc theo cấp độ và loại học liệu. Danh mục bên trái nhóm các bài hoặc bộ thẻ theo chủ đề. Chọn một bài để xem từ, ví dụ và bắt đầu học trong bài đó.

Tiếng Anh dùng trang thư viện này cho các bộ từ vựng, tình huống, collocations và biến thể. Tiếng Trung dùng loại **Giáo trình**, giữ số bài theo từng sách. Chủ đề giúp tìm bài. Thứ tự thẻ trong mỗi bài và thứ tự bài dùng cho lộ trình học lấy từ danh mục giáo trình.

## Thông tin của một bài hoặc bộ thẻ

| Trường trong `VocabDeck` | Quy ước |
| --- | --- |
| `id` | ID ổn định dùng cho bộ thẻ, lịch sử và dữ liệu đã lưu. |
| `language`, `level`, `collection` | Mã ngôn ngữ, cấp độ và loại học liệu dùng cho bộ lọc. Dùng mã cấp theo chương trình của ngôn ngữ đó. |
| `name` | Tiêu đề chính để người học tra cứu bằng tiếng Việt. Với giáo trình có thứ tự, đặt số bài trước tên. |
| `nativeName` | Tiêu đề nguyên ngữ khi có, chẳng hạn tiêu đề trong mục lục. Thư viện hiển thị ở dòng dưới và cho phép tìm theo nội dung này. Bỏ trường khi chưa có tiêu đề nguyên ngữ hoặc khi trùng tiêu đề chính. |
| `category` | Chủ đề ngắn bằng tiếng Việt, ví dụ **Giao tiếp**, **Học tập**, **Đi lại** hoặc **Ăn uống**. Dùng cùng tên cho các bộ có nội dung cùng chủ đề. |
| `description` | Mô tả ngắn về ngữ cảnh hoặc mục tiêu. Để trống khi tiêu đề đã đủ thông tin. |
| `wordIds` | Danh sách ID thẻ theo thứ tự bài khi bộ tham chiếu danh mục từ chung. Với bộ trực tiếp, từng thẻ trỏ về bộ qua `deckId`. |

Dùng chung giao diện trong [`DecksView.tsx`](../../src/components/DecksView.tsx). Danh mục tiếng Anh được tạo trong [`englishDecks.ts`](../../src/data/englishDecks.ts). Với tiếng Trung, xem thêm [quy ước cho từng sách HSK](chinese-curriculum.md). Bộ chọn trong phiên học và trang trò chơi dùng tiêu đề chính.

## Thông tin của một thẻ

- Đặt từ hoặc cụm từ nguyên ngữ trong `term`, nghĩa tiếng Việt trong `meaning` và từ loại trong `partOfSpeech`. Thêm `phonetic` theo quy ước của ngôn ngữ khi có.
- Ghi riêng câu nguyên ngữ, cách đọc khi phù hợp và bản dịch tiếng Việt trong `examples`. Chọn ví dụ và cụm từ minh họa đúng nghĩa của thẻ. Ghi nguồn khi sử dụng nội dung tham khảo.
- Dùng lại ID khi hai bài dạy cùng từ và cùng nghĩa. Tách ID nếu hai mục đồng tự có cách đọc hoặc nghĩa cần được học riêng. Lượt xuất hiện trong bài có thể lặp, còn phạm vi ôn tổng gộp theo ID.
- Ghi nguồn cho tiêu đề, thứ tự bài và danh mục từ. Chỉ rõ phần nào do Largo biên soạn và phạm vi đã đối chiếu.

Khi sửa tài liệu hoặc tiêu đề, giữ ID, danh sách thành viên và dữ liệu học. Khi cập nhật danh mục đã phát hành, kiểm thử bản lưu cũ, thẻ đã xóa, khôi phục và chạy cập nhật hai lần.

## Biên tập tiếng Anh: nghĩa trước, cách dùng sau (seed v13–v19)

- Nghĩa tiếng Việt là một hoặc vài cách dịch ngắn, cùng nghĩa trọng tâm; không dùng toàn bộ hướng dẫn ngữ pháp hoặc ví dụ làm đáp án nghĩa.
- Giải thích và cách dùng nằm trong `notes`: nêu sắc thái, cấu trúc, giới từ, văn phong hoặc phân biệt từ dễ nhầm. Không tự tạo quy tắc tuyệt đối khi có ngoại lệ.
- Cụm từ đi kèm phải tự nhiên và đúng nghĩa đang dạy; mỗi ví dụ có bản dịch cùng ngữ cảnh. Ưu tiên câu ngắn, từ nền tảng dễ hiểu ở A1–A2 và câu minh họa sắc thái ở B2–C1.
- Bản biên tập do Largo viết nằm ở [English/englishEditorial.json](../../English/englishEditorial.json), khóa bằng ID hiện hành, ưu tiên hơn enrichment khi cùng trường. Không chỉnh tệp nguồn lớn bằng thao tác thay chữ hàng loạt; đối chiếu từng nghĩa và ngữ cảnh. Chỉ thêm ghi chú khi có thông tin hữu ích.
- Nhóm chủ đề thống nhất bằng [englishCurriculum.ts](../../src/data/englishCurriculum.ts); trong cùng cấp ưu tiên từ vựng → giao tiếp → collocations → cụm danh/tính từ → cụm động từ → biến thể. Giữ cấp và thành viên đã phát hành; bài nhiều chủ đề không được gán nhãn hẹp tùy tiện.
- Bài tập nhỏ nên chọn 8–12 thẻ mới cùng chủ đề, học nghĩa trước rồi mới luyện ghép cụm, nhớ lại và đặt câu; không bắt buộc thay đổi giới hạn ôn hoặc thuật toán SRS.
- Đợt 1: 184 mục C1 và 8 mục A1. Đợt 2a (seed v14): bổ sung 84 mục C1, 112 mục A1 và 61 mục B2 (công nghệ, kinh tế). Tổng 449 ID có overlay: 268 C1, 120 A1, 61 B2. C1 đã phủ toàn bộ nghĩa/ghi chú, ví dụ chỉ sửa chọn lọc; chưa kiểm chứng toàn bộ ví dụ hoặc quan hệ từ. Các mục còn lại chưa được rà soát đầy đủ; không coi đây là chứng nhận CEFR hoặc xác minh từ điển độc lập.

- Đợt 2b (seed v15): bổ sung 310 mục A1 trong nguồn vocabulary, với 620 câu song ngữ mới; ưu tiên nghĩa thường gặp, từ loại hiện hành, mạo từ, trợ động từ và cấu trúc động từ. Tổng 759 ID có overlay, trong đó 430/800 mục A1 của nguồn vocabulary chính. Không xem đây là tỷ lệ hoàn thành toàn cấp A1 (còn các bộ khác) hoặc chứng nhận đã kiểm tra mọi trường.

- Đợt 2c (seed v16): hoàn tất overlay nghĩa và ví dụ cho 370 mục còn lại trong 800 mục A1 nguồn vocabulary chính; thêm 740 câu song ngữ, sửa từ loại rõ ràng sai ở am, hello, bye, lot. Tổng 1.129 ID có overlay; chưa xác minh tất cả trường hoặc các bộ A1 khác. Theo yêu cầu chủ dự án đưa trực tiếp vào main; chưa chạy lint/test/build/browser.

- Đợt 2d (seed v17): thêm 94 mục A1 nguồn extra, 72 collocation A1, 29 cụm động từ thuộc ba bộ đầu (4 ID dùng chung với A2 giao tiếp, 25 ID phrasal riêng) và 67 mục nguồn vocabulary A2. Tổng 1.391 ID. Mỗi mục mới có hai ví dụ song ngữ; ví dụ bổ sung A1 và cụm động từ giữ một câu nguồn và viết một câu mới, collocation giữ một câu nguồn và viết một câu mới, A2 viết hai câu mới. Ví dụ biến thể từ riêng vẫn dùng nguồn vùng miền. Chưa kiểm chứng mọi trường.

- Đợt 2e (seed v18): bổ sung 36 ID A1 còn lại (24 giao tiếp, 12 regional), 213 ID từ vựng chính A2 (7 bài). A1 đủ 1.002/1.002 ID có overlay; A2 nguồn chính 280/900. Tổng 1.640 ID (23,43%). Hai câu song ngữ mỗi overlay mới; giữ ví dụ riêng vùng miền khi headword khác. Kiểm tra toàn bộ ID nguồn, JSON và bảo toàn 1.391 overlay cũ; chưa chạy lint/test/build/browser. Xem [tiến độ](english-editorial-progress.md) và [roadmap](english-editorial-roadmap.md).

- Đợt 2f (seed v19): thêm 271 ID nguồn chính A2 thuộc general-01–07; A2 nguồn chính 551/900, toàn A2 555/1.297. Tổng 1.911/7.000 ID có overlay (27,30%). Sửa nghĩa/từ loại, dạng phân từ, động từ khuyết thiếu, cấu trúc ngữ pháp và từ đa nghĩa; hai câu song ngữ/mục. Bảo toàn 1.640 overlay cũ, kiểm tra JSON và ID; chưa chạy lint/test/build/browser. Xem [tiến độ](english-editorial-progress.md).
