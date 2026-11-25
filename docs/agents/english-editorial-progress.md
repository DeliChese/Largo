# Tiến độ biên tập tiếng Anh — Giai đoạn 2

**Kế hoạch và quy trình bàn giao:** [Roadmap 2E–2Z](english-editorial-roadmap.md). Đọc roadmap và tài liệu này ở đầu mỗi phiên; cập nhật tiến độ thực tế sau mỗi đợt.

**Đợt tiếp theo:** 2K.2 — 148 ID B1 nguồn chính general-09–17 (127 tính từ, 20 trạng từ, 1 liên từ); kiểm tra CI v29 trước khi sửa. Mốc hiện tại: Seed v29, 3.455 ID có overlay; B1 nguồn chính 802/950; 268 ID có 288 nhóm nghĩa bổ sung; chưa nghiệm thu toàn trường.

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

## Bổ sung sau 2G: nghĩa theo từ loại (Seed v21)

- Phát hiện từ đồng tự có nhiều từ loại và cách dùng nhưng thẻ chỉ có một `partOfSpeech`, `meaning` và nhóm ví dụ chính. Ví dụ book (danh từ sách; động từ đặt trước), light (tính từ nhẹ; danh từ ánh sáng/đèn; động từ thắp), record (động từ ghi lại; danh từ hồ sơ/kỷ lục, khác trọng âm).
- Thêm trường tùy chọn `VocabWord.additionalSenses` và [dữ liệu biên tập riêng](../../English/englishAdditionalSenses.json), khóa bằng ID hiện có. Mỗi nghĩa bổ sung chứa từ loại, nghĩa ngắn, hai ví dụ song ngữ, ghi chú/cấu trúc và cách đọc khi khác nghĩa chính. Các thẻ đồng tự cùng từ loại nhưng khác cách đọc/nghĩa (lead /liːd/ và /led/) cũng có thể tách nhóm.
- Đợt đầu: 61 ID A1–A2 đã có overlay, 72 nhóm nghĩa bổ sung, 144 câu song ngữ mới; không tăng số ID có overlay (vẫn 2.260/7.000). Không đổi nghĩa chính, ví dụ chính, CEFR, bộ, ID hoặc số thẻ. Nghĩa bổ sung chỉ để tham khảo; không ghép vào đáp án quiz/flashcard ngược, không tự tạo SRS/Bloom riêng.
- Giao diện chi tiết thẻ và mặt đáp án flashcard hiển thị nhóm nghĩa riêng; tìm kiếm thư viện hỗ trợ từ loại/nghĩa/ghi chú bổ sung. Không áp dụng tự động cho biến thể vùng miền có headword khác. Bổ sung kiểm tra dữ liệu backup và test hồi quy seed v20, đối chiếu dữ liệu và round-trip backup; chưa chạy lint/test/build/browser, chưa kiểm tra giao diện hay migration thực tế.
- Kể từ 2H, kiểm tra nghĩa có thuộc đúng từ loại chính không, bổ sung các từ loại thông dụng khác khi có căn cứ, không liệt kê mọi nghĩa hiếm. Ghi tiến độ riêng (ID có additionalSenses, số nhóm nghĩa, ví dụ) và mở rộng rà soát A1–C1 trong 2Y; chưa tuyên bố đủ tất cả từ loại của 7.000 thẻ.
- Đợt tiếp theo vẫn là 2H, dự kiến Seed v22 nếu cập nhật học liệu; còn 393 ID A2 chưa có overlay.

## Phạm vi đợt 2H.1 (Seed v22)

