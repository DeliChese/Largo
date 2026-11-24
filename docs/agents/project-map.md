# Bản đồ dự án Largo

## Tìm điểm vào

| Nếu cần sửa | Bắt đầu ở |
| --- | --- |
| Chọn cấp độ hoặc bộ thẻ tiếng Anh | `src/App.tsx`, `src/utils/studyScope.ts`, `src/types/vocab.ts` |
| Danh sách bài, tìm bộ, lọc chủ đề, cuộn từng cột | `src/components/DecksView.tsx`, `src/interface.css` |
| Quy ước cho giáo trình và ngôn ngữ mới | [Quy chuẩn học liệu](language-curriculum.md), [mẫu và checklist](language-curriculum-checklist.md) |
| Điều hướng và bố cục chung | `src/App.tsx`, `src/components/Sidebar.tsx`, `src/index.css`, `src/interface.css` |
| Phiên hằng ngày, ôn tăng cường, câu hỏi và chấm điểm | `src/utils/studyPlan.ts`, `src/components/StudyHubView.tsx`, `src/components/StudySession.tsx` |
| Lịch ôn, Bloom, nhắc nhở và đo độ nhớ | `src/utils/srsBloom.ts`, `src/utils/studyPlan.ts`, `src/components/AnalyticsView.tsx` |
| Trò chơi từ vựng và Đấu trường nối từ | `src/components/GamesView.tsx`, `src/components/WordChainGame.tsx`, `src/utils/wordChain.ts` |
| Tra từ nhanh trong phạm vi học | `src/components/WordLookup.tsx`, `src/utils/vocabSearch.ts` |
| Bộ học mặc định và nâng cấp bản lưu | `src/data/seedVocab.ts`, `src/data/englishDecks.ts`, `English/build_expansion.py` |
| Lưu tiến độ, cài đặt hoặc ảnh hồ sơ | `src/App.tsx`, `src/utils/offlineStorage.ts`, `src/utils/profileImages.ts` |
| Cài đặt, giao diện và sao lưu | `src/components/SettingsView.tsx`, `src/data/seedVocab.ts`, `src/App.tsx` |
| Đọc từ, câu ví dụ và giọng phát âm | `src/utils/soundEngine.ts`, `src/utils/speechClipCache.ts`, `server/speech.mjs` |
| Tạo ví dụ trên thẻ bằng AI | `src/components/WordExampleGenerator.tsx`, `server/exampleGenerator.mjs` |

`src/main.tsx` dựng `App`. Điều hướng dùng URL hash, ví dụ `/#/decks`, `/#/study` và `/#/analytics/history`. `src/types/vocab.ts` mô tả dữ liệu thẻ, bộ học, phiên, hồ sơ và cài đặt.

## Phạm vi học và phiên ôn

- `App.tsx` lọc bộ tiếng Anh theo cấp độ qua `getScopedDecks`, rồi lấy thẻ qua `getScopedWords`. Lọc chủ đề và tìm bộ trong `DecksView` thu hẹp phần thư viện đang hiển thị.
- `getScopedWords` đọc `VocabDeck.wordIds` và lấy mỗi ID một lần trong phạm vi. Bộ tham chiếu lấy thẻ cùng ID để dùng chung lịch ôn. Phạm vi nhiều bộ ưu tiên bộ gốc khi cả bộ gốc và bộ tham chiếu đều có mặt.
- `getDailyStudyPlan` xếp lượt ôn đến hạn trước từ mới. `App.tsx` truyền cả thư viện làm đầu vào tính hạn mức từ mới trong ngày. `applyStudyReview` xử lý riêng lượt ôn đúng lịch, luyện sớm và đặt câu.
- `studyAttempt.ts` chấm bài tại máy và tạo dữ liệu cập nhật SRS, XP và tổng hợp phiên. `mastery.ts` dựng trạng thái Bloom đã xác minh và lỗi cần luyện lại từ các lượt đã lưu.
- `adaptivePlanner.ts` chọn thẻ và dạng bài cho phiên hằng ngày khi bật dùng thử. `App.tsx` đưa phạm vi học, bằng chứng, đồng hồ và giọng đọc trên thiết bị vào bộ lập kế hoạch. `plannerMetrics.ts` so sánh đề xuất và tổng hợp các lượt đã quan sát.
- `src/data/englishDecks.ts` nạp danh mục chính và các bộ bổ sung. [Nguồn học liệu](../../public/english-sources.txt) ghi cách tái tạo dữ liệu bổ sung.

## Dữ liệu đã lưu

- `src/utils/offlineStorage.ts` lưu bản chụp `decks`, `words`, `logs`, `profile`, `settings` và `version`. App có thể đọc nhanh từ `localStorage`, sau đó chọn bản mới hơn theo `savedAt` giữa `localStorage` và IndexedDB. Dữ liệu trình duyệt thuộc về đúng origin đang dùng.
- `App.tsx` dùng `withCurrentSeed` khi đọc cả hai nguồn. `CURRENT_DATA_VERSION` trong `seedVocab.ts` là phiên bản dữ liệu học. `DB_VERSION` trong `offlineStorage.ts` là phiên bản cấu trúc IndexedDB. Hai giá trị phục vụ hai bước nâng cấp khác nhau.
- `mergeEnglishSeed` ghép dữ liệu theo ID thẻ và kiểm tra bộ đã cài để giữ các thẻ người học từng xóa. Bản lưu trước v12 có thể giữ ID cụm động từ cũ với tiến độ riêng.
- IndexedDB v4 giữ các khóa dữ liệu v3 và thêm `learning_attempts`. Bản chụp và lượt trả lời cập nhật cùng transaction. LocalStorage lưu bản chụp dự phòng.
- **Nhập JSON** ở trang bộ từ tạo thẻ trong bộ đã chọn. Ở Cài đặt, **Sao lưu toàn bộ dữ liệu (JSON)** xuất backup v2 và **Khôi phục từ bản sao lưu JSON** chấp nhận file đời cũ hoặc v2. Xem `src/utils/backup.ts` để kiểm tra định dạng và quy tắc xem trước.

## Máy chủ và âm thanh

Vite phục vụ app khi phát triển. `server/index.mjs` phục vụ `dist/` khi chạy `npm start`. Cả hai dùng `createSpeechRouter` cho `/api/speech/voices` và `/api/speech/synthesize`. Tích hợp Azure đọc `AZURE_SPEECH_KEY` và `AZURE_SPEECH_REGION` ở máy chủ. Khi chưa chọn giọng Azure hoặc tải âm thanh thất bại, `speakPronunciation` dùng giọng trình duyệt nếu có. Với giọng Azure, `speechClipCache.ts` có thể dùng lại đoạn âm thanh từ Cache Storage.

Khi chẩn đoán vấn đề đang chạy, làm theo [hướng dẫn kiểm chứng](verification.md).


## Roadmap/đích đến (chưa triển khai)

Đọc `../roadmap/README.md` và `../roadmap/10-work-packages.md`. Để phát triển engine: `../roadmap/01-learning-engine.md`, `../roadmap/02-bloom-evidence.md`, `../roadmap/03-adaptive-planner.md`. Events và migration: `../roadmap/04-events-migrations.md`. DeepSeek gateway: `../roadmap/05-deepseek-ai.md`. Release public: `../roadmap/07-hosting-pwa.md`. Auth/sync: `../roadmap/08-accounts-sync.md`. Dictionary: `../roadmap/09-dictionary.md`. Các module như `aiAssessment.ts`, serverless functions và mastery stores trong roadmap là **đề xuất**, không phải file đang tồn tại.
