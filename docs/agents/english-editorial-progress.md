# Tiến độ biên tập tiếng Anh — Giai đoạn 2

**Kế hoạch và quy trình bàn giao:** [Roadmap 2E–2Z](english-editorial-roadmap.md). Đọc roadmap và tài liệu này ở đầu mỗi phiên; cập nhật tiến độ thực tế sau mỗi đợt.

**Đợt tiếp theo:** 2H (393 ID A2 còn thiếu: extra, collocations, giao tiếp, regional, expansion; chia đợt con nếu cần). Mốc hiện tại: Seed v20, 2.260 ID có overlay; chưa nghiệm thu toàn trường.

Dữ liệu đã biên tập nằm trong [English/englishEditorial.json](../../English/englishEditorial.json). Mỗi bản ghi dùng ID hiện có; không tạo thẻ mới, không thay đổi CEFR hay thành viên bộ.

| Cấp/nhóm | Đợt 1 | Đợt 2a | Đợt 2b | Đợt 2c | Đợt 2d | Đợt 2e | Đợt 2f | Đợt 2g | Tổng có overlay |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| A1 | 8 | 112 | 310 | 370 | 166 | 36 | 0 | 0 | 1.002 |
| A2 | 0 | 0 | 0 | 0 | 71 | 213 | 271 | 349 | 904 |
| B1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| B2 | 0 | 61 | 0 | 0 | 0 | 0 | 0 | 0 | 61 |
| C1 | 184 | 84 | 0 | 0 | 0 | 0 | 0 | 0 | 268 |
| Cụm động từ (ID riêng) | 0 | 0 | 0 | 0 | 25 | 0 | 0 | 0 | 25 |
| Tổng | 192 | 257 | 310 | 370 | 262 | 249 | 271 | 349 | 2.260 |

2.260/7.000 mục có chỉnh sửa biên tập (32,29%); chưa kiểm chứng mọi trường. 4.740 mục chưa có overlay. Bốn cụm động từ dùng chung ID đã tính vào A2, không đếm hai lần.

## Phạm vi đợt 2a

- C1: phủ hết 268 ID của cấp hiện hành về nghĩa cốt lõi và ghi chú; sửa ví dụ có vấn đề chọn lọc, chưa đối chiếu toàn bộ câu ví dụ và quan hệ từ.
- A1: 112 danh từ cơ bản, ưu tiên gia đình, nhà cửa, vật dụng và sinh hoạt. Viết hai ví dụ song ngữ mới cho mỗi mục. Xóa quan hệ từ tự động chưa được kiểm chứng trong 112 overlay; không đụng quan hệ người dùng tự thêm. Danh sách đối nghĩa chung của seed vẫn có thể bổ sung quan hệ.
- B2: toàn bộ 61 mục thuộc hai bộ `deck-en-exp-b2-software-cloud` và `deck-en-exp-b2-economics-markets`, tách nghĩa và giải thích chuyên ngành.
- Không sửa dữ liệu nguồn; không đánh đồng ví dụ mới với xác nhận chính thức từ từ điển.

## Phạm vi đợt 2b

- 219 mục thuộc nhóm danh từ, tính từ cơ bản; thêm 91 mục ngữ pháp và động từ nền tảng. Mỗi mục có hai câu song ngữ mới (620 câu).
- Sửa nghĩa sai ngữ cảnh như sentence, plane, smith; bổ sung cách dùng be, do, have, a/an, listen/hear, say/tell, make/do. Giữ từ loại và CEFR hiện hành.
- 430/800 mục A1 thuộc nguồn vocabulary chính có overlay; còn 370 mục nguồn chính và các bộ A1 khác chưa có overlay. A2 chưa được biên tập trong đợt này.
- Không thay đổi logic học, ID hay số lượng thẻ.

## Phạm vi đợt 2c

- 370 mục còn lại của nguồn vocabulary A1, 740 câu song ngữ mới. Đủ 800/800 mục nguồn chính; các bộ A1 khác chưa hoàn thành.
- Sửa từ loại am, hello, bye, lot; sửa nghĩa thông dụng của afraid, dirty, excited, matter, time. Giữ nguyên ID, cấp, bộ và tiến độ.
- Kiểm tra 370 ID mới, hai câu song ngữ không rỗng mỗi mục, 759 overlay cũ giữ nguyên.
- Đưa 2b và 2c trực tiếp vào main theo yêu cầu. Chưa chạy lint/test/build/browser.

## Phạm vi đợt 2d

