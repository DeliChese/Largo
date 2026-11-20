# 06 — Quality gates, kiểm thử và tiêu chí phát hành

## Chuẩn làm việc

Đọc `../agents/verification.md`, không bịa log. Với mỗi work package: test hiện trạng → test đỏ tái hiện hành vi mới → code → test xanh → build → kiểm UI tại đúng origin → changelog và rollback. Không báo chạy test nếu chỉ đọc repository qua GitHub.

## Test pyramid

| Tầng | Bộ thử | Gate |
| --- | --- | --- |
| Unit | SRS pure functions, evidence reducer, planner, normalization, rubric | Deterministic, cover edge cases |
| Property/invariant | ID, quota, sort, not double schedule, idempotent migrations | Không vi phạm bất biến |
| Migration fixtures | Snapshot v1/v2, HSK, deleted, profile images, gzip, corrupt, future | Restore roundtrip, rollback |
| Integration | StudySession→event→projection→SRS; API gateway mock | 1 attempt không cộng 2 lần |
| UI/E2E | Mobile/desktop, offline, browser refresh, PWA update, reconnect, AI down | Học tiếp, không mất dữ liệu |
| AI eval | Gold set có nhãn người thật, adversarial, ngôn ngữ và trình độ | False-pass, false-fail, cost nằm trong budget |
| Release | Production HTTPS + Chrome/Android/iOS supported, data origin | Kiểm thực tế, rollback được |

## Gate số học đề xuất (chỉ áp dụng sau khi có dữ liệu đánh giá)

- Không có bug tái hiện gây mất SRS/từ tự tạo/thẻ xóa trong fixture migration.
- 0 duplicate `attemptId` làm cộng SRS/XP hoặc logs.
- Planner giữ 100% hard constraints trên deterministic suite; không starvation trong kịch bản test định nghĩa trước.
- AI L5/L6: trên golden set đủ rộng và có review, false-pass **mục tiêu ≤2%**, và 0 false-pass trên bộ critical adversarial. Nếu chưa đủ mẫu để đo đáng tin thì **không bật auto-verification**.
- AI unavailable phải chuyển về local học, không bị kẹt UI; no key leak trong client bundle.
- Cost gate: không có lời gọi ngoài quota thử nghiệm; 100% responses có accounting khi provider trả usage, mọi lỗi có metric không chứa raw answer.
- Không coi ước tính retention là xác suất chuẩn trước khi đối chiếu với recall thực tế. Nếu hiển thị, phải có nhãn “ước tính”.

## Bộ regression tối thiểu từ baseline

~~~bash
npm run lint
node --import ./.chinese-work/register.mjs --test --test-isolation=none src/utils/studyScope.test.ts src/utils/srsBloom.test.ts server/speech.test.mjs
npm run build
~~~

Khi tạo test mới, cập nhật lệnh verification và CI. Node/bun phiên bản theo lockfile/current repo, không tự bỏ test cũ. Báo rõ nếu không có môi trường chạy browser và test nào chỉ là dự kiến.

## Release gate / rollout

1. Feature flag off → shadow testing → opt-in → rollout nhỏ → default on khi evidence đủ.
2. Version hóa SRS/rubric/planner/prompt; có kill switch cho AI và planner; rollback mã không downgrade data.
3. Trước deploy: xuất backup có thể restore, chạy smoke test origin mới, kiểm tra PWA, offline cache, token quota.
4. Sau deploy: xem error rates, missing events, quota, restore reports; nếu lỗi nặng, tắt feature flag trước khi rollback.
5. Tài liệu hóa test artifacts, số lượng cases, phiên bản model và hạn chế; không tuyên bố pedagogical efficacy khi chưa có nghiên cứu người học.

## Template báo cáo cho AI coding agent

- Scope + files changed:
- Baseline/expected behavior:
- Tests executed (exact commands, results):
- Tests not executed + why:
- Migration/data preservation evidence:
- AI safety and cost (nếu có):
- Browser/production URL actually observed:
- Rollback/feature flags:
- Next package:
