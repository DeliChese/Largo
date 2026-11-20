import englishVocabulary from '../../English/englishVocabulary.json' with { type: 'json' };
import englishCollocations from '../../English/englishCollocations.json' with { type: 'json' };
import englishRegional from '../../English/englishRegional.json' with { type: 'json' };
import englishEnrichment from '../../English/englishEnrichment.json' with { type: 'json' };
import englishPhrasalVerbs from '../../English/englishPhrasalVerbs.json' with { type: 'json' };
import type { CollocationItem, DeckCollection, EnglishLocale, EnglishWordForms, ExampleSentence, VocabDeck, VocabWord } from '../types/vocab';
import { createInitialSRS } from '../utils/srsBloom';
import { ENGLISH_COLLOCATION_POS } from '../utils/englishStudy';

const NOW = Date.now();
export const ENGLISH_LEVELS = ['a1', 'a2', 'b1', 'b2'] as const;
export const ENGLISH_PHRASAL_LEVEL = 'phrasal';
const GENERAL_CATEGORY = 'Từ thường dùng';

const VOCABULARY_TOPICS: Record<string, string> = {
  talk: 'Giao tiếp và thông tin',
  work: 'Học tập và công việc',
  people: 'Con người và quan hệ',
  home: 'Nhà cửa và sinh hoạt',
  travel: 'Đi lại và vị trí',
  feelings: 'Cảm xúc và thái độ',
  health: 'Sức khỏe và cơ thể',
  money: 'Mua bán và tài chính',
  conflict: 'Xung đột và cạnh tranh',
  ideas: 'Suy nghĩ và nhận thức',
  changes: 'Tác động và thay đổi',
  activity: 'Hành động và hoạt động',
  nature: 'Thiên nhiên và môi trường',
  quantity: 'Thời gian, mức độ và số lượng',
  qualities: 'Miêu tả và đặc điểm',
  grammar: 'Cấu trúc và liên kết câu',
};

interface EnglishCardSeed {
  term: string;
  phonetic: string;
  partOfSpeech: string;
  meaning: string;
  collocations: CollocationItem[];
  examples: ExampleSentence[];
  notes?: string;
  englishForms?: EnglishWordForms;
  synonyms?: string[];
  antonyms?: string[];
}

interface EnglishEnrichment {
  topic?: string;
  examples?: ExampleSentence[];
  formExamples?: Partial<Record<EnglishLocale, ExampleSentence[]>>;
  synonyms?: string[];
  antonyms?: string[];
}

const enrichment: Record<string, EnglishEnrichment> = englishEnrichment;

interface EnglishVocabularyRow {
  term: string;
  partOfSpeech: string;
  meaning: string;
  phonetic?: string;
  british?: string;
  american?: string;
  sentence?: string;
  translation?: string;
}

interface EnglishVocabularyLesson {
  id: string;
  level: string;
  title: string;
  category: string;
  cards: EnglishVocabularyRow[];
}

const originalVocabulary: EnglishVocabularyLesson[] = englishVocabulary;

interface EnglishTopicSeed {
  id: string;
  level: 'a1' | 'a2' | 'b1';
  title: string;
  description: string;
  cards: EnglishCardSeed[];
}

