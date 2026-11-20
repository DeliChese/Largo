---
name: largo-study-state
description: Sửa dữ liệu học đã lưu, migration, phạm vi bộ thẻ hoặc lịch ôn SRS và Bloom của Largo. Dùng khi đổi cấu trúc bộ thẻ, có thẻ bị mất khỏi phạm vi hoặc người dùng báo mất tiến độ sau cập nhật.
---

# Giữ tiến độ học khi thay đổi dữ liệu Largo

1. Đọc phần [dữ liệu đã lưu](../../../docs/agents/project-map.md#dữ-liệu-đã-lưu) và lần theo lỗi qua `withCurrentSeed`, `getEditionDecks`, `getScopedDecks`, `getScopedWords` và hàm chấm ôn liên quan. Với lỗi chỉ xảy ra sau cập nhật, tái hiện bằng bản chụp mẫu cùng phiên bản và cấu trúc.
2. Bảo toàn `word.id`, `srs`, `createdAt`, `bloomLevel`, `lastSynthesisAt`, từ/bộ cá nhân, lịch sử và `todayWordIds`. Nếu thực sự đổi ID, ánh xạ từ ID đã phát hành và kiểm tra các tham chiếu liên quan. Dùng `wordIds` của bài khi một thẻ chia sẻ giữa các phiên bản HSK.
3. Kiểm tra số phiên bản cùng cấu trúc bản chụp. `hasCurrentChineseDecks` và các test đi kèm xử lý trường hợp bản chụp mang số phiên bản hiện tại nhưng thiếu danh mục bài. Với thay đổi seed, đọc [cách cập nhật giáo trình đã lưu](#cập-nhật-giáo-trình-đã-lưu).
4. Khi sửa cách chấm, dùng các hàm sẵn có trong `studyPlan.ts` và `srsBloom.ts`. Kiểm tra lượt đúng lịch, lượt luyện sớm, đặt câu và hạn mức ngày nếu logic đó bị ảnh hưởng.
5. Kiểm thử bản lưu trước và sau khi chạy `withCurrentSeed` lần nữa. Xác nhận số bài và lịch ôn trên phạm vi đúng, đồng thời thử với thư viện mới nếu có thay đổi seed. Xem các lệnh và cách xác minh giao diện trong [hướng dẫn kiểm chứng](../../../docs/agents/verification.md).

## Cập nhật giáo trình đã lưu

- `withCurrentSeed` trả lại bản lưu có `CURRENT_DATA_VERSION` nếu danh mục bài đang khớp. Khi đổi nghĩa, ví dụ hoặc tên bài mà cấu trúc vẫn khớp, kiểm tra đường cập nhật metadata cho người dùng cũ. Có thể cần tăng phiên bản dữ liệu và kiểm thử bước ghép seed.
- `mergeChineseSeed` hiện coi các thẻ vắng mặt trong bản lưu đã có bộ giáo trình là thẻ cần giữ trạng thái vắng mặt. Khi mở thêm bài hoặc cấp, xác định những ID xuất hiện lần đầu trong lộ trình so với bản đã phát hành. Kiểm thử cả thẻ mới phải xuất hiện và thẻ từng được người dùng xóa phải tiếp tục vắng mặt.
