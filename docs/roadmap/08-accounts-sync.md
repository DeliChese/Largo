# 08 — Tài khoản và đồng bộ sau khi engine ổn định

## Đừng nhầm ba sản phẩm

1. **Website công khai**: người khác truy cập ở mọi mạng (`07-hosting-pwa.md`).
2. **PWA offline**: tải một lần, học không mạng với IndexedDB trên thiết bị.
3. **Tài khoản + sync**: học cùng dữ liệu ở điện thoại và laptop; cần auth, backend, conflict resolution, privacy. Chỉ bắt đầu R2 sau gate E0–E2.

## Chọn nhà cung cấp khi bắt đầu R2

Có thể dùng managed auth + Postgres/RLS (ví dụ Supabase) hoặc Cloudflare stack + identity provider. Không chốt vendor trong source trước khi kiểm pricing, privacy, restore và conflict behavior. Giữ adapter `AuthProvider` / `SyncTransport`; không buộc thay engine vì đổi dịch vụ.

## Dữ liệu cần sync

Canonical word progress/SRS, attempts append-only, mastery projection version, custom decks/words, tombstones, profile/settings, ảnh theo consent. **Không sync toàn bộ seed catalogue**; nguồn seed versioned local, chỉ sync preference/overrides và tiến độ. Ai không đăng nhập vẫn học offline đầy đủ.

## Identity & privacy

- Guest là mặc định; đăng nhập/link account chỉ khi user chọn.
- Xác thực bằng provider phù hợp, token session lưu an toàn; không tự gửi tất cả backup lên cloud.
- Server authz theo user ID; row-level security hoặc chính sách tương đương, kiểm thử chéo user và revocation; không lấy `userId` do client tự khai làm bằng chứng sở hữu.
- Có export portable, account deletion, logout an toàn; logout **không** âm thầm xóa học liệu local.
- Rà soát chính sách quyền riêng tư, thông báo AI third-party, giữ và xóa dữ liệu, yêu cầu người dùng trẻ tuổi nếu mở rộng đối tượng.

## Conflict resolution không được last-write-wins snapshot

- Attempts append-only, dedup bằng `eventId`, server idempotent.
- SRS là projection có version từ attempts; khi có offline concurrent reviews ở hai máy, cần replay theo thứ tự logic hoặc reconcile có audit. Nếu lịch sử legacy thiếu event, giữ bản cũ và đưa ra conflict resolver rõ; không chọn “savedAt mới hơn” để đè toàn bộ.
- Custom edits có revision/operationId, merge theo field khi an toàn; xóa thẻ sử dụng **tombstone** (không để seed hồi sinh).
- Clock skew/server timestamp, mất kết nối, duplicate/reorder, simultaneous devices, logout giữa sync, partial upload, permission revoked phải có tests.
- Khi sync fail: local write tiếp tục, queue retry bounded, hiển thị unsynced count, không báo “đã đồng bộ” nếu chưa ack.

## Migration guest→account

Preview dữ liệu sẽ upload; tạo backup; chọn merge/replace có xác nhận; chạy dry-run và kiểm đếm; commit server theo batch idempotent; lưu marker upload. Test import on second device và việc account rỗng không ghi đè guest state.

## Gate

2 thiết bị khác mạng, offline concurrent reviews, đổi account, hủy đồng bộ, restore, deleted cards, privacy boundaries đều pass. Không báo đồng bộ hoàn tất chỉ vì login thành công.