const ENGLISH_TOPICS: EnglishTopicSeed[] = [
  {
    id: 'deck-en-a1-everyday',
    level: 'a1',
    title: 'Ăn uống và mua sắm',
    description: 'Gọi món, hỏi giá và trao đổi ngắn khi ghé quán hay cửa hàng.',
    cards: [
      {
        term: 'need',
        phonetic: '/niːd/',
        partOfSpeech: 'Động từ',
        meaning: 'cần',
        collocations: [{ phrase: 'need help', meaning: 'cần được giúp đỡ' }],
        examples: [{ sentence: 'I need help with this machine.', translation: 'Tôi cần được giúp đỡ với chiếc máy này.' }],
      },
      {
        term: 'menu',
        phonetic: '/ˈmenjuː/',
        partOfSpeech: 'Danh từ',
        meaning: 'thực đơn',
        collocations: [{ phrase: 'look at the menu', meaning: 'xem thực đơn' }],
        examples: [{ sentence: 'Can we look at the menu first?', translation: 'Chúng tôi xem thực đơn trước được không?' }],
      },
      {
        term: 'receipt',
        phonetic: '/rɪˈsiːt/',
        partOfSpeech: 'Danh từ',
        meaning: 'hóa đơn mua hàng',
        collocations: [{ phrase: 'keep the receipt', meaning: 'giữ lại hóa đơn' }],
        examples: [{ sentence: 'Please keep the receipt.', translation: 'Bạn vui lòng giữ lại hóa đơn nhé.' }],
        notes: 'Chữ p trong receipt không được phát âm.',
      },
      {
        term: 'change',
        phonetic: '/tʃeɪndʒ/',
        partOfSpeech: 'Danh từ',
        meaning: 'tiền thừa được trả lại',
        collocations: [{ phrase: 'keep the change', meaning: 'giữ tiền thừa' }],
        examples: [{ sentence: 'You can keep the change.', translation: 'Bạn cứ giữ tiền thừa nhé.' }],
      },
      {
        term: 'ready',
        phonetic: '/ˈredi/',
        partOfSpeech: 'Tính từ',
        meaning: 'sẵn sàng',
        collocations: [{ phrase: 'ready to order', meaning: 'sẵn sàng gọi món' }],
        examples: [{ sentence: 'Are you ready to order?', translation: 'Bạn đã sẵn sàng gọi món chưa?' }],
      },
      {
        term: 'try on',
        phonetic: '/traɪ ɑːn/',
        partOfSpeech: 'Cụm động từ',
        meaning: 'mặc thử',
        collocations: [{ phrase: 'try it on', meaning: 'mặc thử món này' }],
        examples: [{ sentence: 'Can I try on this jacket?', translation: 'Tôi mặc thử chiếc áo khoác này được không?' }],
        notes: 'Nếu dùng it hoặc them, đặt đại từ giữa try và on.',
      },
      {
        term: 'How much is this',
        phonetic: '/haʊ mʌtʃ ɪz ðɪs/',
        partOfSpeech: 'Mẫu câu',
        meaning: 'Cái này bao nhiêu tiền?',
        collocations: [{ phrase: 'How much is that?', meaning: 'Cái kia bao nhiêu tiền?' }],
        examples: [{ sentence: 'How much is this blue shirt?', translation: 'Chiếc áo sơ mi xanh này bao nhiêu tiền?' }],
      },
      {
        term: 'Could I have',
        phonetic: '/kʊd aɪ hæv/',
        partOfSpeech: 'Mẫu câu',
        meaning: 'Cho tôi xin … được không?',
        collocations: [{ phrase: 'Could I have the bill?', meaning: 'Cho tôi xin hóa đơn được không?' }],
        examples: [{ sentence: 'Could I have a glass of water?', translation: 'Cho tôi xin một cốc nước được không?' }],
      },
      {
        term: 'to go',
        phonetic: '/tə ɡoʊ/',
        partOfSpeech: 'Cụm từ',
        meaning: 'mang đi khi gọi món',
        collocations: [{ phrase: 'a coffee to go', meaning: 'một ly cà phê mang đi' }],
        examples: [{ sentence: 'Can I get a coffee to go?', translation: 'Cho tôi một ly cà phê mang đi được không?' }],
      },
      {
        term: 'for here',
        phonetic: '/fər hɪr/',
        partOfSpeech: 'Cụm từ',
        meaning: 'dùng tại chỗ khi gọi món',
        collocations: [{ phrase: 'for here or to go', meaning: 'dùng tại chỗ hay mang đi' }],
        examples: [{ sentence: 'Is that for here or to go?', translation: 'Bạn dùng tại chỗ hay mang đi?' }],
      },
      {
        term: 'take a seat',
        phonetic: '/teɪk ə siːt/',
        partOfSpeech: 'Cụm động từ',
        meaning: 'mời ngồi',
        collocations: [{ phrase: 'take a seat by the window', meaning: 'ngồi cạnh cửa sổ' }],
        examples: [{ sentence: 'Please take a seat by the window.', translation: 'Mời bạn ngồi cạnh cửa sổ.' }],
      },
      {
        term: 'nearby',
        phonetic: '/ˌnɪrˈbaɪ/',
        partOfSpeech: 'Trạng từ',
        meaning: 'ở gần đây',
        collocations: [{ phrase: 'live nearby', meaning: 'sống ở gần đây' }],
        examples: [{ sentence: 'Do you live nearby?', translation: 'Bạn sống ở gần đây à?' }],
      },
    ],
  },
  {
    id: 'deck-en-a1-conversation',
    level: 'a1',
    title: 'Hỏi và đáp hằng ngày',
    description: 'Mở lời, hỏi lại và nhờ giúp đỡ bằng những câu ngắn.',
    cards: [
      {
        term: 'repeat',
        phonetic: '/rɪˈpiːt/',
        partOfSpeech: 'Động từ',
        meaning: 'nhắc lại',
        collocations: [{ phrase: 'repeat the question', meaning: 'nhắc lại câu hỏi' }],
        examples: [{ sentence: 'Could you repeat the question, please?', translation: 'Bạn nhắc lại câu hỏi giúp tôi được không?' }],
      },
      {
        term: 'slowly',
        phonetic: '/ˈsloʊli/',
        partOfSpeech: 'Trạng từ',
        meaning: 'chậm rãi',
        collocations: [{ phrase: 'speak slowly', meaning: 'nói chậm' }],
        examples: [{ sentence: 'Please speak slowly.', translation: 'Bạn nói chậm giúp tôi với.' }],
      },
      {
        term: 'mean',
        phonetic: '/miːn/',
        partOfSpeech: 'Động từ',
        meaning: 'có nghĩa là',
        collocations: [{ phrase: 'What does it mean?', meaning: 'Nó có nghĩa là gì?' }],
        examples: [{ sentence: 'What does this word mean?', translation: 'Từ này có nghĩa là gì?' }],
      },
      {
        term: 'address',
        phonetic: '/əˈdres/',
        partOfSpeech: 'Danh từ',
        meaning: 'địa chỉ',
        collocations: [{ phrase: 'home address', meaning: 'địa chỉ nhà' }],
        examples: [{ sentence: 'What is your home address?', translation: 'Địa chỉ nhà bạn là gì?' }],
      },
      {
        term: 'leave',
        phonetic: '/liːv/',
        partOfSpeech: 'Động từ',
        meaning: 'rời đi, khởi hành',
        collocations: [{ phrase: 'leave home', meaning: 'rời nhà' }],
        examples: [{ sentence: 'I usually leave home at eight.', translation: 'Tôi thường rời nhà lúc tám giờ.' }],
      },
      {
        term: 'bring',
        phonetic: '/brɪŋ/',
        partOfSpeech: 'Động từ',
        meaning: 'mang theo đến nơi đến',
        collocations: [{ phrase: 'bring your ID', meaning: 'mang theo giấy tờ tùy thân' }],
        examples: [{ sentence: 'Please bring your ID to the airport.', translation: 'Bạn nhớ mang giấy tờ tùy thân ra sân bay.' }],
      },
      {
        term: 'Excuse me',
        phonetic: '/ɪkˈskjuːz miː/',
        partOfSpeech: 'Mẫu câu',
        meaning: 'Xin lỗi, cho tôi hỏi',
        collocations: [{ phrase: 'Excuse me, where is…?', meaning: 'Xin lỗi, … ở đâu ạ?' }],
        examples: [{ sentence: 'Excuse me, where is the train station?', translation: 'Xin lỗi, ga tàu ở đâu ạ?' }],
      },
      {
        term: "I'm looking for",
        phonetic: '/aɪm ˈlʊkɪŋ fər/',
        partOfSpeech: 'Mẫu câu',
        meaning: 'Tôi đang tìm …',
        collocations: [{ phrase: "I'm looking for a pharmacy.", meaning: 'Tôi đang tìm một hiệu thuốc.' }],
        examples: [{ sentence: "I'm looking for the bus stop.", translation: 'Tôi đang tìm trạm xe buýt.' }],
      },
      {
        term: 'Can you help me',
        phonetic: '/kæn juː help miː/',
        partOfSpeech: 'Mẫu câu',
        meaning: 'Bạn giúp tôi được không?',
        collocations: [{ phrase: 'Can you help me with this?', meaning: 'Bạn giúp tôi việc này được không?' }],
        examples: [{ sentence: 'Can you help me find my seat?', translation: 'Bạn giúp tôi tìm chỗ ngồi được không?' }],
      },
      {
        term: 'Let me check',
        phonetic: '/let miː tʃek/',
        partOfSpeech: 'Mẫu câu',
        meaning: 'Để tôi kiểm tra',
        collocations: [{ phrase: 'Let me check the time.', meaning: 'Để tôi xem giờ.' }],
        examples: [{ sentence: 'Let me check my phone.', translation: 'Để tôi xem điện thoại.' }],
      },
      {
        term: 'Sounds good',
        phonetic: '/saʊndz ɡʊd/',
        partOfSpeech: 'Mẫu câu',
        meaning: 'Được đấy',
        collocations: [{ phrase: 'That sounds good.', meaning: 'Nghe được đấy.' }],
        examples: [{ sentence: '“Meet at six?” “Sounds good.”', translation: '“Gặp nhau lúc sáu giờ nhé?” “Được đấy.”' }],
      },
      {
        term: 'See you later',
        phonetic: '/siː juː ˈleɪtər/',
        partOfSpeech: 'Mẫu câu',
        meaning: 'Hẹn gặp lại',
        collocations: [{ phrase: 'See you tomorrow.', meaning: 'Hẹn gặp bạn ngày mai.' }],
        examples: [{ sentence: 'See you later, Mia!', translation: 'Hẹn gặp lại nhé, Mia!' }],
      },
    ],
  },
  {
    id: 'deck-en-a2-work-study',
    level: 'a2',
    title: 'Học tập và công việc',
    description: 'Hẹn lịch, xin tài liệu và theo dõi việc đang làm.',
    cards: [
      {
        term: 'deadline',
        phonetic: '/ˈdedlaɪn/',
        partOfSpeech: 'Danh từ',
        meaning: 'hạn chót',
        collocations: [{ phrase: 'meet the deadline', meaning: 'hoàn thành đúng hạn' }],
        examples: [{ sentence: 'We need one more person to meet the deadline.', translation: 'Chúng ta cần thêm một người để hoàn thành đúng hạn.' }],
      },
      {
        term: 'meeting',
        phonetic: '/ˈmiːtɪŋ/',
        partOfSpeech: 'Danh từ',
        meaning: 'cuộc họp',
        collocations: [{ phrase: 'join a meeting', meaning: 'tham gia một cuộc họp' }],
        examples: [{ sentence: 'Can you join a meeting at two?', translation: 'Bạn tham gia một cuộc họp lúc hai giờ được không?' }],
      },
      {
        term: 'update',
        phonetic: '/ˈʌpdeɪt/',
        partOfSpeech: 'Danh từ',
        meaning: 'tin cập nhật',
        collocations: [{ phrase: 'give me an update', meaning: 'cập nhật tình hình cho tôi' }],
        examples: [{ sentence: 'Can you give me an update this afternoon?', translation: 'Chiều nay bạn cập nhật tình hình cho tôi được không?' }],
      },
      {
        term: 'available',
        phonetic: '/əˈveɪləbəl/',
        partOfSpeech: 'Tính từ',
        meaning: 'rảnh, có thể tham gia',
        collocations: [{ phrase: 'available for a call', meaning: 'rảnh để gọi điện' }],
        examples: [{ sentence: 'Are you available for a call tomorrow morning?', translation: 'Sáng mai bạn có rảnh để gọi điện không?' }],
      },
      {
        term: 'schedule',
        phonetic: '/ˈskedʒuːl/',
        partOfSpeech: 'Động từ',
        meaning: 'lên lịch',
        collocations: [{ phrase: 'schedule a call', meaning: 'lên lịch một cuộc gọi' }],
        examples: [{ sentence: 'Can we schedule a call for Thursday?', translation: 'Mình lên lịch gọi điện vào thứ Năm được không?' }],
      },
      {
        term: 'follow up',
        phonetic: '/ˈfɑːloʊ ʌp/',
        partOfSpeech: 'Cụm động từ',
        meaning: 'liên hệ lại để theo dõi việc đã trao đổi',
        collocations: [{ phrase: 'follow up on an email', meaning: 'hỏi lại về một email' }],
        examples: [{ sentence: 'I’d like to follow up on an email I sent last week.', translation: 'Tôi muốn hỏi lại về một email tôi gửi tuần trước.' }],
      },
      {
        term: 'take notes',
        phonetic: '/teɪk noʊts/',
        partOfSpeech: 'Cụm động từ',
        meaning: 'ghi chép',
        collocations: [{ phrase: 'take notes in class', meaning: 'ghi chép trên lớp' }],
        examples: [{ sentence: 'I take notes in class to remember new words.', translation: 'Tôi ghi chép trên lớp để nhớ từ mới.' }],
      },
      {
        term: 'keep track of',
        phonetic: '/kiːp træk əv/',
        partOfSpeech: 'Cụm động từ',
        meaning: 'theo dõi và nắm được tình hình',
        collocations: [{ phrase: 'keep track of new words', meaning: 'theo dõi các từ mới' }],
        examples: [{ sentence: 'I use a notebook to keep track of new words.', translation: 'Tôi dùng sổ để theo dõi các từ mới.' }],
      },
      {
        term: 'make progress',
        phonetic: '/meɪk ˈprɑːɡres/',
        partOfSpeech: 'Cụm động từ',
        meaning: 'có tiến bộ',
        collocations: [{ phrase: 'make progress on a project', meaning: 'có tiến triển trong một dự án' }],
        examples: [{ sentence: 'We can make progress if we practice every day.', translation: 'Chúng ta có thể tiến bộ nếu luyện mỗi ngày.' }],
      },
      {
        term: 'run into',
        phonetic: '/rʌn ˈɪntuː/',
        partOfSpeech: 'Cụm động từ',
        meaning: 'gặp phải vấn đề bất ngờ',
        collocations: [{ phrase: 'run into a problem', meaning: 'gặp phải vấn đề' }],
        examples: [{ sentence: 'Let me know if you run into a problem.', translation: 'Báo tôi nếu bạn gặp vấn đề nhé.' }],
      },
      {
        term: 'Could you send me',
        phonetic: '/kʊd juː send miː/',
        partOfSpeech: 'Mẫu câu',
        meaning: 'Bạn gửi cho tôi … được không?',
        collocations: [{ phrase: 'Could you send me a copy?', meaning: 'Bạn gửi tôi một bản được không?' }],
        examples: [{ sentence: 'Could you send me the link?', translation: 'Bạn gửi cho tôi đường dẫn được không?' }],
      },
      {
        term: "I'll get back to you",
        phonetic: '/aɪl ɡet bæk tə juː/',
        partOfSpeech: 'Mẫu câu',
        meaning: 'Tôi sẽ phản hồi lại bạn',
        collocations: [{ phrase: "I'll get back to you by Friday.", meaning: 'Tôi sẽ phản hồi chậm nhất vào thứ Sáu.' }],
        examples: [{ sentence: "I'll get back to you after I check the schedule.", translation: 'Tôi sẽ phản hồi sau khi xem lịch.' }],
      },
    ],
  },
  {
    id: 'deck-en-a2-travel',
    level: 'a2',
    title: 'Đi lại và dịch vụ',
    description: 'Hỏi đường, nhận phòng và xử lý những tình huống thường gặp khi đi xa.',
    cards: [
      {
        term: 'reservation',
        phonetic: '/ˌrezərˈveɪʃən/',
        partOfSpeech: 'Danh từ',
        meaning: 'chỗ đã đặt trước',
        collocations: [{ phrase: 'make a reservation', meaning: 'đặt chỗ trước' }],
        examples: [{ sentence: 'I’d like to make a reservation for two nights.', translation: 'Tôi muốn đặt phòng trong hai đêm.' }],
      },
      {
        term: 'refund',
        phonetic: '/ˈriːfʌnd/',
        partOfSpeech: 'Danh từ',
        meaning: 'khoản tiền được hoàn lại',
        collocations: [{ phrase: 'get a full refund', meaning: 'được hoàn tiền đầy đủ' }],
        examples: [{ sentence: 'Can I get a full refund for this ticket?', translation: 'Tôi được hoàn lại toàn bộ tiền vé này không?' }],
      },
      {
        term: 'delay',
        phonetic: '/dɪˈleɪ/',
        partOfSpeech: 'Danh từ',
        meaning: 'sự chậm trễ',
        collocations: [{ phrase: 'a flight delay', meaning: 'chuyến bay bị hoãn' }],
        examples: [{ sentence: 'There’s a flight delay of thirty minutes.', translation: 'Chuyến bay bị hoãn ba mươi phút.' }],
      },
      {
        term: 'crowded',
        phonetic: '/ˈkraʊdɪd/',
        partOfSpeech: 'Tính từ',
        meaning: 'đông đúc, chật kín',
        collocations: [{ phrase: 'a crowded bus', meaning: 'xe buýt đông người' }],
        examples: [{ sentence: 'We got on a crowded bus at five.', translation: 'Chúng tôi lên một chiếc xe buýt đông người lúc năm giờ.' }],
      },
      {
        term: 'recommend',
        phonetic: '/ˌrekəˈmend/',
        partOfSpeech: 'Động từ',
        meaning: 'gợi ý vì thấy phù hợp',
        collocations: [{ phrase: 'recommend a restaurant', meaning: 'gợi ý một nhà hàng' }],
        examples: [{ sentence: 'Can you recommend a restaurant near here?', translation: 'Bạn gợi ý một nhà hàng gần đây được không?' }],
      },
      {
        term: 'turn left',
        phonetic: '/tɜːrn left/',
        partOfSpeech: 'Cụm động từ',
        meaning: 'rẽ trái',
        collocations: [{ phrase: 'turn left at the light', meaning: 'rẽ trái tại đèn giao thông' }],
        examples: [{ sentence: 'Walk one block and turn left at the light.', translation: 'Đi hết một dãy phố rồi rẽ trái ở đèn giao thông.' }],
      },
      {
        term: 'run out of',
        phonetic: '/rʌn aʊt əv/',
        partOfSpeech: 'Cụm động từ',
        meaning: 'dùng hết, không còn',
        collocations: [{ phrase: 'run out of water', meaning: 'hết nước' }],
        examples: [{ sentence: 'We might run out of water on the hike.', translation: 'Có thể chúng ta sẽ hết nước khi đi bộ đường dài.' }],
      },
      {
        term: 'pick up',
        phonetic: '/pɪk ʌp/',
        partOfSpeech: 'Cụm động từ',
        meaning: 'đón ai',
        collocations: [{ phrase: 'pick me up at the airport', meaning: 'đón tôi ở sân bay' }],
        examples: [{ sentence: 'Can you pick up Sam at the station?', translation: 'Bạn đón Sam ở ga được không?' }],
      },
      {
        term: 'drop off',
        phonetic: '/drɑːp ɔːf/',
        partOfSpeech: 'Cụm động từ',
        meaning: 'đưa đến rồi cho xuống',
        collocations: [{ phrase: 'drop me off at the hotel', meaning: 'cho tôi xuống ở khách sạn' }],
        examples: [{ sentence: 'Could you drop off my friend here?', translation: 'Bạn cho bạn tôi xuống ở đây được không?' }],
      },
      {
        term: 'check in',
        phonetic: '/tʃek ɪn/',
        partOfSpeech: 'Cụm động từ',
        meaning: 'làm thủ tục nhận phòng',
        collocations: [{ phrase: 'check in at the front desk', meaning: 'nhận phòng tại quầy lễ tân' }],
        examples: [{ sentence: 'You can check in at the front desk after three.', translation: 'Bạn có thể nhận phòng tại quầy lễ tân sau ba giờ.' }],
      },
      {
        term: 'on time',
        phonetic: '/ɑːn taɪm/',
        partOfSpeech: 'Cụm từ',
        meaning: 'đúng giờ đã định',
        collocations: [{ phrase: 'arrive on time', meaning: 'đến đúng giờ' }],
        examples: [{ sentence: 'Will the bus arrive on time?', translation: 'Xe buýt có đến đúng giờ không?' }],
      },
      {
        term: 'Is there another option',
        phonetic: '/ɪz ðer əˈnʌðər ˈɑːpʃən/',
        partOfSpeech: 'Mẫu câu',
        meaning: 'Còn lựa chọn khác không?',
        collocations: [{ phrase: 'Is there a cheaper option?', meaning: 'Có lựa chọn nào rẻ hơn không?' }],
        examples: [{ sentence: 'Is there another option if this train is full?', translation: 'Nếu chuyến tàu này hết chỗ thì còn lựa chọn khác không?' }],
      },
    ],
  },
  {
    id: 'deck-en-b1-discussion',
    level: 'b1',
    title: 'Trao đổi và giải quyết vấn đề',
    description: 'Nêu ưu tiên, làm rõ ý và thống nhất cách xử lý trong nhóm.',
    cards: [
      {
        term: 'priority',
        phonetic: '/praɪˈɔːrəti/',
        partOfSpeech: 'Danh từ',
        meaning: 'việc cần ưu tiên',
        collocations: [{ phrase: 'top priority', meaning: 'ưu tiên hàng đầu' }],
        examples: [{ sentence: 'Our top priority is to finish the first draft.', translation: 'Ưu tiên hàng đầu của chúng tôi là hoàn thành bản nháp đầu tiên.' }],
      },
      {
        term: 'feedback',
        phonetic: '/ˈfiːdbæk/',
        partOfSpeech: 'Danh từ',
        meaning: 'nhận xét để cải thiện',
        collocations: [{ phrase: 'ask for feedback', meaning: 'xin nhận xét' }],
        examples: [{ sentence: 'I’d like to ask for feedback on my presentation.', translation: 'Tôi muốn xin nhận xét về bài thuyết trình của mình.' }],
        notes: 'Feedback thường không đếm được. Có thể nói a piece of feedback.',
      },
      {
        term: 'reliable',
        phonetic: '/rɪˈlaɪəbəl/',
        partOfSpeech: 'Tính từ',
        meaning: 'đáng tin cậy',
        collocations: [{ phrase: 'a reliable source', meaning: 'nguồn đáng tin cậy' }],
        examples: [{ sentence: 'Can we find a reliable source for these figures?', translation: 'Mình tìm được nguồn đáng tin cậy cho các số liệu này không?' }],
      },
      {
        term: 'trade-off',
        phonetic: '/ˈtreɪd ɔːf/',
        partOfSpeech: 'Danh từ',
        meaning: 'sự đánh đổi giữa các lựa chọn',
        collocations: [{ phrase: 'a trade-off between price and quality', meaning: 'sự đánh đổi giữa giá và chất lượng' }],
        examples: [{ sentence: 'There is a trade-off between price and quality.', translation: 'Có sự đánh đổi giữa giá và chất lượng.' }],
      },
      {
        term: 'clarify',
        phonetic: '/ˈklerəfaɪ/',
        partOfSpeech: 'Động từ',
        meaning: 'làm rõ',
        collocations: [{ phrase: 'clarify one point', meaning: 'làm rõ một ý' }],
        examples: [{ sentence: 'Could you clarify one point before we finish?', translation: 'Bạn làm rõ một ý trước khi mình kết thúc được không?' }],
      },
      {
        term: 'reschedule',
        phonetic: '/ˌriːˈskedʒuːl/',
        partOfSpeech: 'Động từ',
        meaning: 'đổi lịch sang thời điểm khác',
        collocations: [{ phrase: 'reschedule the meeting', meaning: 'đổi lịch họp' }],
        examples: [{ sentence: 'Can we reschedule the meeting for Thursday?', translation: 'Mình dời cuộc họp sang thứ Năm được không?' }],
      },
      {
        term: 'bring up',
        phonetic: '/brɪŋ ʌp/',
        partOfSpeech: 'Cụm động từ',
        meaning: 'đề cập một chủ đề để bàn',
        collocations: [{ phrase: 'bring up a concern', meaning: 'nêu một điều lo ngại' }],
        examples: [{ sentence: 'I’d like to bring up a concern before we start.', translation: 'Tôi muốn nêu một điều lo ngại trước khi chúng ta bắt đầu.' }],
      },
      {
        term: 'work out',
        phonetic: '/wɜːrk aʊt/',
        partOfSpeech: 'Cụm động từ',
        meaning: 'tìm được cách giải quyết',
        collocations: [{ phrase: 'work out a solution', meaning: 'tìm ra một giải pháp' }],
        examples: [{ sentence: 'Let’s work out a solution we can all accept.', translation: 'Cùng tìm một giải pháp mà mọi người đều chấp nhận được.' }],
        notes: 'Work out cũng có nghĩa là tập thể dục trong ngữ cảnh khác.',
      },
      {
        term: 'figure out',
        phonetic: '/ˈfɪɡjər aʊt/',
        partOfSpeech: 'Cụm động từ',
        meaning: 'tìm hiểu để hiểu ra',
        collocations: [{ phrase: 'figure out what happened', meaning: 'tìm hiểu xem chuyện gì đã xảy ra' }],
        examples: [{ sentence: 'We need to figure out what happened to the file.', translation: 'Chúng ta cần tìm hiểu xem chuyện gì đã xảy ra với tệp.' }],
      },
      {
        term: 'rule out',
        phonetic: '/ruːl aʊt/',
        partOfSpeech: 'Cụm động từ',
        meaning: 'loại trừ một khả năng',
        collocations: [{ phrase: 'rule out a mistake', meaning: 'loại trừ khả năng có sai sót' }],
        examples: [{ sentence: 'Can we rule out a mistake in the data?', translation: 'Mình có thể loại trừ khả năng sai sót trong dữ liệu không?' }],
      },
      {
        term: 'As far as I know',
        phonetic: '/æz fɑːr æz aɪ noʊ/',
        partOfSpeech: 'Mẫu câu',
        meaning: 'Theo những gì tôi biết',
        collocations: [{ phrase: 'As far as I know, that’s correct.', meaning: 'Theo tôi biết thì điều đó đúng.' }],
        examples: [{ sentence: 'As far as I know, the deadline hasn’t changed.', translation: 'Theo tôi biết thì hạn chót chưa đổi.' }],
      },
      {
        term: "I'm leaning toward",
        phonetic: '/aɪm ˈliːnɪŋ təwɔːrd/',
        partOfSpeech: 'Mẫu câu',
        meaning: 'Tôi đang nghiêng về …',
        collocations: [{ phrase: "I'm leaning toward the first option.", meaning: 'Tôi đang nghiêng về phương án đầu tiên.' }],
        examples: [{ sentence: "I'm leaning toward moving the call to Friday.", translation: 'Tôi đang nghiêng về việc chuyển cuộc gọi sang thứ Sáu.' }],
      },
    ],
  },
  {
    id: 'deck-en-b1-communication',
    level: 'b1',
    title: 'Trình bày quan điểm và kết nối ý',
    description: 'Diễn đạt lập luận rõ ràng, so sánh phương án và tổng kết ý khi trao đổi.',
    cards: [
      {
        term: 'perspective',
        phonetic: '/pərˈspektɪv/',
        partOfSpeech: 'Danh từ',
        meaning: 'góc nhìn, cách nhìn nhận',
        collocations: [{ phrase: 'from my perspective', meaning: 'theo góc nhìn của tôi' }],
        examples: [{ sentence: 'From my perspective, a slower rollout is much safer.', translation: 'Theo góc nhìn của tôi, triển khai chậm hơn sẽ an toàn hơn nhiều.' }],
        notes: 'Thường đi trong cụm from someone’s perspective.',
      },
      {
        term: 'compromise',
        phonetic: '/ˈkɑːmprəmaɪz/',
        partOfSpeech: 'Danh từ',
        meaning: 'sự thỏa hiệp, giải pháp dung hòa',
        collocations: [{ phrase: 'reach a compromise', meaning: 'đạt được thỏa hiệp' }],
        examples: [{ sentence: 'Both teams talked for an hour and finally reached a compromise.', translation: 'Cả hai nhóm trao đổi suốt một tiếng và cuối cùng đã đạt được thỏa hiệp.' }],
      },
      {
        term: 'outcome',
        phonetic: '/ˈaʊtkʌm/',
        partOfSpeech: 'Danh từ',
        meaning: 'kết quả cuối cùng',
        collocations: [{ phrase: 'the expected outcome', meaning: 'kết quả như mong đợi' }],
        examples: [{ sentence: 'The expected outcome is a faster sign-up flow for new users.', translation: 'Kết quả kỳ vọng là quy trình đăng ký nhanh hơn cho người dùng mới.' }],
      },
      {
        term: 'drawback',
        phonetic: '/ˈdrɔːbæk/',
        partOfSpeech: 'Danh từ',
        meaning: 'hạn chế, mặt bất lợi',
        collocations: [{ phrase: 'the main drawback', meaning: 'hạn chế chính' }],
        examples: [{ sentence: 'The hotel is quiet, though the main drawback is the long walk.', translation: 'Khách sạn khá yên tĩnh, dù hạn chế chính là phải đi bộ hơi xa.' }],
      },
      {
        term: 'justify',
        phonetic: '/ˈdʒʌstɪfaɪ/',
        partOfSpeech: 'Động từ',
        meaning: 'chứng minh lý do hợp lý',
        collocations: [{ phrase: 'justify the cost', meaning: 'chứng minh chi phí là xứng đáng' }],
        examples: [{ sentence: 'We need clear numbers to justify the cost of the upgrade.', translation: 'Chúng ta cần số liệu rõ ràng để chứng minh chi phí nâng cấp là hợp lý.' }],
      },
      {
        term: 'emphasize',
        phonetic: '/ˈemfəsaɪz/',
        partOfSpeech: 'Động từ',
        meaning: 'nhấn mạnh',
        collocations: [{ phrase: 'emphasize a key point', meaning: 'nhấn mạnh một ý chính' }],
        examples: [{ sentence: 'Let me emphasize a key point before we vote on the plan.', translation: 'Để tôi nhấn mạnh một ý chính trước khi mình biểu quyết kế hoạch.' }],
      },
      {
        term: 'efficient',
        phonetic: '/ɪˈfɪʃənt/',
        partOfSpeech: 'Tính từ',
        meaning: 'hiệu quả, ít tốn thời gian và công sức',
        collocations: [{ phrase: 'an efficient workflow', meaning: 'quy trình làm việc hiệu quả' }],
        examples: [{ sentence: 'Sharing notes in one folder gives us a more efficient workflow.', translation: 'Chia sẻ ghi chú chung một thư mục giúp quy trình làm việc hiệu quả hơn.' }],
      },
      {
        term: 'point out',
        phonetic: '/pɔɪnt aʊt/',
        partOfSpeech: 'Cụm động từ',
        meaning: 'chỉ ra, lưu ý một chi tiết quan trọng',
        collocations: [{ phrase: 'point out a flaw', meaning: 'chỉ ra một thiếu sót' }],
        examples: [{ sentence: 'Thank you for taking time to point out a flaw in the schedule.', translation: 'Cảm ơn bạn đã dành thời gian chỉ ra một thiếu sót trong lịch trình.' }],
      },
      {
        term: 'follow through',
        phonetic: '/ˈfɑːloʊ θruː/',
        partOfSpeech: 'Cụm động từ',
        meaning: 'theo đuổi và làm đến nơi đến chốn',
        collocations: [{ phrase: 'follow through on a promise', meaning: 'giữ lời và làm đến cùng' }],
        examples: [{ sentence: 'A good teammate will always follow through on a promise.', translation: 'Một đồng đội đáng tin sẽ luôn làm trọn vẹn điều đã hứa.' }],
      },
      {
        term: 'in the long run',
        phonetic: '/ɪn ðə lɔːŋ rʌn/',
        partOfSpeech: 'Cụm từ',
        meaning: 'về lâu dài',
        collocations: [{ phrase: 'save time in the long run', meaning: 'tiết kiệm thời gian về lâu dài' }],
        examples: [{ sentence: 'Writing clean notes takes effort now, but it saves time in the long run.', translation: 'Ghi chép rõ ràng tốn công lúc đầu nhưng sẽ tiết kiệm thời gian về lâu dài.' }],
      },
      {
        term: 'on the other hand',
        phonetic: '/ɑːn ði ˈʌðər hænd/',
        partOfSpeech: 'Cụm từ',
        meaning: 'mặt khác (đối chiếu hai khía cạnh)',
        collocations: [{ phrase: 'on the other hand', meaning: 'mặt khác, ngược lại' }],
        examples: [{ sentence: 'The new tool is quick; on the other hand, it takes time to learn.', translation: 'Công cụ mới rất nhanh; mặt khác, mọi người cần thời gian làm quen.' }],
      },
      {
        term: 'What I mean is',
        phonetic: '/wʌt aɪ miːn ɪz/',
        partOfSpeech: 'Mẫu câu',
        meaning: 'Ý tôi là … (diễn giải rõ lại)',
        collocations: [{ phrase: 'What I mean is that…', meaning: 'Ý tôi muốn nói là…' }],
        examples: [{ sentence: 'What I mean is we should test the draft with five users first.', translation: 'Ý tôi là chúng ta nên thử bản nháp với năm người dùng trước đã.' }],
      },
    ],
  },
];

