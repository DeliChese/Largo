# Tiến độ biên tập tiếng Anh — Giai đoạn 2

**Kế hoạch và quy trình bàn giao:** [Roadmap 2E–2Z](english-editorial-roadmap.md). Đọc roadmap và tài liệu này ở đầu mỗi phiên; cập nhật tiến độ thực tế sau mỗi đợt.

**Đợt tiếp theo:** 2E (giao tiếp/biến thể A1, kiểm kê expansion A1, tiếp tục A2 theo sức chứa). Mốc hiện tại: Seed v17, 1.391 ID có overlay; chưa nghiệm thu toàn trường.

Dữ liệu đã biên tập nằm trong [English/englishEditorial.json](../../English/englishEditorial.json). Mỗi bản ghi dùng ID hiện có; không tạo thẻ mới, không thay đổi CEFR hay thành viên bộ.

| Cấp/nhóm | Đợt 1 | Đợt 2a | Đợt 2b | Đợt 2c | Đợt 2d | Tổng có overlay |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| A1 | 8 | 112 | 310 | 370 | 166 | 966 |
| A2 | 0 | 0 | 0 | 0 | 71 | 71 |
| B1 | 0 | 0 | 0 | 0 | 0 | 0 |
| B2 | 0 | 61 | 0 | 0 | 0 | 61 |
| C1 | 184 | 84 | 0 | 0 | 0 | 268 |
| Cụm động từ (ID riêng) | 0 | 0 | 0 | 0 | 25 | 25 |
| Tổng | 192 | 257 | 310 | 370 | 262 | 1.391 |

1.391/7.000 mục có chỉnh sửa biên tập; chưa kiểm chứng mọi trường. 5.609 mục chưa có overlay. Bốn cụm động từ dùng chung ID đã tính vào A2, không đếm hai lần.

## Phạm vi đợt 2a

- C1: phủ hết 268 ID của cấp hiện hành về nghĩa cốt lõi và ghi chú; sửa ví dụ có vấn đề chọn lọc, chưa đối chiếu toàn bộ câu ví dụ và quan hệ từ.
- A1: 112 danh từ cơ bản, ưu tiên gia đình, nhà cửa, vật dụng và sinh hoạt. Viết hai ví dụ song ngữ mới cho mỗi mục. Xóa quan hệ từ tự động chưa được kiểm chứng trong 112 overlay; không đụng quan hệ người dùng tự thêm. Danh sách đối nghĩa chung của seed vẫn có thể bổ sung quan hệ.
- B2: toàn bộ 61 mục thuộc hai bộ `deck-en-exp-b2-software-cloud` và `deck-en-exp-b2-economics-markets`, tách nghĩa và giải thích chuyên ngành.
- Không sửa dữ liệu nguồn; không đánh đồng ví dụ mới với xác nhận chính thức từ từ điển.

## Phạm vi đợt 2b

- 219 mục thuộc nhóm danh từ, tính từ cơ bản; thêm 91 mục ngữ pháp và động từ nền tảng. Mỗi mục có hai câu song ngữ mới (620 câu).
- Sửa nghĩa sai ngữ cảnh như sentence, plane, smith; bổ sung cách dùng be, do, have, a/an, listen/hear, say/tell, make/do. Giữ từ loại và CEFR hiện hành.
- 430/800 mục A1 thuộc nguồn vocabulary chính có overlay; còn 370 mục nguồn chính và các bộ A1 khác chưa có overlay. A2 chưa được biên tập trong đợt này.
- Không thay đổi logic học, ID hay số lượng thẻ.

## Phạm vi đợt 2c

- 370 mục còn lại của nguồn vocabulary A1, 740 câu song ngữ mới. Đủ 800/800 mục nguồn chính; các bộ A1 khác chưa hoàn thành.
- Sửa từ loại am, hello, bye, lot; sửa nghĩa thông dụng của afraid, dirty, excited, matter, time. Giữ nguyên ID, cấp, bộ và tiến độ.
- Kiểm tra 370 ID mới, hai câu song ngữ không rỗng mỗi mục, 759 overlay cũ giữ nguyên.
- Đưa 2b và 2c trực tiếp vào main theo yêu cầu. Chưa chạy lint/test/build/browser.

## Phạm vi đợt 2d

- 94/94 từ bổ sung A1 và 72/72 collocation A1 của nguồn tương ứng; bộ A1 giao tiếp gốc và biến thể vùng miền vẫn cần kiểm tra.
- 29 cụm động từ thuộc ba bộ đầu: 25 ID riêng và 4 ID dùng chung A2 (run out of, pick up, drop off, check in).
- 67 từ A2 thuộc hai bài đầu của nguồn vocabulary; sửa Ms, bill, queen, chef, market, traffic, stamp và các mục đa nghĩa khác.
- Hai câu song ngữ cho mỗi overlay mới (524 câu, 329 câu mới và 195 câu nguồn giữ lại). Không sửa 1.129 overlay cũ.
- Kiểm tra JSON/ID/số câu; chưa chạy lint/test/build/browser.

## Các đợt tiếp theo

1. Các bộ giao tiếp gốc/biến thể A1 còn lại, nguồn vocabulary A2 và các bộ A2: đối chiếu nghĩa theo từ loại, đơn giản hóa ví dụ và sửa dịch máy.
2. B1/B2: kiểm tra cụm từ đi kèm, giới từ, cấu trúc và cách dùng theo ngữ cảnh.
3. C1 và các mục đã có overlay: kiểm tra phần ví dụ, quan hệ từ, phát âm/biến thể còn lại. 
4. Chỉ đánh dấu hoàn thành khi mọi trường đã được kiểm tra hoặc có lý do không áp dụng. Kiểm tra CEFR và phân bổ lại bộ thuộc giai đoạn 3.

## Kiểm chứng

Kiểm tra trực tiếp JSON overlay: 449 khóa duy nhất; đủ 268 ID C1 trong nguồn expansion; 61 ID hai bộ B2; 112 ID A1 mới đều tồn tại trong nguồn vocabulary. Các kiểm thử TypeScript được bổ sung nhưng chưa chạy trong phiên này. Chưa kiểm tra giao diện trình duyệt.

Đợt 2b: kiểm tra 759 khóa, 310 khóa mới đều tồn tại trong nguồn A1, mỗi khóa mới có đúng hai câu song ngữ không rỗng; 449 overlay cũ không thay đổi. Chưa chạy bộ test TypeScript, lint, build hay browser.
