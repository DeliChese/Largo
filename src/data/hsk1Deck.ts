import type { VocabDeck, VocabWord } from '../types/vocab';

const NOW = Date.now();

export function createChineseCard(
  id: string,
  deckId: string,
  term: string,
  phonetic: string,
  sinoVietnamese: string,
  radical: string,
  partOfSpeech: string,
  meaning: string,
  notes: string,
  collocations: Array<{ phrase: string; meaning: string }>,
  examples: Array<{ sentence: string; translation: string }>,
  synonyms: string[],
): VocabWord {
  return {
    id,
    deckId,
    language: 'zh',
    term,
    phonetic,
    sinoVietnamese,
    radical,
    partOfSpeech,
    meaning,
    notes,
    collocations,
    examples,
    synonyms,
    bloomLevel: 1,
    srs: {
      easeFactor: 2.5,
      intervalDays: 0,
      repetitions: 0,
      lapses: 0,
      nextReviewAt: NOW,
      lastReviewedAt: null,
    },
    createdAt: NOW,
  };
}

export const HSK1_DECKS: VocabDeck[] = [
  {
    id: 'deck-hsk1-core',
    name: 'HSK 1 · Nền tảng Giao tiếp, Đại từ & Hư từ',
    description:
      'Nhóm từ trục xương sống để ghép câu tiếng Trung: đại từ xưng hô, từ để hỏi, phủ định (不/没) và trợ từ ngữ khí.',
    language: 'zh',
    category: 'HSK 1 · Chủ đề 1',
    isCustom: false,
    createdAt: NOW,
  },
  {
    id: 'deck-hsk1-actions',
    name: 'HSK 1 · Động tác Hàng ngày & Học tập',
    description:
      'Động từ tần suất cao trong giao tiếp, học tập, mua sắm và động từ năng nguyện (会, 能, 想, 要).',
    language: 'zh',
    category: 'HSK 1 · Chủ đề 2',
    isCustom: false,
    createdAt: NOW,
  },
  {
    id: 'deck-hsk1-life',
    name: 'HSK 1 · Gia đình, Thời gian & Ẩm thực',
    description:
      'Từ vựng về người thân, mốc thời gian, lượng từ căn bản (个, 本, 块, 岁) và sinh hoạt ăn uống hằng ngày.',
    language: 'zh',
    category: 'HSK 1 · Chủ đề 3',
    isCustom: false,
    createdAt: NOW,
  },
  {
    id: 'deck-hsk1-space',
    name: 'HSK 1 · Không gian, Di chuyển & Tính chất',
    description:
      'Phương vị từ, địa điểm quen thuộc, phương tiện đi lại, thời tiết và các tính từ miêu tả cốt lõi.',
    language: 'zh',
    category: 'HSK 1 · Chủ đề 4',
    isCustom: false,
    createdAt: NOW,
  },
];