function buildEnglishWordId(deckId: string, term: string): string {
  return deckId + '-' + term.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

export const PRE_V5_ENGLISH_WORD_IDS = new Set(
  ENGLISH_TOPICS
    .filter((topic) => topic.id !== 'deck-en-b1-communication')
    .flatMap((topic) => topic.cards.map((card) => buildEnglishWordId(topic.id, card.term))),
);

function createEnglishDeck(
  { id, level, title }: { id: string; level: string; title: string },
  collection: DeckCollection,
  category: string,
  description: string,
): VocabDeck {
  return {
    id,
    level,
    category,
    collection,
    description,
    name: level === ENGLISH_PHRASAL_LEVEL ? title : level.toUpperCase() + ' · ' + title,
    language: 'en',
    isCustom: false,
    createdAt: NOW,
  };
}

function createEnglishCard(id: string, deckId: string, card: EnglishCardSeed): VocabWord {
  const extra = enrichment[id];
  const englishForms = extra?.formExamples ? { ...card.englishForms } : card.englishForms;
  if (extra?.formExamples && englishForms) {
    for (const [locale, examples] of Object.entries(extra.formExamples)) {
      const key = locale as EnglishLocale;
      englishForms[key] = { ...englishForms[key], examples };
    }
  }
  return {
    ...card,
    englishForms,
    id,
    deckId,
    language: 'en',
    examples: extra?.examples ?? card.examples,
    synonyms: extra?.synonyms ?? card.synonyms ?? [],
    antonyms: extra?.antonyms ?? card.antonyms ?? [],
    bloomLevel: 1,
    srs: createInitialSRS(NOW),
    createdAt: NOW,
  };
}

export const STARTER_ENGLISH_DECKS = ENGLISH_TOPICS.map((topic) =>
  createEnglishDeck(topic, 'situations', topic.title, topic.description),
);

export const STARTER_ENGLISH_WORDS = ENGLISH_TOPICS.flatMap((topic) =>
  topic.cards.map((card) => {
    const forms: EnglishWordForms | undefined = card.term === 'schedule' ? {
      'en-GB': { phonetic: '/ˈʃedjuːl/' },
      'en-US': { phonetic: card.phonetic },
    } : undefined;
    return createEnglishCard(buildEnglishWordId(topic.id, card.term), topic.id, { ...card, ...(forms && { englishForms: forms }) });
  }),
);

type LinkedPhrase = typeof englishCollocations[number]['cards'][number];
const LEVEL_ORDER: readonly string[] = ENGLISH_LEVELS;
const phrasesByAnchor = new Map<string, { level: string; card: LinkedPhrase }[]>();
for (const { level, cards } of englishCollocations) {
  for (const card of cards) {
    const anchor = card.anchor.toLowerCase();
    const linked = phrasesByAnchor.get(anchor) ?? [];
    linked.push({ level, card });
    phrasesByAnchor.set(anchor, linked);
  }
}

function organizeVocabularyLessons(): EnglishVocabularyLesson[] {
  const thematicLessons: EnglishVocabularyLesson[] = [];
  for (const level of ENGLISH_LEVELS) {
    const lessons = originalVocabulary.filter((lesson) => lesson.level === level);
    thematicLessons.push(...lessons.filter(({ category }) => category !== GENERAL_CATEGORY));
    const generalLessons = lessons.filter(({ category }) => category === GENERAL_CATEGORY);
    const groups = new Map<string, EnglishVocabularyRow[]>();
    for (const card of generalLessons.flatMap(({ cards }) => cards)) {
      const topic = enrichment[buildEnglishWordId('en-vocab', card.term)]?.topic ?? 'grammar';
      const group = groups.get(topic);
      if (group) group.push(card);
      else groups.set(topic, [card]);
    }
    let usedIds = 0;
    for (const [topic, cards] of groups) {
      const sections = Math.ceil(cards.length / 36);
      const category = VOCABULARY_TOPICS[topic];
      for (let section = 0; section < sections; section++) {
        const start = Math.floor(section * cards.length / sections);
        const end = Math.floor((section + 1) * cards.length / sections);
        const id = generalLessons[usedIds++]?.id ?? `deck-en-vocab-${level}-topic-${topic}-${section + 1}`;
        const title = sections > 1 ? `${category} · Bộ ${section + 1}` : category;
        thematicLessons.push({ id, level, title, category, cards: cards.slice(start, end) });
      }
    }
  }
  return thematicLessons;
}

const vocabularyLessons = organizeVocabularyLessons();
const vocabularyDecks = vocabularyLessons.map((lesson) =>
  createEnglishDeck(lesson, 'vocabulary', lesson.category, 'Từ vựng CEFR-J theo chủ đề.'),
);

const vocabularyWords = vocabularyLessons.flatMap(({ id, level, cards }) => cards.map((card) => {
  const linked = (phrasesByAnchor.get(card.term.toLowerCase()) ?? [])
    .filter((item) => LEVEL_ORDER.indexOf(item.level) <= LEVEL_ORDER.indexOf(level))
    .slice(0, 3)
    .map(({ card: phrase }) => phrase);
  const collocations = linked.map((phrase) => ({ phrase: phrase.term, meaning: phrase.meaning }));
  const examples: ExampleSentence[] = card.sentence ? [{ sentence: card.sentence, translation: card.translation ?? '' }] : [];
  const linkedExamples = linked.map((phrase) => ({ sentence: phrase.sentence, translation: phrase.translation }));
  const englishForms: EnglishWordForms = {};
  if (card.british) englishForms['en-GB'] = { phonetic: card.british };
  if (card.american) englishForms['en-US'] = { phonetic: card.american };
  if (linked.some((phrase) => phrase.american)) {
    englishForms['en-US'] = {
      ...englishForms['en-US'],
      collocations: linked.map((phrase) => ({ phrase: phrase.american?.term ?? phrase.term, meaning: phrase.meaning })),
      examples: [...examples, ...linked.map((phrase) => ({ sentence: phrase.american?.sentence ?? phrase.sentence, translation: phrase.translation }))],
    };
  }
  return createEnglishCard(buildEnglishWordId('en-vocab', card.term), id, {
    term: card.term,
    phonetic: card.phonetic ?? '',
    partOfSpeech: card.partOfSpeech,
    meaning: card.meaning,
    collocations,
    examples: [...examples, ...linkedExamples],
    englishForms: Object.keys(englishForms).length ? englishForms : undefined,
  });
}));

const collocationDecks = englishCollocations.map((lesson) =>
  createEnglishDeck(
    lesson,
    'collocations',
    lesson.title,
    'Luyện cụm từ qua nghĩa tiếng Việt và câu ví dụ song ngữ.',
  ),
);
const collocationWords = englishCollocations.flatMap(({ id, cards }) => cards.map((card) => {
  const { term, meaning, sentence, translation, american } = card;
  const englishForms: EnglishWordForms | undefined = american ? {
    'en-GB': { term },
    'en-US': {
      term: american.term,
      examples: [{ sentence: american.sentence, translation }],
    },
  } : undefined;
  return createEnglishCard(buildEnglishWordId('en-phrase', term), id, {
    term,
    phonetic: '',
    partOfSpeech: ENGLISH_COLLOCATION_POS,
    meaning,
    collocations: [],
    examples: [{ sentence, translation }],
    englishForms,
  });
}));

const regionalDecks = englishRegional.map((lesson) =>
  createEnglishDeck(
    lesson,
    'regional',
    lesson.title,
    'So sánh cách dùng, chính tả và phát âm Anh-Anh, Anh-Mỹ trong cùng một thẻ.',
  ),
);
const regionalWords = englishRegional.flatMap(({ id, cards }) => cards.map((card) => {
  const { american, british, meaning, partOfSpeech, translation, notes } = card;
  return createEnglishCard(buildEnglishWordId('en-regional', american.term), id, {
    term: american.term,
    phonetic: '',
    partOfSpeech,
    meaning,
    notes,
    collocations: [],
    examples: [{ sentence: american.sentence, translation }],
    englishForms: {
      'en-GB': {
        term: british.term,
        phonetic: british.phonetic,
        examples: [{ sentence: british.sentence, translation }],
      },
      'en-US': { term: american.term, phonetic: american.phonetic },
    },
  });
}));

const courseDecks = [...STARTER_ENGLISH_DECKS, ...collocationDecks, ...regionalDecks, ...vocabularyDecks];
const phrasalDecks = englishPhrasalVerbs.map(({ id, title, topic }) => createEnglishDeck(
  { id, title, level: ENGLISH_PHRASAL_LEVEL }, 'phrasal', topic, 'Cụm động từ theo ngữ cảnh, có câu mẫu song ngữ.',
));
const phrasalWords = englishPhrasalVerbs.flatMap(({ id, cards }) => cards.map((card) => createEnglishCard(card.id, id, {
  term: card.term,
  phonetic: '',
  partOfSpeech: 'Cụm động từ',
  meaning: card.meaning,
  collocations: [],
  examples: card.examples,
  synonyms: 'synonyms' in card ? card.synonyms : undefined,
  antonyms: 'antonyms' in card ? card.antonyms : undefined,
  notes: `${card.gloss} (PDF, trang ${card.page})`,
})));

// The original lesson membership is used only to tell old deletions from new cards.
export const ENGLISH_V7_WORD_DECK_IDS = new Map([
  ...[...STARTER_ENGLISH_WORDS, ...collocationWords, ...regionalWords].map(({ id, deckId }) => [id, deckId] as const),
  ...originalVocabulary.flatMap((deck) => deck.cards.map(({ term }) => [buildEnglishWordId('en-vocab', term), deck.id] as const)),
]);

export const ENGLISH_DECKS = [
  ...ENGLISH_LEVELS.flatMap((level) => courseDecks.filter((deck) => deck.level === level)),
  ...phrasalDecks,
];
const deckOrder = new Map(ENGLISH_DECKS.map(({ id }, index) => [id, index]));
export const ENGLISH_WORDS = [...STARTER_ENGLISH_WORDS, ...collocationWords, ...regionalWords, ...vocabularyWords, ...phrasalWords]
  .sort((a, b) => deckOrder.get(a.deckId)! - deckOrder.get(b.deckId)!);
