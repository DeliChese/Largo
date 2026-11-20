# 02 — Bloom Evidence: không đánh đồng thuộc từ với biết sử dụng

## Định nghĩa

Bloom là **rubric đánh giá nhiệm vụ**, không phải số lần bấm “dễ”. Dùng evidence trong các ngữ cảnh độc lập để chứng minh kỹ năng. `SRS.repetitions`, XP và streak **không trực tiếp tăng Bloom**. Giữ trường legacy `VocabWord.bloomLevel` trong migration; chỉ trạng thái mới `verifiedBloomLevel` được dựa trên rubric có phiên bản.

## Ma trận bài tập và bằng chứng

| Tầng | Năng lực quan sát được | Ví dụ bài | Chấm |
| --- | --- | --- | --- |
| 1 Remember | Nhận diện âm/mặt chữ/nghĩa | flashcard nhận diện, quiz đơn giản | local |
| 2 Understand | Phân biệt nghĩa trong ngữ cảnh | chọn đúng nghĩa/đối chiếu 2 ví dụ | local, có distractor hợp lệ |
| 3 Apply | Dùng hình thái/cụm đúng trong câu | cloze/điền từ không gợi ý | local có key; AI cho câu mở |
| 4 Analyze | Phân biệt cặp dễ nhầm, giải thích khác nhau | contrast task | rubric local nếu structured; AI/human nếu mở |
| 5 Evaluate | Phát hiện/sửa lỗi, giải thích vì sao | error correction + rationale | AI/human với rubric |
| 6 Create | Viết câu/đoạn mới đúng nghĩa và ngữ pháp | production task tự do | AI/human với rubric |

Dictation chứng minh **nghe–chép/truy hồi hình thức**, không tự động chứng minh Bloom 5. Câu có chứa từ khóa và độ dài đủ **không** chứng minh tầng 6.

## Rubric v1 (ngưỡng khởi đầu, phải đo)

- L1/L2: tối thiểu 2 bài đúng độc lập, không nhìn đáp án, khác attempt; ít nhất một bài sau lần đầu 1 ngày hoặc hơn (ngưỡng thử nghiệm).
- L3/L4: tối thiểu 2 lần đúng ở **hai phiên/ngữ cảnh khác nhau**, không gợi ý, có rubric tương ứng. Ít nhất một bài thuộc dạng active recall/production có độ khó xác định.
- L5/L6: tối thiểu 2 bằng chứng **độc lập**, khác ngày/ngữ cảnh; assessment đạt cả tiêu chí meaning/usage/grammar (và rationale cho L5), kiểm tra bởi AI có cấu trúc hoặc người chấm. AI self-confidence một mình không đủ.
- Không nhảy cấp chỉ bằng một bài; đạt tầng N cần đạt điều kiện các tầng thấp hơn hoặc rubric tương đương có bằng chứng rõ ràng.
- Không coi retry trong cùng phiên, câu có đáp án mẫu, bài quá đơn giản hoặc nội dung copy là bằng chứng độc lập.
- Sai một câu không tự động tụt toàn bộ Bloom; đánh dấu skill yếu và yêu cầu tái xác minh nếu lặp lại. SRS lapse vẫn hoạt động độc lập.
- Các ngưỡng là **product hypothesis**: thay đổi phải tăng `rubricVersion`, cập nhật fixtures/backtest, không sửa ngầm mức cũ.

## Kết quả đánh giá chuẩn hoá

`Assessment` phải tách:
- `status`: `passed | failed | uncertain | unavailable`.
- `criteria`: `meaning`, `grammar`, `targetUsage`, `naturalness` và khi cần `reasoning` = `pass | fail | uncertain | not_applicable`.
- `assessor`: `local_exact | local_rubric | ai | human`.
- `hintUsed`, `isRetry`, `independent`, `rubricVersion`, `taskDifficulty`, `feedbackCode`.
- `feedbackText` là giải thích học tập, **không** là dữ liệu nâng Bloom nếu thiếu criteria.

Nếu `uncertain/unavailable`: cho phép học tiếp và tự so sánh mẫu, nhưng evidence không dùng để chứng nhận mức cao. Không đồng nhất lỗi mạng với sai kiến thức.

## Bảo vệ khỏi lỗi chấm

- Từ/cụm đa nghĩa: đánh giá theo nghĩa đích và prompt cụ thể, không chỉ `term.includes`.
- Tiếng Trung: phân biệt giản thể/phồn thể khi phù hợp, dấu câu/khoảng trắng không phải lỗi ngữ pháp; chấp nhận biến thể đúng, không dựa số ký tự đơn thuần.
- Tiếng Anh: chấp nhận đáp án tương đương trong context, giới hạn hint, kiểm tra hình thái và collocation.
- Negative controls: câu lặp từ khóa vô nghĩa; câu copy mẫu; câu sai nghĩa nhưng đúng ngữ pháp; câu đúng nghĩa nhưng sai cấu trúc; đáp án tự chấm đạt mà không có bằng chứng; prompt injection trong input người học.
- Có golden dataset do người đánh giá độc lập gắn nhãn; đo **false pass** đặc biệt ở L5/6, kiểm chứng trước bật mặc định.

## UI đề xuất

Hiển thị hai dòng tách biệt: “Ôn tiếp vào …” (SRS) và “Năng lực: … / cần xác minh …” (Mastery). Không hiển thị 95% mastery khi chưa có đủ mẫu. Khuyến khích sửa câu và luyện cặp từ dễ nhầm, không chỉ thưởng XP.

## Exit gate

Không có test nào cho thấy flashcard tự chấm, quiz đoán mò, retry hoặc `evaluateSynthesisSentence` cũ làm Bloom verified nhảy lên 4–6. AI chấm chưa chắc chắn phải dẫn đến `uncertain`.
