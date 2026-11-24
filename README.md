# Largo

Largo là PWA học tiếng Anh và tiếng Trung bằng tiếng Việt. Ứng dụng có từ vựng CEFR-J, hai phiên bản HSK, thẻ cá nhân, ôn cách quãng và bản sao lưu tiến độ. Tiến độ được lưu trên trình duyệt theo địa chỉ của ứng dụng.

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

## Học liệu và giấy phép

Bộ Cụm động từ hiện có 33 nghĩa do Largo biên soạn, mỗi nghĩa có hai ví dụ Anh–Việt. Bộ từ PDF và hai PDF HSK cũ đã được rút khỏi các tệp phát hành hiện tại. Bản lưu cá nhân cũ có thể chứa học liệu từ các phiên bản trước. Xem [nguồn tiếng Anh](public/english-sources.txt), [nguồn HSK](docs/agents/chinese-curriculum.md) và [phạm vi giấy phép](LICENSE).

Nếu công khai kho mã, cần xử lý riêng các commit và bản phát hành cũ chứa học liệu đã rút. Xem [ADR-018](docs/roadmap/DECISIONS.md#adr-018--thay-thế-học-liệu-cụm-động-từ-trước-khi-phát-hành).