- 150 ID mới: 72/72 collocations A2 (4 bài travel, health, work, social), 12/12 regional A2, 66/205 extra A2 (life-01, daily-01, daily-02). Giữ 2.260 overlay trước đó. A2 có 1.054/1.297 ID; toàn kho 2.410/7.000 (34,43%), còn 4.590 ID thiếu overlay. Bảng trên là mốc lịch sử v21.
- Sửa pear (quả lê), pence (xu tiền Anh), heating (hệ thống sưởi), stomachache (đau bụng), ski (ván trượt tuyết), pasta, rugby, seafood; phân biệt borrow/lend, take/pass an exam, on time/in time, direct/non-stop flight và các biến thể Anh–Anh/Anh–Mỹ. Giữ nguyên ID, CEFR, nguồn, bộ.
- 300 cặp ví dụ chính: 155 câu viết mới hoặc chỉnh câu gốc, 51 câu nguồn được bổ sung bản dịch, 94 cặp nguồn giữ lại. 5 ID thêm 5 nhóm nghĩa phụ (ski, skate, shampoo, printer, cereal), 10 ví dụ song ngữ mới; tổng 66 ID/77 nhóm. Không áp nghĩa phụ cho headword vùng miền khác.
- Kiểm tra JavaScript: JSON parse, khóa duy nhất, 150 ID đúng từ ba nguồn và không trùng overlay cũ; bảo toàn toàn bộ 2.260 overlay và 61 nhóm ID nghĩa phụ cũ; đủ hai ví dụ không rỗng trên mỗi ID mới. Đã bổ sung test độ phủ, biến thể và migration v21; chưa chạy lint/test/build/browser hoặc migration thực tế do chỉ làm việc qua GitHub API. Không xác nhận mọi IPA, quan hệ từ hoặc ví dụ UK riêng.
- Bàn giao 2H.2: còn 243 ID A2, ưu tiên extra general-01/02/03, people-01, work-01, travel-01; kiểm kê giao tiếp gốc và expansion A2 theo ID, loại bốn ID phrasal đã có. Không chuyển sang 2I trước khi phủ hết A2.

## Phạm vi đợt 2H.2 (Seed v23)

- 139 ID mới: toàn bộ extra A2 còn lại thuộc general-01/02/03, people-01, work-01, travel-01. Đủ 205/205 extra A2; toàn A2 1.193/1.297, tổng 2.549/7.000 (36,41%), còn 4.451 ID thiếu overlay.
- Sửa footballer, meter, right-hand, folder, psychologist, shade, context, fare, overweight; phân biệt amused/amusing, indoor/indoors, pronunciation, refer to. Giữ nguyên ID/CEFR/bộ và nguồn.
- 278 ví dụ chính: 159 câu viết mới/chỉnh câu, 105 câu nguồn bổ sung/chỉnh bản dịch, 14 cặp giữ lại. Thêm 10 ID/10 nhóm nghĩa phụ, 20 ví dụ mới. Tổng 76 ID/87 nhóm nghĩa phụ. Bảo toàn 2.410 overlay và 66 ID nghĩa phụ cũ.
- Kiểm tra JavaScript/JSON: 139 ID duy nhất, đúng nguồn, hai ví dụ song ngữ không rỗng, giữ dữ liệu cũ. Thêm test độ phủ và migration v22; chưa chạy lint/test/build/browser hoặc migration thực tế qua GitHub API. Chưa kiểm chứng mọi IPA, quan hệ từ, ví dụ vùng miền.
- Bàn giao: 20 ID giao tiếp gốc (12 work-study, 8 travel; 4 ID phrasal đã có) và 84 ID expansion A2 đã kiểm kê qua blob e0ba0ef: everyday-home (18), everyday-tools-fabrics (14), social-etiquette (10), everyday-errands (11), phrases-travel-2 (15), phrasal-everyday-2 (16). Tiếp tục 2H.3, không chuyển 2I trước khi phủ hết.

## Phạm vi đợt 2H.3 (Seed v24)

