# Largo

Largo là PWA học tiếng Anh bằng tiếng Việt. Thư viện có 7.000 từ và cụm từ, bộ thẻ cá nhân, ôn cách quãng và sao lưu tiến độ. Tiến độ được lưu trên trình duyệt theo địa chỉ của ứng dụng.

## Chạy trên máy

Cần Node.js 24 trở lên và npm 10 trở lên. Dùng `bun install --frozen-lockfile` để cài theo lockfile hoặc `npm install` để cài bằng npm.

```sh
npm run dev
npm run lint
npm test
npm run build
npm start
```

`npm run dev` mở Vite ở `http://localhost:3000`. `npm start` chạy bản đã build và các API. Khi cấu hình Azure Speech trong `.env`, mở ứng dụng qua `http://localhost:3000` hoặc `http://127.0.0.1:3000` để dùng giọng Azure. Các bản truy cập từ xa dùng giọng có sẵn trên thiết bị nếu trình duyệt hỗ trợ.

## Sao lưu tiến độ

Trong Cài đặt, bản sao lưu JSON v3 lưu tiến độ, nội dung cá nhân, ảnh và các lượt trả lời đã ghi. Khi khôi phục, Largo ghép các ID thẻ với học liệu tiếng Anh đi kèm ứng dụng. Để chuyển về Largo phiên bản dữ liệu 34, chọn **Kèm toàn bộ học liệu** trước khi xuất, rồi nhập bản v2 trên một hồ sơ trình duyệt riêng chạy bản cũ.

## Học liệu và giấy phép

Thư viện lọc theo cấp A1–C1, chủ đề và loại học liệu, gồm collocations, cụm động từ, cụm danh từ và cụm tính từ. Đấu trường có đấu bot, tiếp sức 60 giây và hai người dùng chung thiết bị. Xem [nguồn và cách tái tạo học liệu](public/english-sources.txt) và [phạm vi giấy phép](LICENSE).

Trên thẻ thư viện hoặc mặt đáp án flashcard, mở **Tạo lại ví dụ bằng AI** để tạo hai câu gợi ý. Cấu hình `GEMINI_API_KEY` và model tùy chọn `GEMINI_MODEL` ở máy chủ. Nếu chưa cấu hình Gemini, gateway dùng DeepSeek khi đã bật và cấu hình hợp lệ. Đặt `EXAMPLE_AI_ENABLED=false` để tắt việc tạo ví dụ.

Nếu công khai kho mã, cần xử lý riêng các commit và bản phát hành cũ chứa học liệu đã rút. Xem [ADR-018](docs/roadmap/DECISIONS.md#adr-018--thay-thế-học-liệu-cụm-động-từ-trước-khi-phát-hành).
