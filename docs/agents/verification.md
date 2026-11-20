# Chạy và kiểm chứng Largo

## Lệnh trong repo

Chạy từ thư mục gốc. Repo dùng `bun.lock` để ghim phụ thuộc. Nếu cần cài lại từ lockfile, dùng `bun install --frozen-lockfile` ở môi trường có Bun. Các lệnh kiểm kiểu, kiểm thử và build đã được xác minh với Node `25.8.0` và npm `11.11.0`.

```text
npm run dev
npm run lint
node --import ./.chinese-work/register.mjs --test --test-isolation=none src/utils/studyScope.test.ts src/utils/srsBloom.test.ts server/speech.test.mjs
npm run build
```

`npm run dev` chạy Vite, mặc định cổng `3000`. Dùng URL Vite thực sự in ra. `npm run lint` kiểm kiểu TypeScript. Lệnh `node --test` dùng bộ phân giải import trong `.chinese-work/register.mjs` cho các test TypeScript. `server/speech.test.mjs` dùng Azure giả lập. Sau khi build, `npm run preview` xem bản Vite đã build hoặc `npm start` chạy Express phục vụ `dist/` và API phát âm.

## Lỗi web app chưa hiện tính năng

1. Xác định URL người dùng đang xem, gồm hostname, cổng và route. Với bản chạy trên máy, ưu tiên đúng origin người dùng đang dùng để kiểm tra dữ liệu cũ. `localhost` và `127.0.0.1` có kho dữ liệu trình duyệt riêng.
2. Xác nhận máy chủ đang phục vụ mã nào. Với Vite dev, kiểm tra module nguồn liên quan đã tải. Với Express hoặc preview, kiểm tra `dist/` và asset mà HTML tham chiếu. Kiểm tra `DISABLE_HMR` nếu việc tải lại thay đổi có liên quan. `vite-plugin-pwa` quản lý service worker và cache riêng.
3. Nếu giao diện mới đã hiện nhưng dữ liệu trống, xem phạm vi ngôn ngữ, phiên bản HSK, cấp độ, bộ lọc và bản chụp đã lưu trước. Lỗi từng gặp là bản chụp có số `version` hiện tại nhưng thiếu các bộ giáo trình. Kiểm tra cả cấu trúc bộ và ID thẻ. Giữ tiến độ của người dùng tại origin này và dùng bản chụp mẫu cho các thử nghiệm cần làm sạch dữ liệu.
4. Xác minh lại trên route vừa lỗi. Với `/#/decks`, chọn Tiếng Trung và lần lượt hai HSK, kiểm tra bài đầu/cuối, tìm bộ, đổi chủ đề và mở một bài. Trên màn hình đủ rộng, cuộn hai danh sách riêng và quan sát thanh lọc bên trái. Khi sửa migration, tải lại với dữ liệu cũ và xác nhận thẻ đã ôn giữ lịch/Bloom.

Kết quả HTTP chứng minh máy chủ đã trả nội dung. Kết quả kiểm thử chứng minh các trường hợp được chạy. Để báo một thao tác đã hoạt động trên web app, ghi URL và hành vi thực tế quan sát được. Khi được giao triển khai, xác định nền tảng và xác minh phiên bản tại URL triển khai trước khi báo hoàn tất.


## Gates cho roadmap mới (chưa có code mới)

Theo `../roadmap/06-quality-gates.md`: mỗi package ở `../roadmap/10-work-packages.md` phải có unit/integration/fixture tests và migration rollback phù hợp. Engine: retry và SRS idempotency, mastery proof, planner fairness. AI: model mock, JSON schema, quota, prompt injection, no secret in bundle. PWA: tự cập nhật không reload giữa phiên, thử origin khác, iOS/Android, backup restore. Account: offline conflict và RLS. Không báo test pass hay production hoạt động nếu chưa trực tiếp chạy/quan sát.
