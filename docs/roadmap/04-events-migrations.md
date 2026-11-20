# 04 — Evidence Ledger, persistence, backup và migration

## Quyết định dữ liệu

Giữ `VocabWord` hiện hành làm **điểm tương thích**; không thêm một mảng events lớn vào từng word hoặc bản localStorage snapshot. Thêm IndexedDB object store riêng theo phiên bản schema, có index `wordId`, `startedAt` và `sessionId`. Không đổi DB_VERSION nếu chưa có migration test. Dữ liệu được lưu **local-first**; remote sync (sau này) chỉ nhận các record hợp lệ.

## Hợp đồng sự kiện v1 (đề xuất)

`LearningAttemptEvent` có:
- `eventId` UUID độc nhất, `schemaVersion=1`, `createdAt` UTC epoch ms, `sessionId`, `wordId` canonical, `language`, `hskEdition?`, `taskType`, `promptVersion`, `rubricVersion`;
- `startedAt`, `answeredAt`, `responseMs` giới hạn hợp lý, `attemptIndex`, `isRetry`, `scheduledAtStart`, `source=guided|manual|intensive|game`;
- `outcome=correct|incorrect|partial|uncertain|unavailable`, `quality?` 1–4, `hintCount`, `revealedAnswer`, `assessmentSource=local|ai|human|self`;
- `skillTags[]`, `criteria` tách rubric, `feedbackCode?`, `taskDifficulty?`, `assessmentVersion?`;
- `rawAnswer`: **KHÔNG LƯU MẶC ĐỊNH**; nếu cần review AI, xin đồng ý cục bộ và giữ thời hạn ngắn. Không lưu bí mật, key, PII vào events.

Dữ liệu ở đây là **spec**, không khẳng định interface đã có trong `src/types/vocab.ts`.

## Idempotency & transactional boundaries

- Tạo `eventId` một lần lúc bắt đầu chấm, không tạo lại khi render/retry mạng.
- IndexedDB commit event theo key unique; nếu key đã tồn tại, xử lý no-op hoặc compare exact payload; không cộng XP/SRS lần hai.
- Với state phân tán giữa React/IndexedDB/backup, thiết kế "commit then project": ghi event và sync projection/snapshot an toàn, có cơ chế replay sau crash; không tuyên bố atomicity giữa localStorage và IndexedDB.
- `sessionId` + `attemptIndex` xác định thứ tự; timestamp thiết bị có thể sai, không dùng làm ID.
- Các bản event mở rộng phải có `schemaVersion`; decoder bỏ field lạ an toàn; record version tương lai không được bị ghi đè.
- Có retention/quota policy: compact aggregates khi cần **sau** export/backup; giữ dữ liệu tối thiểu cần backtest SRS, consent/restore.

## Migration chiến lược nhiều bước

1. Bổ sung chức năng **import full backup JSON** và validator trước khi thay state. Không nhầm với import từ vào deck. Xuất đủ logs, images, trạng thái người dùng, sau này gồm events/mastery.
2. Kiểm thử roundtrip, các fixture `00-baseline.md`; có dry-run hiển thị thống kê và lựa chọn thay thế/merge minh bạch; mặc định không xóa state trước khi xác minh backup.
3. Nâng cấp IndexedDB `DB_VERSION` khi thêm store; dùng `onupgradeneeded`, kiểm tra tương thích; tránh schema changes không rollback được.
4. Mastery projection mới bắt đầu **unverified**, không suy đoán evidence quá khứ từ tổng `StudySessionLog`. Giữ legacy Bloom tách biệt trong UI.
5. Khi thay seed data tăng `CURRENT_DATA_VERSION` nếu cần, kiểm tra `withCurrentSeed` + `mergeChineseSeed` + `mergeEnglishSeed` và ý định xóa thẻ cũ.
6. Có `migrationId`, snapshot tests `migrate(migrate(s)) = migrate(s)` và trường hợp lỗi nửa chừng. Tránh tự clear IndexedDB khi nâng cấp thất bại.

## Hợp đồng backup v2 (đề xuất)

`{ format: "largo-backup", formatVersion: 2, exportedAt, appDataVersion, idbSchemaVersion, snapshot: { decks, words, logs, profile, settings, images }, attempts: [...], mastery: optional }`.

- Hỗ trợ import backup cũ của `handleExportFullBackup` (không có `format`), tạo event list rỗng.
- Validations: type, kích thước, length, duplicate ID, reference integrity, malicious input, archived future versions.
- Mastery là projection có thể rebuild từ events; không tin vào giá trị không tương ứng rubricVersion.
- Bảo mật: backup có dữ liệu học cá nhân và ảnh; cảnh báo trước khi chia sẻ/đưa lên server.

## Sync-ready từ giai đoạn engine (nhưng chưa triển khai tài khoản)

- Từ được xóa phải có tombstone rõ với ID + deletedAt + actor/revision trước khi remote sync; không chỉ hiểu “không có trong danh sách”.
- Mỗi thay đổi có `deviceId` và `operationId` nếu cần sync sau này; không phụ thuộc clock để quyết định ghi đè.
- Dedup append-only attempt bằng eventId; SRS/projections phải xử lý thứ tự/merge, không lấy `savedAt` lớn nhất rồi đè toàn bộ.
- Không đưa auth/sync vào cùng PR đầu tiên của event store; xem `08-accounts-sync.md`.

## Test gate

Backup v1→v2, restore v2, idempotent import, migration lặp, corrupted record fallback, giao nhau HSK, thẻ bị xóa, đa ngôn ngữ, thay đổi origin thủ công, ảnh, settings, event replay/duplicate. Không có test qua fixtures thì không bật tính năng mới.
