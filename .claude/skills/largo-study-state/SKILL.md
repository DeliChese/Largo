---
name: largo-study-state
description: Sửa dữ liệu học đã lưu, migration, backup/restore, evidence ledger, phạm vi bộ thẻ và lịch ôn SRS/Bloom của Largo. Dùng khi đổi cấu trúc bộ thẻ, thêm event hoặc người dùng báo mất tiến độ.
---

# Giữ tiến độ học của Largo

1. Đọc `../../../docs/agents/project-map.md`, `../../../docs/roadmap/00-baseline.md`, `../../../docs/roadmap/04-events-migrations.md` và `../../../docs/roadmap/06-quality-gates.md`. Khảo sát `withCurrentSeed`, `getEditionDecks`, `getScopedDecks`, `getScopedWords`, `offlineStorage.ts`.
2. Bảo toàn `word.id`, `srs`, `createdAt`, `bloomLevel`, `lastSynthesisAt`, `personalRelations`, `todayWordIds`, từ/bộ cá nhân, thẻ đã cố ý xóa, logs, profile/images/settings. Khi đổi ID đã phát hành, tạo migration mapping kèm fixture. HSK editions chia sẻ trạng thái.
3. Phân biệt `CURRENT_DATA_VERSION` (seed) và `DB_VERSION` (IndexedDB). Không thay `savedAt` snapshot bằng sync conflict resolution. Khi thêm attempt events, dùng store riêng, eventId/idempotency, tránh lưu danh sách events lớn vào localStorage fallback.
4. Phát triển full backup import với validator/dry-run/roundtrip **trước** migration có rủi ro. Backup cũ từ `handleExportFullBackup` không có per-word attempts; khởi tạo evidence mới là unverified, không đoán dựa logs tổng.
5. `mergeChineseSeed` coi thẻ vắng mặt là user deletion trong nhiều trường hợp; khi thêm cấp/bài, bảo vệ cả thẻ mới phải xuất hiện lẫn thẻ cũ đã xóa không bị hồi sinh. `withCurrentSeed` có thể bỏ qua metadata nếu version/structure không đổi: viết test tương ứng.
6. Kiểm tra nâng version lặp hai lần, corruption/future version, cùng word ở hai editions, restore ảnh và mọi lịch; chạy test/lint/build, báo chứng cứ. Không chạy reset trên origin thật để thử migration.
