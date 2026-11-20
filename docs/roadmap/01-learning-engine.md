# 01 — Learning Engine 2.0 (local-first)

## Mục tiêu / ngoài phạm vi

Engine phải trả lời **khi nào ôn**, **ôn kỹ năng nào**, **dạng bài gì**, và **đã có bằng chứng gì**. Không yêu cầu AI để ôn flashcard, SRS hay tạo phiên học. Không thay model SRS bằng AI, không hứa khả năng đo độ nhớ chuẩn xác khi chưa hiệu chuẩn.

## Tách ba lớp trạng thái

1. **Scheduler:** giữ `VocabWord.srs` hiện tại và `applyStudyReview` trong migration đầu. Quản lý ngày đến hạn, không chứa phán quyết Bloom.
2. **Evidence ledger:** append-only attempt events `04-events-migrations.md`, gồm kết quả, dạng bài, gợi ý, độ trễ, nguồn chấm.
3. **Mastery state:** mỗi từ x từng kỹ năng, tính từ evidence đáng tin, lưu `masteryVersion`/`rubricVersion`; chỉ hiển thị Bloom verified khi đạt rubric `02-bloom-evidence.md`.

Không dùng `bloomLevel` làm input ngược để thay đổi lịch SM-2 khi không có dữ liệu mới. Trước khi xóa/chuyển field cũ, chuẩn bị adapter để UI/backup phiên bản cũ vẫn đọc được.

## Luồng xử lý một attempt

`StudySession` tạo `attemptId` ổn định trước chấm → deterministic grader hoặc AI assessment → kiểm tra kết quả và status → lưu event (idempotent) → cập nhật mastery và, **chỉ nếu đúng điều kiện scheduled**, cập nhật SRS → ghi summary/log → planner chọn mục sau.

- `scheduled` = từ mới hoặc đến hạn ở thời điểm attempt bắt đầu. Xác định một lần trước khi hiển thị, tránh race khi quá hạn giữa câu.
- `practice` trước hạn: có thể cập nhật mastery skill, nhưng không dời lịch SRS; đánh giá có gợi ý/đã xem đáp án không được thành “independent recall”.
- Retry sau khi sai: không cộng thêm số lượt thành công độc lập; ghi event `isRetry=true`, `evidenceWeight=0` cho milestone trong cùng phiên.
- Người học bấm “Quên/Hơi khó/Nhớ/Rất dễ” trên flashcard là **self-rating**, không đủ chứng nhận Bloom 4–6.
- Game vẫn cho XP/động lực; không ghi nhận mastery cao khi không có rubric tương ứng.
- AI unavailable: lưu outcome `unverified` hoặc local-only feedback; không mở khóa tầng yêu cầu AI/human evaluation.

## Hợp đồng đề xuất (chỉ là thiết kế, chưa tồn tại)

`LearningAttempt` là event; `WordMastery` là projection có thể rebuild. Các hành vi nên được khai báo thành hàm thuần:

- `evaluateLocalAttempt(attempt, word, answer) -> LocalGrade`
- `buildMasteryProjection(events, rubricVersion) -> MasteryProjection`
- `shouldScheduleReview(word, startedAt, sessionMode) -> boolean`
- `applyScheduledSrs(word, grade, startedAt) -> VocabWord`
- `planAdaptiveSession(scope, state, limit, now) -> StudyPlan`

Tách orchestration khỏi React component; dependency injection đồng hồ/ngẫu nhiên; giữ kết quả deterministic với input giống nhau. Hạn chế gọi API ở render/effect không có user intent.

## Lộ trình thực hiện không phá dữ liệu

1. E0: thêm test bất biến và full backup restore trước.
2. E1: tạo store + event interface; ghi song song **không đổi hành vi SRS hiện tại**, feature flag off mặc định. Kiểm tra event replay và idempotency.
3. E2: triển khai projection kỹ năng/Bloom qua rubric version mới; UI hiển thị “đang thu thập bằng chứng” khi chưa đủ. `bloomLevel` lịch sử được hiển thị là legacy, không âm thầm gán verified.
4. E3: planner mới trong shadow mode (so sánh với planner hiện tại, không quyết định thật); chạy test và đo starvation/cap; rollout opt-in, giữ kill switch.
5. E4: cân nhắc FSRS sau khi có lịch sử đủ chất lượng, có backtest và phương án trở về SM-2. Không tự động migrate hằng loạt lịch đang đến hạn.

## Acceptance tests tối thiểu

- Ôn due đúng 1 lần → SRS thay đổi 1 lần; retry không double-schedule.
- Luyện sớm cloze/quiz → mastery kỹ năng có thể ghi, `nextReviewAt` bất biến.
- Đặt câu đủ ký tự nhưng sai ngữ pháp → **không** xác nhận Bloom cao.
- Cùng thẻ xuất hiện HSK 2.0/3.0 → một canonical learner state.
- App offline hoặc DeepSeek lỗi → học tiếp, không mất câu, không tự tăng mastery.
- Back/refresh giữa phiên → không mất event đã chấm; không ghi trùng.
- Planner không có từ đến hạn → có thể chọn từ mới theo quota; có overdue backlog → không ép từ mới.

## Những chỉ số nên đo (không suy đoán)

Tỉ lệ nhớ lần đầu theo khoảng cách, tỉ lệ trả lời không gợi ý, elapsed-to-answer, phân phối dạng bài, tỷ lệ luyện bị bỏ dở, false advancement Bloom, độ trễ tạo phiên, tỷ lệ event trùng, tỷ lệ hoàn thành. Không gửi telemetry cá nhân ra server nếu chưa đồng ý.
