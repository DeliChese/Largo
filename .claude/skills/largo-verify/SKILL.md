---
name: largo-verify
description: Kiểm chứng thay đổi trong Largo hoặc chẩn đoán web app còn hiển thị dữ liệu cũ. Dùng cho kiểm kiểu, build, test, kiểm tra route đang chạy, giao diện hoặc cache PWA.
---

# Kiểm chứng thay đổi của Largo

1. Đọc [hướng dẫn chạy và kiểm chứng](../../../docs/agents/verification.md). Chọn bài kiểm thử và mức kiểm chứng theo luồng bị thay đổi.
2. Với báo cáo chưa thấy tính năng, xác định URL/route người dùng mở và kiểm tra máy chủ tại đó. Khi giao diện đã mới nhưng bộ bài trống, kiểm tra bản lưu và phạm vi theo [skill trạng thái học](../largo-study-state/SKILL.md).
3. Với thay đổi UI, quan sát thao tác thực tế tại điểm vào của tính năng. Dùng dữ liệu cũ để kiểm tra nâng cấp và dữ liệu mẫu riêng cho thử nghiệm cần trạng thái mới.
4. Khi báo kết quả, nêu lệnh đã chạy, URL nếu có, thao tác đã quan sát và phần còn thiếu bằng chứng. Trạng thái triển khai cần được xác minh tại đích triển khai tương ứng.
