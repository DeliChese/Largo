# Tiến độ biên tập tiếng Anh — Giai đoạn 2

Dữ liệu đã biên tập nằm trong [English/englishEditorial.json](../../English/englishEditorial.json). Mỗi bản ghi dùng ID hiện có; không tạo thẻ mới, không thay đổi CEFR hay thành viên bộ.

| Cấp | Đợt 1 | Đợt 2a | Đợt 2b | Tổng có overlay |
| --- | ---: | ---: | ---: | ---: |
| A1 | 8 | 112 | 310 | 430 |
| A2 | 0 | 0 | 0 | 0 |
| B1 | 0 | 0 | 0 | 0 |
| B2 | 0 | 61 | 0 | 61 |
| C1 | 184 | 84 | 0 | 268 |
| Tổng | 192 | 257 | 310 | 759 |

759/7.000 mục có chỉnh sửa biên tập; không đồng nghĩa 759 mục đã được kiểm chứng mọi trường. 6.241 mục chưa có overlay.

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

## Các đợt tiếp theo

1. A1 còn lại và A2: đối chiếu nghĩa theo từ loại, đơn giản hóa ví dụ và sửa dịch máy.
2. B1/B2: kiểm tra cụm từ đi kèm, giới từ, cấu trúc và cách dùng theo ngữ cảnh.
3. C1 và các mục đã có overlay: kiểm tra phần ví dụ, quan hệ từ, phát âm/biến thể còn lại. 
4. Chỉ đánh dấu hoàn thành khi mọi trường đã được kiểm tra hoặc có lý do không áp dụng. Kiểm tra CEFR và phân bổ lại bộ thuộc giai đoạn 3.

## Kiểm chứng

Kiểm tra trực tiếp JSON overlay: 449 khóa duy nhất; đủ 268 ID C1 trong nguồn expansion; 61 ID hai bộ B2; 112 ID A1 mới đều tồn tại trong nguồn vocabulary. Các kiểm thử TypeScript được bổ sung nhưng chưa chạy trong phiên này. Chưa kiểm tra giao diện trình duyệt.

Đợt 2b: kiểm tra 759 khóa, 310 khóa mới đều tồn tại trong nguồn A1, mỗi khóa mới có đúng hai câu song ngữ không rỗng; 449 overlay cũ không thay đổi. Chưa chạy bộ test TypeScript, lint, build hay browser.
