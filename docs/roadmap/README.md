# Largo — kế hoạch phát triển dài hạn (2026+)

> Đọc `AGENTS.md` trước mọi thay đổi. Xem [chạy và kiểm chứng](../agents/verification.md) để biết phạm vi mã và các bước kiểm thử E0–E1.
> Thứ tự ưu tiên bắt buộc: **Learning Engine → AI hỗ trợ học → phát hành PWA/hosting → tài khoản/đồng bộ → từ điển đa nguồn**.
> Thực hiện từng work package và hoàn tất acceptance gate, không làm một đợt refactor khổng lồ.

## Điểm bắt đầu cho coding agent

1. Đọc `../agents/project-map.md` và `00-baseline.md`; kiểm tra thực tế trên nhánh đang làm.
2. Chọn **một** package trong `10-work-packages.md`, đọc đầy đủ tài liệu kỹ thuật liên quan.
3. Trước sửa: `git status --short`; xác định phạm vi, đánh giá rủi ro dữ liệu cũ, viết test đỏ nếu đổi hành vi.
4. Sửa mã nguồn (không sửa `dist/`, `dev-dist/`). Chạy kiểm kiểu, test, build và kiểm thử thao tác theo `../agents/verification.md`.
5. Báo file sửa, test đã chạy/thất bại, migration, dữ liệu thử nghiệm, rủi ro/rollback, việc chưa làm; cập nhật roadmap nếu trạng thái thực sự thay đổi.

## Thứ tự và điều kiện chuyển giai đoạn

| Giai đoạn | Nội dung | Gate bắt buộc |
| --- | --- | --- |
| E0 | Baseline, fixtures cũ, backup/restore, record per-attempt | Test snapshot & phục hồi, không mất SRS/thẻ đã xóa |
| E1 | Mastery/Bloom Evidence độc lập SRS | Không nâng Bloom chỉ bằng lượt tự chấm hoặc câu có từ khóa |
| E2 | Adaptive Planner local, offline | Chọn hợp lý và ổn định, cùng input cùng output; SRS cũ không đổi trái phép |
| A1 | DeepSeek Gateway nhỏ, có quota, fallback | Không lộ key, không tăng Bloom khi AI lỗi, chi phí giới hạn |
| A2 | Bộ đánh giá AI, quality evaluation & tối ưu token | Gold set đối chiếu; đo FP, latency, token/call, cost/call |
| R1 | Backup/restore ổn định, PWA update an toàn, hosting công khai | Máy cá nhân tắt vẫn dùng được; dữ liệu giữ nguyên origin hoặc được chuyển bằng restore |
| R2 | Tài khoản và sync đa thiết bị (tùy chọn) | Offline-first, chống đè dữ liệu, RLS, logout không xóa cục bộ |
| D1 | Từ điển Hanzii/Cambridge và dữ liệu có giấy phép | Hợp pháp, không trộn dữ liệu tham khảo vào SRS |

**Chặn tiến độ:** không được bắt đầu R2 trước khi E0–E2 được kiểm chứng. Có thể triển khai R1 tối thiểu sớm để thử nghiệm nội bộ, nhưng không được trì hoãn yêu cầu giữ dữ liệu.

## Hồ sơ tài liệu

- `00-baseline.md` — thực trạng, bất biến, rủi ro.
- `01-learning-engine.md` — state machine, SRS, cách ghi chấm.
- `02-bloom-evidence.md` — rubric 6 tầng, tiêu chí đạt.
- `03-adaptive-planner.md` — chọn từ/dạng bài, fairness.
- `04-events-migrations.md` — dữ liệu sự kiện, migration, backup.
- `05-deepseek-ai.md` — API, JSON, ngân sách và fallback.
- `06-quality-gates.md` — test, benchmark, quality gates.
- `07-hosting-pwa.md` — deploy một lần, cập nhật ứng dụng.
- `08-accounts-sync.md` — tài khoản và đa thiết bị khi đã sẵn sàng.
- `09-dictionary.md` — Hanzii ưu tiên, Cambridge và nguồn dự phòng.
- `10-work-packages.md` — checklist theo PR có thể giao trực tiếp.
- `DECISIONS.md` — decision log / thay đổi kiến trúc.

## Các nguyên tắc bất biến

- **Không mất tiến độ:** giữ `VocabWord.id`, SRS, Bloom hiện có trong giai đoạn chuyển đổi, lịch sử, bộ/từ cá nhân, ảnh hồ sơ và cả ý định xóa thẻ; không tính lại toàn bộ lịch ôn khi deploy.
- **Offline luôn hoạt động:** SRS, quiz, flashcard, cloze và planner chạy không mạng; AI là optional enhancement, không là single point of failure.
- **Dữ liệu/capability không tự suy diễn:** số % nhớ dự đoán hiện tại chỉ là heuristic; đánh giá AI không là sự thật hiển nhiên; Bloom là bằng chứng năng lực, không phải XP.
- **Bảo mật từ đầu:** không nhúng API key vào Vite client; backend phải có quota, xác thực khi phát hành rộng, giới hạn input, quan sát chi phí.
- **Chống lock-in:** model name/config có thể thay đổi; thêm provider adapter, không gắn nghiệp vụ vào SDK cụ thể.
- **Độc lập trạng thái:** bản phát hành mã mới không đồng nghĩa người dùng chuyển origin; cache PWA khác IndexedDB; đồng bộ nhiều thiết bị là công việc riêng.
- **Không tự động release:** CI/test/evidence trước production; không ghi nhận hoàn thành nếu chỉ thay đổi tài liệu.

## Cách xử lý khi yêu cầu mới xung đột roadmap

Đặt yêu cầu mới vào `DECISIONS.md` với lý do, trade-off, cách rollback và package bị ảnh hưởng. Chỉ ưu tiên phát hành hosting/tài khoản trước engine nếu có yêu cầu rõ từ chủ dự án hoặc rủi ro bảo toàn dữ liệu bắt buộc.
