import type { DeckCollection } from '../types/vocab';

// Canonical themes for built-in lessons. Titles and IDs keep their original identity.
// Mixed-topic source lessons remain broad rather than being assigned an arbitrary single topic.
const THEMES: ReadonlyArray<readonly [string, readonly string[]]> = [
  ['Con người và quan hệ', ['Con người và gia đình', 'Con người và quan hệ', 'Quan hệ và cảm xúc', 'Cộng đồng và đời sống', 'Gia đình, nhà cửa và đời sống cộng đồng']],
  ['Nhà cửa và sinh hoạt', ['Nhà cửa và đời sống', 'Cuộc sống hằng ngày', 'Nhà cửa và sinh hoạt', 'Sinh hoạt và thời gian', 'Thói quen, gia đình và đời sống', 'Cụm danh từ · Đời sống', 'Cụm tính từ · Đời sống']],
  ['Ăn uống và mua sắm', ['Ăn uống và mua sắm', 'Ăn uống và mua đồ', 'Ẩm thực và đời sống', 'Dịch vụ khách hàng và tiêu dùng']],
  ['Đi lại và vị trí', ['Đi lại và vị trí', 'Đi lại và địa điểm', 'Đi lại và dịch vụ', 'Đi lại và hỏi đường', 'Du lịch và dịch vụ', 'Du lịch và di chuyển', 'Du lịch, khách sạn và ẩm thực', 'Du lịch, vận chuyển và hậu cần']],
  ['Học tập và công việc', ['Học tập và công việc', 'Trường học và công việc', 'Việc học và công việc', 'Lớp học và giao tiếp', 'Học tập và phát triển kỹ năng', 'Dự án và công việc', 'Họp hành và cộng tác công sở', 'Hiệu suất cá nhân và thói quen học tập', 'Nghề nghiệp và phát triển bản thân', 'Cụm tính từ · Công việc', 'Cụm tính từ · Học tập', 'Cụm tính từ · Dự án']],
  ['Giao tiếp và thông tin', ['Giao tiếp và thông tin', 'Giao tiếp và xã hội', 'Giao tiếp và ứng xử', 'Hỏi và đáp hằng ngày', 'Trao đổi và giải quyết vấn đề', 'Trình bày quan điểm và kết nối ý', 'Giao tiếp tự nhiên và tình huống sống', 'Giao tiếp tinh tế và thuyết phục', 'Liên kết diễn đạt và sắc thái bản ngữ', 'Cụm danh từ · Giao tiếp & Tâm lý', 'Cụm danh từ · Diễn ngôn C1']],
  ['Suy nghĩ và nhận thức', ['Suy nghĩ và nhận thức', 'Kỹ năng và tư duy', 'Cụm danh từ · Tư duy C1']],
  ['Cảm xúc và thái độ', ['Cảm xúc và thái độ', 'Cụm tính từ · Tính cách']],
  ['Miêu tả và đặc điểm', ['Miêu tả và đặc điểm', 'Cụm tính từ · Sắc thái', 'Cụm tính từ · Không gian & Cảm giác']],
  ['Hành động và hoạt động', ['Hành động và hoạt động']],
  ['Tác động và thay đổi', ['Tác động và thay đổi']],
  ['Thời gian, mức độ và số lượng', ['Thời gian, mức độ và số lượng', 'Cụm danh từ · Thời gian & Nơi chốn']],
  ['Sức khỏe và cơ thể', ['Sức khỏe và đời sống', 'Sức khỏe và cơ thể', 'Sức khỏe và thói quen', 'Sức khỏe, dinh dưỡng và tâm lý', 'Y tế và chăm sóc sức khỏe']],
  ['Kinh doanh và tài chính', ['Kinh doanh và tài chính', 'Mua bán và tài chính', 'Tài chính cá nhân và kinh tế', 'Tài chính và ngân sách', 'Lãnh đạo, chiến lược và ra quyết định', 'Lãnh đạo và điều phối', 'Cụm danh từ · Kinh doanh', 'Cụm danh từ · Tài chính & Sự nghiệp']],
  ['Công nghệ và kỹ thuật số', ['Công nghệ và kỹ thuật số', 'Công nghệ và số hóa', 'Công nghệ số và an toàn mạng', 'Công nghệ và an toàn số', 'Cụm danh từ · Công nghệ']],
  ['Khoa học và công nghệ', ['Khoa học và công nghệ', 'Khoa học, đổi mới và sản xuất', 'Cụm danh từ · Khoa học & Môi trường']],
  ['Thiên nhiên và môi trường', ['Thiên nhiên và môi trường', 'Môi trường, khí hậu và phát triển bền vững', 'Môi trường và phát triển bền vững', 'Cụm danh từ · Đô thị & Thiên nhiên']],
  ['Học thuật và nghiên cứu', ['Học thuật và nghiên cứu', 'Nghiên cứu, lập luận và viết học thuật', 'Nghiên cứu và viết học thuật', 'Nghiên cứu và số liệu', 'Dữ liệu và phân tích', 'Lập luận và bằng chứng', 'Collocations học thuật & sắc thái tinh tế', 'Cụm danh từ · Học thuật', 'Cụm tính từ · Học thuật']],
  ['Xã hội và pháp luật', ['Xã hội và pháp luật', 'Pháp luật, chính sách và đời sống xã hội', 'Pháp lý và chính sách công', 'Quản lý, chính sách và thương lượng', 'Cụm danh từ · Truyền thông & Pháp lý']],
  ['Văn hóa và nghệ thuật', ['Văn hóa và nghệ thuật', 'Truyền thông, sáng tạo và văn hóa', 'Truyền thông, thiết kế và nghệ thuật']],
  ['Cấu trúc và liên kết câu', ['Cấu trúc và liên kết câu']],
  ['Thể thao và thiên nhiên', ['Thể thao và thiên nhiên']],
  ['Xung đột và cạnh tranh', ['Xung đột và cạnh tranh']],
  ['Tổng hợp nhiều chủ đề', ['Từ vựng tổng hợp', 'Nhà cửa, ăn uống và mua sắm', 'Sức khỏe, giải trí và xã hội', 'Bạn bè, tiền bạc và thời tiết', 'Xã hội, môi trường và truyền thông', 'Thành ngữ học thuật và sắc thái cao cấp']],
];

const byAlias = new Map(THEMES.flatMap(([theme, aliases]) => aliases.map(alias => [alias, theme] as const)));

export function englishLearningCategory(category: string, collection: DeckCollection): string {
  if (collection === 'regional') return 'Biến thể Anh–Anh và Anh–Mỹ';
  return byAlias.get(category) ?? category;
}

// Within each CEFR level, learn core words before combining them into phrases.
// Keep the original order within each type (stable sort).
const COLLECTION_ORDER: Record<DeckCollection, number> = {
  textbook: 0, vocabulary: 1, situations: 2, collocations: 3, phrases: 4, phrasal: 5, regional: 6,
};
export function englishLearningOrder(collection?: DeckCollection): number {
  return COLLECTION_ORDER[collection ?? 'vocabulary'];
}
