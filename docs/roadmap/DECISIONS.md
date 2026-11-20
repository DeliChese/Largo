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

## ADR-005 — Snapshot mẫu tái lập cho E0-01

- Ngày: 2026-11-20. Trạng thái: Accepted.
- Quyết định: Dùng snapshot tạo từ danh mục có sẵn với mốc thời gian cố định và hồ sơ giả lập. Fixture giữ cùng ID giữa hai bản HSK và hai cách viết Anh–Anh/Anh–Mỹ. Thẻ xóa được mô hình hóa bằng việc vắng mặt trong danh sách thẻ đã lưu.
- Kiểm thử: `npm test` dùng chung cho local và CI. Fixture backup đời cũ dùng làm đầu vào cho kiểm thử nhập ở E0-02.
- Rollback: Hoàn tác fixture, test và cấu hình CI. Schema và dữ liệu runtime giữ nguyên.

## ADR-006 — Khôi phục theo ảnh chụp

- Ngày: 2026-11-20. Gói E0-02.
- Kiểm tra backup đời cũ và v2 trước khi ghi. Sau khi người học xác nhận thay thế, lưu dữ liệu học và ảnh trong một transaction. Dùng bản chụp đầy đủ để giữ nguyên trạng thái thẻ đã xóa. Gộp tiến độ giữa các bản chụp phụ thuộc vào chính sách tombstone ở R2.

## ADR-007 — Ledger và tiến độ trong cùng transaction

- Ngày: 2026-11-20. Gói E0-03.
- IndexedDB v4 thêm store `learning_attempts` với khóa sự kiện và khóa duy nhất theo phiên/thứ tự. Giữ store, khóa và dữ liệu ảnh v3. Mỗi lần ghi hợp lệ cập nhật ledger và snapshot trong cùng transaction. Khi đầy đủ IndexedDB, backup v2 chứa cả ledger. LocalStorage tiếp tục chứa snapshot để dự phòng.
- Rollback triển khai dùng bản mã tương thích IndexedDB v4 và giữ dữ liệu đã ghi. Lưu bản sao lưu trước nâng cấp để có thể đối chiếu và khôi phục.

## ADR-008 — Chấm trước khi ghi, phản hồi sau khi lưu

- Ngày: 2026-11-20. Gói E1-01.
- Mỗi câu hỏi chốt thời điểm bắt đầu và mã lượt. Gửi lại sau lỗi dùng lại mã đó. Lượt thử lại lưu sự kiện riêng. SRS, XP và thống kê cộng theo lượt đầu có kết quả xác định. Trình duyệt dùng localStorage dự phòng cho lịch và XP khi IndexedDB không khả dụng.
- Câu mở ghi trạng thái chưa xác minh. Lần sửa sau khi thấy mẫu được đánh dấu thử lại và đã thấy đáp án. Nội dung câu trả lời chỉ tồn tại trong giao diện phiên học.

## ADR-009 — Rubric v1 dựa trên bài tập hiện có

- Ngày: 2026-11-20. Gói E1-02.
- Bộ chiếu Bloom dựng từ ledger theo ID thẻ chuẩn. Tầng 1 và 2 cần các lượt đúng độc lập cách nhau ít nhất 24 giờ. Tầng 3 cần đủ tầng thấp và hai bài điền khác ngữ cảnh ở hai phiên. Bài truy hồi theo ngữ cảnh cũng có thể làm bằng chứng cho tầng thấp.
- Các bài offline hiện có hỗ trợ tầng 1–3. Các tầng 4–6 cần bài và rubric tương ứng trong [đặc tả Bloom](02-bloom-evidence.md). Tự chấm, gợi ý, xem mẫu, lượt thử lại và đánh giá AI riêng lẻ không xác minh Bloom. Giá trị Bloom cũ giữ vai trò lịch sử.

## ADR-010 — Hiển thị năng lực và lỗi theo kỹ năng

- Ngày: 2026-11-20. Gói E1-03.
- Giao diện thẻ, phiên học và thống kê hiển thị trạng thái đã xác minh hoặc chưa xác minh. Biểu đồ và mốc thành tích cũ mang nhãn Bloom cũ. Mục luyện lại lỗi mở bài phù hợp với thẻ hiện có trong phạm vi học. Hai lỗi độc lập liên tiếp của cùng kỹ năng đánh dấu cần xác minh lại.

## ADR-011 — Kế hoạch hằng ngày theo lịch và kỹ năng

- Ngày: 2026-11-20. Gói E2-01.
- Planner v1 dùng lịch đến hạn và hạn mức từ mới trước khi xếp theo kỹ năng. Giữ thứ tự từ mới theo giáo trình và dành chỗ cho thẻ chờ lâu nhất. Chuyển sang kế hoạch có sẵn khi thiếu bằng chứng độc lập ở các từ đến hạn. Nghe chép cá nhân hóa dùng giọng trên thiết bị đúng biến thể.

## ADR-012 — Dùng thử theo lựa chọn và theo dõi tại máy

- Ngày: 2026-11-20. Gói E2-02.
- `adaptivePlanner` mặc định tắt. Cài đặt so sánh hai kế hoạch tại máy. Khi bắt đầu phiên, giữ riêng danh sách thẻ và dạng bài để các lượt vừa ghi chỉ ảnh hưởng phiên sau.
- Metadata tùy chọn trong lượt trả lời gồm phiên bản planner, số thẻ dự kiến và dấu hiệu luyện kỹ năng yếu. Dùng IndexedDB v4 và backup v2 hiện hành. Tắt tùy chọn trong Cài đặt để các phiên sau trở về kế hoạch gốc.

## Template ADR mới

- ID/ngày/status:
- Bối cảnh:
- Các lựa chọn và rủi ro:
- Quyết định:
- Tác động đến dữ liệu cũ và hợp đồng API:
- Test/metrics:
- Rollback:
- Link PR/commit:
