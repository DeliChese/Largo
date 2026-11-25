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

## ADR-013 — Góp ý câu mở theo yêu cầu người học

- Ngày: 2026-11-20. Gói thử nghiệm AI cho Bloom theo yêu cầu chủ dự án.
- Triển khai một luồng thử tại máy gồm nút nhận góp ý, gateway DeepSeek và hạn mức theo tiến trình. Lựa chọn này gom phần tối thiểu của A1-01, A1-02 và A2-01 để thử luồng từ giao diện tới gateway. Giữ nguyên các gate trước khi phát hành công khai hoặc dùng AI làm bằng chứng Bloom.
- DeepSeek chỉ nhận câu tiếng Anh hoặc Trung được người học chọn gửi, cùng từ và nghĩa đích. Gửi một lượt JSON ngắn ở chế độ không thinking, kiểm schema và không tự gửi lại. Giữ kết quả tạm thời trong bộ nhớ của thẻ và máy chủ. Góp ý không tham gia ledger hoặc phép chiếu Bloom.
- Giữ định dạng backup và cơ sở dữ liệu hiện hành. Rollback bằng `DEEPSEEK_AI_ENABLED=false` và khởi động lại. Trước khi mở rộng, cần đo chất lượng trên gold set và hạn mức bền vững theo danh tính.

## ADR-014 — Bridge DeepSeek Chat cục bộ cho bản dùng thử

- Ngày: 2026-11-21. Yêu cầu trực tiếp của chủ dự án: dùng nguồn miễn phí `sums001/Deepseek-API` cho góp ý Bloom.
- Quyết định: giữ API chính thức làm một lựa chọn cấu hình; thêm `community_local` kết nối HTTP tới `127.0.0.1:8000/v1`. Cài mã nguồn bridge vào thư mục `.local/` bị Git bỏ qua. Không chuyển khóa hay phiên đăng nhập vào Vite hoặc browser của Largo.
- Bridge dùng tài khoản DeepSeek Chat cá nhân, giao thức web không chính thức, ước lượng token và bỏ qua trần token trong request. Gateway giới hạn input, quota, timeout, JSON đầu ra và không tính số token ước lượng là usage thật. Góp ý từ bridge không nâng Bloom đã xác minh.
- Không đổi schema, backup, SRS hay ID thẻ. Rollback bằng `DEEPSEEK_AI_ENABLED=false` và khởi động lại Largo. Chất lượng chấm, phiên đăng nhập và khả năng duy trì bridge cần kiểm tra riêng trước khi phát hành rộng.

## ADR-015 — Bỏ quota cho thử nghiệm cá nhân qua loopback

- Ngày: 2026-11-21. Chủ dự án chọn local không giới hạn lượt để test, tiếp tục chặn LAN.
- `DEEPSEEK_LOCAL_UNLIMITED=true` chỉ bỏ quota phút/ngày/tháng khi dùng `community_local` và vượt qua kiểm tra loopback trực tiếp hiện hành. Giới hạn đồng thời, kiểm schema, timeout và tạm dừng sau lỗi vẫn áp dụng. Cache idempotency tối đa 512 kết quả, thời hạn tối đa 24 giờ.
- Bridge cài tại `.local/deepseek-api` được sửa để `RATE_LIMIT_PER_MINUTE=0` cho phép loopback trực tiếp và chặn các kết nối khác. Lựa chọn này phục vụ thử nghiệm trên máy cá nhân. Giới hạn từ DeepSeek và tuổi thọ phiên đăng nhập phụ thuộc upstream.
- Schema dữ liệu học giữ nguyên. Rollback bằng `DEEPSEEK_LOCAL_UNLIMITED=false`, `RATE_LIMIT_PER_MINUTE=30` và khởi động lại hai server.

## ADR-016 — Danh mục theo bài HSK 3 của hai phiên bản