- 94/94 từ bổ sung A1 và 72/72 collocation A1 của nguồn tương ứng; bộ A1 giao tiếp gốc và biến thể vùng miền vẫn cần kiểm tra.
- 29 cụm động từ thuộc ba bộ đầu: 25 ID riêng và 4 ID dùng chung A2 (run out of, pick up, drop off, check in).
- 67 từ A2 thuộc hai bài đầu của nguồn vocabulary; sửa Ms, bill, queen, chef, market, traffic, stamp và các mục đa nghĩa khác.
- Hai câu song ngữ cho mỗi overlay mới (524 câu, 329 câu mới và 195 câu nguồn giữ lại). Không sửa 1.129 overlay cũ.
- Kiểm tra JSON/ID/số câu; chưa chạy lint/test/build/browser.

## Phạm vi đợt 2e (Seed v18)

- 24/24 ID giao tiếp A1 gốc (Ăn uống và mua sắm; Hỏi và đáp hằng ngày), 12/12 ID biến thể A1. Kiểm kê toàn bộ expansion: không có bài A1. Đủ 1.002/1.002 ID A1 có overlay (800 vocabulary chính, 94 extra, 72 collocations, 24 giao tiếp, 12 regional); chưa kiểm định mọi trường.
- 213 ID A2 nguồn chính thuộc bảy bài: `deck-en-a2-words-daily-02` (35), `deck-en-a2-words-daily-03` (35), `deck-en-a2-words-work-01` (24), `deck-en-a2-words-work-02` (25), `deck-en-a2-words-travel-01` (30), `deck-en-a2-words-life-01` (32), `deck-en-a2-words-life-02` (32). Đã phủ 280/900 từ A2 nguồn chính; 4 ID phrasal dùng chung A2 vẫn tính trong A2. A2 tổng 284 overlay.
- Sửa nghĩa lemon (quả chanh vàng), mall (trung tâm mua sắm), dessert (món tráng miệng), appointment (cuộc hẹn; sự bổ nhiệm), float (phao nổi; xe diễu hành trang trí), rap, cricket; bổ sung cách dùng furniture/software/research không đếm được, phân biệt receipt/bill, try it on và biến thể chips/fries, biscuit/cookie, pants/trousers. Sửa từ loại take a seat thành Cụm từ.
- 249 ID mới, 498 câu song ngữ trong overlay mới (484 cặp khác nội dung nguồn trực tiếp, 14 cặp giữ nguyên theo đối chiếu câu và bản dịch chính xác). Các câu mới/biên tập do Largo soạn, không phải chứng nhận từ điển độc lập. Ví dụ riêng của Anh-Anh trên các thẻ có headword khác vẫn giữ nguyên theo cơ chế hiện tại; chưa kiểm tra hết enrichment, IPA và quan hệ từ.
- Kiểm tra bằng GitHub API/JavaScript: toàn bộ danh mục nguồn có 7.000 ID duy nhất; JSON 1.640 khóa duy nhất; 249 ID mới thuộc seed, không trùng overlay cũ; 1.391 overlay cũ giữ nguyên; mọi mục mới có nghĩa và hai câu song ngữ không rỗng. Đã cập nhật assertion số lượng và thêm hai test TypeScript cho phủ A1, ví dụ vùng miền và migration v17. Chưa chạy lint/test/build/browser (không có checkout/runtime repo trong phiên API này).
- Bàn giao 2F: bắt đầu các bài A2 nguồn chính từ `deck-en-a2-words-general-01` trở đi (620 ID chưa phủ), ưu tiên nhóm sinh hoạt/con người/hành động; chia đợt con theo sức chứa và chủ đề, không sửa ID/bộ. A2 extra, collocations, giao tiếp/biến thể, expansion còn cần biên tập.

## Phạm vi đợt 2f (Seed v19)

- 271 ID nguồn vocabulary A2 thuộc bảy bài `deck-en-a2-words-general-01` đến `deck-en-a2-words-general-07` (38 + 39 + 39 + 39 + 38 + 39 + 39). Đã phủ 551/900 từ nguồn chính A2, 555/1.297 ID toàn cấp A2. Tổng 1.911/7.000 ID có overlay (27,30%); còn 5.089 ID chưa có overlay. A1 giữ 1.002/1.002.
- Sửa nghĩa sai ngữ cảnh ở max (mức tối đa), been/done (quá khứ phân từ), might (khả năng), stuff (đồ đạc/những thứ), given (được cho), hardly (hầu như không), condition (tình trạng/điều kiện), target (mục tiêu/bia ngắm), brilliant (xuất sắc/sáng chói); phân biệt từ loại yeah (thán từ), dead/die/death, lie/lay, raise/rise, lose/loose, advice/advise, beside/besides, used to/be used to. Bổ sung cấu trúc explain something to someone, consider/suggest + V-ing, prefer A to B và các danh từ không đếm được. Giữ CEFR và ID.
- 542 câu song ngữ trong overlay mới, đều khác cặp câu/bản dịch nguồn trực tiếp theo so sánh chính xác. Nội dung biên soạn Largo, chưa đối chiếu độc lập mọi trường; giữ cơ chế ví dụ vùng miền hiện có.
- Kiểm tra API/JavaScript: 271 ID mới trùng khớp bảy bài nguồn, không chồng lấn 1.640 overlay cũ; JSON 1.911 khóa duy nhất, mọi overlay cũ giữ nguyên nội dung, hai ví dụ song ngữ không rỗng mỗi ID mới. Cập nhật assertion tổng số overlay, thêm test phủ A2 và migration v18. Chưa chạy lint/test/build/browser hoặc migration trong runtime.
- Bàn giao 2G: bắt đầu `deck-en-a2-words-general-08` đến `general-16`, còn 349 ID nguồn chính A2; sau đó 2H xử lý các bộ A2 còn lại. Chia đợt con khi cần; không coi độ phủ overlay là nghiệm thu.

