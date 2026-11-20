# Largo

Largo là web app học từ và cụm từ bằng tiếng Việt. Ứng dụng dùng React, TypeScript và Vite, có lộ trình HSK theo giáo trình và ôn cách quãng (SRS).

## Trước khi sửa

- Chạy `git status --short` và giữ phần việc đang dang dở của người dùng. Tìm điểm vào thật trong mã, dữ liệu và bài kiểm thử trước khi đặt tên file, tính năng hoặc trường dữ liệu.
- Khi mô tả kết quả, ghi rõ lệnh đã chạy, giao diện đã quan sát và phần còn thiếu bằng chứng. Với số lượng thẻ, đề cương HSK hoặc mục lục sách, đối chiếu nguồn và phiên bản trước khi khẳng định.
- Giữ `VocabWord.id` khi đổi nội dung, vị trí bài hoặc giáo trình. Hai lộ trình HSK có thể tham chiếu cùng ID và dùng chung lịch ôn. Khi sửa dữ liệu đã lưu, giữ lịch, Bloom, thẻ cá nhân và các thẻ người dùng đã chủ động xóa.
- Sửa mã nguồn tạo ra app. `dist/` và `dev-dist/` là đầu ra của Vite/PWA. Lấy tên biến cấu hình từ `.env.example` và giữ giá trị bí mật trong môi trường chạy.

## Chọn tài liệu theo công việc

| Công việc | Điểm bắt đầu |
| --- | --- |
| Tìm màn hình, luồng học, nguồn dữ liệu hoặc API | [Bản đồ dự án](docs/agents/project-map.md) |
| Thêm từ, bài hoặc cấp HSK và kiểm chứng nguồn sách | [Skill HSK](.claude/skills/largo-hsk-curriculum/SKILL.md) |
| Sửa SRS, chuyển phiên bản dữ liệu, khôi phục bộ thẻ bị trống | [Skill trạng thái học](.claude/skills/largo-study-state/SKILL.md) |
| Chạy kiểm thử, kiểm tra giao diện, chẩn đoán app đang phục vụ bản nào | [Skill kiểm chứng](.claude/skills/largo-verify/SKILL.md) |

Các đường dẫn skill dùng chung cho người đọc `AGENTS.md`. Với yêu cầu chỉ sửa tài liệu, kiểm tra đường dẫn, lệnh và dữ kiện thay đổi. Với thay đổi mã, chọn các bước kiểm chứng phù hợp trong [hướng dẫn chạy và kiểm tra](docs/agents/verification.md).