- Ngày 2026-11-21. Theo yêu cầu chủ dự án, cấp HSK 3 có 20 bài từ giáo trình chuẩn bản 2.0 và 18 bài từ giáo trình mới bản 3.0. Mỗi phiên bản dùng tiêu đề và chỉ mục từ vựng của sách tương ứng.
- Mỗi bài tham chiếu ID thẻ. Khi cùng một từ hoặc nghĩa xuất hiện trong nhiều bài hay hai phiên bản, lịch ôn dùng chung ID. Dấu `*` và các dạng chữ theo sách 2.0 hiển thị trong từng bài.
- Seed v9 bổ sung thẻ chưa có trong giáo trình trước và giữ thẻ đã xóa của giáo trình đã cài. Dữ liệu trước v9 không có dấu xóa cho thẻ nằm ngoài danh mục bài đang cài, nên mục vắng mặt ngoài phạm vi đó được bổ sung như thẻ mới. IndexedDB và định dạng backup v2 dùng schema hiện hành.
- Kiểm thử thứ tự bài, số mục, nội dung ví dụ và nâng cấp từ snapshot v8. Nếu cần rút bài sau phát hành, dùng bản sửa đọc được seed v9 để giữ tiến độ phát sinh. Khi quay về mã v8, dùng bản sao lưu trước nâng cấp.

## ADR-017 — Tiêu đề nguyên ngữ và chủ đề trong thư viện

- Ngày 2026-11-21. HSK 1 và HSK 3 dùng danh mục nhóm chủ đề chung với tiếng Anh. Tiêu đề chính hiển thị bằng tiếng Việt. Trường tùy chọn `nativeName` hiển thị tiêu đề gốc ở danh mục, trang chi tiết và tham gia tìm kiếm.
- Chủ đề chỉ sắp xếp danh mục. Số bài và thứ tự thẻ vẫn lấy từ giáo trình của từng phiên bản. [Quy chuẩn học liệu](../agents/language-curriculum.md) áp dụng khi thêm ngôn ngữ.
- Bản lưu v9 tự làm mới metadata của bộ tiếng Trung theo seed. Giữ ID bộ, ID thẻ, thời điểm tạo, tiến độ, bộ cá nhân và trạng thái thẻ đã xóa. Khi cần rollback cách đặt tên hoặc nhóm, phục hồi metadata trước đó trong seed và giữ bước phát hiện metadata cũ.

## ADR-018 — Thay thế học liệu cụm động từ trước khi phát hành