## Phạm vi đợt 2g (Seed v20)

- 349 ID nguồn vocabulary A2 thuộc chín bài `deck-en-a2-words-general-08` đến `deck-en-a2-words-general-16` (39 + 38 + 39 + 39 + 39 + 38 + 39 + 39 + 39). Hoàn thành 900/900 ID nguồn chính A2; toàn A2 có 904/1.297 ID có overlay. Tổng 2.260/7.000 ID (32,29%); còn 4.740 ID chưa có overlay. A1 giữ 1.002/1.002.
- Sửa ID (giấy tờ tùy thân/mã định danh), cent (xu, không phải percent), solution (giải pháp/dung dịch), concentrate (tập trung/cô đặc), tip (đầu mút/lời khuyên/tiền boa), anxious (lo lắng/nóng lòng), appearance (vẻ ngoài/sự xuất hiện), crown (vương miện/đỉnh), quality (chất lượng/phẩm chất), fry (danh từ cá con, phân biệt động từ chiên), blonde (màu tóc, không mặc định màu da), good-looking (mọi giới); giữ CEFR, ID và từ loại nguồn trừ khi có căn cứ.
- Bổ sung mẫu remind someone to do/of something, manage to do, avoid V-ing, regret doing/to inform, prevent someone from doing, succeed in doing, provide someone with something, apply for/to, advise someone to do, encourage someone to do; phân biệt effect/affect, rob/steal, lend/borrow, principal/principle, bored/boring và embarrassed/embarrassing.
- 698 câu song ngữ trong overlay mới, đều khác cặp câu/bản dịch nguồn trực tiếp theo so sánh chính xác. Nội dung biên soạn Largo, chưa đối chiếu độc lập mọi trường.
- Kiểm tra API/JavaScript: 349 ID mới khớp chín bài nguồn, không trùng 1.911 overlay cũ; JSON 2.260 khóa duy nhất, nội dung toàn bộ overlay cũ giữ nguyên, mỗi ID mới có hai ví dụ song ngữ không rỗng. Cập nhật assertion số overlay, chuyển assertion lịch sử 2F sang ngưỡng tối thiểu, bổ sung test độ phủ 900 ID A2 nguồn chính và migration v19. Chưa chạy lint/test/build/browser hoặc migration thực tế.
- Bàn giao 2H: 393 ID A2 còn thiếu overlay, thuộc extra/collocations/giao tiếp/regional/expansion. Kiểm kê ID chưa phủ theo bộ, không đếm trùng bốn ID phrasal đã biên tập; chia đợt 2H.1/2H.2 nếu cần theo quy mô 250–350 ID. Không sửa CEFR hoặc thành viên bộ. Độ phủ overlay chưa phải nghiệm thu.

## Các đợt tiếp theo

1. Các bộ A2 ngoài nguồn vocabulary chính: đối chiếu nghĩa theo từ loại, đơn giản hóa ví dụ và sửa dịch máy.
2. B1/B2: kiểm tra cụm từ đi kèm, giới từ, cấu trúc và cách dùng theo ngữ cảnh.
3. C1 và các mục đã có overlay: kiểm tra phần ví dụ, quan hệ từ, phát âm/biến thể còn lại. 
4. Chỉ đánh dấu hoàn thành khi mọi trường đã được kiểm tra hoặc có lý do không áp dụng. Kiểm tra CEFR và phân bổ lại bộ thuộc giai đoạn 3.

## Kiểm chứng

Kiểm tra trực tiếp JSON overlay: 449 khóa duy nhất; đủ 268 ID C1 trong nguồn expansion; 61 ID hai bộ B2; 112 ID A1 mới đều tồn tại trong nguồn vocabulary. Các kiểm thử TypeScript được bổ sung nhưng chưa chạy trong phiên này. Chưa kiểm tra giao diện trình duyệt.

Đợt 2b: kiểm tra 759 khóa, 310 khóa mới đều tồn tại trong nguồn A1, mỗi khóa mới có đúng hai câu song ngữ không rỗng; 449 overlay cũ không thay đổi. Chưa chạy bộ test TypeScript, lint, build hay browser.
