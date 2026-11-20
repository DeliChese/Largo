# 07 — Phát hành PWA hoạt động khi máy chủ cá nhân tắt

## Mục tiêu

Người dùng khác mạng mở được Largo mà máy tác giả tắt; developer push main rồi build/deploy tự động; PWA cập nhật code khi mở/kết nối mạng, không bắt gỡ/cài lại; tiến độ cục bộ không bị xóa. **Không đồng nghĩa** tài khoản/remote sync (xem `08-accounts-sync.md`).

## Hosting tối giản đề xuất

Cloudflare Pages build Vite static: build `npm run build`, output `dist`, production branch main. Repo private có thể liên kết GitHub nếu quyền connector đáp ứng. Dùng HTTPS + domain ổn định (định origin cuối cùng ngay trước khi mời người dùng).

Express `server/index.mjs` không chạy trên Pages static. API speech `/api/speech/voices` và `/synthesize` cần Cloudflare Functions/Workers (hoặc backend public riêng); browser TTS fallback hiện đã tồn tại. DeepSeek gateway cũng phải chạy server-side, có secrets/quota. Kiểm tra tương thích runtime Cloudflare (không copy nguyên Express/node sang Worker).

## Thứ tự triển khai R1

1. E0 backup/restore hoàn thành. Xuất backup tại origin **đang chứa tiến độ** (localhost, IP cũ, domain cũ) trước khi chuyển.
2. Tạo build production clean; xác minh base URL root, hash routing, asset URLs, manifest icons, SW assets và fallback voice.
3. Tạo Pages project liên kết GitHub một lần; cấu hình secret ở Pages Functions/Workers, không thêm vào git.
4. Giữ một domain production ổn định. Origin khác nhau có IndexedDB khác nhau; cần import backup thủ công hoặc migration bridge được người dùng chấp nhận.
5. CI build/test trên commit; GitHub push có thể auto deploy nhưng không tự tuyên bố thành công khi chưa kiểm tại URL production.
6. Thử trên máy khác/mạng khác và khi máy tác giả tắt; đảm bảo mở link và cài PWA.
7. Kiểm tra rollback phiên bản client khi DB schema mới đã chạy; không downgrade bằng overwrite local state.

## Chiến lược PWA update

Baseline có `registerType: 'autoUpdate'`; tính năng này có thể reload khi service worker cập nhật và khiến phiên đang làm gián đoạn. Trước khi public:
- Thiết kế `updateReady`/`sessionInProgress` signal từ App/StudySession; cache code mới, chỉ activate/reload an toàn **sau khi trạng thái answer/session đã được commit** hoặc khi người dùng chọn cập nhật.
- Dùng mô hình update prompt/activate có kiểm soát nếu autoUpdate không đáp ứng. Kiểm tra đúng hành vi runtime/plugin version, không tin mỗi config.
- Không xóa IndexedDB hoặc localStorage trong SW activate; assets cache và dữ liệu học phải cách ly.
- Test: mở v1 đang học → release v2 → vào lại tab → phiên không mất; hoàn thành phiên → nhận v2, dữ liệu tiến độ giữ; 2 tabs; offline giữa update; iOS home screen vs Chrome/Android.
- Khi migration xảy ra sau update, bắt buộc rollback-safe/backup trước ghi; trạng thái chưa commit không được báo đã lưu.

## Bảo mật, chi phí, giám sát

- Endpoint AI/speech có budget/quota, giới hạn CORS, rate limits, abuse protection, logs tối thiểu, và health check.
- Cloudflare free tier/giá/quota có thể thay đổi: xác minh tài liệu chính thức vào lúc triển khai, không cam kết miễn phí vô hạn.
- Mở rộng API khi traffic thật sự có; không triển khai nhiều app/server cho cùng một chức năng nếu không cần.
- Nếu không có auth, bất kỳ ai có URL có thể tải web; vì vậy **không mở public AI API không hạn mức**.

## Gate

Có URL HTTPS, một người ngoài mạng truy cập được khi máy cá nhân tắt, PWA update sau phát hành, backup tại origin cũ→restore ở origin mới và regression offline/voice. Chưa có các bằng chứng này thì R1 vẫn là kế hoạch.
