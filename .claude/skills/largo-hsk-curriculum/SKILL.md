---
name: largo-hsk-curriculum
description: Thêm hoặc sửa từ vựng tiếng Trung, phân thẻ theo bài hoặc mở thêm cấp trong giáo trình HSK 2.0 và HSK 3.0 của Largo. Dùng khi cần xác minh danh mục từ hoặc đối chiếu với sách.
---

# Phát triển giáo trình HSK của Largo

1. Đọc [nguồn và cấu trúc giáo trình](../../../docs/agents/chinese-curriculum.md). Chốt đúng phiên bản, cấp và phần sách mà người dùng yêu cầu. Đối chiếu mục lục và chỉ mục từ của phần đó.
2. Tìm theo chữ Hán, pinyin và nghĩa trong `Chinese/chineseVocabulary.json`. Khi hai nghĩa cùng mặt chữ, chọn đúng mục bằng selector `từ@hskId` nếu có. Giữ ID gốc cho mục được dùng chung giữa hai sách.
3. Cập nhật thứ tự và chủ đề bài tại `Chinese/hsk1Courses.ts` hoặc phần khai báo cấp mới tương ứng. Bổ sung mục từ ở nguồn JSON nếu cần và giữ ví dụ, pinyin, bản dịch, cùng cụm từ minh họa có thể kiểm tra được.
4. Với từ do dự án bổ sung, lưu rõ nguồn hoặc lý do đặt vào bài. Khi chưa đối chiếu đủ, ghi phạm vi xác minh để người đọc phân biệt phần theo sách và phần biên soạn.
5. Kiểm tra `CHINESE_DECKS`, thứ tự `wordIds` và số thẻ tại `src/utils/studyScope.test.ts`. Kiểm tra cả đường nâng cấp cho người đang học theo [skill trạng thái học](../largo-study-state/SKILL.md).