- 104 ID mới: 20 giao tiếp gốc (12 work-study, 8 travel), 84 expansion (18 everyday-home, 14 everyday-tools-fabrics, 10 social-etiquette, 11 everyday-errands, 15 phrases-travel-2, 16 phrasal-everyday-2). 393 ID toàn 2H. Đối chiếu 1.297 ID A2 từ toàn bộ nguồn, không trùng: 900 vocabulary, 205 extra, 72 collocations, 12 regional, 24 giao tiếp, 84 expansion; tất cả có overlay. Toàn kho 2.653/7.000 (37,90%), còn 4.347 ID thiếu overlay.
- 208 ví dụ chính do Largo biên soạn lại; 12 ID/12 nhóm nghĩa phụ (24 ví dụ mới); tổng 88 ID/99 nhóm. Rút gọn nghĩa, sửa câu dài và thiếu tự nhiên; phân biệt expiry/expiry date, grocery/groceries, split the bill không nhất thiết chia đều, day pass theo điều kiện sử dụng, confide in, eavesdrop on, phrasal verb tách được và vị trí đại từ. Sửa từ loại take notes, make progress, turn left thành Collocation; không thay đổi ID, CEFR, bộ, nguồn hoặc engine.
- Kiểm tra JavaScript/JSON: 104 ID mới đúng nguồn, 1.297 ID A2 duy nhất đều có overlay, 2.549 overlay và 76 ID nghĩa phụ cũ giữ nguyên; hai ví dụ song ngữ không rỗng trên mỗi ID mới. Thêm test độ phủ A2 và migration v23. CI v23 [45538497974](https://github.com/DeliChese/Largo/actions/runs/45538497974) đã thất bại ở lint TS2339 trong hai test migration do kiểu suy luận mất additionalSenses; sửa kiểu fixture thành VocabWord[] (không sửa engine). Chưa xác nhận CI v24, chưa chạy browser/migration tại máy hoặc kiểm định toàn trường IPA, quan hệ từ, biến thể. Kiểm tra CI v24 trước đợt sau.
- Bàn giao 2I: kiểm kê 950 ID nguồn chính B1, ưu tiên danh từ theo bài hoặc nhóm; không sửa CEFR, ID. A2 hoàn thành độ phủ, chưa nghiệm thu chất lượng.

## Phạm vi đợt 2I.1 (Seed v25)

- Kiểm kê toàn bộ 950 ID B1 nguồn chính: 551 danh từ theo nhãn nguồn. Biên tập 96 ID danh từ thuộc people-01 (23), daily-01 (36), daily-02 (37). Còn 455 danh từ nguồn chính B1 chưa phủ: work/travel/life và general-01–17. Tổng 2.749/7.000 (39,27%), còn 4.251 ID chưa phủ. B1 nguồn chính 96/950. Không đổi ID, CEFR, bộ, nguồn.
- 192 ví dụ chính biên soạn mới (có thể giữ câu nguồn nếu phù hợp); 19 nhóm nghĩa phụ trên 19 ID (38 ví dụ); tổng 107 ID/118 nhóm. Sửa marriage/wedding, nephew/niece vs grandson/granddaughter, neighborhood, charge, bureau, silk, jar, goods; tách nghĩa động từ respect, charge, taste, iron, wrap, v.v. Không xác nhận IPA hoặc quan hệ từ chưa kiểm định.
- CI v24 [45538902900](https://github.com/DeliChese/Largo/actions/runs/45538902900): lint đạt, test thất bại 4 trường hợp, build bỏ qua. Sửa chủ đích 4 overlay cũ: make progress/run into thêm ví dụ chứa nguyên cụm cho cloze, take off/look up thay câu trùng ngữ cảnh. Giữ mọi trường còn lại của 4 overlay và nguyên vẹn 2.649 overlay khác. Sửa studyScope.test.ts: kiểm tra cấu trúc quan hệ từ thay quota số lượng đồng/trái nghĩa không còn phù hợp vì chủ động xóa quan hệ chưa xác minh; vẫn kiểm tra có quan hệ trong kho. Sửa studySnapshots.test.ts so sánh tập ID ôn khi hai hạn giống hệt nhau (không ép tie-break), giữ kiểm tra reviewCount và thẻ đã xóa. Không đổi SRS/planner.
- JavaScript: kiểm tra 96 ID khớp nguồn, không trùng, JSON 2.749 khóa duy nhất, nghĩa và hai ví dụ song ngữ mỗi ID mới; bảo toàn 88 ID nghĩa phụ cũ, đúng 4 overlay cũ sửa có chủ đích. Thêm test độ phủ 2I.1 và migration v24; chưa xác nhận CI v25, chưa chạy browser hoặc migration thực tế. CI v24 đã thất bại nên chưa nghiệm thu.
- Bàn giao: 2I.2 tiếp tục danh từ B1 work-01/02 (66), travel-01/02 (48), life-01/02/03 (91), sau đó general (250). Kiểm tra CI v25 trước khi mở rộng. Không chuyển 2J trước khi hoàn tất nhóm danh từ.

## Phạm vi đợt 2I.2 (Seed v26)

- CI Seed v25 [45539603482](https://github.com/DeliChese/Largo/actions/runs/45539603482) đã hoàn thành thành công; không có lỗi tồn đọng cần sửa ở đầu phiên.
- 205 ID mới: work-01/02 (66), travel-01/02 (48), life-01/02/03 (91). B1 nguồn chính 301/950; danh từ 301/551, còn 250 thuộc general-01–17. Tổng 2.954/7.000 (42,20%), còn 4.046 ID chưa có overlay. Giữ nguyên 2.749 overlay cũ, ID, CEFR, bộ, dữ liệu nguồn và engine.
- 410 cặp ví dụ chính, 2 cặp trùng nguyên văn nguồn trực tiếp được giữ, 408 cặp biên soạn/chỉnh lại. Thêm 38 ID/39 nhóm nghĩa phụ với 78 ví dụ; tổng 145 ID/157 nhóm. Sửa crash (không phải hét), economy (nền kinh tế), customs (hải quan), capture, parking, breath/breathe, professor, moral, ward, radiation, puzzle; phân biệt danh/động từ suspect, transport, conflict và các cách đọc bow. Không tạo quan hệ từ thiếu căn cứ.
- Kiểm tra JavaScript: 205 ID mới đúng nguồn, khóa duy nhất, JSON 2.954 overlay, đủ hai ví dụ không rỗng mỗi ID mới; giữ nguyên 107 ID nghĩa phụ cũ. Bổ sung test độ phủ bảy bộ và migration v25 (SRS/Bloom, quan hệ cá nhân, thẻ đã xóa, todayWordIds, idempotence). Chưa xác nhận CI v26 tại thời điểm commit; chưa chạy browser, migration trên thiết bị hoặc kiểm định toàn bộ IPA/biến thể/quan hệ từ.
- Bàn giao 2I.3: hoàn thiện 250 danh từ B1 thuộc 17 bài general theo nhãn nguồn, kiểm kê bằng ID; chưa chuyển 2J. Kiểm tra CI v26 trước khi mở rộng.

## Phạm vi đợt 2I.3 (Seed v27)

- CI Seed v26 [45540429123](https://github.com/DeliChese/Largo/actions/runs/45540429123) đã hoàn thành thành công; không có lỗi tồn đọng cần sửa ở đầu phiên.
- 250 ID danh từ B1 mới thuộc general-01–17 (4, 11, 16, 16, 16, 21, 11, 16, 16, 18, 12, 17, 13, 14, 17, 16, 16 ID theo thứ tự). Hoàn tất 551/551 danh từ nguồn chính B1 qua 2I.1–2I.3; B1 nguồn chính 551/950. Tổng 3.204/7.000 (45,77%), còn 3.796 ID chưa có overlay. Giữ nguyên 2.954 overlay cũ, ID, CEFR, bộ, dữ liệu nguồn và engine.
- 500 ví dụ chính, 2 cặp giữ nguyên nguồn trực tiếp, 498 cặp biên soạn/chỉnh lại. Thêm 64 ID/64 nhóm nghĩa phụ, 128 ví dụ; tổng 209 ID/221 nhóm. Sửa passion (đam mê), identity (danh tính/bản sắc), angle (góc), monitor, pipe, tension, aim, storage, fifth (danh từ phân số), dating, refuse và conduct; tách nghĩa động từ, tính từ và số thứ tự khi phù hợp. Ghi IPA cho refuse, progress, object, conduct, content ở nghĩa phụ. Không tạo quan hệ từ chưa xác minh.
- JavaScript: 250 ID duy nhất khớp nguồn, JSON 3.204 khóa duy nhất, 551 danh từ đều có overlay, hai câu song ngữ không rỗng trên từng ID mới; bảo toàn 145 ID nghĩa phụ cũ. Bổ sung test toàn bộ danh từ B1 và migration v26 (SRS/Bloom, quan hệ cá nhân, thẻ đã xóa, todayWordIds, idempotence). Chưa xác nhận CI v27 tại thời điểm commit; chưa chạy browser hoặc migration thực tế trên thiết bị; chưa kiểm định toàn bộ IPA, biến thể, quan hệ từ.
- Bàn giao 2J: kiểm kê 104 động từ nguồn chính B1 theo nhãn nguồn và ID chưa có overlay; sau đó 2K xử lý 235 tính từ, 54 trạng từ, 6 liên từ (295 ID). Đã phủ danh từ, chưa nghiệm thu toàn trường.

## Phạm vi đợt 2J (Seed v28)

- CI Seed v27 [45541368162](https://github.com/DeliChese/Largo/actions/runs/45541368162) thành công.
- 104 ID mới: toàn bộ động từ B1 nguồn chính theo nhãn nguồn, thuộc general-01–17. B1 nguồn chính 655/950, toàn kho 3.308/7.000 (47,26%), còn 3.692 ID thiếu overlay. Giữ nguyên 3.204 overlay cũ, ID, CEFR, bộ và engine.
- 208 ví dụ chính: 1 câu trùng nguyên văn nguồn trực tiếp (bản dịch do Largo biên soạn), 207 câu viết mới/chỉnh lại. Thêm 31 ID/31 nhóm nghĩa phụ danh từ (62 ví dụ song ngữ); tổng 240 ID/252 nhóm. Sửa lay/lie, fetch, bore, soil, transfer, attend, react, approve/approve of, deny, commit, permit, assure/ensure; làm rõ cấu trúc giới từ và dạng bất quy tắc. Không bổ sung quan hệ từ chưa xác minh.
- Kiểm tra JavaScript: 104 ID duy nhất khớp nguồn, 104/104 động từ có overlay, hai ví dụ song ngữ không rỗng mỗi mục; kiểm tra khóa JSON cấp gốc không trùng, bảo toàn 3.204 overlay và 209 ID nghĩa phụ trước đó. Thêm test độ phủ và migration v27 (SRS/Bloom, quan hệ cá nhân, thẻ đã xóa, todayWordIds, idempotence). Chưa chạy npm lint/test/build cục bộ; CI v28 cần xác nhận sau commit. Chưa kiểm tra browser, migration thực tế, toàn bộ IPA, biến thể, quan hệ từ.
- Bàn giao 2K: kiểm kê lại 295 ID còn lại B1 nguồn chính (235 tính từ, 54 trạng từ, 6 liên từ), chia đợt nếu cần. Kiểm tra CI v28 trước khi sửa.

## Phạm vi đợt 2K.1 (Seed v29)

- CI Seed v28 [45542122605](https://github.com/DeliChese/Largo/actions/runs/45542122605) thành công.
- 147 ID mới (34 trạng từ, 5 liên từ, 108 tính từ), toàn bộ mục chưa phủ thuộc B1 nguồn chính general-01–08. B1 nguồn chính 802/950; toàn kho 3.455/7.000 (49,36%), còn 3.545 ID thiếu overlay. Giữ nguyên 3.308 overlay cũ, ID, CEFR, bộ, nguồn và engine.
- 294 ví dụ chính: 0 câu trùng nguồn trực tiếp (bản dịch biên soạn), 294 câu viết mới/chỉnh lại. Thêm 28 ID/36 nhóm nghĩa phụ (72 ví dụ); tổng 268 ID/288 nhóm. Sửa gay (đồng tính, nghĩa hiện đại), pregnant (mang thai, không phải nghén), terrific, otherwise, working, bound, rolling, directly, properly; phân biệt sometime/sometimes/some time, worth + V-ing, unless, since/until, ashamed/embarrassed, capable of/able to; tách các nghĩa danh từ, động từ, giới từ và liên từ thông dụng. Không xác nhận quan hệ từ hoặc IPA chưa đối chiếu.
- Kiểm tra JavaScript: JSON hợp lệ, khóa cấp gốc duy nhất, 147 ID đúng nguồn, đủ hai ví dụ song ngữ mỗi mục, bảo toàn 3.308 overlay và 240 ID nghĩa phụ cũ. Thêm test độ phủ 2K.1 và migration v28 (SRS/Bloom, quan hệ cá nhân, thẻ đã xóa, todayWordIds, idempotence). Chưa chạy npm lint/test/build cục bộ, CI v29 chưa xác nhận tại thời điểm commit, chưa chạy browser/migration thực tế.
- Bàn giao 2K.2: còn 148 ID general-09–17 (127 tính từ, 20 trạng từ, 1 liên từ); kiểm tra CI v29 trước khi sửa. Không chuyển 2L trước khi đủ 950/950 ID B1 nguồn chính.

## Các đợt tiếp theo

1. 2I–2N: B1 nguồn chính, extra, collocations, giao tiếp, regional và expansion; xử lý CI tồn đọng trước khi mở rộng.
2. B1/B2: kiểm tra cụm từ đi kèm, giới từ, cấu trúc và cách dùng theo ngữ cảnh.
3. C1 và các mục đã có overlay: kiểm tra phần ví dụ, quan hệ từ, phát âm/biến thể còn lại. 
4. Chỉ đánh dấu hoàn thành khi mọi trường đã được kiểm tra hoặc có lý do không áp dụng. Kiểm tra CEFR và phân bổ lại bộ thuộc giai đoạn 3.

## Kiểm chứng

Kiểm tra trực tiếp JSON overlay: 449 khóa duy nhất; đủ 268 ID C1 trong nguồn expansion; 61 ID hai bộ B2; 112 ID A1 mới đều tồn tại trong nguồn vocabulary. Các kiểm thử TypeScript được bổ sung nhưng chưa chạy trong phiên này. Chưa kiểm tra giao diện trình duyệt.

Đợt 2b: kiểm tra 759 khóa, 310 khóa mới đều tồn tại trong nguồn A1, mỗi khóa mới có đúng hai câu song ngữ không rỗng; 449 overlay cũ không thay đổi. Chưa chạy bộ test TypeScript, lint, build hay browser.
