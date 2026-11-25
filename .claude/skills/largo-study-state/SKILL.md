---
name: largo-study-state
description: Sửa dữ liệu học đã lưu, migration, backup/restore, evidence ledger, phạm vi bộ thẻ và lịch ôn SRS/Bloom của Largo. Dùng khi đổi cấu trúc bộ thẻ, thêm event hoặc người dùng báo mất tiến độ.
---

# Giữ tiến độ học của Largo

1. Đọc `../../../docs/agents/project-map.md`, `../../../docs/roadmap/00-baseline.md`, `../../../docs/roadmap/04-events-migrations.md` và `../../../docs/roadmap/06-quality-gates.md`. Khảo sát `withCurrentSeed`, `getEditionDecks`, `getScopedDecks`, `getScopedWords`, `offlineStorage.ts`.
2. Bảo toàn `word.id`, `srs`, `createdAt`, `bloomLevel`, `lastSynthesisAt`, `personalRelations`, `todayWordIds`, từ/bộ cá nhân, thẻ đã cố ý xóa, logs, profile/images/settings. Khi đổi ID đã phát hành, tạo migration mapping kèm fixture. Hai giọng tiếng Anh dùng chung tiến độ.
3. Phân biệt `ENGLISH_SEED_VERSION` (học liệu), `CURRENT_DATA_VERSION` (snapshot) và `DB_VERSION` (IndexedDB). Không thay `savedAt` snapshot bằng sync conflict resolution. Khi thêm attempt events, dùng store riêng, eventId/idempotency, tránh lưu danh sách events lớn vào localStorage fallback.
4. Phát triển full backup import với validator/dry-run/roundtrip **trước** migration có rủi ro. Backup cũ từ `handleExportFullBackup` không có per-word attempts; khởi tạo evidence mới là unverified, không đoán dựa logs tổng.
5. Snapshot 35 dùng `deletedWordIds` để giữ ý định xóa. Khi thêm cấp hoặc bài, kiểm tra thẻ mới xuất hiện và thẻ đã xóa vẫn ẩn. Khi rút ID seed cần có migration cho tiến độ và override cũ.
6. Kiểm tra nâng version lặp hai lần, corruption/future version, cùng word ở hai editions, restore ảnh và mọi lịch; chạy test/lint/build, báo chứng cứ. Không chạy reset trên origin thật để thử migration.
