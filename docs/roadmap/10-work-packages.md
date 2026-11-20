# 10 — Work packages để giao cho coding AI theo từng PR

Mỗi package 1 PR (hoặc 1–2 PR nếu lớn), không triển khai toàn bộ bằng một prompt. Trước khi bắt đầu: `git status --short`, đọc `AGENTS.md`, tài liệu kỹ thuật của package và `06-quality-gates.md`. Mặc định **không** commit trực tiếp main khi đang sửa code logic; tạo PR để có test/review, trừ khi chủ dự án yêu cầu trực tiếp.

| ID | Cần làm, theo thứ tự | Dependencies | Definition of Done |
| --- | --- | --- | --- |
| E0-01 | Viết fixtures dữ liệu legacy/HSK, kiểm snapshot và invariant | baseline | Test chạy lặp được, dữ liệu ẩn danh |
| E0-02 | Import full backup và export v2-compatible | E0-01 | Roundtrip, dry-run, legacy import, không ghi đè khi lỗi |
| E0-03 | Thiết kế event model + store IndexedDB; thử ghi song song | E0-02 | Idempotent, replay-safe, không thay lịch SRS cũ |
| E1-01 | Trích grader/attempt orchestration từ StudySession | E0-03 | Không double-review/XP, test offline/retry |
| E1-02 | Bloom rubric + mastery projection tách SRS | E1-01 | Self-rating không mở L4–6, versioned evidence |
| E1-03 | UX hiển thị “legacy/unverified/verified”, review lỗi | E1-02 | Không báo Bloom giả, không phá thống kê |
| E2-01 | Planner pure functions + reason codes, fallback | E1-02 | Constraint tests và deterministic snapshots |
| E2-02 | Shadow planner, opt-in, theo dõi fairness | E2-01 | Không starvation, kill switch |
| A1-01 | DeepSeek server adapter + schema + mock + secrets | E1-02 | No key in client, bounded tokens, fallback |
| A1-02 | Quota, cache, rate limit, consent, telemetry ít dữ liệu | A1-01 | Abuse tests, budget guard |
| A2-01 | AI assessment trong đặt câu + uncertain | A1-02 | Không auto Bloom sai, feedback tiếng Việt |
| A2-02 | Golden eval + compare human + token optimization | A2-01 | False-pass gate, cost/latency report |
| R1-01 | PWA update không gián đoạn phiên | E0-02 | 2 tabs, offline/update, không mất dữ liệu |
| R1-02 | Cloudflare Pages + serverless AI/speech adapter | A1-02, R1-01 | Máy tác giả tắt vẫn học, HTTPS verified |
| R1-03 | Release checklist, staging/production, backups | R1-02 | Domain ổn định, smoke, rollback |
| R2-01 | Thiết kế auth/identity và consent | E0–E2, R1 | Guest dùng được, security review |
| R2-02 | Sync append-only event và conflict policy | R2-01 | Multi-device offline conflict tests |
| R2-03 | Sync user overrides, tombstones, profile/settings | R2-02 | Deleted cards không hồi sinh, export/delete |
| D1-01 | DictionaryProvider và source attribution | E1 | Offline fallback, no SRS mutation |
| D1-02 | Hanzii preferred/Cambridge links, licensed API nếu có | D1-01 | Quyền nguồn rõ, multi-sense tests |

**Priority exception**: nếu API chi phí cao hoặc chưa có khoá, A1/A2 có thể dùng mock trong integration, nhưng không công bố AI assessment chạy thực. Nếu chưa thể làm R1, các engine phases vẫn có thể làm độc lập offline.

## Prompt mẫu giao cho agent

> Thực hiện duy nhất package `[ID]` trong `docs/roadmap/10-work-packages.md`. Đọc `AGENTS.md`, `docs/roadmap/README.md`, các spec liên quan, `docs/agents/project-map.md` và `docs/agents/verification.md`. Bắt đầu bằng `git status --short`; bảo toàn mọi thay đổi dở. Viết tests trước hành vi mới. Không phá SRS/HSK/backup, không ghi secrets. Sau sửa: lint, test liên quan, build, chạy UI nếu có; mô tả dữ liệu migration, rollback, lệnh đã chạy và các vấn đề chưa chứng minh. Nếu chưa đạt gate, giữ feature flag off và không tuyên bố xong.

## Quy tắc cập nhật lộ trình

Chỉ tick “Done” khi có commit, test output và thông tin đã verify thực tế. Sau mỗi package cập nhật `DECISIONS.md` và thay đổi bất biến/diagram nếu kiến trúc thay đổi. Không xóa package chỉ vì đã tạo code chưa được test.
