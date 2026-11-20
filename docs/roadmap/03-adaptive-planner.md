# 03 — Adaptive Study Planner chạy offline

## Mục đích

Quyết định **luyện từ nào** và **kỹ năng nào** theo evidence; không cần AI để lập lịch. Tránh tối ưu một chỉ số đến mức bỏ quên từ đến hạn, tránh lặp dạng bài và tránh spam từ mới.

## Inputs / outputs

Input: `scope` (language, HSK edition, level, decks), `now`, canonical words + SRS, mastery projection, attempt aggregates, profile quota, accessible exercise catalogue; config phiên bản hoá. Output: danh sách `{ wordId, taskType, reasonCode, dueKind, evidenceTarget }` với giải thích ngắn người dùng hiểu được; `generatedAt`, `plannerVersion`.

Phải sử dụng `getEditionDecks`, `getScopedDecks`, `getScopedWords` và mapping ID đã có. Thứ tự bài là dữ liệu có ý nghĩa; không bỏ qua từ theo giáo trình khi chưa đủ kiến thức nền.

## Luật cứng (trước scoring)

1. Chọn due SRS trước; khi backlog lớn không ép từ mới. Tôn trọng session size và daily new-word quota hiện tại.
2. Cấm lấy bài không có prompt/key phù hợp (ví dụ cloze không có example); có fallback sang flashcard/quiz.
3. Không thay `nextReviewAt` vì người học làm luyện tự chọn trước hạn.
4. Không chọn 3–4 câu giống hệt liên tiếp nếu có khả năng đa dạng; không dùng cùng một prompt AI đã fail nhiều lần.
5. Bảo đảm công bằng giữa các nhóm từ đến hạn; chống starvation cho từ khó/trễ lâu, có cơ chế không ưu tiên mãi 1 thẻ.
6. Respect active session: không đổi hàng đợi giữa phiên chỉ vì state nền thay đổi.
7. Offline hoàn toàn vẫn tạo phiên có ích; khi thiếu evidence, dùng thứ tự hiện hành thay vì ngẫu nhiên quá mức.

## Scoring heuristic v1 (đề xuất thử nghiệm)

Chỉ áp dụng **sau** khi chia pool `overdue → due → optional new/early practice`:

`priority = overdueWeight + difficultyWeight + weakSkillWeight + diversityBonus - recentExposurePenalty`

Gợi ý trọng số khởi đầu (không coi là khoa học đã kiểm nghiệm):
- overdueWeight = min(40, ngày trễ * 2 + 10)
- difficultyWeight = min(15, số lapse * 3)
- weakSkillWeight = 0..20 dựa tỷ lệ success **theo skill**, có smoothing cho mẫu ít
- diversityBonus = 0..8 nếu tránh dạng bài gần nhất
- recentExposurePenalty = 0..20 nếu vừa gặp lại trong phiên/ngày

Không dùng `calculateRetentionProbability` cũ làm xác suất hiệu chuẩn; có thể dùng để sắp xếp phụ nếu nhãn ghi “heuristic”. Stable tie-break: `wordId` rồi `taskType`; random seed chỉ dùng khi có test fixture xác định.

## Policy chọn dạng bài

- Chưa biết: recognition và flashcard, ít gợi ý.
- Đã nhận diện nhưng thiếu active recall: dictation, recall, cloze.
- Biết từ nhưng nhầm collocation: collocation/cloze với distractor cùng từ loại và đồng nghĩa gần.
- Sử dụng ngữ cảnh yếu: câu mở với rubric, AI chỉ khi có user intent/đủ quota; không AI thì dùng guided correction.
- Có evidence L4/5 nhưng chưa ổn định: contrast, error correction xen kẽ, không tăng Bloom tự động.
- Kết quả bất định hoặc AI unavailable: chọn bài deterministic phù hợp, không coi như đạt.

## API thử nghiệm

`planAdaptiveSession({ words, masteryById, recentEvents, scope, profile, limits, now, version }): Plan` và `explainPlanItem(item): string`. Giữ pure functions để có snapshot tests. Không gọi fetch trong scheduler. Mọi `wordId` được trả ra phải thuộc scope và chưa xóa.

## Test scenarios bắt buộc

- 50 overdue + 10 new: không bỏ due vì weak skill của new.
- Hai HSK edition cùng thẻ: không lặp hai lần trong một phiên.
- Người chưa có event: plan vẫn deterministic như engine cũ.
- Người yếu nghe: tăng tỷ lệ dictation **khi voice khả dụng**; nếu thiết bị không hỗ trợ thì fallback.
- Có 100 lần luyện với hint: không đạt mastery independent.
- Không có bài cloze khả dụng: fallback không lỗi/trống phiên.
- Task AI vượt quota: planner không bế tắc.
- Lặp 5 phiên: fairness, không starvation và không đổi lịch SRS khi luyện sớm.

## Rollout & quan sát

Shadow planner trên fixtures, so sánh 20 kịch bản với legacy; flag `adaptivePlanner` mặc định off đến khi test xong. Sau bật opt-in, đo retention thực tế qua kỳ ôn tiếp theo, completion, % tập trung vào điểm yếu, sai/lặp/hint và latency lập kế hoạch. Có kill switch trả về `getDailyStudyPlan`.

## Triển khai v1

- Phiên “Kế hoạch hôm nay” lấy thẻ đã đến hạn trước và dùng chung hạn mức từ mới với kế hoạch cũ. Trong nhóm đến hạn, sắp theo số ngày quá hạn, số lần quên, lỗi theo kỹ năng và lần luyện gần nhất. Dành thẻ chờ lâu nhất cho các vị trí 1, 5 và 9 để giảm thời gian chờ. Thứ tự từ mới theo giáo trình.
- Chọn kỹ năng từ các bài đã chấm độc lập. Điền cụm từ dùng câu có đáp án, trắc nghiệm cần ít nhất hai phương án nhiễu và nghe chép dùng giọng đúng biến thể có sẵn trên thiết bị. Khi dữ liệu kỹ năng còn thiếu, dùng thứ tự và dạng bài của kế hoạch cũ. Phần ôn tăng cường tiếp tục xử lý luyện sớm.
- **Cài đặt → Dùng thử kế hoạch cá nhân hóa** mặc định tắt. Mục so sánh tính cả hai kế hoạch tại máy, còn phiên chỉ dùng đề xuất khi người học bật tính năng. Mỗi phiên giữ thẻ và dạng bài đã chọn khi bắt đầu.
- Chỉ số trong Cài đặt lấy từ các lượt đã lưu, gồm phiên có câu trả lời, lượt luyện kỹ năng yếu, lượt sai, gợi ý, làm lại và số lượt đúng khi ôn đến hạn lần sau có chấm độc lập. Mẫu số của lượt ôn sau chỉ tính các câu được chấm độc lập. Độ trễ hiển thị là thời gian tính kế hoạch hiện tại trên thiết bị.
