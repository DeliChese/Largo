---
name: largo-ai-gateway
description: Tích hợp DeepSeek assessment tiết kiệm token, viết gateway backend, quota, cache, schema, privacy và fallback trong Largo. Dùng khi làm AI chấm câu hoặc tạo bài cá nhân hoá.
---

# DeepSeek optional assessment

1. Đọc `../../../docs/roadmap/05-deepseek-ai.md`, `../../../docs/roadmap/02-bloom-evidence.md`, `../../../docs/roadmap/04-events-migrations.md` và `../../../docs/roadmap/06-quality-gates.md`. Chỉ làm một package A1/A2 ở `../../../docs/roadmap/10-work-packages.md`.
2. Xác minh **tài liệu API DeepSeek mới nhất** trước khi chọn model, giá, JSON output hay thinking; config model/endpoint runtime thay vì hardcode.
3. Bảo mật: key chỉ server secret, không `VITE_*`, không lưu raw answer mặc định, consent khi gửi câu ra bên thứ ba. API kiểm input, rate limit, budget, timeout, có idempotency/circuit breaker.
4. Giữ local grading cho closed tasks. Prompt ngắn, JSON schema strict, structured assessment; AI sai/uncertain/offline/quota hết thì không nâng Bloom hay chặn học.
5. Gold set có nhãn người chấm, adversarial prompt injection, đa nghĩa, sai collocation; đo false pass, token/call, cost/call, latency trước bật mặc định. Ưu tiên model rẻ đáp ứng chất lượng, không dùng reasoning trừ khi có bằng chứng.
6. Mock provider trong test; kiểm không leak key trong `dist/`; ghi những lệnh đã chạy, số đo thực tế và rollback/disable AI.
