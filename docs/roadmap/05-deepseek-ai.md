# 05 — DeepSeek AI: optional assessment, cực tiết kiệm token

## Ranh giới

AI **không** lập lịch SRS, không cho XP, không tự quyết định Bloom verified, không chạy mỗi lần render và không cần thiết để học offline. AI chỉ làm **ngữ nghĩa và phản hồi đối với đáp án mở**, hoặc tạo/bổ sung bài tập thiếu dữ liệu sau khi được xác thực.

## Contract backend (đề xuất, chưa tồn tại)

Endpoint: POST /api/ai/assess (serverless gateway hoặc Express adapter), không gọi trực tiếp từ client.

Request tối thiểu:
~~~json
{"requestId":"uuid","task":"sentence_usage","language":"zh","term":"提高","targetMeaning":"nâng cao","prompt":"Viết câu sử dụng 提高","answer":"...","rubricVersion":1}
~~~
Response chuẩn hóa, có kiểm schema runtime:
~~~json
{"requestId":"uuid","status":"passed","criteria":{"targetUsage":"pass","grammar":"pass","meaning":"pass","naturalness":"pass"},"feedbackCode":"ok","feedbackVi":"Dùng từ phù hợp.","assessor":"deepseek","rubricVersion":1,"usage":{"inputTokens":0,"outputTokens":0}}
~~~
status thuộc passed|failed|uncertain|unavailable. **Không tin output thô của model**, validate đủ fields, enum, độ dài, escape HTML, không render Markdown/HTML từ output. Nếu model nghi ngờ, timeout, JSON lỗi hoặc quota hết thì status uncertain/unavailable, không công nhận Bloom cấp cao.

## Model adapter và cấu hình

- Provider interface: `assessSentence(input): Promise<Assessment>`; mock adapter phục vụ unit/integration tests; DeepSeek adapter chỉ ở server.
- Model ID, base URL, capabilities, response-format và tham số reasoning đọc từ config runtime và tài liệu DeepSeek **tại thời điểm triển khai**. Không hardcode giả định tên model, giá, chế độ thinking hay header từ trao đổi trước.
- Dùng model rẻ nhất đáp ứng gold set; model reasoning/high-cost chỉ fallback có cấu hình rõ, **không tự động escalates** cho mọi người dùng.
- Prompt cố định tiếng Việt ngắn, rubric nằm ở system/template versioned; user input là dữ liệu untrusted, không phải instructions.
- Bắt đầu output ngắn (mục tiêu 40–120 tokens) và trần response token; kiểm tra trường hợp đa nghĩa, sai ngữ pháp và dữ liệu adversarial.
- Có thể dùng output JSON/structured schema khi API hỗ trợ; nếu không, parse + validate strict và fallback unavailable.

## Decision gate trước gọi API

1. Bài đóng có đáp án xác định? local grader, không gọi AI.
2. Bài mở có quá ngắn, trống, copy mẫu, không chứa từ mục tiêu? local warning, cho sửa; **không kết luận đúng/ngữ pháp từ regex**.
3. Có kết quả assessment từ cùng rubric/prompt/term/normalized answer và được phép reuse? lấy cache; không cache dữ liệu cá nhân vượt chính sách.
4. User có bật AI assessment + còn quota? gọi backend. Nếu tắt, offline hoặc hết hạn mức: chỉ hiển thị “Chưa được xác minh” + cách tự đối chiếu.
5. AI trả uncertain: ưu tiên cho sửa và bài local thay thế; không lặp vô tận.

## Bảo mật / chống lạm dụng

- Secret `DEEPSEEK_API_KEY` chỉ ở runtime server/secret binding, **không** đặt ở file git, không dùng `VITE_*`, không gửi key qua service worker.
- Backend kiểm input schema (language/length/rubric/token budget), content type, body limit, timeout, CORS/CSRF phù hợp, rate limiting, quota per user/session/IP khi chưa có tài khoản, idempotency requestId; production public AI endpoint **phải** chống lạm dụng, không dựa mỗi rate limit client.
- Không log raw answers mặc định; redact PII nếu analytics; user control tắt AI và consent gửi câu ra bên thứ ba; ghi rõ DeepSeek xử lý nội dung.
- Thêm kill switch, circuit breaker, retry tối đa 1 lần với jitter cho lỗi transient, không retry lỗi 4xx/quota, tránh double charge khi đã nhận event.
- Công khai “AI có thể chấm sai”, giữ nút báo chấm sai và manual override có audit trail.

## Tối ưu token — đo thay vì đoán

- Local-first, no call cho flashcard/quiz/dictation/cloze đã có key.
- Prompt rubric ngắn ổn định tiền tố; gửi từ, nghĩa đích, prompt, câu trả lời tối thiểu; **không gửi toàn bộ hồ sơ, examples hay lịch sử**.
- Batching **chỉ** cho bài tạo mới/analytics offline không cần feedback ngay; chấm câu realtime thì một request nhỏ.
- Cache server content-addressed chỉ với bài tập công khai; assessment cá nhân nên cache cục bộ theo consent + TTL và version; không tiết lộ nội dung giữa users.
- Ghi usage từ response: input/output/cache hit tokens, latency, status, costs dựa bảng giá **được cấu hình**. Tránh hardcode “$x” trong thuật toán.
- Trần riêng: per-request input/output tokens, per-user/day, per-user/month, budget toàn hệ thống, max concurrency, alert trên ngưỡng; fail-closed cho gọi AI, **fail-open cho học local**.
- Dùng prompt-cache provider chỉ khi tài liệu và model thực tế hỗ trợ; không hứa tỉ lệ cache hit.

## Evaluation gate A1/A2

Gold set tiếng Trung giản/phồn, tiếng Anh Anh–Anh/Anh–Mỹ; ví dụ đúng/sai; đa nghĩa; sai collocation; đúng ngữ pháp sai nghĩa; câu nhiễu injection ("ignore previous instructions"); answer dài; prompt độc hại. Reviewer người chấm làm chuẩn. Không bật automatic Bloom advancement nếu false-pass vượt ngưỡng đã chốt trong `06-quality-gates.md`.

## Dependencies

Đọc `01-learning-engine.md`, `02-bloom-evidence.md` và `04-events-migrations.md` trước khi viết endpoint. AI assessment là **một nguồn evidence**, không được ghi đè `srs.nextReviewAt` hoặc profile chỉ vì AI trả passed.
