---
name: largo-verify
description: Kiểm chứng thay đổi Largo qua test, build, trình duyệt, dữ liệu cũ, PWA updates hoặc đánh giá chất lượng/chi phí AI. Dùng khi sửa engine, AI, deploy hoặc xử lý lỗi bản cũ.
---

# Kiểm chứng Largo

1. Đọc `../../../docs/agents/verification.md` và `../../../docs/roadmap/06-quality-gates.md`; xác định package, rủi ro, lệnh và gate tương ứng.
2. Với lỗi UI, xác định URL/route và origin thực. Với dữ liệu trống/khác sau update, đọc `../largo-study-state/SKILL.md`, test fixture legacy trước khi nghĩ đến reset.
3. Với engine: deterministic test scheduled vs early, retry idempotency, Bloom proof, HSK shared IDs, adaptive fairness, offline fallback. Với AI: mock/test schema, key non-leak, prompt injection, false-pass, token budget, timeout. Với PWA: update giữa phiên, 2 tabs, offline, restore origin.
4. Kiểm tra mã nguồn vs build `dist/`; thông báo kết quả chỉ khi thực chạy. Có thể không có browser/test runtime: ghi rõ giới hạn thay vì tuyên bố pass.
5. Báo chính xác lệnh, kết quả, URL, UI thao tác đã quan sát, migration & rollback, phần chưa verify; không đồng nhất HTTP 200 với tính năng đã hoạt động.
