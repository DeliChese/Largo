# 00 — Baseline và ranh giới không được phá vỡ

## Hiện trạng được quan sát trong mã (20/11/2026)

- React + TypeScript + Vite, `vite-plugin-pwa`; backend Express chỉ phục vụ `dist/` và `/api/speech`.
- `src/utils/srsBloom.ts`: `calculateNextSRS` là biến thể SM-2 với 4 mức (1–4), 4 `SRSMode`; `calculateRetentionProbability` là công thức heuristic, **không** phải dự báo đã được hiệu chuẩn bằng dữ liệu người học.
- `src/utils/studyPlan.ts`: `getDailyStudyPlan` xếp từ đến hạn trước từ mới, phiên tối đa 12 thẻ; luyện tự chọn 15; intensive 8. `applyStudyReview` giữ lịch khi luyện sớm (trừ cơ chế synthesis riêng).
- `src/components/StudySession.tsx`: các câu trả lời được ghi qua `onRecordReview`, session logs là tổng hợp; lượt retry không tính lại như lần đầu.
- `evaluateSynthesisSentence` hiện chỉ kiểm tra độ dài, có từ khóa và tham chiếu cụm; **không kiểm chứng ngữ pháp/ý nghĩa/tự nhiên**. `applyStudyReview` có đường tăng Bloom bằng synthesis không đổi SRS. Đây là lỗ hổng học thuật ưu tiên.
- `src/types/vocab.ts`: `VocabWord.srs` và `bloomLevel` nằm trong thẻ; `StudySessionLog` chưa lưu sự kiện theo từng attempt.
- `src/utils/offlineStorage.ts`: IndexedDB `lexisbloom_offline_db` (DB_VERSION=3), localStorage fallback, `savedAt`; `src/data/seedVocab.ts` CURRENT_DATA_VERSION=8 và `withCurrentSeed` để nâng cấp.
- `src/App.tsx` xuất full backup JSON nhưng `SettingsView.tsx` **chưa có luồng nhập full backup**. Chức năng nhập JSON trong `DecksView.tsx` chỉ nhập từ vào deck, không khôi phục tiến độ.
- Hai HSK edition chia sẻ định danh từ qua `wordIds`; phải bảo toàn mapping, không nhân đôi lịch ôn vì đổi giáo trình.
- PWA `registerType: 'autoUpdate'` đã bật; chưa có gate đảm bảo không reload giữa phiên học. Dữ liệu thuộc **origin**, không tự chuyển sang domain mới.
- Không có auth, remote sync hay DeepSeek gateway ở baseline. Không mô tả đặc tả dưới đây là đã tồn tại.

## Bất biến trước/sau mọi migration

1. ID từ đã phát hành không được đổi chỉ vì đổi giáo trình hoặc loại bài; giữ `id` canonical.
2. Bảo toàn nguyên trạng: `srs`, `createdAt`, `bloomLevel`, `lastSynthesisAt`, `personalRelations`, `todayWordIds`, lịch sử `logs`, profile/settings, bộ/thẻ cá nhân, ảnh profile.
3. Thẻ mặc định người dùng cố ý xóa không được tự hồi sinh; khi thiết kế sync cần tombstone rõ ràng (baseline suy luận qua thẻ vắng mặt).
4. Thêm định dạng mastery mới là **additive migration**; không suy ra dữ liệu Bloom bằng cách tăng điểm dựa trên lịch SRS cũ.
5. Nếu đọc state mới hơn version code hiện tại: không ghi lùi phiên bản hoặc ghi đè dữ liệu; đưa vào chế độ đọc an toàn/backup.
6. Không lấy token API từ client; không log nguyên văn câu riêng tư hoặc secret mặc định.
7. Cập nhật phiên mới không được xóa IndexedDB, localStorage hoặc Cache Storage dữ liệu học tuỳ tiện.

## Khảo sát bắt buộc trước PR đầu tiên

- Kiểm tra `git status --short`, phiên bản main, file `.env.example`, phạm vi API.
- Chạy kiểm thử `src/utils/srsBloom.test.ts` + `src/utils/studyScope.test.ts`, kiểm kiểu và build như `../agents/verification.md`.
- Tạo fixture (ẩn danh) cho: mới cài, học HSK 2.0, học HSK 3.0, đổi English en-GB/en-US, cá nhân hóa, thẻ bị xóa, có avatar, có nhiều logs, localStorage gzip fallback, bản snapshot mang version hiện tại nhưng thiếu deck.
- Snapshot/restore fixture ở origin test riêng. Không chạy thao tác xóa trên origin thật.

## Rủi ro kỹ thuật cần giải trước khi phát hành

- `saveOfflineState` hiện ghi snapshot lớn khi state thay đổi; event history mới nên lưu ở IndexedDB store riêng, có phân trang, không nối toàn bộ events vào localStorage fallback.
- Cập nhật metadata seed có thể bị bỏ qua khi `withCurrentSeed` thấy version/structure đã khớp; xác minh cả nghĩa/câu ví dụ mới ở user cũ.
- Đừng thay `SM-2` sang `FSRS` bằng tính lại ngày ôn hàng loạt: cần event history và comparison data.
- Biểu đồ độ nhớ/Bloom có thể tạo cảm giác độ chính xác giả; phải gắn nhãn “ước tính” cho heuristic và mức bằng chứng.
- Không lấy sự kiện luyện sớm hay chơi game làm bằng chứng SRS mạnh tương đương ôn đến hạn.

## Exit gate E0

Backup/restore round-trip được kiểm tra với các fixture; chưa có migration âm thầm xóa dữ liệu; test tái hiện được lỗi đặt câu và giới hạn Bloom hiện tại. Chỉ khi đó mới sửa thuật toán.
