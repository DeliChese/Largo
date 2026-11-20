# Architecture Decision Log — Largo

Tài liệu này là log quyết định; hãy thêm ADR mới thay vì sửa lịch sử quyết định đã chốt khi thay đổi hướng đi.

## ADR-001 — Local-first, engine trước tài khoản

- Ngày: 2026-11-20. Trạng thái: Accepted for planning.
- Bối cảnh: Largo là PWA offline-first, không có auth/sync, dữ liệu học thuộc origin.
- Quyết định: Ưu tiên bảo toàn dữ liệu, evidence ledger, mastery/Bloom, adaptive planner, sau đó AI gateway, cuối cùng mới tài khoản/sync. Hosting public có thể thử sau gate backup.
- Hệ quả: không phụ thuộc cloud để ôn SRS; migration và account là gói riêng.
- Rollback: dùng planner hiện tại, giữ legacy Bloom read-only, tắt feature flag.

## ADR-002 — AI là assessor không là scheduler

- Ngày: 2026-11-20. Trạng thái: Accepted for planning.
- Quyết định: DeepSeek qua server adapter chỉ cho câu mở/semantic assessment; local rules cho closed tasks và lịch học. AI unreliable/timeout => uncertain, không thay SRS/Bloom, không block học.
- Hệ quả: cần rubric versioned, quota, consent, golden set và kill switch.
- Rollback: disable remote AI, dùng local feedback.

## ADR-003 — Evidence trước verified Bloom

- Ngày: 2026-11-20. Trạng thái: Accepted for planning.
- Quyết định: tách `verifiedBloomLevel` khỏi `VocabWord.bloomLevel` legacy; self-reported memory và regex-keyword không đủ L4–6; không hồi tố gán verified từ session summary.
- Hệ quả: UI cần ghi nhãn rõ, thiết kế migration additive và replay.
- Rollback: hiển thị legacy progress với nhãn “chưa xác minh”, không xóa data.

## ADR-004 — Public PWA ≠ đồng bộ tài khoản

- Ngày: 2026-11-20. Trạng thái: Accepted for planning.
- Quyết định: hosting static và serverless API; giữ stable origin và backup/restore; auth/sync là giai đoạn sau. Không dùng last-write-wins trên whole snapshot để merge hai thiết bị.
- Hệ quả: nhà cung cấp hosting/auth có thể thay; cần tombstones và event IDs.
- Rollback: hoạt động guest offline độc lập.

## Template ADR mới

- ID/ngày/status:
- Bối cảnh:
- Các lựa chọn và rủi ro:
- Quyết định:
- Tác động đến dữ liệu cũ và hợp đồng API:
- Test/metrics:
- Rollback:
- Link PR/commit:
