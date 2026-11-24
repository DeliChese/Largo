# Mẫu và checklist thêm học liệu

Dùng cùng [quy chuẩn học liệu đa ngôn ngữ](language-curriculum.md). Điền thông tin theo nguồn đang biên tập và ghi lại phần đã xác minh.

## Mẫu đề bài

| Hạng mục | Điền khi mở một bộ học liệu |
| --- | --- |
| Ngôn ngữ và đối tượng | Mã ngôn ngữ, người học mục tiêu và bản dịch dùng trong Largo. |
| Chương trình | Tên chương trình, phiên bản, cấp, loại học liệu và phạm vi bài. |
| Nguồn | Tên sách hoặc dữ liệu, nhà xuất bản, năm hoặc ISBN, liên kết mục lục và danh mục từ, điều kiện sử dụng. |
| Bản đồ bài | Mỗi dòng gồm số bài, tiêu đề tiếng Việt, tiêu đề gốc nếu có, chủ đề, số lượt mục từ và nguồn xác nhận. |
| Nội dung thẻ | Nghĩa, từ loại, cách đọc, ví dụ, bản dịch và cụm từ. Ghi lại thẻ dùng chung, mục bổ sung và mục cần đối chiếu. |
| Dữ liệu cũ | ID được giữ, dữ liệu nào cần làm mới, trường hợp thẻ đã xóa và cách quay lại nếu có lỗi. |

Ví dụ dòng trong bản đồ bài. Dùng lại ID và số bài đã phát hành của bộ tương ứng.

| Bài | Tiêu đề tiếng Việt | Tiêu đề gốc | Chủ đề | Lượt mục từ |
| --- | --- | --- | --- | ---: |
| 1 | Chúng tôi sẽ ra sân bay đón các bạn. | 我们去机场接你们 | Đi lại | 27 |

## Checklist trước khi thêm

- [ ] Chốt nguồn, cấp độ và phiên bản. Kiểm tra bài đầu, bài cuối, số thứ tự, tiêu đề và phạm vi từ ở từng bài.
- [ ] Xác nhận nhãn chủ đề và tiêu đề phù hợp với [quy chuẩn thư viện](language-curriculum.md). Dùng lại nhóm có cùng nội dung.
- [ ] Đối chiếu ID, nghĩa và cách đọc của thẻ dùng lại. Làm rõ ví dụ, bản dịch và nguồn của mục mới.
- [ ] Kiểm tra cách dữ liệu sẽ đến người học mới và bản lưu đã có tiến độ. Giữ bộ cá nhân, lịch ôn, Bloom, lịch sử và thẻ đã xóa.

## Checklist kiểm thử

- [ ] Kiểm tra lọc theo ngôn ngữ, phiên bản nếu có, cấp độ và loại học liệu. Kiểm tra nhóm chủ đề ở danh mục.
- [ ] Tìm bằng tiêu đề tiếng Việt và tiêu đề gốc nếu có. Mở bài và đối chiếu số thẻ, thứ tự, nghĩa và ví dụ.
- [ ] Mở cả danh mục và chi tiết bài ở màn hình rộng và hẹp. Kiểm tra nhãn cấp khi đang xem tất cả, xuống dòng của tiêu đề dài và nút học bài.
- [ ] Dùng fixture để kiểm tra cập nhật lặp, khôi phục bản lưu và dữ liệu học đã có. Ghi cách rollback và phạm vi chưa kiểm tra.
- [ ] Chạy `npm run lint`, `npm test`, `npm run build` và ghi kết quả cùng URL giao diện đã quan sát. Xem [hướng dẫn kiểm chứng](verification.md).
