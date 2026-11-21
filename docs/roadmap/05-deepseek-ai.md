# 05 — DeepSeek AI: optional assessment, cực tiết kiệm token

## Ranh giới

AI **không** lập lịch SRS, không cho XP, không tự quyết định Bloom verified, không chạy mỗi lần render và không cần thiết để học offline. AI chỉ làm **ngữ nghĩa và phản hồi đối với đáp án mở**, hoặc tạo/bổ sung bài tập thiếu dữ liệu sau khi được xác thực.

## Bản dùng thử tại máy

- Nguồn miễn phí `sums001/Deepseek-API` là bridge không chính thức dựa trên tài khoản DeepSeek Chat. Mã nguồn cục bộ ở `.local/deepseek-api` (không commit), cố định tại `f8c1397d00e9893e5fec29dd2eb1acaba6b27f57`. Môi trường Python ở `.local/deepseek-api/.venv`. Đăng nhập lần đầu cần chủ tài khoản tự hoàn thành trong trình duyệt do bridge mở.
- Để chạy bridge trên Windows, mở PowerShell tại thư mục gốc rồi chạy `cd .local/deepseek-api`, `./.venv/Scripts/python.exe -m deepseek.auth` để đăng nhập một lần, sau đó `$env:SERVER_INTERACTIVE_LOGIN='0'` và `./.venv/Scripts/python.exe app.py`. Giữ bridge nghe ở `127.0.0.1:8000`. Kiểm tra `http://127.0.0.1:8000/healthz`; sau đó khởi động lại Largo.
- Largo dùng `DEEPSEEK_PROVIDER=community_local`, `DEEPSEEK_BASE_URL=http://127.0.0.1:8000/v1` và `DEEPSEEK_AI_ENABLED=true` trong `.env` cục bộ. Gateway chỉ kết nối tới địa chỉ loopback này. Bridge nhận `deepseek-chat`, `thinking=false` và `search=false`.
- Bridge không áp dụng `max_tokens` hay `response_format` và tự ước lượng usage. Largo kiểm JSON/độ dài phản hồi, bỏ qua usage ước lượng, áp dụng timeout 45 giây và hạn mức lượt gọi. Chất lượng chấm thực tế cần gold set trước khi dùng làm bằng chứng Bloom. Bridge cần phiên đăng nhập cá nhân và có thể ngừng hoạt động nếu DeepSeek thay đổi web app. Xem [README và giới hạn của tác giả](https://github.com/sums001/Deepseek-API#notes--limitations).
- Trong bài **Tự đặt câu** tiếng Anh hoặc tiếng Trung, nút **Nhận góp ý AI** gửi câu, từ và nghĩa đích cho DeepSeek sau khi người học bấm. Flashcard, trắc nghiệm, điền từ, nghe chép, nút **Kiểm tra từ khóa** và planner tiếp tục chấm tại máy. Câu trống, chỉ lặp từ khóa, quá dài hoặc trùng câu mẫu được xử lý tại trình duyệt.
- Chế độ API chính thức dùng `DEEPSEEK_PROVIDER=official`, `DEEPSEEK_AI_ENABLED=true` và `DEEPSEEK_API_KEY` trong môi trường máy chủ (file `.env` cục bộ). `DEEPSEEK_MODEL` mặc định là `deepseek-flash`; `DEEPSEEK_BASE_URL` chỉ nhận origin HTTPS chính thức của DeepSeek, có thể kèm `/v1`.
- Mỗi lượt được gửi tối đa một yêu cầu. API chính thức đặt trần 160 token đầu ra. Cả hai nguồn giới hạn dữ liệu động ở 1.200 byte. Trình duyệt dùng lại 24 kết quả gần nhất trên thẻ đang mở. Máy chủ giữ mã yêu cầu, dấu băm và kết quả trong RAM tối đa 24 giờ để gộp yêu cầu trùng. Timeout, lỗi provider hoặc JSON sai đều giữ bài tập local khả dụng.
- Bật `DEEPSEEK_LOCAL_UNLIMITED=true` cùng `DEEPSEEK_PROVIDER=community_local` để bỏ hạn mức lượt/phút, ngày và tháng cho HTTP loopback trực tiếp trên máy chạy Largo. Chế độ này mặc định tắt trong `.env.example` và đang được bật trong cấu hình test cá nhân. Truy cập qua LAN hoặc header proxy nhận 403. Hai yêu cầu đồng thời, timeout và tạm dừng sau lỗi liên tiếp vẫn áp dụng. Cache máy chủ giữ tối đa 512 mã yêu cầu trong 24 giờ, loại kết quả đã hoàn thành cũ nhất khi đầy.
- Bản bridge cục bộ có sửa `server/ratelimit.py` để `RATE_LIMIT_PER_MINUTE=0` bỏ quota cho kết nối loopback trực tiếp và trả 403 cho kết nối khác hoặc header proxy. File `.local/deepseek-api/.env` đặt giá trị này cùng `HOST=127.0.0.1`. Nếu tải lại bridge từ upstream, cần áp dụng lại thay đổi này. Việc dùng miễn phí vẫn phụ thuộc vào phiên tài khoản, khả năng hoạt động của bridge và giới hạn phía DeepSeek.
- Khi tắt chế độ unlimited hoặc dùng API chính thức, hạn mức mỗi tiến trình là 6 lượt/phút, 20 lượt/ngày và 150 lượt/tháng (mốc ngày/tháng UTC). Mỗi lượt đã gửi đều tính quota, kể cả khi timeout. Bộ đếm đặt lại khi khởi động lại tiến trình. Đặt `DEEPSEEK_AI_LOG_USAGE=true` để lấy trạng thái và độ trễ, cùng số token nếu dùng API chính thức, mà không ghi nội dung câu hay key. Rollback quota bằng `DEEPSEEK_LOCAL_UNLIMITED=false`, `RATE_LIMIT_PER_MINUTE=30` trong môi trường tương ứng rồi khởi động lại hai server.
- Góp ý hiển thị trong bài tập hiện tại. Ledger, XP, lịch SRS và Bloom dùng pipeline hiện tại. Chấm thật trên gold set có người gắn nhãn và quota bền vững theo danh tính là điều kiện trước mở rộng. Tắt bằng `DEEPSEEK_AI_ENABLED=false` rồi khởi động lại máy chủ.

## Contract backend của bản thử

Endpoint: POST /api/ai/assess (serverless gateway hoặc Express adapter), không gọi trực tiếp từ client.

Request tối thiểu:
~~~json
{"requestId":"uuid-v4","consent":true,"task":"sentence_usage","language":"zh","term":"提高","targetMeaning":"nâng cao","answer":"我每天练习，希望提高中文水平。","rubricVersion":1}
~~~
Response chuẩn hóa, có kiểm schema runtime:
~~~json
{"requestId":"uuid-v4","status":"passed","criteria":{"targetUsage":"pass","grammar":"pass","meaning":"pass","naturalness":"pass"},"feedbackVi":"Dùng từ phù hợp.","assessor":"deepseek","rubricVersion":1,"usage":{"inputTokens":192,"cacheHitTokens":64,"outputTokens":52}}
~~~
status thuộc passed|failed|uncertain|unavailable. **Không tin output thô của model**, validate đủ fields, enum, độ dài, escape HTML, không render Markdown/HTML từ output. Nếu model nghi ngờ, timeout, JSON lỗi hoặc quota hết thì status uncertain/unavailable, không công nhận Bloom cấp cao.

Phản hồi lỗi có dạng `{"status":"unavailable","reason":"quota"}`. Máy chủ suy ra trạng thái từ bốn tiêu chí thay vì nhận kết luận do mô hình tự gán. Số token trong ví dụ là dữ liệu giả lập, không phải phép đo của model thật.

Các mục dưới đây là tiêu chí cho những đợt mở rộng sau bản dùng thử.

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
