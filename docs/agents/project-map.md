# Bản đồ dự án Largo

## Tìm điểm vào

| Nếu cần sửa | Bắt đầu ở |
| --- | --- |
| Chọn ngôn ngữ, phiên bản HSK, cấp độ hoặc bộ thẻ | `src/App.tsx`, `src/utils/studyScope.ts`, `src/types/vocab.ts` |
| Danh sách bài, tìm bộ, lọc chủ đề, cuộn từng cột | `src/components/DecksView.tsx`, `src/interface.css` |
| Điều hướng và bố cục chung | `src/App.tsx`, `src/components/Sidebar.tsx`, `src/index.css`, `src/interface.css` |
| Phiên hằng ngày, ôn tăng cường, câu hỏi và chấm điểm | `src/utils/studyPlan.ts`, `src/components/StudyHubView.tsx`, `src/components/StudySession.tsx` |
| Lịch ôn, Bloom, nhắc nhở và đo độ nhớ | `src/utils/srsBloom.ts`, `src/utils/studyPlan.ts`, `src/components/AnalyticsView.tsx` |
| Trò chơi từ vựng và kết quả | `src/components/GamesView.tsx`, `handleSaveGameResult` trong `src/App.tsx` |
| Tra từ nhanh trong phạm vi học, từ điển Trung–Việt | `src/components/WordLookup.tsx`, `src/utils/vocabSearch.ts`, `src/utils/chineseDict.ts` |
| Bộ học mặc định, thay đổi giáo trình hoặc nhập dữ liệu cũ | `src/data/seedVocab.ts`, `src/data/englishDecks.ts`, `Chinese/chineseDecks.ts`, `src/data/seedMigration.ts` |
| Lưu tiến độ, cài đặt hoặc ảnh hồ sơ | `src/App.tsx`, `src/utils/offlineStorage.ts`, `src/utils/profileImages.ts` |
| Cài đặt, giao diện và sao lưu | `src/components/SettingsView.tsx`, `src/data/seedVocab.ts`, `src/App.tsx` |
| Đọc từ, câu ví dụ và giọng phát âm | `src/utils/soundEngine.ts`, `src/utils/speechClipCache.ts`, `server/speech.mjs` |

`src/main.tsx` dựng `App`. Điều hướng dùng URL hash, ví dụ `/#/decks`, `/#/study` và `/#/analytics/history`. `src/types/vocab.ts` mô tả dữ liệu thẻ, bộ học, phiên, hồ sơ và cài đặt.

## Phạm vi học và phiên ôn

- `App.tsx` lấy bộ theo ngôn ngữ và phiên bản qua `getEditionDecks`, lọc cấp độ qua `getScopedDecks`, rồi lấy thẻ qua `getScopedWords`. Bộ Trung cá nhân có mặt trong cả hai phiên bản. Lọc chủ đề và tìm bộ trong `DecksView` thu hẹp phần thư viện đang hiển thị.
- `getScopedWords` đọc `VocabDeck.wordIds` theo thứ tự bài, lấy mỗi ID một lần trong phạm vi và đặt `deckId` trên bản dùng cho giao diện. Việc đổi bài hoặc đổi HSK vẫn giữ `VocabWord.id` để lịch ôn và bằng chứng cập nhật đúng thẻ đã lưu. Khi dùng lại một từ ở nhiều bài trong cùng phiên bản, kiểm tra cả danh sách tổng và từng bài.
- `getDailyStudyPlan` xếp lượt ôn đến hạn trước từ mới. `App.tsx` truyền cả thư viện làm đầu vào tính hạn mức từ mới trong ngày, nên đổi ngôn ngữ hay phiên bản HSK vẫn dùng chung hạn mức. `applyStudyReview` xử lý riêng lượt ôn đúng lịch, luyện sớm và đặt câu.
- `studyAttempt.ts` chấm bài tại máy và tạo dữ liệu cập nhật SRS, XP và tổng hợp phiên. `mastery.ts` dựng trạng thái Bloom đã xác minh và lỗi cần luyện lại từ các lượt đã lưu.
- Thẻ tiếng Anh được tạo trong `src/data/englishDecks.ts`. Từ điển tiếng Trung lấy từ danh mục `CHINESE_WORDS`, gồm cả những từ chưa nằm trong lộ trình HSK đang mở. Xem [nguồn và cấu trúc giáo trình](chinese-curriculum.md) khi thay đổi bộ Trung.

## Dữ liệu đã lưu

- `src/utils/offlineStorage.ts` lưu bản chụp `decks`, `words`, `logs`, `profile`, `settings` và `version`. App có thể đọc nhanh từ `localStorage`, sau đó chọn bản mới hơn theo `savedAt` giữa `localStorage` và IndexedDB. Dữ liệu trình duyệt thuộc về đúng origin đang dùng.
- `App.tsx` dùng `withCurrentSeed` khi đọc cả hai nguồn. `CURRENT_DATA_VERSION` trong `seedVocab.ts` là phiên bản dữ liệu học. `DB_VERSION` trong `offlineStorage.ts` là phiên bản cấu trúc IndexedDB. Hai giá trị phục vụ hai bước nâng cấp khác nhau.
- `mergeChineseSeed` ghép dữ liệu theo ID thẻ và dùng `seedMigration.ts` cho ID đời cũ. `hasCurrentChineseDecks` kiểm tra danh mục bài theo `id`, cấp, phiên bản HSK và thứ tự `wordIds`. Phần lưu cũng kiểm tra cấu trúc bộ trước khi ghi bản chụp hiện tại.
- IndexedDB v4 giữ các khóa dữ liệu v3 và thêm `learning_attempts`. Bản chụp và lượt trả lời cập nhật cùng transaction. LocalStorage lưu bản chụp dự phòng.
- **Nhập JSON** ở trang bộ từ tạo thẻ trong bộ đã chọn. Ở Cài đặt, **Sao lưu toàn bộ dữ liệu (JSON)** xuất backup v2 và **Khôi phục từ bản sao lưu JSON** chấp nhận file đời cũ hoặc v2. Xem `src/utils/backup.ts` để kiểm tra định dạng và quy tắc xem trước.

## Máy chủ và âm thanh

Vite phục vụ app khi phát triển. `server/index.mjs` phục vụ `dist/` khi chạy `npm start`. Cả hai dùng `createSpeechRouter` cho `/api/speech/voices` và `/api/speech/synthesize`. Tích hợp Azure đọc `AZURE_SPEECH_KEY` và `AZURE_SPEECH_REGION` ở máy chủ. Khi chưa chọn giọng Azure hoặc tải âm thanh thất bại, `speakPronunciation` dùng giọng trình duyệt nếu có. Với giọng Azure, `speechClipCache.ts` có thể dùng lại đoạn âm thanh từ Cache Storage.

Khi chẩn đoán vấn đề đang chạy, làm theo [hướng dẫn kiểm chứng](verification.md).


## Roadmap/đích đến (chưa triển khai)

Đọc `../roadmap/README.md` và `../roadmap/10-work-packages.md`. Để phát triển engine: `../roadmap/01-learning-engine.md`, `../roadmap/02-bloom-evidence.md`, `../roadmap/03-adaptive-planner.md`. Events và migration: `../roadmap/04-events-migrations.md`. DeepSeek gateway: `../roadmap/05-deepseek-ai.md`. Release public: `../roadmap/07-hosting-pwa.md`. Auth/sync: `../roadmap/08-accounts-sync.md`. Dictionary: `../roadmap/09-dictionary.md`. Các module như `aiAssessment.ts`, serverless functions và mastery stores trong roadmap là **đề xuất**, không phải file đang tồn tại.
