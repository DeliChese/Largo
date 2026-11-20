---
name: largo-release
description: Triển khai Largo PWA public, cập nhật tự động không mất dữ liệu, chuyển serverless speech/AI và phát triển tài khoản, đồng bộ đa thiết bị khi sẵn sàng.
---

# Phát hành Largo an toàn

1. Đọc `../../../docs/roadmap/07-hosting-pwa.md`, `../../../docs/roadmap/08-accounts-sync.md`, `../../../docs/roadmap/04-events-migrations.md` và `../../../docs/roadmap/06-quality-gates.md`.
2. Xác định domain/origin đang có dữ liệu; yêu cầu roundtrip backup/restore trước chuyển domain. Không xóa IndexedDB/localStorage để giải quyết SW cache.
3. `vite.config.ts` đã có PWA autoUpdate; verify cách activate và trì hoãn reload trong phiên, cả 2 tabs/iOS/Android/offline. Không coi reload khi update là bảo toàn trạng thái chưa lưu.
4. Hosting static không chạy Express Azure speech; dùng serverless adapter với secrets hoặc browser TTS fallback. Tạo staging build/test, sau đó xác minh URL HTTPS thật trên mạng khác khi máy cá nhân tắt.
5. Public AI endpoint phải có quota/rate limits/abuse guard. Không tự động triển khai auth trước Learning Engine. Với sync, dùng event IDs, tombstones, per-user auth/RLS và conflict resolution, không last-write-wins snapshot.
6. Chạy test, build và kiểm browser/production thực; báo URL và bằng chứng nếu có, không báo deploy thành công khi chưa xác minh.