export const HSK1_WORDS: VocabWord[] = [
  // ==========================================================
  // DECK 1: HSK 1 · Nền tảng Giao tiếp, Đại từ & Hư từ (20 từ)
  // ==========================================================
  createChineseCard(
    'hsk1-core-1',
    'deck-hsk1-core',
    '我们',
    'wǒmen',
    'NGÃ MÔN',
    '戈 (Qua) + 亻(Nhân)',
    'Đại từ',
    'chúng tôi, chúng ta',
    'Thêm hậu tố 们 sau đại từ nhân xưng để chỉ số nhiều (你们, 他们). Phân biệt nhẹ với 咱们 (bao gồm cả người nghe thân mật).',
    [
      { phrase: '我们一起', meaning: 'chúng ta cùng nhau' },
      { phrase: '我们班', meaning: 'lớp của chúng tôi' },
    ],
    [
      {
        sentence: '周末我们一起去图书馆复习汉语吧。(Zhōumò wǒmen yìqǐ qù túshūguǎn fùxí Hànyǔ ba.)',
        translation: 'Cuối tuần chúng ta cùng đến thư viện ôn tiếng Trung nhé.',
      },
      {
        sentence: '老师让我们先讨论一下这个问题。(Lǎoshī ràng wǒmen xiān tǎolùn yíxià zhège wèntí.)',
        translation: 'Thầy giáo bảo chúng tôi thảo luận trước về vấn đề này.',
      },
    ],
    ['咱们', '我', '大家'],
  ),
  createChineseCard(
    'hsk1-core-2',
    'deck-hsk1-core',
    '您',
    'nín',
    'NẪM',
    '亻(Nhân) + 心 (Tâm)',
    'Đại từ',
    'ngài, ông, bà, anh/chị (kính trọng)',
    'Dùng thay cho 你 khi nói chuyện với người lớn tuổi, thầy cô, khách hàng hoặc cấp trên. Lưu ý không dùng 您们 trong văn viết chuẩn.',
    [
      { phrase: '请问您', meaning: 'xin hỏi ngài / anh chị' },
      { phrase: '您贵姓', meaning: 'quý danh / họ của ngài là gì' },
    ],
    [
      {
        sentence: '王老师，您今天下午有空吗？(Wáng lǎoshī, nín jīntiān xiàwǔ yǒukòng ma?)',
        translation: 'Thầy Vương ơi, chiều nay thầy có rảnh không ạ?',
      },
      {
        sentence: '欢迎您来到我们公司参观。(Huānyíng nín láidào wǒmen gōngsī cānguān.)',
        translation: 'Chào mừng quý khách đã đến tham quan công ty chúng tôi.',
      },
    ],
    ['你', '你们'],
  ),
  createChineseCard(
    'hsk1-core-3',
    'deck-hsk1-core',
    '什么',
    'shénme',
    'THẬP MA',
    '亻(Nhân) + 丿(Phiệt)',
    'Đại từ nghi vấn',
    'cái gì, gì',
    'Trong tiếng Trung từ để hỏi đặt ở đúng vị trí của câu trả lời, không đảo lên đầu câu: 你喝什么？(Bạn uống gì?) -> 我喝茶.',
    [
      { phrase: '什么时候', meaning: 'khi nào, lúc nào' },
      { phrase: '没什么', meaning: 'không có gì đâu' },
    ],
    [
      {
        sentence: '请问，这个汉字是什么意思？(Qǐngwèn, zhège Hànzì shì shénme yìsi?)',
        translation: 'Xin hỏi, chữ Hán này có nghĩa là gì vậy?',
      },
      {
        sentence: '你周末一般做什么运动？(Nǐ zhōumò yìbān zuò shénme yùndòng?)',
        translation: 'Cuối tuần bạn thường chơi môn thể thao nào?',
      },
    ],
    ['怎么', '哪个', '多少'],
  ),
  createChineseCard(
    'hsk1-core-4',
    'deck-hsk1-core',
    '谁',
    'shéi',
    'THÙY',
    '讠(Ngôn) + 隹 (Chuy)',
    'Đại từ nghi vấn',
    'ai, người nào',
    'Có hai cách đọc là shéi (khẩu ngữ phổ biến) và shuí (văn viết). Đặt ở vị trí chủ ngữ hoặc tân ngữ tùy câu hỏi.',
    [
      { phrase: '谁的书', meaning: 'sách của ai' },
      { phrase: '找谁', meaning: 'tìm ai' },
    ],
    [
      {
        sentence: '门口站着的那位先生是谁？(Ménkǒu zhànzhe de nà wèi xiānsheng shì shéi?)',
        translation: 'Vị tiên sinh đang đứng ở cửa là ai vậy?',
      },
      {
        sentence: '下个月的比赛谁代表我们班参加？(Xià gè yuè de bǐsài shéi dàibiǎo wǒmen bān cānjiā?)',
        translation: 'Cuộc thi tháng sau ai sẽ đại diện lớp mình tham gia?',
      },
    ],
    ['哪位', '什么人'],
  ),
  createChineseCard(
    'hsk1-core-5',
    'deck-hsk1-core',
    '哪儿',
    'nǎr',
    'NA NHI',
    '口 (Khẩu) + 儿 (Nhi)',
    'Đại từ nghi vấn',
    'đâu, ở đâu',
    '哪儿 dùng phổ biến ở miền Bắc Trung Quốc, tương đương với 哪里 (nǎlǐ). Phân biệt thanh 3 哪 (nǎ: nào) với thanh 4 那 (nà: kia/đó).',
    [
      { phrase: '去哪儿', meaning: 'đi đâu' },
      { phrase: '在哪儿', meaning: 'ở đâu' },
    ],
    [
      {
        sentence: '最近的地铁站离这儿远吗，在哪儿？(Zuìjìn de dìtiězhàn lí zhèr yuǎn ma, zài nǎr?)',
        translation: 'Ga tàu điện ngầm gần nhất cách đây có xa không, ở chỗ nào vậy?',
      },
      {
        sentence: '我的钥匙刚才还放在这儿，现在去哪儿了？(Wǒ de yàoshi gāngcái hái fàng zài zhèr, xiànzài qù nǎr le?)',
        translation: 'Chìa khóa của tôi vừa mới để ở đây mà, giờ biến đi đâu mất rồi?',
      },
    ],
    ['哪里', '那儿'],
  ),
  createChineseCard(
    'hsk1-core-6',
    'deck-hsk1-core',
    '怎么',
    'zěnme',
    'CHẨM MA',
    '心 (Tâm) + 么 (Ma)',
    'Đại từ nghi vấn',
    'như thế nào, làm sao, sao lại',
    'Đứng trước động từ để hỏi cách thức (怎么去？đi bằng cách nào?) hoặc hỏi nguyên nhân ngạc nhiên (你怎么没来？sao bạn lại không đến?).',
    [
      { phrase: '怎么走', meaning: 'đi đường nào / đi thế nào' },
      { phrase: '怎么了', meaning: 'làm sao thế / có chuyện gì vậy' },
    ],
    [
      {
        sentence: '从火车站到国家图书馆怎么坐车最方便？(Cóng huǒchēzhàn dào Guójiā Túshūguǎn zěnme zuòchē zuì fāngbiàn?)',
        translation: 'Từ ga tàu hỏa đến Thư viện Quốc gia đi xe thế nào là tiện nhất?',
      },
      {
        sentence: '这个电脑突然开不了机了，怎么办？(Zhège diànnǎo tūrán kāi bù liǎo jī le, zěnmebàn?)',
        translation: 'Máy tính này tự nhiên bật không lên nữa rồi, làm sao bây giờ?',
      },
    ],
    ['怎么样', '为什么'],
  ),
  createChineseCard(
    'hsk1-core-7',
    'deck-hsk1-core',
    '多少',
    'duōshao',
    'ĐA THIỂU',
    '夕 (Tịch) + 小 (Tiểu)',
    'Đại từ nghi vấn',
    'bao nhiêu',
    'Dùng để hỏi số lượng (thường dự đoán trên 10) hoặc giá tiền: 多少钱？ Khác với 几 (thường hỏi số nhỏ hơn 10 và bắt buộc có lượng từ đi kèm).',
    [
      { phrase: '多少钱', meaning: 'bao nhiêu tiền' },
      { phrase: '多少人', meaning: 'bao nhiêu người' },
    ],
    [
      {
        sentence: '请问，这本汉越词典多少钱？(Qǐngwèn, zhè běn Hàn-Yuè cídiǎn duōshao qián?)',
        translation: 'Xin hỏi, cuốn từ điển Hán-Việt này giá bao nhiêu tiền?',
      },
      {
        sentence: '你们汉语班一共有多少名留学生？(Nǐmen Hànyǔ bān yígòng yǒu duōshao míng liúxuéshēng?)',
        translation: 'Lớp tiếng Hán của các bạn tổng cộng có bao nhiêu lưu học sinh?',
      },
    ],
    ['几', '多大'],
  ),
  createChineseCard(
    'hsk1-core-8',
    'deck-hsk1-core',
    '的',
    'de',
    'ĐÍCH',
    '白 (Bạch) + 勺 (Chước)',
    'Trợ từ kết cấu',
    'của (sở hữu, định ngữ)',
    'Nối định ngữ với danh từ trung tâm theo trật tự ngược tiếng Việt: [Bổ nghĩa] + 的 + [Danh từ]. Có thể lược bỏ khi nói về quan hệ thân thuộc (我妈妈).',
    [
      { phrase: '我的朋友', meaning: 'bạn của tôi' },
      { phrase: '新买的书', meaning: 'quyển sách mới mua' },
    ],
    [
      {
        sentence: '桌子上面那本蓝色的笔记本是我的。(Zhuōzi shàngmiàn nà běn lánsè de bǐjìběn shì wǒ de.)',
        translation: 'Quyển sổ ghi chép màu xanh ở trên bàn kia là của tôi.',
      },
      {
        sentence: '她说一口非常流利的普通话。(Tā shuō yì kǒu fēicháng liúlì de Pǔtōnghuà.)',
        translation: 'Cô ấy nói tiếng phổ thông cực kỳ lưu loát.',
      },
    ],
    ['地', '得'],
  ),
  createChineseCard(
    'hsk1-core-9',
    'deck-hsk1-core',
    '了',
    'le',
    'LIỄU',
    '乙 (Ất)',
    'Trợ từ ngữ khí / động thái',
    'rồi (hoàn thành hoặc biến đổi trạng thái)',
    'Đặt sau động từ để chỉ hành động đã hoàn thành (买了), hoặc đặt cuối câu để báo sự thay đổi trạng thái (天气冷了 Trời lạnh rồi).',
    [
      { phrase: '太好了', meaning: 'tốt quá rồi' },
      { phrase: '下雨了', meaning: 'trời mưa rồi' },
    ],
    [
      {
        sentence: '我已经把今天的生词全部复习完了。(Wǒ yǐjīng bǎ jīntiān de shēngcí quánbù fùxí wán le.)',
        translation: 'Tôi đã ôn xong toàn bộ từ mới của hôm nay rồi.',
      },
      {
        sentence: '春天气温高了，公园里的花都开了。(Chūntiān qìwēn gāo le, gōngyuán lǐ de huā dōu kāi le.)',
        translation: 'Mùa xuân nhiệt độ ấm lên rồi, hoa trong công viên đều nở cả.',
      },
    ],
    ['过', '着'],
  ),
  createChineseCard(
    'hsk1-core-10',
    'deck-hsk1-core',
    '吗',
    'ma',
    'MA',
    '口 (Khẩu) + 马 (Mã)',
    'Trợ từ nghi vấn',
    'không? (câu hỏi Có/Không)',
    'Đặt ở cuối câu trần thuật để biến thành câu hỏi Có/Không. Tuyệt đối KHÔNG dùng chung 吗 với từ để hỏi (như 什么, 谁, 哪儿).',
    [
      { phrase: '好吗', meaning: 'được không?' },
      { phrase: '真的吗', meaning: 'thật vậy sao?' },
    ],
    [
      {
        sentence: '你习惯每天早上喝一杯热茶吗？(Nǐ xíguàn měitiān zǎoshang hē yì bēi rè chá ma?)',
        translation: 'Bạn có thói quen uống một tách trà nóng mỗi sáng không?',
      },
      {
        sentence: '明天的会议大家都准备好了吗？(Míngtiān de huìyì dàjiā dōu zhǔnbèi hǎo le ma?)',
        translation: 'Cuộc họp ngày mai mọi người đều đã chuẩn bị xong chưa?',
      },
    ],
    ['呢', '吧'],
  ),
  createChineseCard(
    'hsk1-core-11',
    'deck-hsk1-core',
    '呢',
    'ne',
    'NI',
    '口 (Khẩu) + 尼 (Ni)',
    'Trợ từ',
    'thế, nhỉ, còn... thì sao?',
    'Có 2 công dụng chính: (1) Hỏi lại ngắn gọn sau danh từ/đại từ (我喜欢咖啡，你呢？); (2) Đặt cuối câu cùng 正在 để chỉ hành động đang diễn ra.',
    [
      { phrase: '你呢', meaning: 'còn bạn thì sao?' },
      { phrase: '正在看书呢', meaning: 'đang đọc sách đây' },
    ],
    [
      {
        sentence: '我已经报了名，你呢，打算参加吗？(Wǒ yǐjīng bào le míng, nǐ ne, dǎsuàn cānjiā ma?)',
        translation: 'Tôi đã đăng ký rồi, còn bạn thì sao, có dự định tham gia không?',
      },
      {
        sentence: '外面的雨还在下呢，先别急着出门。(Wàimiàn de yǔ hái zài xià ne, xiān bié jí zhe chūmén.)',
        translation: 'Bên ngoài trời vẫn đang mưa đấy, khoan vội ra ngoài.',
      },
    ],
    ['吗', '啊'],
  ),
  createChineseCard(
    'hsk1-core-12',
    'deck-hsk1-core',
    '吧',
    'ba',
    'BA',
    '口 (Khẩu) + 巴 (Ba)',
    'Trợ từ ngữ khí',
    'nhé, đi, chắc là',
    'Đặt cuối câu để diễn tả lời đề nghị mềm mỏng, rủ rê (走吧 đi thôi) hoặc sự phỏng đoán cần xác nhận (他是医生吧？Anh ấy chắc là bác sĩ nhỉ?).',
    [
      { phrase: '好吧', meaning: 'được thôi' },
      { phrase: '走吧', meaning: 'đi thôi nào' },
    ],
    [
      {
        sentence: '时间不早了，我们早点儿休息吧。(Shíjiān bù zǎo le, wǒmen zǎodiǎnr xiūxi ba.)',
        translation: 'Không còn sớm nữa đâu, chúng ta nghỉ ngơi sớm chút đi.',
      },
      {
        sentence: '外面这么冷，你多穿一件大衣吧。(Wàimiàn zhème lěng, nǐ duō chuān yí jiàn dàyī ba.)',
        translation: 'Ngoài trời lạnh thế này, bạn mặc thêm một chiếc áo khoác dài đi.',
      },
    ],
    ['吗', '啊'],
  ),
  createChineseCard(
    'hsk1-core-13',
    'deck-hsk1-core',
    '不',
    'bù',
    'BẤT',
    '一 (Nhất)',
    'Phó từ phủ định',
    'không (thói quen, hiện tại, tương lai)',
    'Phủ định ý chí, thói quen, tính chất hoặc tương lai. Lưu ý biến điệu: 不 đọc thành bú khi đứng trước âm tiết thanh 4 (如: 不是 búshì, 不要 búyào).',
    [
      { phrase: '不错', meaning: 'không tệ, khá tốt' },
      { phrase: '不知道', meaning: 'không biết' },
    ],
    [
      {
        sentence: '我平时不怎么喝咖啡，只喜欢喝乌龙茶。(Wǒ píngshí bù zěnme hē kāfēi, zhǐ xǐhuan hē wūlóngchá.)',
        translation: 'Ngày thường tôi không hay uống cà phê, chỉ thích uống trà ô long.',
      },
      {
        sentence: '这个问题不难，只要多读几遍就能看懂。(Zhège wèntí bù nán, zhǐyào duō dú jǐ biàn jiù néng kàndǒng.)',
        translation: 'Vấn đề này không khó, chỉ cần đọc thêm vài lượt là có thể hiểu được.',
      },
    ],
    ['没', '没有', '别'],
  ),
  createChineseCard(
    'hsk1-core-14',
    'deck-hsk1-core',
    '没有',
    'méiyǒu',
    'MỘT HỮU',
    '氵(Thủy) + 月 (Nguyệt)',
    'Động từ / Phó từ',
    'không có; chưa (quá khứ)',
    'Phủ định của động từ 有 (không có) hoặc phủ định hành động trong quá khứ (昨天我没有去: Hôm qua tôi đã không đi). Không dùng 不有!',
    [
      { phrase: '没有时间', meaning: 'không có thời gian' },
      { phrase: '没关系', meaning: 'không sao đâu' },
    ],
    [
      {
        sentence: '昨天晚上因为加班，我没有看那部新电影。(Zuótiān wǎnshang yīnwèi jiābān, wǒ méiyǒu kàn nà bù xīn diànyǐng.)',
        translation: 'Tối qua vì tăng ca nên tôi đã không xem bộ phim mới đó.',
      },
      {
        sentence: '别担心，这次考试没有你想象的那么难。(Bié dānxīn, zhè cì kǎoshì méiyǒu nǐ xiǎngxiàng de nàme nán.)',
        translation: 'Đừng lo, kỳ thi lần này không khó như bạn tưởng đâu.',
      },
    ],
    ['没', '不'],
  ),
  createChineseCard(
    'hsk1-core-15',
    'deck-hsk1-core',
    '很',
    'hěn',
    'HÃN',
    '彳(Sách) + 艮 (Cấn)',
    'Phó từ',
    'rất (và đệm trước tính từ)',
    'Trước tính từ làm vị ngữ trong câu khẳng định, tiếng Trung thường thêm 很 để cân bằng nhịp câu (她很高), không nhất thiết mang nghĩa quá mạnh.',
    [
      { phrase: '很好', meaning: 'rất tốt' },
      { phrase: '很重要', meaning: 'rất quan trọng' },
    ],
    [
      {
        sentence: '这家饭馆的饺子很新鲜，味道也很地道。(Zhè jiā fànguǎn de jiǎozi hěn xīnxiān, wèidào yě hěn dìdào.)',
        translation: 'Sủi cảo của quán ăn này rất tươi, hương vị cũng rất chuẩn gốc.',
      },
      {
        sentence: '刚开始学汉字时觉得很难，慢慢就习惯了。(Gāng kāishǐ xué Hànzì shí juéde hěn nán, mànmàn jiù xíguàn le.)',
        translation: 'Lúc mới bắt đầu học chữ Hán thấy rất khó, dần dần rồi cũng quen.',
      },
    ],
    ['非常', '挺', '真'],
  ),
  createChineseCard(
    'hsk1-core-16',
    'deck-hsk1-core',
    '都',
    'dōu',
    'ĐÔ',
    '者 (Giả) + 阝(Ấp)',
    'Phó từ',
    'đều, tất cả',
    'LUÔN đứng trước động từ/tính từ và sau chủ ngữ số nhiều (我们都是学生). Để chỉ phủ định một phần dùng 不都, phủ định toàn bộ dùng 都不.',
    [
      { phrase: '都喜欢', meaning: 'đều thích' },
      { phrase: '每天都', meaning: 'ngày nào cũng' },
    ],
    [
      {
        sentence: '我们班的同学对中华文化都很感兴趣。(Wǒmen bān de tóngxué duì Zhōnghuá wénhuà dōu hěn gǎn xìngqù.)',
        translation: 'Các bạn học trong lớp chúng tôi đều rất hứng thú với văn hóa Trung Hoa.',
      },
      {
        sentence: '并不是所有的问题都能立刻解决。(Bìng búshì suǒyǒu de wèntí dōu néng lìkè jiějué.)',
        translation: 'Không phải tất cả các vấn đề đều có thể giải quyết ngay lập tức.',
      },
    ],
    ['全部', '所有', '也'],
  ),
  createChineseCard(
    'hsk1-core-17',
    'deck-hsk1-core',
    '也',
    'yě',
    'DÃ',
    '乙 (Ất)',
    'Phó từ',
    'cũng',
    'Bắt buộc đứng SAU chủ ngữ và TRƯỚC động từ/phó từ khác (我也去, không nói 也我去). Khi kết hợp với 都: 也 trước 都 sau (也都是).',
    [
      { phrase: '也是', meaning: 'cũng là' },
      { phrase: '也喜欢', meaning: 'cũng thích' },
    ],
    [
      {
        sentence: '姐姐喜欢画水彩画，弟弟也对艺术很有热情。(Jiějie xǐhuan huà shuǐcǎihuà, dìdi yě duì yìshù hěn yǒu rèqíng.)',
        translation: 'Chị gái thích vẽ tranh màu nước, em trai cũng rất đam mê nghệ thuật.',
      },
      {
        sentence: '即使工作再忙，也不能忘记照顾身体。(Jíshǐ gōngzuò zài máng, yě bù néng wàngjì zhàogù shēntǐ.)',
        translation: 'Cho dù công việc bận đến đâu cũng không được quên chăm sóc sức khỏe.',
      },
    ],
    ['还', '都'],
  ),
  createChineseCard(
    'hsk1-core-18',
    'deck-hsk1-core',
    '和',
    'hé',
    'HÒA',
    '禾 (Hòa) + 口 (Khẩu)',
    'Liên từ / Giới từ',
    'và; cùng với',
    'Chỉ dùng nối DANH TỪ hoặc ĐẠI TỪ (我哥哥和妹妹), KHÔNG dùng nối hai mệnh đề động từ. Khi là giới từ: A + 和 + B + 一起 + V.',
    [
      { phrase: '我和你', meaning: 'tôi và bạn' },
      { phrase: '和朋友一起', meaning: 'cùng với bạn bè' },
    ],
    [
      {
        sentence: '我在手机上下载了中文词典和听力软件。(Wǒ zài shǒujī shàng xiàzài le Zhōngwén cídiǎn hé tīnglì ruǎnjiàn.)',
        translation: 'Tôi đã tải từ điển tiếng Trung và phần mềm luyện nghe về điện thoại.',
      },
      {
        sentence: '星期天下午我常常和家人去公园散步。(Xīngqītiān xiàwǔ wǒ chángcháng hé jiārén qù gōngyuán sànbù.)',
        translation: 'Chiều Chủ nhật tôi thường đi dạo công viên cùng người nhà.',
      },
    ],
    ['跟', '而且'],
  ),
  createChineseCard(
    'hsk1-core-19',
    'deck-hsk1-core',
    '不客气',
    'bú kèqi',
    'BẤT KHÁCH KHÍ',
    '一 + 宀 + 气',
    'Cụm giao tiếp',
    'không có gì, đừng khách sáo',
    'Câu đáp lịch sự sau khi người khác nói 谢谢. Chú ý biến điệu 不 (bù) -> bú trước thanh 4 客 (kè).',
    [
      { phrase: '别客气', meaning: 'đừng khách sáo (thân mật hơn)' },
      { phrase: '谢谢 — 不客气', meaning: 'cảm ơn — không có gì' },
    ],
    [
      {
        sentence: 'A: 谢谢你帮我修改作文。 B: 不客气，这是我应该做的。(A: Xièxie nǐ bāng wǒ xiūgǎi zuòwén. B: Bú kèqi, zhè shì wǒ yīnggāi zuò de.)',
        translation: 'A: Cảm ơn bạn đã sửa bài viết giúp mình. B: Đừng khách sáo, việc mình nên làm thôi.',
      },
      {
        sentence: '到了我家就别客气，请随便坐。(Dào le wǒ jiā jiù bié kèqi, qǐng suíbiàn zuò.)',
        translation: 'Đến nhà tôi rồi thì đừng khách sáo nhé, mời tự nhiên ngồi.',
      },
    ],
    ['别客气', '没关系'],
  ),
  createChineseCard(
    'hsk1-core-20',
    'deck-hsk1-core',
    '对不起',
    'duìbuqǐ',
    'ĐỐI BẤT KHỞI',
    '寸 + 一 + 走',
    'Động từ / Cụm giao tiếp',
    'xin lỗi, có lỗi với',
    'Dùng để xin lỗi chân thành khi làm sai hoặc phiền người khác. Câu đáp lại chuẩn là 没关系 (không sao đâu).',
    [
      { phrase: '对不起，我迟到了', meaning: 'xin lỗi, tôi đến muộn rồi' },
      { phrase: '真对不起', meaning: 'thật sự xin lỗi' },
    ],
    [
      {
        sentence: '真对不起，刚才路上堵车，让你久等了。(Zhēn duìbuqǐ, gāngcái lùshang dǔchē, ràng nǐ jiǔ děng le.)',
        translation: 'Thật sự xin lỗi, vừa nãy trên đường bị kẹt xe nên để bạn đợi lâu rồi.',
      },
      {
        sentence: '对不起，请问能再说一遍吗？我没听清楚。(Duìbuqǐ, qǐngwèn néng zài shuō yí biàn ma? Wǒ méi tīng qīngchu.)',
        translation: 'Xin lỗi, cho hỏi có thể nói lại một lần nữa không? Tôi nghe chưa rõ.',
      },
    ],
    ['不好意思', '抱歉', '没关系'],
  ),

  // ==========================================================
  // DECK 2: HSK 1 · Động tác Hàng ngày & Học tập (20 từ)
  // ==========================================================
  createChineseCard(
    'hsk1-act-1',
    'deck-hsk1-actions',
    '学习',
    'xuéxí',
    'HỌC TẬP',
    '子 (Tử) + 习 (Tập)',
    'Động từ / Danh từ',
    'học tập, nghiên cứu',
    'Động từ mang tân ngữ trực tiếp (学习中文) hoặc đứng làm danh từ (学习成绩). Khi muốn nói học từ ai đó dùng: 向 + [Ai] + 学习.',
    [
      { phrase: '学习汉语', meaning: 'học tiếng Hán' },
      { phrase: '认真学习', meaning: 'học tập nghiêm túc' },
    ],
    [
      {
        sentence: '每天坚持学习十五分钟，词汇量会明显增加。(Měitiān jiānchí xuéxí shíwǔ fēnzhōng, cíhuìliàng huì míngxiǎn zēngjiā.)',
        translation: 'Mỗi ngày kiên trì học 15 phút, vốn từ vựng sẽ tăng lên rõ rệt.',
      },
      {
        sentence: '我有很多地方需要向这位老同事学习。(Wǒ yǒu hěnduō dìfang xūyào xiàng zhè wèi lǎo tóngshì xuéxí.)',
        translation: 'Tôi có rất nhiều điều cần học hỏi từ vị đồng nghiệp lâu năm này.',
      },
    ],
    ['读书', '学', '复习'],
  ),
  createChineseCard(
    'hsk1-act-2',
    'deck-hsk1-actions',
    '认识',
    'rènshi',
    'NHẬN THỨC',
    '讠(Ngôn) + 讠(Ngôn)',
    'Động từ',
    'quen biết, nhận ra (người/chữ)',
    'Chỉ việc biết mặt/tên người (我认识他) hoặc nhận biết mặt chữ (认识汉字). Khác với 知道 (biết một thông tin, sự việc trừu tượng).',
    [
      { phrase: '很高兴认识你', meaning: 'rất vui được làm quen với bạn' },
      { phrase: '认识汉字', meaning: 'nhận biết chữ Hán' },
    ],
    [
      {
        sentence: '来到北京以后，我认识了不少热情的中国朋友。(Láidào Běijīng yǐhòu, wǒ rènshi le bùshǎo rèqíng de Zhōngguó péngyou.)',
        translation: 'Sau khi đến Bắc Kinh, tôi đã quen biết khá nhiều người bạn Trung Quốc nhiệt tình.',
      },
      {
        sentence: '虽然他只学了三个月，但已经认识三百多个汉字了。(Suīrán tā zhǐ xué le sān gè yuè, dàn yǐjīng rènshi sānbǎi duō gè Hànzì le.)',
        translation: 'Tuy anh ấy mới học 3 tháng nhưng đã nhận biết được hơn 300 chữ Hán rồi.',
      },
    ],
    ['知道', '了解', '熟悉'],
  ),
  createChineseCard(
    'hsk1-act-3',
    'deck-hsk1-actions',
    '知道',
    'zhīdào',
    'TRI ĐẠO',
    '矢 (Thỉ) + 辶 (Sước)',
    'Động từ',
    'biết, nắm được thông tin',
    'Dùng cho sự việc, thông tin, địa điểm. Phủ định là 不知道 (không nói 没知道). Dùng 知道 rồi sau đó mới phát triển thành hiểu sâu (了解).',
    [
      { phrase: '我不知道', meaning: 'tôi không biết' },
      { phrase: '谁知道', meaning: 'ai mà biết / có ai biết không' },
    ],
    [
      {
        sentence: '你知道明天上午的中文课几点开始吗？(Nǐ zhīdào míngtiān shàngwǔ de Zhōngwén kè jǐ diǎn kāishǐ ma?)',
        translation: 'Bạn có biết tiết tiếng Trung sáng mai bắt đầu lúc mấy giờ không?',
      },
      {
        sentence: '直到看了那篇新闻，我才知道这件事。(Zhídào kàn le nà piān xīnwén, wǒ cái zhīdào zhè jiàn shì.)',
        translation: 'Mãi đến khi đọc bản tin đó tôi mới biết chuyện này.',
      },
    ],
    ['认识', '明白', '了解'],
  ),
  createChineseCard(
    'hsk1-act-4',
    'deck-hsk1-actions',
    '觉得',
    'juéde',
    'GIÁC ĐẮC',
    '见 (Kiến) + 彳(Sách)',
    'Động từ',
    'cảm thấy, cho rằng (cảm quan cá nhân)',
    'Biểu đạt cảm nhận chủ quan về cơ thể hoặc đánh giá nhẹ nhàng (我觉得这个主意不错). Khi muốn nhấn mạnh quan điểm lập luận dùng 认为.',
    [
      { phrase: '我觉得很好', meaning: 'tôi thấy rất ổn' },
      { phrase: '觉得累', meaning: 'cảm thấy mệt' },
    ],
    [
      {
        sentence: '用联想部首的方法记生词，我觉得效果很不错。(Yòng liánxiǎng bùshǒu de fāngfǎ jì shēngcí, wǒ juéde xiàoguǒ hěn búcuò.)',
        translation: 'Dùng cách liên tưởng bộ thủ để nhớ từ mới, tôi thấy hiệu quả khá tốt.',
      },
      {
        sentence: '刚下了雪，外面温度低，你觉得冷吗？(Gāng xià le xuě, wàimiàn wēndù dī, nǐ juéde lěng ma?)',
        translation: 'Vừa mới có tuyết rơi, nhiệt độ bên ngoài thấp, bạn có thấy lạnh không?',
      },
    ],
    ['认为', '感觉', '以为'],
  ),
  createChineseCard(
    'hsk1-act-5',
    'deck-hsk1-actions',
    '会',
    'huì',
    'HỘI',
    '人 (Nhân) + 云 (Vân)',
    'Động từ năng nguyện',
    'biết (kỹ năng qua học tập); sẽ (phỏng đoán)',
    'Có 2 nghĩa chính: (1) Biết kỹ năng nhờ học luyện (我会说汉语); (2) Sẽ xảy ra trong tương lai hoặc phỏng đoán (明天会下雨).',
    [
      { phrase: '会说汉语', meaning: 'biết nói tiếng Hán' },
      { phrase: '会成功的', meaning: 'sẽ thành công thôi' },
    ],
    [
      {
        sentence: '只要坚持每天跟读，你的发音一定会越来越自然。(Zhǐyào jiānchí měitiān gēndú, nǐ de fāyīn yídìng huì yuè lái yuè zìrán.)',
        translation: 'Chỉ cần kiên trì đọc nhại theo mỗi ngày, phát âm của bạn chắc chắn sẽ ngày càng tự nhiên.',
      },
      {
        sentence: '他不但会说英语，还会做地道的四川菜。(Tā búdàn huì shuō Yīngyǔ, hái huì zuò dìdào de Sìchuān cài.)',
        translation: 'Anh ấy không chỉ biết nói tiếng Anh mà còn biết nấu món Tứ Xuyên chuẩn vị.',
      },
    ],
    ['能', '可以', '懂得'],
  ),
  createChineseCard(
    'hsk1-act-6',
    'deck-hsk1-actions',
    '能',
    'néng',
    'NĂNG',
    '厶 (Tư) + 月 (Nguyệt)',
    'Động từ năng nguyện',
    'có thể (năng lực hoặc điều kiện khách quan)',
    'Nhấn mạnh khả năng đạt mức độ cụ thể (他能走十公里) hoặc điều kiện cho phép (我明天能来). Hỏi xin phép lịch sự thường dùng 可以/能不能.',
    [
      { phrase: '能不能', meaning: 'có thể ... không' },
      { phrase: '能做到', meaning: 'có thể làm được' },
    ],
    [
      {
        sentence: '不好意思，明天我能早半个小时下班吗？(Bù hǎoyìsi, míngtiān wǒ néng zǎo bàn gè xiǎoshí xiàbān ma?)',
        translation: 'Ngại quá, ngày mai tôi có thể tan làm sớm nửa tiếng được không?',
      },
      {
        sentence: '这台洗衣机一次能洗八公斤衣服。(Zhè tái xǐyījī yí cì néng xǐ bā gōngjīn yīfu.)',
        translation: 'Chiếc máy giặt này một lần có thể giặt được 8 kg quần áo.',
      },
    ],
    ['可以', '能够', '会'],
  ),
  createChineseCard(
    'hsk1-act-7',
    'deck-hsk1-actions',
    '想',
    'xiǎng',
    'TƯỞNG',
    '木 (Mộc) + 心 (Tâm)',
    'Động từ',
    'muốn; nhớ nhung; suy nghĩ',
    'Trước động từ mang nghĩa "muốn/dự định" nhẹ nhàng hơn 要 (我想去旅行). Theo sau là danh từ người/nơi chốn mang nghĩa "nhớ" (我想家).',
    [
      { phrase: '想一想', meaning: 'nghĩ một chút' },
      { phrase: '想家', meaning: 'nhớ nhà' },
    ],
    [
      {
        sentence: '今年秋天我想到西安去看看历史博物馆。(Jīnniān qiūtiān wǒ xiǎng dào Xīān qù kànkan lìshǐ bówùguǎn.)',
        translation: 'Mùa thu năm nay tôi muốn đến Tây An thăm bảo tàng lịch sử.',
      },
      {
        sentence: '让我想一想，这件事情还有没有更好的办法。(Ràng wǒ xiǎng yi xiǎng, zhè jiàn shìqing hái yǒu méiyǒu gèng hǎo de bànfǎ.)',
        translation: 'Để tôi nghĩ kỹ một chút xem chuyện này còn cách nào hay hơn không.',
      },
    ],
    ['要', '打算', '思考'],
  ),
  createChineseCard(
    'hsk1-act-8',
    'deck-hsk1-actions',
    '帮忙',
    'bāngmáng',
    'BANG MANG',
    '巾 (Cân) + 忄(Tâm)',
    'Động từ ly hợp',
    'giúp đỡ, phụ giúp',
    'Là động từ LY HỢP: KHÔNG thể gắn tân ngữ trực tiếp (Sai: 帮忙我 -> Đúng: 帮我的忙 hoặc dùng 帮助我 / 帮我). Có thể chen yếu tố vào giữa: 帮个忙.',
    [
      { phrase: '帮个忙', meaning: 'giúp một tay' },
      { phrase: '谢谢帮忙', meaning: 'cảm ơn đã giúp đỡ' },
    ],
    [
      {
        sentence: '请问能帮我一个忙，把门打开一下吗？(Qǐngwèn néng bāng wǒ yí gè máng, bǎ mén dǎkāi yíxià ma?)',
        translation: 'Xin hỏi có thể giúp tôi một tay, mở cửa ra giùm chút được không?',
      },
      {
        sentence: '每次搬家，周围的朋友都会主动过来帮忙。(Měi cì bānjiā, zhōuwéi de péngyou dōu huì zhǔdòng guòlái bāngmáng.)',
        translation: 'Mỗi lần chuyển nhà, bạn bè xung quanh đều chủ động qua phụ giúp.',
      },
    ],
    ['帮助', '帮'],
  ),
  createChineseCard(
    'hsk1-act-9',
    'deck-hsk1-actions',
    '准备',
    'zhǔnbèi',
    'CHUẨN BỊ',
    '两点水 (冫) + 亻(Nhân)',
    'Động từ',
    'chuẩn bị, dự định',
    'Dùng cho hành động sắp xếp trước (准备好了) hoặc mang nghĩa "dự định làm gì" (我准备明天出发). Kết quả hoàn tất nói: 准备好了.',
    [
      { phrase: '准备好', meaning: 'chuẩn bị xong xuôi' },
      { phrase: '准备考试', meaning: 'ôn thi / chuẩn bị thi' },
    ],
    [
      {
        sentence: '出发去机场以前，记得检查护照和机票准备好了没有。(Chūfā qù jīchǎng yǐqián, jìdé jiǎnchá hùzhào hé jīpiào zhǔnbèi hǎo le méiyǒu.)',
        translation: 'Trước khi xuất phát ra sân bay, nhớ kiểm tra xem hộ chiếu và vé máy bay đã chuẩn bị xong chưa.',
      },
      {
        sentence: '她已经准备好明天上午的演讲内容了。(Tā yǐjīng zhǔnbèi hǎo míngtiān shàngwǔ de yǎnjiǎng nèiróng le.)',
        translation: 'Cô ấy đã chuẩn bị xong nội dung bài thuyết trình sáng mai rồi.',
      },
    ],
    ['打算', '计划', '预备'],
  ),
  createChineseCard(
    'hsk1-act-10',
    'deck-hsk1-actions',
    '读书',
    'dúshū',
    'ĐỘC THƯ',
    '讠(Ngôn) + 乛(Ẩt)',
    'Động từ ly hợp',
    'đọc sách; đi học (ở trường)',
    'Vừa có nghĩa đen là đọc sách (大声读书), vừa mang nghĩa đi học tại trường (他在北京读书). Khi mở rộng có thể nói 读一本书.',
    [
      { phrase: '在大学读书', meaning: 'học đại học' },
      { phrase: '喜欢读书', meaning: 'thích đọc sách' },
    ],
    [
      {
        sentence: '他哥哥在广州的一所中学读书，成绩一直很优秀。(Tā gēge zài Guǎngzhōu de yì suǒ zhōngxué dúshū, chéngjì yìzhí hěn yōuxiù.)',
        translation: 'Anh trai cậu ấy học ở một trường trung học tại Quảng Châu, thành tích luôn rất xuất sắc.',
      },
      {
        sentence: '每天晚上睡前读书半小时，是很好的放松习惯。(Měitiān wǎnshang shuìqián dúshū bàn xiǎoshí, shì hěn hǎo de fàngsōng xíguàn.)',
        translation: 'Mỗi tối đọc sách nửa tiếng trước khi ngủ là một thói quen thư giãn rất tốt.',
      },
    ],
    ['看书', '学习', '念书'],
  ),
  createChineseCard(
    'hsk1-act-11',
    'deck-hsk1-actions',
    '听见',
    'tīngjiàn',
    'THÍNH KIẾN',
    '口 (Khẩu) + 见 (Kiến)',
    'Động từ kết quả',
    'nghe thấy (kết quả của hành động nghe)',
    'Phân biệt với 听 (hành động hướng tai nghe): 听 nhưng có thể 没听见 (nghe mà không thấy gì). Tương tự với 看 vs 看见.',
    [
      { phrase: '没听见', meaning: 'không nghe thấy' },
      { phrase: '听见声音', meaning: 'nghe thấy tiếng động' },
    ],
    [
      {
        sentence: '刚才外面声音太大了，我没听见你的电话。(Gāngcái wàimiàn shēngyīn tài dà le, wǒ méi tīngjiàn nǐ de diànhuà.)',
        translation: 'Vừa nãy bên ngoài ồn quá, tôi không nghe thấy chuông điện thoại của bạn.',
      },
      {
        sentence: '清晨拉开窗户，就能听见树上的小鸟在唱歌。(Qīngchén lākāi chuānghu, jiù néng tīngjiàn shù shàng de xiǎoniǎo zài chànggē.)',
        translation: 'Sáng sớm mở cửa sổ ra là có thể nghe thấy chim non hót trên cây.',
      },
    ],
    ['听到', '听', '听清楚'],
  ),
  createChineseCard(
    'hsk1-act-12',
    'deck-hsk1-actions',
    '说话',
    'shuōhuà',
    'THUYẾT THOẠI',
    '讠(Ngôn) + 讠(Ngôn)',
    'Động từ ly hợp',
    'nói chuyện, phát biểu',
    'Không gắn nội dung nói trực tiếp sau 说话 (dùng 说 + nội dung). Để chỉ nói với ai dùng: 跟/对 + [Ai] + 说话.',
    [
      { phrase: '小声说话', meaning: 'nói chuyện nhỏ nhẹ' },
      { phrase: '跟老师说话', meaning: 'nói chuyện với thầy cô' },
    ],
    [
      {
        sentence: '图书馆里请保持安静，不要大声说话。(Túshūguǎn lǐ qǐng bǎochí ānjìng, búyào dàshēng shuōhuà.)',
        translation: 'Trong thư viện xin giữ yên tĩnh, đừng nói chuyện lớn tiếng.',
      },
      {
        sentence: '她说话总是慢慢的，让人听起来很舒服。(Tā shuōhuà zǒngshì mànmàn de, ràng rén tīng qǐlái hěn shūfu.)',
        translation: 'Cô ấy nói chuyện luôn từ tốn, khiến người nghe cảm thấy rất dễ chịu.',
      },
    ],
    ['讲话', '聊天', '说'],
  ),
  createChineseCard(
    'hsk1-act-13',
    'deck-hsk1-actions',
    '写',
    'xiě',
    'TẢ',
    '冖 (Mịch)',
    'Động từ',
    'viết, ghi chép, sáng tác',
    'Kết hợp với bổ ngữ kết quả: 写完 (viết xong), 写错 (viết sai), 写对 (viết đúng), 写下来 (viết xuống).',
    [
      { phrase: '写汉字', meaning: 'viết chữ Hán' },
      { phrase: '写下来', meaning: 'ghi chép lại' },
    ],
    [
      {
        sentence: '如果担心忘记，请把重要的日子写在本子上。(Rúguǒ dānxīn wàngjì, qǐng bǎ zhòngyào de rìzi xiě zài běnzi shàng.)',
        translation: 'Nếu sợ quên, hãy ghi những ngày quan trọng vào cuốn sổ tay.',
      },
      {
        sentence: '这篇短文你写得很有道理，语句也很通顺。(Zhè piān duǎnwén nǐ xiě de hěn yǒu dàolǐ, yǔjù yě hěn tōngshùn.)',
        translation: 'Bài văn ngắn này bạn viết rất có lý, câu chữ cũng rất trôi chảy.',
      },
    ],
    ['抄写', '记'],
  ),
  createChineseCard(
    'hsk1-act-14',
    'deck-hsk1-actions',
    '问',
    'wèn',
    'VẤN',
    '门 (Môn) + 口 (Khẩu)',
    'Động từ',
    'hỏi, hỏi thăm',
    'Cấu trúc: 问 + [Ai] + [Câu hỏi] hoặc 向 + [Ai] + 问路 (hỏi đường ai). Đáp lại lịch sự bằng 回答 (trả lời).',
    [
      { phrase: '问路', meaning: 'hỏi đường' },
      { phrase: '请问', meaning: 'xin hỏi' },
    ],
    [
      {
        sentence: '遇到不懂的语法点，一定要马上问老师。(Yùdào bù dǒng de yǔfǎdiǎn, yídìng yào mǎshàng wèn lǎoshī.)',
        translation: 'Gặp điểm ngữ pháp nào chưa hiểu nhất định phải hỏi thầy cô ngay.',
      },
      {
        sentence: '他找不到公交车站，只好停下来向路人问路。(Tā zhǎo bú dào gōngjiāochēzhàn, zhǐhǎo tíng xiàlái xiàng lùrén wènlù.)',
        translation: 'Anh ấy không tìm thấy trạm xe buýt nên đành dừng lại hỏi đường người đi bộ.',
      },
    ],
    ['请问', '打听', '回答'],
  ),
  createChineseCard(
    'hsk1-act-15',
    'deck-hsk1-actions',
    '买',
    'mǎi',
    'MÃI',
    '乛 + 头',
    'Động từ',
    'mua, sắm',
    'Phân biệt thanh 3 买 (mǎi - mua) với thanh 4 卖 (mài - bán). Cụm thường gặp: 买东西 (mua đồ), 买到 (mua được rồi).',
    [
      { phrase: '买东西', meaning: 'đi mua sắm, mua đồ' },
      { phrase: '买票', meaning: 'mua vé' },
    ],
    [
      {
        sentence: '下班以后我去超市买点新鲜水果和牛奶。(Xiàbān yǐhòu wǒ qù chāoshì mǎi diǎn xīnxiān shuǐguǒ hé niúnǎi.)',
        translation: 'Sau khi tan làm tôi đi siêu thị mua ít trái cây tươi và sữa bò.',
      },
      {
        sentence: '这趟火车的票太紧张了，我们提前一周买吧。(Zhè tàng huǒchē de piào tài jǐnzhāng le, wǒmen tíqián yì zhōu mǎi ba.)',
        translation: 'Vé chuyến tàu này khan hiếm quá, chúng ta mua trước một tuần đi.',
      },
    ],
    ['购物', '卖'],
  ),
  createChineseCard(
    'hsk1-act-16',
    'deck-hsk1-actions',
    '开',
    'kāi',
    'KHAI',
    '廾 (Củng)',
    'Động từ',
    'mở; bật (máy); lái (xe); tổ chức (họp)',
    'Động từ đa nghĩa cực phổ biến: 开门 (mở cửa), 开灯 (bật đèn), 开车 (lái xe), 开会 (họp), 开玩笑 (nói đùa). Trái nghĩa thường là 关.',
    [
      { phrase: '开车', meaning: 'lái xe ô tô' },
      { phrase: '开会', meaning: 'họp' },
    ],
    [
      {
        sentence: '屋子里太热了，请帮我把窗户打开透透气。(Wūzi lǐ tài rè le, qǐng bāng wǒ bǎ chuānghu dǎkāi tòutòuqì.)',
        translation: 'Trong phòng nóng quá, làm ơn mở giùm tôi cửa sổ cho thoáng khí.',
      },
      {
        sentence: '经理每周一早上九点都要在会议室开会。(Jīnglǐ měi zhōuyī zǎoshang jiǔ diǎn dōu yào zài huìyìshì kāihuì.)',
        translation: 'Giám đốc sáng thứ Hai nào lúc 9 giờ cũng họp tại phòng họp.',
      },
    ],
    ['打开', '关闭'],
  ),
  createChineseCard(
    'hsk1-act-17',
    'deck-hsk1-actions',
    '做',
    'zuò',
    'TÁC / TỐ',
    '亻(Nhân) + 攵 (Phộc)',
    'Động từ',
    'làm, chế biến, thực hiện',
    'Dùng cho hành động tạo tác cụ thể: 做饭 (nấu cơm), 做作业 (làm bài tập), 做笔记 (ghi chép), 做工作 (làm việc).',
    [
      { phrase: '做饭', meaning: 'nấu cơm, nấu ăn' },
      { phrase: '做作业', meaning: 'làm bài tập về nhà' },
    ],
    [
      {
        sentence: '周日不想点外卖，我想自己学做几道中国菜。(Zhōurì bù xiǎng diǎn wàimài, wǒ xiǎng zìjǐ xué zuò jǐ dào Zhōngguó cài.)',
        translation: 'Chủ nhật không muốn đặt đồ ăn ngoài, tôi muốn tự học nấu vài món Trung Hoa.',
      },
      {
        sentence: '这件事情关系到整个团队，做决定前一定要想清楚。(Zhè jiàn shìqing guānxi dào zhěnggè tuánduì, zuò juédìng qián yídìng yào xiǎng qīngchu.)',
        translation: 'Chuyện này liên quan tới cả đội nhóm, trước khi ra quyết định nhất định phải nghĩ thật kỹ.',
      },
    ],
    ['干', '办', '完成'],
  ),
  createChineseCard(
    'hsk1-act-18',
    'deck-hsk1-actions',
    '找',
    'zhǎo',
    'TRẢO',
    '扌(Thủ) + 戈 (Qua)',
    'Động từ',
    'tìm kiếm; thối lại (tiền thừa)',
    'Ngoài nghĩa tìm kiếm (找工作 tìm việc), trong mua bán 找还/找钱 là trả lại tiền thừa. 找到 là tìm thấy (kết quả thành công).',
    [
      { phrase: '找工作', meaning: 'tìm việc làm' },
      { phrase: '找到答案', meaning: 'tìm ra đáp án' },
    ],
    [
      {
        sentence: '如果你在生词本里找不到这个词，可以查一下词典。(Rúguǒ nǐ zài shēngcíběn lǐ zhǎo bú dào zhège cí, kěyǐ chá yíxià cídiǎn.)',
        translation: 'Nếu bạn tìm không thấy từ này trong sổ từ vựng thì có thể tra từ điển thử xem.',
      },
      {
        sentence: '毕业以后，他很快就找到了一家外资公司的工作。(Bìyè yǐhòu, tā hěn kuài jiù zhǎodào le yì jiā wàizī gōngsī de gōngzuò.)',
        translation: 'Sau khi tốt nghiệp, anh ấy rất nhanh đã tìm được công việc ở một công ty nước ngoài.',
      },
    ],
    ['寻找', '查'],
  ),
  createChineseCard(
    'hsk1-act-19',
    'deck-hsk1-actions',
    '休息',
    'xiūxi',
    'HƯU TỨC',
    '亻(Nhân) + 自 (Tự) + 心 (Tâm)',
    'Động từ',
    'nghỉ ngơi, giải lao',
    'Âm 息 đọc thanh nhẹ (xiūxi). Lặp lại động từ để tạo cảm giác thư giãn nhẹ nhàng: 休息休息 hoặc 休息一下.',
    [
      { phrase: '休息一下', meaning: 'nghỉ ngơi một lát' },
      { phrase: '好好休息', meaning: 'nghỉ ngơi cho khỏe' },
    ],
    [
      {
        sentence: '已经连续学习两个小时了，我们站起来休息一下吧。(Yǐjīng liánxù xuéxí liǎng gè xiǎoshí le, wǒmen zhàn qǐlái xiūxi yíxià ba.)',
        translation: 'Đã học liên tục hai tiếng đồng hồ rồi, chúng ta đứng dậy nghỉ ngơi một chút đi.',
      },
      {
        sentence: '医生建议他最近多休息，少看手机屏幕。(Yīshēng jiànyì tā zuìjìn duō xiūxi, shǎo kàn shǒujī píngmù.)',
        translation: 'Bác sĩ khuyên dạo này anh ấy nên nghỉ ngơi nhiều, bớt nhìn màn hình điện thoại.',
      },
    ],
    ['放松', '午睡'],
  ),
  createChineseCard(
    'hsk1-act-20',
    'deck-hsk1-actions',
    '记住',
    'jìzhù',
    'KÝ TRỤ',
    '讠(Ngôn) + 亻(Nhân)',
    'Động từ kết quả',
    'nhớ kỹ, ghi nhớ chắc chắn',
    '记 là hành động ghi/nhớ, bổ ngữ 住 nhấn mạnh trạng thái giữ chặt không trôi mất. Trái nghĩa: 记不住 (nhớ không nổi).',
    [
      { phrase: '记住生词', meaning: 'nhớ kỹ từ mới' },
      { phrase: '牢牢记住', meaning: 'ghi nhớ khắc cốt' },
    ],
    [
      {
        sentence: '配合例句和情景画面，我能更快记住新学的汉字。(Pèihé lìjù hé qíngjǐng huàmiàn, wǒ néng gèng kuài jìzhù xīn xué de Hànzì.)',
        translation: 'Kết hợp câu ví dụ và hình ảnh ngữ cảnh, tôi có thể nhớ nhanh hơn chữ Hán mới học.',
      },
      {
        sentence: '请记住这个门牌号，下次来的时候就不会走错了。(Qǐng jìzhù zhège ménpáihào, xià cì lái de shíhou jiù bú huì zǒu cuò le.)',
        translation: 'Xin hãy nhớ kỹ số nhà này, lần sau tới sẽ không bị đi nhầm nữa.',
      },
    ],
    ['记得', '记', '忘记'],
  ),

  // ==========================================================
  // DECK 3: HSK 1 · Gia đình, Thời gian & Ẩm thực (20 từ)
  // ==========================================================
  createChineseCard(
    'hsk1-life-1',
    'deck-hsk1-life',
    '家人',
    'jiārén',
    'GIA NHÂN',
    '宀 (Miên) + 人 (Nhân)',
    'Danh từ',
    'người nhà, thành viên gia đình',
    'Chỉ chung bố mẹ, anh chị em trong nhà. Khi muốn chỉ tổ ấm/gia đình một cách trang trọng hơn (HSK 2) dùng 家庭.',
    [
      { phrase: '和家人一起', meaning: 'cùng với người nhà' },
      { phrase: '想念家人', meaning: 'nhớ người thân' },
    ],
    [
      {
        sentence: '不管工作多忙，春节我都会回老家陪家人过年。(Bùguǎn gōngzuò duō máng, Chūnjié wǒ dōu huì huí lǎojiā péi jiārén guònián.)',
        translation: 'Bất kể công việc bận đến đâu, Tết Nguyên đán tôi đều về quê đón Tết cùng gia đình.',
      },
      {
        sentence: '她每周五晚上都给远方的家人打视频电话。(Tā měi zhōuwǔ wǎnshang dōu gěi yuǎnfāng de jiārén dǎ shìpín diànhuà.)',
        translation: 'Tối thứ Sáu nào cô ấy cũng gọi video cho người nhà ở phương xa.',
      },
    ],
    ['家庭', '家里人', '亲人'],
  ),
  createChineseCard(
    'hsk1-life-2',
    'deck-hsk1-life',
    '朋友',
    'péngyou',
    'BẰNG HỮU',
    '月 (Nguyệt) + 又 (Hựu)',
    'Danh từ',
    'bạn bè',
    'Âm 友 đọc thanh nhẹ (péngyou). Số nhiều thân mật thêm 们: 朋友们 (các bạn). Cụm phổ biến: 交朋友 (kết bạn), 老朋友 (bạn cũ).',
    [
      { phrase: '好朋友', meaning: 'bạn thân' },
      { phrase: '交朋友', meaning: 'kết bạn' },
    ],
    [
      {
        sentence: '学习一门新语言让我交到了来自不同国家的朋友。(Xuéxí yì mén xīn yǔyán ràng wǒ jiāodào le láizì bùtóng guójiā de péngyou.)',
        translation: 'Học một ngôn ngữ mới giúp tôi kết giao được bạn bè từ nhiều quốc gia khác nhau.',
      },
      {
        sentence: '真正的朋友会在你遇到困难时主动伸出援手。(Zhēnzhèng de péngyou huì zài nǐ yùdào kùnnan shí zhǔdòng shēnchū yuánshǒu.)',
        translation: 'Người bạn thực sự sẽ chủ động dang tay giúp đỡ khi bạn gặp khó khăn.',
      },
    ],
    ['同学', '同事', '老朋友'],
  ),
  createChineseCard(
    'hsk1-life-3',
    'deck-hsk1-life',
    '同学',
    'tóngxué',
    'ĐỒNG HỌC',
    '冂 (Quynh) + 子 (Tử)',
    'Danh từ',
    'bạn học, bạn cùng trường/lớp',
    'Kết hợp 同 (cùng) + động từ tạo từ chỉ người cùng nhóm: 同事 (đồng nghiệp), 同桌 (bạn cùng bàn). Dùng gọi trực tiếp các bạn cùng lớp rất tự nhiên.',
    [
      { phrase: '大学同学', meaning: 'bạn học đại học' },
      { phrase: '同学们好', meaning: 'chào các em học sinh / các bạn học' },
    ],
    [
      {
        sentence: '下课以后，我和两位同学一起去食堂吃午饭。(Xiàkè yǐhòu, wǒ hé liǎng wèi tóngxué yìqǐ qù shítáng chī wǔfàn.)',
        translation: 'Sau khi tan học, tôi cùng hai bạn học đi xuống nhà ăn dùng bữa trưa.',
      },
      {
        sentence: '虽然毕业五年了，我们老同学还是经常联系。(Suīrán bìyè wǔ nián le, wǒmen lǎo tóngxué háishi jīngcháng liánxì.)',
        translation: 'Tuy đã tốt nghiệp năm năm rồi nhưng bạn học cũ chúng tôi vẫn thường xuyên liên lạc.',
      },
    ],
    ['朋友', '学生', '同事'],
  ),
  createChineseCard(
    'hsk1-life-4',
    'deck-hsk1-life',
    '老师',
    'lǎoshī',
    'LÃO SƯ',
    '耂 (Lão) + 巾 (Cân)',
    'Danh từ',
    'giáo viên, thầy/cô giáo',
    'Gọi trực tiếp thầy/cô bằng: [Họ] + 老师 (ví dụ: 张老师 thầy/cô Trương). Nghề nghiệp có thể đi cùng lượng từ 位 để tỏ sự kính trọng.',
    [
      { phrase: '汉语老师', meaning: 'giáo viên tiếng Hán' },
      { phrase: '一位好老师', meaning: 'một người thầy tốt' },
    ],
    [
      {
        sentence: '李老师讲课非常生动，经常用日常对话帮我们练习。(Lǐ lǎoshī jiǎngkè fēicháng shēngdòng, jīngcháng yòng rìcháng duìhuà bāng wǒmen liànxí.)',
        translation: 'Cô Lý giảng bài cực kỳ sinh động, thường xuyên dùng hội thoại đời thường giúp chúng tôi luyện tập.',
      },
      {
        sentence: '为了感谢老师的教导，学生们准备了一张贺卡。(Wèile gǎnxiè lǎoshī de jiàodǎo, xuéshēngmen zhǔnbèi le yì zhāng hèkǎ.)',
        translation: 'Để cảm ơn sự chỉ dạy của thầy cô, các học sinh đã chuẩn bị một tấm thiệp chúc mừng.',
      },
    ],
    ['教师', '教授', '学生'],
  ),
  createChineseCard(
    'hsk1-life-5',
    'deck-hsk1-life',
    '现在',
    'xiànzài',
    'HIỆN TẠI',
    '王 (Ngọc) + 土 (Thổ)',
    'Danh từ chỉ thời gian',
    'bây giờ, hiện nay',
    'Danh từ chỉ thời gian đặt ở ĐẦU câu hoặc SAU chủ ngữ (我现在很忙 hoặc 现在我很忙). Không đặt ở cuối câu như tiếng Anh!',
    [
      { phrase: '现在几点', meaning: 'bây giờ mấy giờ rồi' },
      { phrase: '从现在开始', meaning: 'bắt đầu từ bây giờ' },
    ],
    [
      {
        sentence: '从现在开始养成每天复习的好习惯，一年后你会惊讶于自己的进步。(Cóng xiànzài kāishǐ yǎngchéng měitiān fùxí de hǎo xíguàn, yì nián hòu nǐ huì jīngyà yú zìjǐ de jìnbù.)',
        translation: 'Từ bây giờ bắt đầu hình thành thói quen ôn tập mỗi ngày, một năm sau bạn sẽ bất ngờ với sự tiến bộ của bản thân.',
      },
      {
        sentence: '现在外面风很大，咱们先在咖啡馆里坐一会儿。(Xiànzài wàimiàn fēng hěn dà, zánmen xiān zài kāfēiguǎn lǐ zuò yíhuìr.)',
        translation: 'Bây giờ bên ngoài gió to lắm, tụi mình ngồi lại quán cà phê một lát đã.',
      },
    ],
    ['目前', '今天', '刚才'],
  ),
  createChineseCard(
    'hsk1-life-6',
    'deck-hsk1-life',
    '时候',
    'shíhou',
    'THỜI HẬU',
    '日 (Nhật) + 亻(Nhân)',
    'Danh từ',
    'lúc, khi, khoảng thời gian',
    'Mẫu câu vàng: [Sự việc / Thời gian] + 的时候 (Khi/lúc...), ví dụ: 休息的时候 (lúc nghỉ ngơi), 小时候 (hồi nhỏ). Hỏi thời gian dùng 什么时候.',
    [
      { phrase: '什么时候', meaning: 'khi nào, bao giờ' },
      { phrase: '……的时候', meaning: 'lúc..., khi...' },
    ],
    [
      {
        sentence: '早上坐地铁上班的时候，我习惯用耳机听十分钟中文。(Zǎoshang zuò dìtiě shàngbān de shíhou, wǒ xíguàn yòng ěrjī tīng shí fēnzhōng Zhōngwén.)',
        translation: 'Buổi sáng lúc đi tàu điện ngầm đi làm, tôi quen đeo tai nghe nghe 10 phút tiếng Trung.',
      },
      {
        sentence: '你有空儿的时候，欢迎来我的新家喝茶聊天。(Nǐ yǒukòngr de shíhou, huānyíng lái wǒ de xīn jiā hēchá liáotiān.)',
        translation: 'Khi nào rảnh rỗi, hoan nghênh bạn đến nhà mới của tôi uống trà trò chuyện.',
      },
    ],
    ['时间', '小时候', '当时'],
  ),
  createChineseCard(
    'hsk1-life-7',
    'deck-hsk1-life',
    '时间',
    'shíjiān',
    'THỜI GIAN',
    '日 (Nhật) + 门 (Môn)',
    'Danh từ',
    'thời gian (khoảng thời lượng hoặc lịch trình)',
    'Phân biệt với 时候: 时间 là danh từ trừu tượng chỉ quỹ thời gian (没有时间, 节省时间), còn 时候 dùng để chỉ mốc/thời điểm (什么时候).',
    [
      { phrase: '有时间', meaning: 'có thời gian' },
      { phrase: '上课时间', meaning: 'giờ lên lớp' },
    ],
    [
      {
        sentence: '合理安排学习时间，比盲目熬夜更有效率。(Hélǐ ānpái xuéxí shíjiān, bǐ mángmù áoyè gèng yǒu xiàolǜ.)',
        translation: 'Sắp xếp thời gian học hợp lý sẽ hiệu quả hơn việc thức khuya mù quáng.',
      },
      {
        sentence: '这周实在太忙了，我连吃午饭的时间都快没有了。(Zhè zhōu shízài tài máng le, wǒ lián chī wǔfàn de shíjiān dōu kuài méiyǒu le.)',
        translation: 'Tuần này thực sự bận quá, đến thời gian ăn trưa tôi cũng sắp không có luôn.',
      },
    ],
    ['时候', '小时', '工夫'],
  ),
  createChineseCard(
    'hsk1-life-8',
    'deck-hsk1-life',
    '今天',
    'jīntiān',
    'KIM THIÊN',
    '人 (Nhân) + 大 (Đại)',
    'Danh từ chỉ thời gian',
    'hôm nay',
    'Chuỗi thời gian chuẩn theo ngày: 前天 (hôm kia) -> 昨天 (hôm qua) -> 今天 (hôm nay) -> 明天 (ngày mai) -> 后天 (ngày kia).',
    [
      { phrase: '今天早上', meaning: 'sáng hôm nay' },
      { phrase: '今天天气', meaning: 'thời tiết hôm nay' },
    ],
    [
      {
        sentence: '今天天气凉快多了，我们去河边散步吧。(Jīntiān tiānqì liángkuai duō le, wǒmen qù hébiān sànbù ba.)',
        translation: 'Thời tiết hôm nay mát mẻ hơn nhiều rồi, chúng ta ra bờ sông đi dạo đi.',
      },
      {
        sentence: '今天的课程重点是分清四个声调的变化。(Jīntiān de kèchéng zhòngdiǎn shì fēnqīng sì gè shēngdiào de biànhuà.)',
        translation: 'Trọng tâm buổi học hôm nay là phân biệt rõ sự biến đổi của bốn thanh điệu.',
      },
    ],
    ['昨天', '明天', '现在'],
  ),
  createChineseCard(
    'hsk1-life-9',
    'deck-hsk1-life',
    '小时',
    'xiǎoshí',
    'TIỂU THÌ',
    '小 (Tiểu) + 日 (Nhật)',
    'Danh từ',
    'tiếng đồng hồ, giờ (độ dài thời gian)',
    'Là khoảng thời lượng (ví dụ: 两个小时 = 2 tiếng đồng hồ), BẮT BUỘC có lượng từ 个 ở giữa số từ và 小时! Phân biệt với 点 (giờ trên đồng hồ: 两点 = 2 giờ).',
    [
      { phrase: '半个小时', meaning: 'nửa tiếng đồng hồ' },
      { phrase: '一个小时', meaning: 'một tiếng đồng hồ' },
    ],
    [
      {
        sentence: '坐高铁从上海到杭州大约只需要一个小时。(Zuò gāotiě cóng Shànghǎi dào Hángzhōu dàyuē zhǐ xūyào yí gè xiǎoshí.)',
        translation: 'Đi tàu cao tốc từ Thượng Hải tới Hàng Châu chỉ mất khoảng một tiếng đồng hồ.',
      },
      {
        sentence: '我在会议室等了半个小时，他才气喘吁吁地赶到。(Wǒ zài huìyìshì děng le bàn gè xiǎoshí, tā cái qìchuǎnxūxū de gǎndào.)',
        translation: 'Tôi đợi ở phòng họp nửa tiếng đồng hồ thì anh ấy mới hớt hải chạy tới.',
      },
    ],
    ['分钟', '钟头', '点'],
  ),
  createChineseCard(
    'hsk1-life-10',
    'deck-hsk1-life',
    '星期',
    'xīngqī',
    'TINH KỲ',
    '日 (Nhật) + 月 (Nguyệt)',
    'Danh từ',
    'tuần lễ; thứ (trong tuần)',
    'Ghép 星期 + 1~6 cho Thứ Hai đến Thứ Bảy; Chủ nhật dùng 星期日 hoặc 星期天. Khoảng lượng: 一个星期 (1 tuần), 下个星期 (tuần sau).',
    [
      { phrase: '星期天', meaning: 'Chủ nhật' },
      { phrase: '下个星期', meaning: 'tuần sau' },
    ],
    [
      {
        sentence: '这门中文课每个星期上三次，分别在周二、周四和周六。(Zhè mén Zhōngwén kè měi gè xīngqī shàng sān cì, fēnbié zài zhōuèr, zhōusì hé zhōuliù.)',
        translation: 'Môn tiếng Trung này mỗi tuần học ba buổi, lần lượt vào thứ Ba, thứ Năm và thứ Bảy.',
      },
      {
        sentence: '上个星期我和同事出差去了南方两个城市。(Shàng gè xīngqī wǒ hé tóngshì chūchāi qù le nánfāng liǎng gè chéngshì.)',
        translation: 'Tuần trước tôi và đồng nghiệp đã đi công tác ở hai thành phố phía Nam.',
      },
    ],
    ['周', '周末', '礼拜'],
  ),
  createChineseCard(
    'hsk1-life-11',
    'deck-hsk1-life',
    '个',
    'gè',
    'CÁ',
    '人 (Nhân) + 丨(Cổn)',
    'Lượng từ',
    'cái, chiếc, người (lượng từ phổ thông)',
    'Lượng từ vạn năng cho người (一个人), đồ vật không có lượng từ chuyên biệt (一个苹果, 一个问题), và giờ/tháng (一个小时, 一个月). Đọc thanh nhẹ khi nói nhanh.',
    [
      { phrase: '一个人', meaning: 'một người' },
      { phrase: '一个问题', meaning: 'một câu hỏi / vấn đề' },
    ],
    [
      {
        sentence: '我有个好主意，我们可以用卡片游戏来记新词。(Wǒ yǒu gè hǎo zhǔyi, wǒmen kěyǐ yòng kǎpiàn yóuxì lái jì xīncí.)',
        translation: 'Tôi có một ý hay, chúng ta có thể dùng trò chơi thẻ để nhớ từ mới.',
      },
      {
        sentence: '每天早上吃一个鸡蛋和一碗热粥，很有营养。(Měitiān zǎoshang chī yí gè jīdàn hé yì wǎn rè zhōu, hěn yǒu yíngyǎng.)',
        translation: 'Mỗi sáng ăn một quả trứng gà và một bát cháo nóng rất giàu dinh dưỡng.',
      },
    ],
    ['位', '本', '条'],
  ),
  createChineseCard(
    'hsk1-life-12',
    'deck-hsk1-life',
    '本',
    'běn',
    'BỔN / BẢN',
    '木 (Mộc) + 一 (Nhất)',
    'Lượng từ / Danh từ',
    'quyển, cuốn (sách, vở, từ điển)',
    'Lượng từ chuyên dùng cho các vật đóng quyển như 书, 词典, 杂志, 笔记本. Khi ghép thành 本子 là danh từ "quyển vở / sổ".',
    [
      { phrase: '一本书', meaning: 'một quyển sách' },
      { phrase: '这本词典', meaning: 'cuốn từ điển này' },
    ],
    [
      {
        sentence: '我在书店挑了三本关于中国历史和文化的书。(Wǒ zài shūdiàn tiāo le sān běn guānyú Zhōngguó lìshǐ hé wénhuà de shū.)',
        translation: 'Tôi đã chọn ở hiệu sách ba cuốn sách về lịch sử và văn hóa Trung Quốc.',
      },
      {
        sentence: '请把这本语法书借给我看几天，周末就还你。(Qǐng bǎ zhè běn yǔfǎshū jiè gěi wǒ kàn jǐ tiān, zhōumò jiù huán nǐ.)',
        translation: 'Làm ơn cho tôi mượn cuốn sách ngữ pháp này xem vài ngày, cuối tuần tôi trả bạn ngay.',
      },
    ],
    ['本子', '册', '张'],
  ),
  createChineseCard(
    'hsk1-life-13',
    'deck-hsk1-life',
    '块',
    'kuài',
    'KHỐI',
    '土 (Thổ) + 夬 (Quải)',
    'Lượng từ',
    'đồng (tiền tệ khẩu ngữ); miếng, cục',
    'Trong giao tiếp hàng ngày thay cho 元 (tệ/đồng): 十块钱 = 10 tệ. Cũng làm lượng từ cho bánh kẹo/xà phòng/đồng hồ (一块蛋糕, 一块手表).',
    [
      { phrase: '多少钱一块', meaning: 'bao nhiêu tiền một miếng/cái' },
      { phrase: '五十块钱', meaning: 'năm mươi đồng (tệ)' },
    ],
    [
      {
        sentence: '这一份牛肉炒饭只要二十五块钱，分量很足。(Zhè yí fèn niúròu chǎofàn zhǐyào èrshíwǔ kuài qián, fènliàng hěn zú.)',
        translation: 'Một suất cơm chiên bò này chỉ có 25 tệ mà phần ăn rất đầy đặn.',
      },
      {
        sentence: '桌子上还有最后一块巧克力蛋糕，你想吃吗？(Zhuōzi shàng hái yǒu zuìhòu yí kuài qiǎokèlì dàngāo, nǐ xiǎng chī ma?)',
        translation: 'Trên bàn vẫn còn miếng bánh sô-cô-la cuối cùng, bạn có muốn ăn không?',
      },
    ],
    ['元', '毛', '片'],
  ),
  createChineseCard(
    'hsk1-life-14',
    'deck-hsk1-life',
    '岁',
    'suì',
    'TUẾ',
    '山 (Sơn) + 夕 (Tịch)',
    'Lượng từ',
    'tuổi (chỉ tuổi tác)',
    'Nói tuổi trực tiếp không cần 是 hay 个: 今年二十岁 (năm nay 20 tuổi). Hỏi tuổi trẻ em dùng 几岁, người lớn lịch sự dùng 多大 hoặc 您多大年纪.',
    [
      { phrase: '几岁了', meaning: 'mấy tuổi rồi (hỏi trẻ em)' },
      { phrase: '二十多岁', meaning: 'hơn hai mươi tuổi' },
    ],
    [
      {
        sentence: '我爷爷今年七十八岁了，但每天依然坚持早起锻炼。(Wǒ yéye jīnnián qīshíbā suì le, dàn měitiān yīrán jiānchí zǎoqǐ duànliàn.)',
        translation: 'Ông nội tôi năm nay 78 tuổi rồi nhưng ngày nào vẫn kiên trì dậy sớm tập thể dục.',
      },
      {
        sentence: '这孩子才六岁就能背诵好多古诗了。(Zhè háizi cái liù suì jiù néng bèisòng hǎoduō gǔshī le.)',
        translation: 'Đứa bé này mới 6 tuổi mà đã có thể đọc thuộc rất nhiều bài thơ cổ rồi.',
      },
    ],
    ['年龄', '年', '多大'],
  ),
  createChineseCard(
    'hsk1-life-15',
    'deck-hsk1-life',
    '吃饭',
    'chīfàn',
    'NGẬT PHẠN',
    '口 (Khẩu) + 饣(Thực)',
    'Động từ ly hợp',
    'ăn cơm, dùng bữa',
    '吃 là ăn, 饭 là cơm/bữa ăn -> 吃饭 chỉ chung việc dùng bữa. Có thể tách ra: 吃早饭 (ăn sáng), 吃过饭了吗 (ăn cơm chưa?).',
    [
      { phrase: '一起吃饭', meaning: 'cùng ăn cơm' },
      { phrase: '吃晚饭', meaning: 'ăn bữa tối' },
    ],
    [
      {
        sentence: '中国人见面问候时，常常会亲切地问一句：“你吃了吗？”(Zhōngguó rén jiànmiàn wènhòu shí, chángcháng huì qīnqiè de wèn yí jù: “Nǐ chī le ma?”)',
        translation: 'Người Trung Quốc khi gặp mặt chào hỏi thường thân mật hỏi một câu: "Bạn ăn cơm chưa?".',
      },
      {
        sentence: '吃饭的时候尽量别一直看手机，这样对消化不好。(Chīfàn de shíhou jǐnliàng bié yìzhí kàn shǒujī, zhèyàng duì xiāohuà bù hǎo.)',
        translation: 'Lúc ăn cơm cố gắng đừng nhìn điện thoại suốt, như vậy không tốt cho tiêu hóa.',
      },
    ],
    ['吃', '早饭', '晚餐'],
  ),
  createChineseCard(
    'hsk1-life-16',
    'deck-hsk1-life',
    '水果',
    'shuǐguǒ',
    'THỦY QUẢ',
    '水 (Thủy) + 木 (Mộc)',
    'Danh từ',
    'hoa quả, trái cây',
    'Thường kết hợp với động từ 吃 (ăn), 买 (mua), 洗 (rửa) và tính từ 新鲜 (tươi ngon). Lượng từ dùng 种 (loại), 个 (quả), 斤 (cân = 0.5kg).',
    [
      { phrase: '新鲜水果', meaning: 'trái cây tươi' },
      { phrase: '吃水果', meaning: 'ăn hoa quả' },
    ],
    [
      {
        sentence: '夏天天气热，多吃点西瓜和苹果等水果可以补充水分。(Xiàtiān tiānqì rè, duō chī diǎn xīguā hé píngguǒ děng shuǐguǒ kěyǐ bǔchōng shuǐfèn.)',
        translation: 'Mùa hè trời nóng, ăn thêm ít hoa quả như dưa hấu và táo có thể bổ sung nước.',
      },
      {
        sentence: '菜市场早上的水果最便宜，也最新鲜。(Càishìchǎng zǎoshang de shuǐguǒ zuì piányi, yě zuì xīnxiān.)',
        translation: 'Hoa quả ở chợ vào buổi sáng vừa rẻ nhất lại vừa tươi nhất.',
      },
    ],
    ['苹果', '食物'],
  ),
  createChineseCard(
    'hsk1-life-17',
    'deck-hsk1-life',
    '茶',
    'chá',
    'TRÀ',
    '艹 (Thảo) + 木 (Mộc)',
    'Danh từ',
    'trà, nước chè',
    'Động từ đi kèm là 喝 (uống) hoặc 泡 (pha). Lượng từ: 一杯茶 (một tách/ly trà), 一壶茶 (một ấm trà). Cụm mới giới trẻ thích: 奶茶 (trà sữa).',
    [
      { phrase: '喝茶', meaning: 'uống trà' },
      { phrase: '一杯热茶', meaning: 'một tách trà nóng' },
    ],
    [
      {
        sentence: '爷爷喜欢在院子里一边喝茶，一边看早上的报纸。(Yéye xǐhuan zài yuànzi lǐ yìbiān hēchá, yìbiān kàn zǎoshang de bàozhǐ.)',
        translation: 'Ông nội thích vừa uống trà ngoài sân vừa đọc tờ báo buổi sáng.',
      },
      {
        sentence: '饭后喝一点绿茶有助于解腻，但晚上别喝太多以免睡不着。(Fànhòu hē yìdiǎn lǜchá yǒuzhùyú jiěnì, dàn wǎnshang bié hē tài duō yǐmiǎn shuì bu zháo.)',
        translation: 'Sau bữa ăn uống chút trà xanh giúp đỡ ngấy, nhưng tối đừng uống nhiều quá kẻo khó ngủ.',
      },
    ],
    ['水', '咖啡', '牛奶'],
  ),
  createChineseCard(
    'hsk1-life-18',
    'deck-hsk1-life',
    '钱',
    'qián',
    'TIỀN',
    '钅(Kim) + 戋 (Tiên)',
    'Danh từ',
    'tiền bạc',
    'Không dùng trực tiếp như lượng từ. Hỏi giá dùng 多少钱. Các động từ hay đi kèm: 花钱 (tiêu tiền), 省钱 (tiết kiệm tiền), 取钱 (rút tiền).',
    [
      { phrase: '多少钱', meaning: 'bao nhiêu tiền' },
      { phrase: '花钱', meaning: 'tiêu tiền' },
    ],
    [
      {
        sentence: '现在中国很多商店都支持手机扫码付钱，不用带现金。(Xiànzài Zhōngguó hěnduō shāngdiàn dōu zhīchí shǒujī sǎomǎ fùqián, búyòng dài xiànjīn.)',
        translation: 'Hiện nay nhiều cửa hàng ở Trung Quốc đều hỗ trợ quét mã điện thoại trả tiền, không cần mang tiền mặt.',
      },
      {
        sentence: '把钱花在学习课程和买好书上是最值得的投资。(Bǎ qián huā zài xuéxí kèchéng hé mǎi hǎoshū shàng shì zuì zhídé de tóuzī.)',
        translation: 'Tiêu tiền vào khóa học và mua sách hay là khoản đầu tư đáng giá nhất.',
      },
    ],
    ['钱包', '元', '块'],
  ),
  createChineseCard(
    'hsk1-life-19',
    'deck-hsk1-life',
    '睡觉',
    'shuìjiào',
    'THỤY GIÁC',
    '目 (Mục) + 见 (Kiến)',
    'Động từ ly hợp',
    'ngủ, đi ngủ',
    'Là động từ LY HỢP: 睡 là động từ, 觉 (jiào) là danh từ giấc ngủ -> Nói "ngủ 8 tiếng" phải tách ra: 睡了八个小时觉 (không nói 睡觉八个小时).',
    [
      { phrase: '早点睡觉', meaning: 'đi ngủ sớm' },
      { phrase: '睡好觉', meaning: 'ngủ ngon giấc' },
    ],
    [
      {
        sentence: '为了保证第二天精神好，每天最好睡够七到八个小时觉。(Wèile bǎozhèng dì èr tiān jīngshén hǎo, měitiān zuìhǎo shuì gòu qī dào bā gè xiǎoshí jiào.)',
        translation: 'Để đảm bảo hôm sau tinh thần minh mẫn, mỗi ngày tốt nhất nên ngủ đủ 7 đến 8 tiếng.',
      },
      {
        sentence: '晚上十一点以前睡觉对身体健康非常有好处。(Wǎnshang shíyī diǎn yǐqián shuìjiào duì shēntǐ jiànkāng fēicháng yǒu hǎochù.)',
        translation: 'Đi ngủ trước 11 giờ tối rất có lợi cho sức khỏe cơ thể.',
      },
    ],
    ['睡', '午睡', '起床'],
  ),
  createChineseCard(
    'hsk1-life-20',
    'deck-hsk1-life',
    '衣服',
    'yīfu',
    'Y PHỤC',
    '衤(Y) + 月 (Nguyệt)',
    'Danh từ',
    'quần áo, trang phục',
    'Lượng từ chuẩn đi kèm là 件 (一件衣服 - một cái áo/bộ đồ) hoặc 套 (一套衣服 - một bộ đồ đồng bộ). Động từ mặc là 穿, giặt là 洗, thử là 试.',
    [
      { phrase: '一件新衣服', meaning: 'một bộ/chiếc áo mới' },
      { phrase: '洗衣服', meaning: 'giặt quần áo' },
    ],
    [
      {
        sentence: '天气预报说明天会降温，快把厚一点儿的衣服找出来吧。(Tiānqì yùbào shuō míngtiān huì jiàngwēn, kuài bǎ hòu yìdiǎnr de yīfu zhǎo chūlái ba.)',
        translation: 'Dự báo thời tiết nói ngày mai trời sẽ giảm nhiệt độ, mau tìm mấy bộ đồ dày hơn ra đi.',
      },
      {
        sentence: '这件浅蓝色的衣服不仅样子大方，穿起来也很舒服。(Zhè jiàn qiǎnlánsè de yīfu bùjǐn yàngzi dàfang, chuān qǐlái yě hěn shūfu.)',
        translation: 'Chiếc áo màu xanh nhạt này không chỉ kiểu dáng thanh lịch mà mặc vào cũng rất thoải mái.',
      },
    ],
    ['大衣', '裙子', '鞋'],
  ),

  // ==========================================================
  // DECK 4: HSK 1 · Không gian, Di chuyển & Tính chất (20 từ)
  // ==========================================================
  createChineseCard(
    'hsk1-space-1',
    'deck-hsk1-space',
    '这里',
    'zhèlǐ',
    'GIÁ LÝ',
    '辶 (Sước) + 里 (Lý)',
    'Đại từ chỉ nơi chốn',
    'ở đây, nơi này',
    'Làm địa điểm theo cấu trúc: 在 + 这里 + V (hoặc từ chỉ hướng 这儿 trong khẩu ngữ miền Bắc). Trái nghĩa: 那里 (ở kia).',
    [
      { phrase: '这里的环境', meaning: 'môi trường ở đây' },
      { phrase: '来这里', meaning: 'đến đây' },
    ],
    [
      {
        sentence: '这里空气清新，周围种满了树，非常适合散步。(Zhèlǐ kōngqì qīngxīn, zhōuwéi zhòng mǎn le shù, fēicháng shìhé sànbù.)',
        translation: 'Ở đây không khí trong lành, xung quanh trồng đầy cây xanh, cực kỳ thích hợp để đi dạo.',
      },
      {
        sentence: '从这里往前走两百米，右边就能看到一家药店。(Cóng zhèlǐ wǎng qián zǒu liǎngbǎi mǐ, yòubiān jiù néng kàndào yì jiā yàodiàn.)',
        translation: 'Từ đây đi thẳng về phía trước 200 mét, bên tay phải là thấy một hiệu thuốc.',
      },
    ],
    ['这儿', '那里', '那边'],
  ),
  createChineseCard(
    'hsk1-space-2',
    'deck-hsk1-space',
    '上面',
    'shàngmiàn',
    'THƯỢNG DIỆN',
    '一 + 面',
    'Danh từ phương vị',
    'bên trên, phía trên',
    'Đặt SAU danh từ chỉ vật để xác định vị trí: [Danh từ] + 上面 (ví dụ: 桌子上面 - trên mặt bàn). Có thể rút gọn thành 上 hoặc 上边.',
    [
      { phrase: '桌子上面', meaning: 'ở trên mặt bàn' },
      { phrase: '上面的内容', meaning: 'nội dung phía trên' },
    ],
    [
      {
        sentence: '纸上面写着老师的手机号码，你别弄丢了。(Zhǐ shàngmiàn xiě zhe lǎoshī de shǒujī hàomǎ, nǐ bié nòng diū le.)',
        translation: 'Trên tờ giấy có viết số điện thoại của thầy giáo, bạn đừng làm mất nhé.',
      },
      {
        sentence: '请看黑板上面的例句，然后用自己的话造一个句子。(Qǐng kàn hēibǎn shàngmiàn de lìjù, ránhòu yòng zìjǐ de huà zào yí gè jùzi.)',
        translation: 'Hãy nhìn câu ví dụ phía trên bảng đen, sau đó tự đặt một câu theo ý mình.',
      },
    ],
    ['上边', '上', '下面'],
  ),
  createChineseCard(
    'hsk1-space-3',
    'deck-hsk1-space',
    '中间',
    'zhōngjiān',
    'TRUNG GIAN',
    '丨(Cổn) + 门 (Môn)',
    'Danh từ phương vị',
    'ở giữa, khoảng giữa',
    'Mẫu câu: A 和 B (的) 中间 (ở giữa A và B), hoặc trong thời gian chỉ quãng nghỉ giữa chừng (中间休息十分钟).',
    [
      { phrase: '坐在中间', meaning: 'ngồi ở chính giữa' },
      { phrase: '两者中间', meaning: 'giữa hai bên' },
    ],
    [
      {
        sentence: '新开的超市就在银行和医院中间，位置很显眼。(Xīn kāi de chāoshì jiù zài yínháng hé yīyuàn zhōngjiān, wèizhì hěn xiǎnyǎn.)',
        translation: 'Siêu thị mới mở nằm ngay giữa ngân hàng và bệnh viện, vị trí rất dễ thấy.',
      },
      {
        sentence: '合影的时候，大家请王老师站在最中间的位置。(Héyǐng de shíhou, dàjiā qǐng Wáng lǎoshī zhàn zài zuì zhōngjiān de wèizhì.)',
        translation: 'Lúc chụp ảnh tập thể, mọi người mời thầy Vương đứng vào vị trí chính giữa.',
      },
    ],
    ['里面', '旁边', '对面'],
  ),
  createChineseCard(
    'hsk1-space-4',
    'deck-hsk1-space',
    '旁边',
    'pángbiān',
    'BÀNG BIÊN',
    '方 (Phương) + 辶 (Sước)',
    'Danh từ phương vị',
    'bên cạnh, kế bên',
    'Theo cấu trúc: [Địa điểm/Người] + (的) 旁边, ví dụ: 学校旁边 (cạnh trường học), 我旁边 (bên cạnh tôi).',
    [
      { phrase: '学校旁边', meaning: 'bên cạnh trường học' },
      { phrase: '坐在旁边', meaning: 'ngồi kế bên' },
    ],
    [
      {
        sentence: '我家旁边新开了一家安静的书店，周末常有读者看书。(Wǒ jiā pángbiān xīn kāi le yì jiā ānjìng de shūdiàn, zhōumò cháng yǒu dúzhě kànshū.)',
        translation: 'Bên cạnh nhà tôi mới mở một hiệu sách yên tĩnh, cuối tuần thường có độc giả đến đọc sách.',
      },
      {
        sentence: '地铁出口旁边有公共自行车，骑去公司只要五分钟。(Dìtiě chūkǒu pángbiān yǒu gōnggòng zìxíngchē, qí qù gōngsī zhǐyào wǔ fēnzhōng.)',
        translation: 'Ngay cạnh lối ra tàu điện ngầm có xe đạp công cộng, đạp tới công ty chỉ mất 5 phút.',
      },
    ],
    ['边', '身边', '对面'],
  ),
  createChineseCard(
    'hsk1-space-5',
    'deck-hsk1-space',
    '回来',
    'huílái',
    'HỒI LAI',
    '囗 (Vi) + 来 (Lai)',
    'Động từ xu hướng',
    'quay về, trở lại (hướng về người nói)',
    'Phân biệt hướng tâm lý: 回来 (trở về phía người nói đang ở) vs 回去 (quay về chỗ cũ rời xa người nói). Có thể chèn địa điểm ở giữa: 回国来.',
    [
      { phrase: '几点回来', meaning: 'mấy giờ quay về' },
      { phrase: '从外地回来', meaning: 'từ tỉnh khác trở về' },
    ],
    [
      {
        sentence: '爸爸出差一个星期了，明天下午终于要回来了。(Bàba chūchāi yí gè xīngqī le, míngtiān xiàwǔ zhōngyú yào huílái le.)',
        translation: 'Bố đi công tác một tuần rồi, chiều mai cuối cùng cũng sắp về tới nhà.',
      },
      {
        sentence: '他从图书馆借了几本小说回来慢慢看。(Tā cóng túshūguǎn jiè le jǐ běn xiǎoshuō huílái mànmàn kàn.)',
        translation: 'Anh ấy mượn từ thư viện vài cuốn tiểu thuyết mang về đọc từ từ.',
      },
    ],
    ['回去', '回', '回家'],
  ),
  createChineseCard(
    'hsk1-space-6',
    'deck-hsk1-space',
    '坐',
    'zuò',
    'TỌA',
    '人 (Nhân) + 土 (Thổ)',
    'Động từ',
    'ngồi; đi (bằng phương tiện công cộng/xe lớn)',
    'Cực kỳ hữu ích cho di chuyển: 坐 + [Phương tiện] + 去 + [Nơi chốn], ví dụ 坐火车去北京, 坐出租车. Nhưng đi xe máy/xe đạp phải dùng 骑!',
    [
      { phrase: '坐地铁', meaning: 'đi tàu điện ngầm' },
      { phrase: '请坐', meaning: 'mời ngồi' },
    ],
    [
      {
        sentence: '早高峰路上容易堵车，坐地铁比坐出租车更准时。(Zǎogāofēng lùshang róngyì dǔchē, zuò dìtiě bǐ zuò chūzūchē gèng zhǔnshí.)',
        translation: 'Giờ cao điểm sáng đường dễ tắc, đi tàu điện ngầm đúng giờ hơn đi taxi.',
      },
      {
        sentence: '请大家按顺序找到自己的座位坐下来。(Qǐng dàjiā àn shùnxù zhǎodào zìjǐ de zuòwèi zuò xiàlái.)',
        translation: 'Mời mọi người theo thứ tự tìm đúng chỗ ngồi của mình rồi ngồi xuống.',
      },
    ],
    ['站', '骑', '打车'],
  ),
  createChineseCard(
    'hsk1-space-7',
    'deck-hsk1-space',
    '火车',
    'huǒchē',
    'HỎA XA',
    '火 (Hỏa) + 车 (Xa)',
    'Danh từ',
    'tàu hỏa, xe lửa',
    'Lượng từ đi kèm: 一列火车 (một đoàn tàu) hoặc 一趟火车 (một chuyến tàu). Các cụm mở rộng: 火车站 (ga tàu hỏa), 火车票 (vé tàu).',
    [
      { phrase: '坐火车', meaning: 'đi tàu hỏa' },
      { phrase: '火车站', meaning: 'ga tàu hỏa' },
    ],
    [
      {
        sentence: '坐火车旅行虽然慢一点儿，但可以欣赏沿途的自然风景。(Zuò huǒchē lǚxíng suīrán màn yìdiǎnr, dàn kěyǐ xīnshǎng yántú de zìrán fēngjǐng.)',
        translation: 'Đi du lịch bằng tàu hỏa tuy chậm một chút nhưng có thể ngắm phong cảnh thiên nhiên dọc đường.',
      },
      {
        sentence: '我们需要提前四十分钟到火车站取票和检票。(Wǒmen xūyào tíqián sìshí fēnzhōng dào huǒchēzhàn qǔpiào hé jiǎnpiào.)',
        translation: 'Chúng tôi cần có mặt ở ga tàu hỏa trước 40 phút để lấy vé và soát vé.',
      },
    ],
    ['地铁', '飞机', '汽车'],
  ),
  createChineseCard(
    'hsk1-space-8',
    'deck-hsk1-space',
    '飞机',
    'fēijī',
    'PHI CƠ',
    '飞 (Phi) + 木 (Mộc)',
    'Danh từ',
    'máy bay',
    'Lượng từ chuẩn: 一架飞机 (một chiếc máy bay). Đi máy bay nói 坐飞机 hoặc 乘飞机; sân bay là 飞机场 / 机场; cất cánh là 起飞.',
    [
      { phrase: '坐飞机', meaning: 'đi máy bay' },
      { phrase: '飞机场', meaning: 'sân bay' },
    ],
    [
      {
        sentence: '明天去北京的飞机上午九点半起飞，别起晚了。(Míngtiān qù Běijīng de fēijī shàngwǔ jiǔ diǎn bàn qǐfēi, bié qǐ wǎn le.)',
        translation: 'Chuyến bay đi Bắc Kinh ngày mai cất cánh lúc 9 giờ rưỡi sáng, đừng dậy muộn nhé.',
      },
      {
        sentence: '坐了三个小时飞机以后，我们顺利到达了目的城市。(Zuò le sān gè xiǎoshí fēijī yǐhòu, wǒmen shùnlì dàodá le mùdì chéngshì.)',
        translation: 'Sau khi bay ba tiếng đồng hồ, chúng tôi đã hạ cánh thuận lợi xuống thành phố đích.',
      },
    ],
    ['机场', '机票', '起飞'],
  ),
  createChineseCard(
    'hsk1-space-9',
    'deck-hsk1-space',
    '学校',
    'xuéxiào',
    'HỌC HIỆU',
    '子 (Tử) + 木 (Mộc)',
    'Danh từ',
    'trường học',
    'Lượng từ: 一所学校 (một ngôi trường). Phân biệt 小学 (tiểu học), 中学 (trung học), 大学 (đại học). Đi học là 上学 hoặc 去学校.',
    [
      { phrase: '在学校学习', meaning: 'học tập ở trường' },
      { phrase: '离学校很近', meaning: 'rất gần trường học' },
    ],
    [
      {
        sentence: '这所学校的校园非常漂亮，还有两个大图书馆。(Zhè suǒ xuéxiào de xiàoyuán fēicháng piàoliang, hái yǒu liǎng gè dà túshūguǎn.)',
        translation: 'Khuôn viên của ngôi trường này cực kỳ đẹp, lại còn có hai thư viện lớn.',
      },
      {
        sentence: '我家离学校只有两公里，天气好时我就走路去上学。(Wǒ jiā lí xuéxiào zhǐyǒu liǎng gōnglǐ, tiānqì hǎo shí wǒ jiù zǒulù qù shàngxué.)',
        translation: 'Nhà tôi cách trường chỉ 2 km, hôm nào trời đẹp tôi đi bộ tới trường.',
      },
    ],
    ['校园', '学院', '大学'],
  ),
  createChineseCard(
    'hsk1-space-10',
    'deck-hsk1-space',
    '医院',
    'yīyuàn',
    'Y VIỆN',
    '匚 (Phương) + 阝(Phụ)',
    'Danh từ',
    'bệnh viện',
    'Lượng từ: 一家医院 hoặc 一所医院. Khám bệnh nói 去医院看病, nhập viện là 住院, xuất viện là 出院 (HSK 2).',
    [
      { phrase: '去医院看病', meaning: 'đi bệnh viện khám bệnh' },
      { phrase: '人民医院', meaning: 'bệnh viện nhân dân' },
    ],
    [
      {
        sentence: '他今天发烧得厉害，朋友陪他去附近的医院检查一下。(Tā jīntiān fāshāo de lìhai, péngyou péi tā qù fùjìn de yīyuàn jiǎnchá yíxià.)',
        translation: 'Hôm nay anh ấy sốt cao quá, bạn bè đưa anh ấy đến bệnh viện gần đó kiểm tra.',
      },
      {
        sentence: '医院药房就在大厅左边，拿着医生写的单子就能取药。(Yīyuàn yàofáng jiù zài dàtīng zuǒbiān, názhe yīshēng xiě de dānzi jiù néng qǔyào.)',
        translation: 'Nhà thuốc bệnh viện ở ngay bên trái đại sảnh, cầm đơn bác sĩ kê là lấy được thuốc.',
      },
    ],
    ['医生', '看病', '药店'],
  ),
  createChineseCard(
    'hsk1-space-11',
    'deck-hsk1-space',
    '天气',
    'tiānqì',
    'THIÊN KHÍ',
    '大 (Đại) + 气 (Khí)',
    'Danh từ',
    'thời tiết',
    'Thường kết hợp với tính từ 好/不好, 冷/热, 凉快, 晴/多云. Mẫu câu: 今天天气怎么样？(Thời tiết hôm nay thế nào?).',
    [
      { phrase: '天气预报', meaning: 'dự báo thời tiết' },
      { phrase: '天气很舒服', meaning: 'thời tiết rất dễ chịu' },
    ],
    [
      {
        sentence: '最近早晚温差大，出门前最好看一眼天气预报。(Zuìjìn zǎowǎn wēnchā dà, chūmén qián zuìhǎo kàn yì yǎn tiānqì yùbào.)',
        translation: 'Gần đây sáng tối chênh lệch nhiệt độ lớn, trước khi ra ngoài tốt nhất xem qua dự báo thời tiết.',
      },
      {
        sentence: '秋天的天气不冷也不热，最适合去郊外爬山。(Qiūtiān de tiānqì bù lěng yě bú rè, zuì shìhé qù jiāowài páshān.)',
        translation: 'Thời tiết mùa thu không lạnh cũng không nóng, thích hợp nhất để ra ngoại ô leo núi.',
      },
    ],
    ['气温', '晴天', '下雨'],
  ),
  createChineseCard(
    'hsk1-space-12',
    'deck-hsk1-space',
    '下雨',
    'xiàyǔ',
    'HẠ VŨ',
    '一 + 雨 (Vũ)',
    'Động từ ly hợp',
    'trời mưa, đổ mưa',
    'Là động từ ly hợp (mưa rơi xuống): Có thể nói 下大雨 (mưa to), 下了一天雨 (mưa cả ngày). Nói sắp mưa dùng 快要下雨了.',
    [
      { phrase: '下大雨', meaning: 'mưa to' },
      { phrase: '快下雨了', meaning: 'trời sắp mưa rồi' },
    ],
    [
      {
        sentence: '天空中黑云越来越厚，看样子马上就要下雨了。(Tiānkōng zhōng hēiyún yuè lái yuè hòu, kàn yàngzi mǎshàng jiù yào xiàyǔ le.)',
        translation: 'Mây đen trên bầu trời ngày càng dày, trông có vẻ sắp mưa ngay rồi.',
      },
      {
        sentence: '因为突然下起了大雨，我们只好改在室内打乒乓球。(Yīnwèi tūrán xià qǐ le dàyǔ, wǒmen zhǐhǎo gǎi zài shìnèi dǎ pīngpāngqiú.)',
        translation: 'Vì bất chợt đổ mưa lớn nên chúng tôi đành đổi sang chơi bóng bàn trong nhà.',
      },
    ],
    ['下雪', '晴天', '雨'],
  ),
  createChineseCard(
    'hsk1-space-13',
    'deck-hsk1-space',
    '漂亮',
    'piàoliang',
    'PHIẾU LƯỢNG',
    '氵(Thủy) + 亠 (Đầu)',
    'Tính từ',
    'đẹp, xinh đẹp, khéo léo',
    'Dùng khen người (nữ giới, trẻ em), đồ vật, quần áo, phong cảnh hoặc hành động xuất sắc (这球打得真漂亮!). Lưu ý 亮 đọc thanh nhẹ.',
    [
      { phrase: '很漂亮', meaning: 'rất đẹp' },
      { phrase: '干得漂亮', meaning: 'làm rất xuất sắc' },
    ],
    [
      {
        sentence: '你的汉字写得越来越漂亮，笔画非常工整。(Nǐ de Hànzì xiě de yuè lái yuè piàoliang, bǐhuà fēicháng gōngzhěng.)',
        translation: 'Chữ Hán của bạn viết ngày càng đẹp, nét chữ cực kỳ ngay ngắn.',
      },
      {
        sentence: '雨后的西湖风景十分漂亮，吸引了好多游客拍照。(Yǔ hòu de Xīhú fēngjǐng shífēn piàoliang, xīyǐn le hǎoduō yóukè pāizhào.)',
        translation: 'Phong cảnh Tây Hồ sau cơn mưa đẹp vô cùng, thu hút rất nhiều du khách chụp ảnh.',
      },
    ],
    ['好看', '美丽'],
  ),
  createChineseCard(
    'hsk1-space-14',
    'deck-hsk1-space',
    '高兴',
    'gāoxìng',
    'CAO HỨNG',
    '亠 (Đầu) + 八 (Bát)',
    'Tính từ',
    'vui vẻ, phấn khởi',
    'Phổ biến trong xã giao: 很高兴认识你 (rất vui được quen bạn). Khi muốn nói vui đùa tận hưởng/hài lòng nhiều dùng 开心 (HSK 2).',
    [
      { phrase: '很高兴', meaning: 'rất vui mừng' },
      { phrase: '高高兴兴', meaning: 'vui vẻ hớn hở (AABB)' },
    ],
    [
      {
        sentence: '得知自己通过了HSK二级考试，他高兴得跳了起来。(Dézhī zìjǐ tōngguò le HSK èr jí kǎoshì, tā gāoxìng de tiào le qǐlái.)',
        translation: 'Hay tin mình đã vượt qua kỳ thi HSK cấp 2, cậu ấy vui mừng đến nhảy cẫng lên.',
      },
      {
        sentence: '今天能在这里和各位老同学重逢，我心里非常高兴。(Jīntiān néng zài zhèlǐ hé gèwèi lǎo tóngxué chóngféng, wǒ xīnlǐ fēicháng gāoxìng.)',
        translation: 'Hôm nay có thể hội ngộ các bạn học cũ tại đây, trong lòng tôi vô cùng vui sướng.',
      },
    ],
    ['开心', '快乐', '难过'],
  ),
  createChineseCard(
    'hsk1-space-15',
    'deck-hsk1-space',
    '重要',
    'zhòngyào',
    'TRỌNG YẾU',
    '丿(Phiệt) + 女 (Nữ)',
    'Tính từ',
    'quan trọng, trọng yếu',
    'Kết hợp với 对……来说 (đối với ai đó mà nói): 学外语对我来说很重要. Danh từ liên quan: 重点 (trọng điểm).',
    [
      { phrase: '非常重要', meaning: 'vô cùng quan trọng' },
      { phrase: '重要的事情', meaning: 'việc quan trọng' },
    ],
    [
      {
        sentence: '在学习语言的早期阶段，把声调读准比背大量生词更重要。(Zài xuéxí yǔyán de zǎoqī jiēduàn, bǎ shēngdiào dú zhǔn bǐ bèi dàliàng shēngcí gèng zhòngyào.)',
        translation: 'Ở giai đoạn đầu học ngôn ngữ, đọc chuẩn thanh điệu quan trọng hơn việc nhồi thật nhiều từ mới.',
      },
      {
        sentence: '有一份重要的通知，大家下班前记得查收邮件。(Yǒu yí fèn zhòngyào de tōngzhī, dàjiā xiàbān qián jìdé cháshōu yóujiàn.)',
        translation: 'Có một thông báo quan trọng, mọi người nhớ kiểm tra email trước khi tan làm.',
      },
    ],
    ['主要', '关键', '重点'],
  ),
  createChineseCard(
    'hsk1-space-16',
    'deck-hsk1-space',
    '快',
    'kuài',
    'KHOÁI',
    '忄(Tâm) + 夬 (Quải)',
    'Tính từ / Phó từ',
    'nhanh, mau; sắp sửa',
    'Ngoài nghĩa nhanh về tốc độ (跑得很快), 快 đặt trước động từ + 了 (快 + V + 了) mang nghĩa "sắp sửa xảy ra" (快要下雨了 / 快到了).',
    [
      { phrase: '快要……了', meaning: 'sắp sửa...' },
      { phrase: '快点儿', meaning: 'nhanh lên một chút' },
    ],
    [
      {
        sentence: '只要找对规律，记汉字的速度就会越来越快。(Zhǐyào zhǎo duì guīlǜ, jì Hànzì de sùdù jiù huì yuè lái yuè kuài.)',
        translation: 'Chỉ cần tìm đúng quy luật, tốc độ nhớ chữ Hán sẽ ngày càng nhanh.',
      },
      {
        sentence: '电影还有五分钟就开场了，我们快进场找座位吧。(Diànyǐng hái yǒu wǔ fēnzhōng jiù kāichǎng le, wǒmen kuài jìnchǎng zhǎo zuòwèi ba.)',
        translation: 'Phim còn 5 phút nữa là chiếu rồi, chúng ta mau vào rạp tìm chỗ ngồi đi.',
      },
    ],
    ['慢', '早', '马上'],
  ),
  createChineseCard(
    'hsk1-space-17',
    'deck-hsk1-space',
    '远',
    'yuǎn',
    'VIỄN',
    '辶 (Sước) + 元 (Nguyên)',
    'Tính từ',
    'xa, xa xôi',
    'Cấu trúc đo khoảng cách chuẩn: [Địa điểm A] + 离 + [Địa điểm B] + 很远 / 不远 (cách rất xa / không xa). Trái nghĩa: 近 (gần).',
    [
      { phrase: '离这里不远', meaning: 'cách đây không xa' },
      { phrase: '远方', meaning: 'phương xa' },
    ],
    [
      {
        sentence: '他新租的房子离公司不算太远，骑车二十分钟就到。(Tā xīn zū de fángzi lí gōngsī bú suàn tài yuǎn, qíchē èrshí fēnzhōng jiù dào.)',
        translation: 'Căn nhà anh ấy mới thuê cách công ty cũng không quá xa, đạp xe 20 phút là tới.',
      },
      {
        sentence: '天气晴朗的时候，站在山顶可以望到很远的地方。(Tiānqì qínglǎng de shíhou, zhàn zài shāndǐng kěyǐ wàngdào hěn yuǎn de dìfang.)',
        translation: 'Những hôm trời quang đãng, đứng trên đỉnh núi có thể phóng tầm mắt tới tận nơi rất xa.',
      },
    ],
    ['近', '旁边'],
  ),
  createChineseCard(
    'hsk1-space-18',
    'deck-hsk1-space',
    '好吃',
    'hǎochī',
    'HẢO NGẬT',
    '女 (Nữ) + 口 (Khẩu)',
    'Tính từ',
    'ngon miệng (đồ ăn)',
    'Cấu trúc 好 + Động từ tạo tính từ dễ/hấp dẫn: 好吃 (ngon miệng), 好喝 (ngon nước uống), 好看 (đẹp/hay xem), 好听 (hay nghe), 好玩儿 (vui chơi).',
    [
      { phrase: '特别好吃', meaning: 'đặc biệt ngon' },
      { phrase: '好吃不贵', meaning: 'ngon mà không đắt' },
    ],
    [
      {
        sentence: '妈妈做的红烧肉又香又软，比饭馆里的还要好吃。(Māma zuò de hóngshāoròu yòu xiāng yòu ruǎn, bǐ fànguǎn lǐ de hái yào hǎochī.)',
        translation: 'Món thịt kho tàu mẹ nấu vừa thơm vừa mềm, còn ngon hơn cả ở nhà hàng.',
      },
      {
        sentence: '这条小吃街的东西不但味道好吃，价格也很便宜。(Zhè tiáo xiǎochījiē de dōngxi búdàn wèidào hǎochī, jiàgé yě hěn piányi.)',
        translation: 'Đồ ăn ở phố ẩm thực này không những ngon mà giá cả cũng rất rẻ.',
      },
    ],
    ['美味', '好喝', '难吃'],
  ),
  createChineseCard(
    'hsk1-space-19',
    'deck-hsk1-space',
    '一样',
    'yíyàng',
    'NHẤT DẠNG',
    '一 + 木 (Mộc)',
    'Tính từ',
    'giống nhau, như nhau',
    'Mẫu câu so sánh ngang bằng chuẩn: A + 跟 / 和 + B + 一样 (+ Tính từ). Phủ định thêm 不 trước 一样: 不一样 (bù yíyàng).',
    [
      { phrase: '和……一样', meaning: 'giống như...' },
      { phrase: '不一样', meaning: 'không giống nhau' },
    ],
    [
      {
        sentence: '这两款词典软件的界面差不多，但功能不太一样。(Zhè liǎng kuǎn cídiǎn ruǎnjiàn de jièmiàn chàbuduō, dàn gōngnéng bú tài yíyàng.)',
        translation: 'Giao diện của hai phần mềm từ điển này xấp xỉ nhau, nhưng tính năng thì hơi khác một chút.',
      },
      {
        sentence: '妹妹和姐姐一样喜欢早上在公园跑步。(Mèimei hé jiějie yíyàng xǐhuan zǎoshang zài gōngyuán pǎobù.)',
        translation: 'Em gái cũng giống chị gái, thích chạy bộ trong công viên vào buổi sáng.',
      },
    ],
    ['相同', '同样', '不同'],
  ),
  createChineseCard(
    'hsk1-space-20',
    'deck-hsk1-space',
    '有点儿',
    'yǒudiǎnr',
    'HỮU ĐIỂM NHI',
    '月 (Nguyệt) + 灬 (Hỏa)',
    'Phó từ',
    'hơi, một chút (chỉ trạng thái)',
    'PHÂN BIỆT QUAN TRỌNG: 有(一)点儿 đứng TRƯỚC tính từ/động từ thường mang sắc thái phàn nàn, chưa ưng ý (有点儿冷, 有点儿贵). Còn 一点儿 đứng SAU tính từ để đề nghị/so sánh (便宜一点儿).',
    [
      { phrase: '有点儿难', meaning: 'hơi khó một chút' },
      { phrase: '有点儿累', meaning: 'hơi mệt chút' },
    ],
    [
      {
        sentence: '今天气温突然降了十度，屋子里感觉有点儿冷。(Jīntiān qìwēn tūrán jiàng le shí dù, wūzi lǐ gǎnjué yǒudiǎnr lěng.)',
        translation: 'Hôm nay nhiệt độ đột ngột giảm 10 độ, trong phòng cảm thấy hơi lạnh chút.',
      },
      {
        sentence: '他说汉语的速度有点儿快，我差点儿没听懂。(Tā shuō Hànyǔ de sùdù yǒudiǎnr kuài, wǒ chàdiǎnr méi tīngdǒng.)',
        translation: 'Anh ấy nói tiếng Hán tốc độ hơi nhanh, suýt nữa thì tôi nghe không hiểu.',
      },
    ],
    ['一点儿', '比较', '稍微'],
  ),
];
