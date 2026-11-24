# Từ vựng và giáo trình tiếng Trung

Danh mục HSK dùng [quy chuẩn học liệu đa ngôn ngữ](language-curriculum.md) của Largo. Chủ đề do Largo đặt để tìm bài. Số bài, tiêu đề tiếng Trung và thứ tự mục từ lấy từ từng giáo trình hoặc chỉ mục đã đối chiếu.

## Nguồn trong repo

| File | Vai trò |
| --- | --- |
| `Chinese/chineseVocabulary.json` | Mục từ gốc với ID, nghĩa tiếng Việt, pinyin, cụm từ, ví dụ và siêu dữ liệu nguồn khi có. Các nhóm JSON phục vụ biên soạn. |
| `Chinese/hsk1Courses.ts` | Hai danh sách bài HSK 1 với nhãn tiếng Việt của Largo, tiêu đề tiếng Trung từ mục lục, chủ đề và từ theo bài. |
| `Chinese/hsk3Course.ts` | Hai danh sách bài HSK 3 với tiêu đề Trung–Việt và chủ đề, kèm dạng chữ và dấu `*` của bản HSK 2.0. |
| `Chinese/chineseDecks.ts` | Giải selector thành ID thẻ, tạo `CHINESE_DECKS` và ghép tiến độ cũ vào thư viện hiện hành. |
| `.chinese-work/` | Bản nháp, nguồn biên tập và script đối chiếu. App đọc dữ liệu từ `Chinese/`. |

`CHINESE_WORDS` chứa toàn bộ danh mục để tra cứu và nhận dữ liệu cũ. `CHINESE_COURSE_WORDS` chứa phần trong giáo trình và được đưa vào `INITIAL_WORDS` cho người học mới. `hskId` là số mục từ nguồn, còn `VocabWord.id` là định danh thẻ mà tiến độ SRS dùng. `a1000Id` ghi nguồn A1000 của mục từ tương ứng.

## Phạm vi đã đối chiếu

Hai phiên bản `hsk20` và `hsk30` đều có cấp `hsk1` và `hsk3`. Mặc định app chọn phiên bản `hsk30`.

- **HSK 1 bản 2.0** có 15 bài, 182 thẻ, gồm đủ 150 mục HSK 1 và các từ/cụm bổ sung theo bài. Sách dùng để đối chiếu là *HSK Standard Course 1*, ISBN `9787561937099`. [Nhà xuất bản BLCUP](https://www.blcup.com/PInfo/index/77) · [Danh sách từ HSK 2015 của CTI](https://old.chinesetest.cn/userfiles/file/HSK/HSK-2015.xlsx)
- **HSK 1 bản 3.0** có 15 bài, 305 thẻ, gồm 300 mục HSK 1 và 5 thẻ bổ sung theo ngữ cảnh bài. Sách dùng để đối chiếu là *New HSK Course 1*, ISBN `9787521367744`. [Nhà xuất bản FLTRP](https://heep.fltrp.com/contents/475469828451340288?type=1) · [Đề cương HSK 3.0 của CTI](https://www.chinesetest.cn/syllabus) · [Chỉ mục từ theo bài của Trung tâm HSK Ulaanbaatar](https://hsk-center.mn/vocab-review/book1.html)
- **HSK 3 bản 2.0** có 20 bài, 314 lượt mục từ, trong đó 13 mục có dấu `*`. Thứ tự và cách viết theo danh sách Học Bá HSK do chủ dự án cung cấp cho *HSK Standard Course 3*, ISBN `9787561938188`. Bài 5 có 13 mục, bỏ họ 张 ở danh sách tên riêng. Giữ mục 黄河 ở Bài 19 theo danh sách đã cung cấp. [Nhà xuất bản BLCUP](https://www.blcup.com/PInfo/index/7740)
- **HSK 3 bản 3.0** có 18 bài và 483 lượt mục từ theo chỉ mục từng bài của *New HSK Course 3*, ISBN `9787521368031`. Các nghĩa, cụm từ và ví dụ Trung–Việt trên thẻ do Largo biên soạn. [Nhà xuất bản FLTRP](https://global.unipus.cn/textbook/detail?id=-oLc_q_1TRmGJYJvMHdMRw) · [Chỉ mục từng bài](https://www.hanzipress.com/textbook/nhsk/nhsk3)

Tiêu đề tiếng Trung của HSK 1 lấy từ mục lục của hai cuốn. [Mục lục HSK Standard Course 1](https://jyangkul.net/HSK/HSK%201/HSK%20standard%20course%201%20PDF.pdf) · [Mục lục New HSK Course 1](https://documents.manchester.ac.uk/display.aspx?DocID=81148)

Các số lượt mục từ được cộng theo từng bài. Danh sách tổng gộp các lượt có chung ID thẻ và người học có thể thêm hoặc xóa thẻ. Khi cập nhật giáo trình, đếm bằng `getEditionDecks`, `getScopedDecks` và `getScopedWords` hoặc kiểm thử tương ứng trong `src/utils/studyScope.test.ts`.

## Cách sửa một bài

1. Xác nhận phiên bản, cấp và số bài. Dùng mục lục để xác nhận chủ đề và thứ tự. Dùng chỉ mục từ mới của sách hoặc nguồn bài tương ứng để xác nhận từ thuộc bài nào. Nếu nguồn chỉ xác nhận mục lục, ghi rõ các mục từ còn cần đối chiếu trước khi gọi chúng là từ của giáo trình.
2. Tìm mục từ và đúng nghĩa trong JSON. Selector dùng chữ Hán, `会@82` để chọn theo `hskId`, hoặc `带@zh-1351` để chọn theo ID thẻ. Dùng `dạng trong sách|selector` khi dạng in khác từ trên thẻ, ví dụ `冬（天）|冬天`. Dấu `*` thuộc danh sách của từng bài. Mỗi selector phải khớp đúng một thẻ.
3. Dùng ID hiện có khi cùng mục từ xuất hiện trong hai sách. Với mục mới, tạo ID duy nhất theo cấu trúc `CatalogueCard` trong `Chinese/chineseDecks.ts`. Loader bổ sung các trường phiên học của `VocabWord`. Giữ `examples[].sentence`, `examples[].phonetic` và `examples[].translation` riêng. Kiểm tra câu và cụm thật sự minh họa nghĩa đang dạy.
4. Khi mở thêm cấp, mở rộng phần khai báo bài và bộ tạo deck trong `Chinese/chineseDecks.ts`. Menu tiếng Trung suy ra cấp từ các bộ của phiên bản đang chọn. ID bài HSK 1 hiện chứa phiên bản, cấp và vị trí trong danh sách. Khi chèn hoặc sắp xếp lại, giữ ID đã phát hành hoặc cập nhật các tham chiếu qua migration.
5. Kiểm tra thứ tự, ID hợp lệ, nghĩa cùng mặt chữ, số thẻ, từ bổ sung và dữ liệu đang lưu. Khi thay đổi nội dung thẻ hoặc danh sách bài, xem [cách nâng cấp trạng thái học](../../.claude/skills/largo-study-state/SKILL.md) để người dùng cũ nhận được dữ liệu dự kiến.
