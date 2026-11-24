# Largo — hướng dẫn chung cho AI coding agents

Largo là PWA học tiếng Anh/Tiếng Trung bằng tiếng Việt trên React + TypeScript + Vite, có HSK 2.0/3.0, ôn cách quãng (SRS), Bloom và lưu offline.

## Lộ trình ưu tiên (đọc trước khi sửa engine)

**[Master roadmap](docs/roadmap/README.md)** → [Work packages theo PR](docs/roadmap/10-work-packages.md) → [Quality gates](docs/roadmap/06-quality-gates.md).

Thứ tự sản phẩm: **Learning Engine / Bloom Evidence / Adaptive Planner → DeepSeek AI assessment → Hosting/PWA → Accounts/Sync → Dictionary**. Roadmap là yêu cầu triển khai, **không** phải thông báo đã có tính năng. Chỉ làm một package tại một thời điểm, có acceptance tests và rollback. Nếu yêu cầu trực tiếp của chủ dự án khác với roadmap, ưu tiên yêu cầu hiện tại và ghi ADR.

## Trước khi sửa

- Chạy `git status --short`, đọc mã/test liên quan, giữ phần việc đang dở của người dùng; không sửa ngoài phạm vi. Với tài liệu chỉ sửa docs, xác minh link và thực trạng.
- Giữ `VocabWord.id`, SRS, Bloom legacy, thẻ/bộ cá nhân, lịch sử, `todayWordIds`, ảnh và trạng thái thẻ đã xóa. HSK 2.0/3.0 có thể chia sẻ từ cùng ID, không tạo lịch ôn riêng. Migration phải idempotent và có fixtures.
- SRS và planner chạy offline; **AI không phải nguồn sự thật tuyệt đối và không được tự nâng Bloom**. Không gọi AI cho việc local có thể làm. Xem [engine](docs/roadmap/01-learning-engine.md), [Bloom](docs/roadmap/02-bloom-evidence.md), [events](docs/roadmap/04-events-migrations.md).
- Không gửi `DEEPSEEK_API_KEY` hoặc Azure key tới trình duyệt, không đặt trong `VITE_*`, repository hoặc logs. AI gateway chỉ server-side, có quota, schema validation, consent, fallback.
- Không chuyển origin hay thay schema DB mà thiếu full backup/restore test. Không xóa cache dữ liệu học để “sửa PWA”. `dist/` và `dev-dist/` là đầu ra build; không sửa trực tiếp.
- Khi báo hoàn tất: lệnh kiểm thử thực sự đã chạy, kết quả, UI/URL đã quan sát, migration & rollback, phần chưa xác minh. Không tự coi docs là code đã triển khai.

## Chọn tài liệu và skill

| Công việc | Tài liệu | Skill |
| --- | --- | --- |
| Tìm file, luồng học, API | [Bản đồ dự án](docs/agents/project-map.md) | — |
| Thêm/sửa lộ trình học SRS, rubric Bloom, planner | [Learning Engine](docs/roadmap/01-learning-engine.md), [Bloom](docs/roadmap/02-bloom-evidence.md), [Adaptive Planner](docs/roadmap/03-adaptive-planner.md) | [largo-learning-engine](.claude/skills/largo-learning-engine/SKILL.md) |
| Lưu events, migrate, restore tiến độ | [Events & migrations](docs/roadmap/04-events-migrations.md) | [largo-study-state](.claude/skills/largo-study-state/SKILL.md) |
| Tích hợp DeepSeek, token/cost/guardrails | [AI](docs/roadmap/05-deepseek-ai.md) | [largo-ai-gateway](.claude/skills/largo-ai-gateway/SKILL.md) |
| Triển khai cho người dùng, PWA, sync/tài khoản | [Hosting](docs/roadmap/07-hosting-pwa.md), [Accounts](docs/roadmap/08-accounts-sync.md) | [largo-release](.claude/skills/largo-release/SKILL.md) |
| Tra từ và giấy phép nguồn | [Dictionary](docs/roadmap/09-dictionary.md) | — |
| Thêm ngôn ngữ, giáo trình hoặc bộ học liệu | [Quy chuẩn học liệu](docs/agents/language-curriculum.md), [mẫu và checklist](docs/agents/language-curriculum-checklist.md) | — |
| HSK/nguồn giáo trình | [Chinese curriculum](docs/agents/chinese-curriculum.md) | [largo-hsk-curriculum](.claude/skills/largo-hsk-curriculum/SKILL.md) |
| Test, UI, hiệu lực bản phát hành | [Verification](docs/agents/verification.md) | [largo-verify](.claude/skills/largo-verify/SKILL.md) |

Ghi quyết định dài hạn vào [Architecture Decision Log](docs/roadmap/DECISIONS.md). Đừng thay đổi toàn bộ thuật toán SRS/FSRS, auth hay backend trong cùng một PR khi chưa có phép thử migration.