- Ngày 2026-11-24. Theo yêu cầu của chủ dự án, rút bộ cụm động từ lấy từ PDF và hai PDF HSK không được ứng dụng tham chiếu. English Speeches yêu cầu đồng ý bằng văn bản để phân phối lại tài liệu. [Điều khoản English Speeches](https://englishspeecheschannel.com/terms-and-conditions/)
- Seed v10 phát hành 33 thẻ biên soạn mới. Mỗi thẻ giữ ID của đúng nghĩa tương ứng để nhận lại SRS, Bloom cũ và quan hệ từ cá nhân. Thẻ vắng trong bài cũ đã cài được xem là đã xóa. Các thẻ rút khỏi danh mục chỉ còn trong dữ liệu cá nhân đã lưu. Nếu bài bị rút có thẻ tự thêm, bài đó chuyển thành bộ cá nhân cho các thẻ này. Backup, IndexedDB và origin dùng định dạng và địa chỉ hiện hành.
- Cập nhật nghĩa và ví dụ Anh–Trung theo ID hiện có. API Azure Speech chỉ nhận kết nối loopback trực tiếp với Host hợp lệ, kiểm tra Origin khi tổng hợp giọng nói và chặn header chuyển tiếp. Bản truy cập từ xa dùng giọng có sẵn trên thiết bị.
- Rollback bằng bản mã đọc được seed v10 và giữ nguyên ID, tiến độ cùng dữ liệu rút khỏi danh mục. Khôi phục về bản v9 cần bản sao lưu cá nhân trước cập nhật. Khi phát hành, giữ học liệu PDF đã rút ngoài gói build. Các commit hoặc bản phát hành cũ cần được xử lý riêng trước khi công khai.

## ADR-019 — Phạm vi ôn tiếng Trung và hai giọng tiếng Anh

- Ngày 2026-11-24. Phạm vi ôn tiếng Trung lấy thẻ của cả hai giáo trình. Thẻ chung dùng cùng ID và ưu tiên bài HSK 3.0 khi ôn chung. Thư viện mở HSK 3.0 mặc định và cho xem danh sách bài theo từng giáo trình.
- Tiếng Anh dùng một phạm vi học chung. Các nút Anh–Anh và Anh–Mỹ chọn giọng riêng cho từng lần phát. Giọng Azure đã chọn ở settings cũ vẫn dùng cho biến thể tương ứng. Chế độ tự động ưu tiên giọng trình duyệt cùng biến thể rồi dùng giọng Azure dự phòng nếu khả dụng.
- Các trường cũ trong bản sao lưu tiếp tục đọc được để tương thích. Thay đổi chỉ ở phạm vi học và phát âm. Khi rollback, mã cũ có thể tiếp tục dùng tùy chọn phiên bản và biến thể đã lưu.

## ADR-020 — Đấu trường nối từ dùng kho Largo trước

- Ngày 2026-11-24. Chủ dự án yêu cầu thêm mode đấu nối từ hoặc cụm từ với bot, có độ khó và thao tác lưu từ của bot.
- Trận đấu dùng kho tiếng Anh hoặc tiếng Trung đang có trên máy. Độ khó quyết định số giây mỗi lượt, thời gian bot phản hồi và số nước tiếp theo mà bot ưu tiên để lại cho người chơi. Trận đấu tính số lượt nối đúng và kết quả thắng thua tại chỗ.
- Người chơi có thể bật DeepSeek cho ván hiện tại. Khi bot cạn từ phù hợp, gateway loopback nhận ký tự đầu, ngôn ngữ và chế độ. Mỗi ván tối đa hai yêu cầu. API chính thức tắt thinking và giới hạn 64 token đầu ra. Community bridge có thể bỏ qua trần token nhưng vẫn chịu giới hạn lượt gọi và timeout của Largo. Kết quả hợp lệ được lưu đệm theo ký tự, ngôn ngữ và chế độ trong tối đa 24 giờ.
- Bộ cá nhân Đấu trường nối từ tham chiếu ID của thẻ đã có để dùng chung lịch ôn. Cụm từ chưa có thẻ hoặc mục do DeepSeek tạo chỉ trở thành thẻ mới sau khi người chơi bấm lưu. Bản sao lưu và cơ sở dữ liệu dùng định dạng hiện hành.
- Tắt DeepSeek phía máy chủ bằng `DEEPSEEK_AI_ENABLED=false` và khởi động lại Largo. Khi rút mode chơi, giữ hỗ trợ bộ cá nhân tham chiếu thẻ để người dùng tiếp tục quản lý các mục đã lưu.

## ADR-021 — Largo tập trung vào tiếng Anh

- Ngày 2026-11-25. Chủ dự án chọn tiếng Anh làm phạm vi sản phẩm. ADR-019 về HSK mô tả bản cũ. Các tệp nguồn lịch sử vẫn dùng để ghi công và đối chiếu bản sao lưu.
- Seed v12 bổ sung 2.963 thẻ tiếng Anh và giữ ID, tiến độ, quan hệ cá nhân và ý định xóa cho thư viện đã cài. Bốn cụm trùng trong danh mục mới dùng ID chung giữa các bộ. Bản lưu đã ôn các ID cũ vẫn giữ thẻ và lịch ôn của từng ID.
- Tạo ví dụ AI là thao tác tự chọn trên thẻ. Server kiểm tra từ mục tiêu, câu trùng, bản dịch, hạn mức và timeout. Kết quả hiển thị trong thẻ đang mở. Tắt bằng biến môi trường `EXAMPLE_AI_ENABLED=false`.
- Đấu trường hỗ trợ đấu bot, tiếp sức 60 giây và hai người cùng thiết bị. Các luật chạy với danh mục cục bộ. Thẻ được lưu từ game dùng lại ID nếu đã có trong thư viện.
- Rollback giao diện bằng mã đọc được seed v12. Khi quay về mã v11, dùng bản sao lưu tương ứng trước cập nhật. Schema IndexedDB và định dạng backup v2 tiếp tục dùng cấu trúc hiện hành.

## ADR-022 — Chuẩn học liệu tiếng Anh nghĩa trước, cách dùng sau

- Ngày 2026-11-25. Phạm vi theo yêu cầu chủ dự án: nội dung học tiếng Anh và thứ tự trình bày thẻ. Không thay đổi SRS, Bloom, game, API, tài khoản, schema IndexedDB hoặc backup.
- Biên tập nghĩa và ghi chú qua overlay theo ID; giữ dữ liệu nguồn, dùng lại ID từ/thẻ/bộ, cấp và thành viên của bộ. Chuẩn hóa nhãn nhóm và thứ tự loại học liệu trong cấp, không tự chuyển cấp hoặc đổi số lượng thẻ.
- Seed v13 dùng cơ chế cập nhật hiện có để áp dụng nội dung cho bản lưu v12, giữ SRS, Bloom, quan hệ cá nhân và các thẻ đã xóa. Cần chạy bộ test migration trước merge; chưa kiểm tra browser hoặc npm trong phiên connector.
- Đợt đầu: 184 mục C1, 8 mục A1; rà soát những mục còn lại theo từng chủ đề và cập nhật overlay sau khi đối chiếu ngôn ngữ. Không tuyên bố toàn bộ 7.000 mục đã được kiểm chứng.
- Rollback: không merge PR nếu chưa đạt test; nếu đã phát hành, khôi phục học liệu cũ với một seed version mới hơn (giữ ID), hoặc phục hồi backup tương ứng trước khi hạ phiên bản.

## ADR-023 — Biên tập học liệu đợt 2a

- Ngày 2026-11-25. Seed v14 bổ sung 257 ID vào overlay hiện có: 84 C1, 112 A1 và 61 B2. Tổng 449 ID; giữ số lượng và ID thẻ, cấp và thành viên bộ.
- C1 hoàn tất phủ nghĩa/ghi chú (268/268). A1 thay 112 cặp ví dụ theo nghĩa cơ bản và loại bỏ danh sách quan hệ từ chưa xác minh ở các ID này. B2 biên tập nghĩa và giải thích cho hai bộ công nghệ và kinh tế. Ví dụ và quan hệ từ ở C1/B2 chưa được kiểm chứng toàn bộ.
- Ví dụ đã biên tập được ưu tiên trong hai locale nếu từ hiển thị không đổi; giữ nguyên ví dụ của từ có biến thể chính tả hoặc từ riêng.
- Thêm test phạm vi C1, tính nhất quán ví dụ hai locale và migration v13. Chưa chạy lint/test/build/browser. Giữ PR draft; rollback bằng phiên bản seed mới hơn chứa nội dung trước đó hoặc backup trước cập nhật.

## ADR-024 — Biên tập A1 đợt 2b

- Seed v15: bổ sung 310 ID A1, viết 620 câu song ngữ; giữ nguyên 449 overlay trước đó. Tổng 759 ID. Ưu tiên nghĩa thông dụng trong ngữ cảnh, giữ từ loại nguồn, phân biệt mạo từ, trợ động từ và cấu trúc dùng từ.
- Loại quan hệ từ tự động chưa xác minh ở các overlay mới; giữ dữ liệu người dùng. Danh sách đối nghĩa chung của seed vẫn có thể bổ sung quan hệ.
- Kiểm tra trực tiếp JSON: ID thuộc nguồn A1, hai câu song ngữ không rỗng mỗi mục mới, không ghi đè overlay cũ. Bổ sung kiểm thử migration v14; chưa chạy lint/test/build hoặc browser. PR vẫn draft.
- Rollback bằng phiên bản seed mới hơn chứa nội dung trước đó hoặc backup trước cập nhật.

## ADR-025 — Hoàn tất vòng biên tập nguồn A1 chính (2c)

- Seed v16 bổ sung 370 ID, 740 câu song ngữ; 800/800 mục nguồn A1 vocabulary có overlay. Tổng 1.129 ID. Sửa từ loại của am, hello, bye, lot qua overlay, giữ ID và tiến độ.
- Theo yêu cầu trực tiếp của chủ dự án, 2b và 2c được đưa vào main bằng commit không force-push. Kiểm tra JSON, không sửa 759 overlay cũ. Chưa chạy lint/test/build/browser; cần kiểm tra trước triển khai thực tế.
- Rollback bằng seed mới hơn chứa nội dung trước đó hoặc phục hồi backup tương ứng.

## Template ADR mới

- ID/ngày/status:
- Bối cảnh:
- Các lựa chọn và rủi ro:
- Quyết định:
- Tác động đến dữ liệu cũ và hợp đồng API:
- Test/metrics:
- Rollback:
- Link PR/commit:
