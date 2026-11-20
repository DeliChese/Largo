---
name: largo-learning-engine
description: Thiết kế hoặc sửa SRS, evidence theo từ, rubric Bloom, kế hoạch học cá nhân hoá và chấm trả lời trong Largo. Dùng khi phát triển engine học hoặc xử lý sai lịch ôn/Bloom.
---

# Largo Learning Engine 2.0

1. Đọc `../../../docs/roadmap/README.md`, `../../../docs/roadmap/01-learning-engine.md`, `../../../docs/roadmap/02-bloom-evidence.md`, `../../../docs/roadmap/03-adaptive-planner.md` và `../../../docs/roadmap/06-quality-gates.md`. Chỉ lấy **một** package `../../../docs/roadmap/10-work-packages.md`.
2. Khảo sát code `src/utils/srsBloom.ts`, `src/utils/studyPlan.ts`, `src/components/StudySession.tsx`, `src/App.tsx` và `src/utils/srsBloom.test.ts`. Test hành vi cũ trước; giữ test đang có.
3. Tách SRS due scheduling khỏi mastery proof: self-rating, câu chứa từ khóa, quiz có hint hoặc retry không mở Bloom 4–6. Không sửa lịch khi luyện sớm; mọi sự kiện có ID để chống double-count.
4. Dùng hàm thuần deterministic cho planner và evidence, inject clock, có fallback offline. Đặt feature flag off cho logic mới đến khi quality gate pass.
5. Nếu sửa state/migration, đọc `../largo-study-state/SKILL.md`. Nếu thêm AI, đọc `../largo-ai-gateway/SKILL.md`. Không biến AI thành quyết định cuối cùng cho XP/SRS/Bloom.
6. Chạy lint, test có liên quan, build, thử UI khi sửa giao diện; báo test thực chạy, giới hạn kiểm chứng và rollback. Không suy diễn từ điểm Bloom/retention heuristic thành độ chính xác khoa học.
