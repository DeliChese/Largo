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
