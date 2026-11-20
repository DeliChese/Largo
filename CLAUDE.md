@AGENTS.md

# Claude Code — Largo

Đọc `AGENTS.md`, sau đó `docs/roadmap/README.md` và `docs/roadmap/10-work-packages.md` nếu yêu cầu liên quan phát triển engine/AI/hosting. Skills nằm ở `.claude/skills/`:

- `/largo-learning-engine` — SRS, Bloom evidence, planner.
- `/largo-study-state` — dữ liệu offline, event store, migration và backup.
- `/largo-ai-gateway` — DeepSeek, quota và đánh giá câu.
- `/largo-release` — PWA update, hosting và tài khoản/sync.
- `/largo-hsk-curriculum` — giáo trình HSK và nguồn.
- `/largo-verify` — kiểm kiểu, test, build và kiểm thực tế.

Không tự xem roadmap là mã đã được triển khai. Mỗi tác vụ chỉ chọn một work package, ghi tests và rollback trước khi đưa vào production.
