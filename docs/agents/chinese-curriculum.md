# Từ vựng và giáo trình tiếng Trung

## Nguồn trong repo

| File | Vai trò |
| --- | --- |
| `Chinese/chineseVocabulary.json` | Mục từ gốc với ID, nghĩa tiếng Việt, pinyin, cụm từ, ví dụ và siêu dữ liệu nguồn khi có. Các nhóm JSON phục vụ biên soạn. |
| `Chinese/hsk1Courses.ts` | Danh sách bài HSK 1 của hai phiên bản, theo thứ tự giáo trình. Mỗi bài có tên, chủ đề, mô tả và danh sách mục từ. |
| `Chinese/chineseDecks.ts` | Giải selector thành ID thẻ, tạo `CHINESE_DECKS` và ghép tiến độ cũ vào thư viện hiện hành. |
| `.chinese-work/` | Bản nháp, nguồn biên tập và script đối chiếu. App đọc dữ liệu từ `Chinese/`. |

`CHINESE_WORDS` chứa toàn bộ danh mục để tra cứu và nhận dữ liệu cũ. `CHINESE_COURSE_WORDS` chứa phần trong giáo trình và được đưa vào `INITIAL_WORDS` cho người học mới. `hskId` là số mục từ nguồn, còn `VocabWord.id` là định danh thẻ mà tiến độ SRS dùng. `a1000Id` ghi nguồn A1000 của mục từ tương ứng.

## Phạm vi đã đối chiếu

Hai phiên bản `hsk20` và `hsk30` đều có cấp `hsk1`. `hsk30` là phiên bản giáo trình HSK 3.0, còn `hsk3` là mã cấp HSK 3. Mặc định app chọn `hsk30`.

- **HSK 2.0** có 15 bài, 182 thẻ, gồm đủ 150 mục HSK 1 và các từ/cụm bổ sung theo bài. Sách dùng để đối chiếu là *HSK Standard Course 1*, ISBN `9787561937099`. [Nhà xuất bản BLCUP](https://www.blcup.com/PInfo/index/77) · [Danh sách từ HSK 2015 của CTI](https://old.chinesetest.cn/userfiles/file/HSK/HSK-2015.xlsx)
- **HSK 3.0** có 15 bài, 305 thẻ, gồm 300 mục HSK 1 và 5 thẻ bổ sung theo ngữ cảnh bài. Sách dùng để đối chiếu là *New HSK Course 1*, ISBN `9787521367744`. [Nhà xuất bản FLTRP](https://heep.fltrp.com/contents/475469828451340288?type=1) · [Đề cương HSK 3.0 của CTI](https://www.chinesetest.cn/syllabus) · [Chỉ mục từ theo bài của Trung tâm HSK Ulaanbaatar](https://hsk-center.mn/vocab-review/book1.html)

Đây là số thẻ khởi tạo ghi nhận trong mã. Khi cập nhật giáo trình, đếm lại bằng `getEditionDecks` và `getScopedWords` hoặc kiểm thử tương ứng trong `src/utils/studyScope.test.ts`. Dữ liệu đã lưu của người học có thể có số thẻ khác do thêm hoặc xóa thẻ.

## Cách sửa một bài

1. Xác nhận phiên bản, cấp và số bài. Dùng mục lục để xác nhận chủ đề và thứ tự. Dùng chỉ mục từ mới của sách hoặc nguồn bài tương ứng để xác nhận từ thuộc bài nào. Nếu nguồn chỉ xác nhận mục lục, ghi rõ các mục từ còn cần đối chiếu trước khi gọi chúng là từ của giáo trình.
2. Tìm mục từ và đúng nghĩa trong JSON. Selector dùng chữ Hán, hoặc dạng `会@82` khi cần chọn đúng mục có `hskId: 82` giữa các nghĩa cùng mặt chữ. `resolveLessonWordId` yêu cầu đúng một mục khớp.
3. Dùng ID hiện có khi cùng mục từ xuất hiện trong hai sách. Với mục mới, tạo ID duy nhất theo cấu trúc `CatalogueCard` trong `Chinese/chineseDecks.ts`. Loader bổ sung các trường phiên học của `VocabWord`. Giữ `examples[].sentence`, `examples[].phonetic` và `examples[].translation` riêng. Kiểm tra câu và cụm thật sự minh họa nghĩa đang dạy.
4. Khi mở thêm cấp, mở rộng phần khai báo bài và bộ tạo deck trong `Chinese/chineseDecks.ts`. Menu tiếng Trung suy ra cấp từ các bộ của phiên bản đang chọn. ID bài HSK 1 hiện chứa phiên bản, cấp và vị trí trong danh sách. Khi chèn hoặc sắp xếp lại, giữ ID đã phát hành hoặc cập nhật các tham chiếu qua migration.
5. Kiểm tra thứ tự, ID hợp lệ, nghĩa cùng mặt chữ, số thẻ, từ bổ sung và dữ liệu đang lưu. Khi thay đổi nội dung thẻ hoặc danh sách bài, xem [cách nâng cấp trạng thái học](../../.claude/skills/largo-study-state/SKILL.md) để người dùng cũ nhận được dữ liệu dự kiến.
