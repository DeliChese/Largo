# Chạy và kiểm chứng Largo

## Lệnh trong repo

Chạy từ thư mục gốc với Node 24 trở lên và npm 10 trở lên. Dùng `bun install --frozen-lockfile` để cài theo `bun.lock`. CI kiểm tra thêm `npm install` từ checkout sạch. Các lệnh kiểm kiểu, kiểm thử và build dùng Node `25.8.0` trong CI.

```text
npm run dev
npm run lint
npm test
npm run build
```

`npm run dev` chạy Vite, mặc định cổng `3000`. Dùng URL Vite thực sự in ra. `npm run lint` kiểm kiểu TypeScript. `npm test` chạy các test SRS/Bloom, phạm vi học, snapshot và các API Azure/DeepSeek giả lập. Lệnh dùng bộ phân giải import trong `.chinese-work/register.mjs` cho các test TypeScript. [CI](../../.github/workflows/verify.yml) chạy kiểm kiểu, test và build. Sau khi build, `npm run preview` xem bản Vite đã build hoặc `npm start` chạy Express phục vụ `dist/` và các API.

Các [snapshot mẫu](../../src/utils/fixtures/studySnapshots.ts) dùng mốc thời gian cố định và hồ sơ giả lập. Bộ kiểm thử bao gồm dữ liệu mới cài, HSK hai phiên bản, Anh–Anh/Anh–Mỹ, bộ/thẻ cá nhân, thẻ đã xóa, lịch sử, avatar, bản lưu gzip và giáo trình thiếu bài. Các bài thử engine kiểm tra backup v2, mã lượt bị trùng, lịch ôn và XP sau lượt thử lại, chấm chưa xác minh cho câu mở và rubric Bloom.

## Kiểm chứng E0–E1 trên trình duyệt

1. Dùng origin thử nghiệm với snapshot mẫu. Ở `/#/settings`, chọn backup JSON đời cũ, xem số lượng bộ/thẻ/phiên/ảnh rồi hủy để kiểm tra bản lưu đang dùng. Lặp lại với file lỗi và kiểm tra thông báo. Nhập lại file hợp lệ, chọn thay thế và xuất backup v2. Tải lại `/#/profile` để kiểm tra avatar và đối chiếu SRS, Bloom cũ, lịch sử, thẻ đã xóa và tùy chọn học.
2. Dùng origin thử nghiệm chứa IndexedDB v3. Tải phiên bản mới rồi đọc snapshot và ảnh. Ghi đồng thời một lượt từ hai kết nối và kiểm tra chỉ có một sự kiện, một lần áp dụng tiến độ. Tạo lỗi ghi trong transaction khôi phục để kiểm tra snapshot, ảnh và ledger cũ được giữ.
3. Ở `/#/study`, trả lời sai một lần, thử gửi lặp và làm thẻ củng cố cuối phiên. Kiểm tra lượt thử lại có sự kiện riêng, SRS/XP/tổng hợp chỉ nhận lượt đầu. Thử một đáp án có gợi ý và một câu lặp từ khóa, rồi tải lại. Ở `/#/analytics/bloom`, kiểm tra mức đã xác minh, Bloom cũ và mục luyện lỗi.

## Lỗi web app chưa hiện tính năng

1. Xác định URL người dùng đang xem, gồm hostname, cổng và route. Với bản chạy trên máy, ưu tiên đúng origin người dùng đang dùng để kiểm tra dữ liệu cũ. `localhost` và `127.0.0.1` có kho dữ liệu trình duyệt riêng.
2. Xác nhận máy chủ đang phục vụ mã nào. Với Vite dev, kiểm tra module nguồn liên quan đã tải. Với Express hoặc preview, kiểm tra `dist/` và asset mà HTML tham chiếu. Kiểm tra `DISABLE_HMR` nếu việc tải lại thay đổi có liên quan. `vite-plugin-pwa` quản lý service worker và cache riêng.
3. Nếu giao diện mới đã hiện nhưng dữ liệu trống, xem phạm vi ngôn ngữ, phiên bản HSK, cấp độ, bộ lọc và bản chụp đã lưu trước. Lỗi từng gặp là bản chụp có số `version` hiện tại nhưng thiếu các bộ giáo trình. Kiểm tra cả cấu trúc bộ và ID thẻ. Giữ tiến độ của người dùng tại origin này và dùng bản chụp mẫu cho các thử nghiệm cần làm sạch dữ liệu.
4. Xác minh lại trên route vừa lỗi. Với `/#/decks`, chọn Tiếng Trung và lần lượt hai HSK, kiểm tra bài đầu/cuối, tìm bộ, đổi chủ đề và mở một bài. Trên màn hình đủ rộng, cuộn hai danh sách riêng và quan sát thanh lọc bên trái. Khi sửa migration, tải lại với dữ liệu cũ và xác nhận thẻ đã ôn giữ lịch/Bloom.

Kết quả HTTP chứng minh máy chủ đã trả nội dung. Kết quả kiểm thử chứng minh các trường hợp được chạy. Để báo một thao tác đã hoạt động trên web app, ghi URL và hành vi thực tế quan sát được. Khi được giao triển khai, xác định nền tảng và xác minh phiên bản tại URL triển khai trước khi báo hoàn tất.

## Kiểm chứng E2

- `npm test` chạy 20 kịch bản đối chiếu hai kế hoạch và mô phỏng năm phiên với 50 từ quá hạn. Kiểm tra giới hạn thẻ, hạn mức toàn thư viện, thứ tự từ mới, ID chung giữa hai bản HSK, bài khả dụng khi thiếu giọng và kết quả nhất quán với cùng dữ liệu.
- Dùng hồ sơ mẫu có lượt làm sai bài điền từ. Trong `/#/settings`, xem mục so sánh khi tùy chọn vẫn tắt, bật dùng thử rồi mở `/#/study` để xem lý do chọn bài. Học hai thẻ, đối chiếu lượt đã ghi và thứ tự phiên, rồi quay lại Cài đặt xem chỉ số và xuất v2. Tắt tùy chọn để thử quay về kế hoạch gốc.


## Kiểm chứng góp ý AI

- `node --test --test-isolation=none server/sentenceAssessment.test.mjs` dùng provider giả lập để kiểm tra giới hạn đầu vào, đồng ý gửi, request trùng, quota, timeout, định dạng JSON và tiêu chí chấm. Bộ thử không cần key.
- Với nguồn miễn phí, kiểm tra bridge tại `http://127.0.0.1:8000/healthz` và danh sách `/v1/models`, rồi thử `/api/ai/assess` qua Largo. Nếu chưa đăng nhập DeepSeek Chat, bridge trả `login_required` và Largo trả `unavailable`. Chỉ sau khi chủ tài khoản đăng nhập mới chạy được phép thử chất lượng với model thật.
- Test gateway dùng 520 lượt giả lập trong cùng thời điểm khi bật `DEEPSEEK_LOCAL_UNLIMITED`, kiểm cache cũ bị loại, cache mới dùng lại, header proxy/LAN bị chặn và API chính thức còn quota. Bản bridge cục bộ kiểm bằng FastAPI TestClient với 200 request loopback và các request LAN/header proxy.
- Trong **Tự đặt câu**, thử nhập một câu hoàn chỉnh rồi dùng **Kiểm tra từ khóa**. Quan sát tab Network để kiểm tra chỉ nút **Nhận góp ý AI** gửi POST tới `/api/ai/assess`. Thử một câu chỉ có từ khóa, một câu trùng ví dụ, trạng thái offline và gateway đang tắt. Đối chiếu lịch SRS, XP và Bloom trước và sau khi nhận góp ý.

## Gates cho roadmap

Theo `../roadmap/06-quality-gates.md`: mỗi package ở `../roadmap/10-work-packages.md` phải có unit/integration/fixture tests và migration rollback phù hợp. Engine: retry và SRS idempotency, mastery proof, planner fairness. AI: model mock, JSON schema, quota, prompt injection, no secret in bundle. PWA: tự cập nhật không reload giữa phiên, thử origin khác, iOS/Android, backup restore. Account: offline conflict và RLS. Không báo test pass hay production hoạt động nếu chưa trực tiếp chạy/quan sát.
