import type { VocabDeck, VocabWord } from '../src/types/vocab';
import { createChineseCard } from './hsk1Deck';

const NOW = Date.now();

export const HSK2_DECKS: VocabDeck[] = [
  {
    id: 'deck-hsk2-grammar',
    name: 'HSK 2 · Liên từ, Phó từ & Cấu trúc Logic',
    description:
      'Khung xương ngữ pháp HSK 2 để nối câu phức: nhân quả (因为…所以…), nhượng bộ (虽然…但是…), tăng tiến và so sánh.',
    language: 'zh',
    category: 'HSK 2 · Chủ đề 1',
    isCustom: false,
    createdAt: NOW,
  },
  {
    id: 'deck-hsk2-mind',
    name: 'HSK 2 · Tư duy, Cảm xúc & Giao tiếp Sâu',
    description:
      'Động từ tâm lý, bày tỏ quan điểm, cảm xúc, sự đồng thuận và động lực nỗ lực trong hội thoại tự nhiên.',
    language: 'zh',
    category: 'HSK 2 · Chủ đề 2',
    isCustom: false,
    createdAt: NOW,
  },
  {
    id: 'deck-hsk2-work',
    name: 'HSK 2 · Học tập, Công việc & Tổ chức',
    description:
      'Từ vựng môi trường công sở, phương pháp học tập, kế hoạch, đánh giá kết quả và phối hợp đồng đội.',
    language: 'zh',
    category: 'HSK 2 · Chủ đề 3',
    isCustom: false,
    createdAt: NOW,
  },
  {
    id: 'deck-hsk2-lifestyle',
    name: 'HSK 2 · Đời sống, Di chuyển & Sức khỏe',
    description:
      'Giao thông đô thị, du lịch, nhà hàng, mua sắm, ngân hàng và chăm sóc sức khỏe hằng ngày.',
    language: 'zh',
    category: 'HSK 2 · Chủ đề 4',
    isCustom: false,
    createdAt: NOW,
  },
];

export const HSK2_WORDS: VocabWord[] = [
  // ==========================================================
  // DECK 1: HSK 2 · Liên từ, Phó từ & Cấu trúc Logic (20 từ)
  // ==========================================================
  createChineseCard(
    'hsk2-gram-1',
    'deck-hsk2-grammar',
    '因为',
    'yīnwèi',
    'NHÂN VÌ',
    '囗 (Vi) + 亻(Nhân)',
    'Liên từ',
    'bởi vì, do',
    'Thường đứng ở đầu vế nguyên nhân, hay đi cặp với 所以 (cho nên) ở vế kết quả. Khác với tiếng Việt có thể dùng "vì... nên...", tiếng Trung cũng giữ cặp 因为…所以… rất tự nhiên.',
    [
      { phrase: '因为…所以…', meaning: 'bởi vì… cho nên…' },
      { phrase: '因为时间不够', meaning: 'vì không đủ thời gian' },
    ],
    [
      {
        sentence: '因为今天路上堵车，所以我比平时晚到了二十分钟。(Yīnwèi jīntiān lùshang dǔchē, suǒyǐ wǒ bǐ píngshí wǎn dào le èrshí fēnzhōng.)',
        translation: 'Vì hôm nay đường kẹt xe nên tôi đến muộn hơn ngày thường 20 phút.',
      },
      {
        sentence: '大家喜欢这家小店，是因为老板对客人很热情。(Dàjiā xǐhuan zhè jiā xiǎodiàn, shì yīnwèi lǎobǎn duì kèrén hěn rèqíng.)',
        translation: 'Mọi người thích tiệm nhỏ này là vì ông chủ rất nhiệt tình với khách.',
      },
    ],
    ['由于'],
  ),
  createChineseCard(
    'hsk2-gram-2',
    'deck-hsk2-grammar',
    '所以',
    'suǒyǐ',
    'SỞ DĨ',
    '户 (Hộ) + 人 (Nhân)',
    'Liên từ',
    'cho nên, vì vậy',
    'Đặt ở đầu vế kết quả (có thể đi kèm 因为 hoặc đứng độc lập sau dấu phẩy). Lưu ý: chủ ngữ vế sau có thể đứng trước hoặc sau 所以.',
    [
      { phrase: '所以才决定', meaning: 'nên mới quyết định' },
      { phrase: '所以没去', meaning: 'cho nên đã không đi' },
    ],
    [
      {
        sentence: '明天早上要开重要会议，所以我今晚早点儿休息。(Míngtiān zǎoshang yào kāi zhòngyào huìyì, suǒyǐ wǒ jīnwǎn zǎodiǎnr xiūxi.)',
        translation: 'Sáng mai có cuộc họp quan trọng nên tối nay tôi nghỉ ngơi sớm một chút.',
      },
      {
        sentence: '这个软件操作简单，所以新同事很快就能学会。(Zhège ruǎnjiàn cāozuò jiǎndān, suǒyǐ xīn tóngshì hěn kuài jiù néng xuéhuì.)',
        translation: 'Phần mềm này thao tác đơn giản nên đồng nghiệp mới rất nhanh đã học được.',
      },
    ],
    ['因此', '于是'],
  ),
  createChineseCard(
    'hsk2-gram-3',
    'deck-hsk2-grammar',
    '虽然',
    'suīrán',
    'TUY NHIÊN',
    '虫 (Trùng) + 灬 (Hỏa)',
    'Liên từ',
    'mặc dù, tuy rằng',
    'Mở đầu vế nhượng bộ và thường phối hợp với 但是 hoặc 可是 ở vế sau. Nếu chủ ngữ hai vế giống nhau, 虽然 đặt sau chủ ngữ; nếu khác nhau, 虽然 đặt trước chủ ngữ.',
    [
      { phrase: '虽然…但是…', meaning: 'mặc dù… nhưng…' },
      { phrase: '虽然有点累', meaning: 'tuy hơi mệt một chút' },
    ],
    [
      {
        sentence: '这套教材虽然内容不长，但是每个语法点都讲得很透彻。(Zhè tào jiàocái suīrán nèiróng bù cháng, dànshì měi gè yǔfǎ diǎn dōu jiǎng de hěn tòuchè.)',
        translation: 'Bộ giáo trình này tuy nội dung không dài nhưng mỗi điểm ngữ pháp đều giảng rất kỹ.',
      },
      {
        sentence: '虽然刚搬到这座城市，他已经交到了几位好朋友。(Suīrán gāng bān dào zhè zuò chéngshì, tā yǐjīng jiāodào le jǐ wèi hǎo péngyou.)',
        translation: 'Mặc dù mới chuyển đến thành phố này, anh ấy đã kết bạn được với vài người bạn tốt.',
      },
    ],
    ['尽管'],
  ),
  createChineseCard(
    'hsk2-gram-4',
    'deck-hsk2-grammar',
    '但是',
    'dànshì',
    'ĐÃN THỊ',
    '亻(Nhân) + 日 (Nhật)',
    'Liên từ',
    'nhưng, nhưng mà',
    'Dùng ở đầu vế chuyển ý tương phản. Trong khẩu ngữ thân mật có thể rút gọn thành 但 (dàn), còn văn viết trang trọng giữ nguyên 但是.',
    [
      { phrase: '但是没关系', meaning: 'nhưng không sao cả' },
      { phrase: '但是我觉得', meaning: 'nhưng tôi cảm thấy' },
    ],
    [
      {
        sentence: '这家餐厅离地铁站有点远，但是菜的味道非常正宗。(Zhè jiā cāntīng lí dìtiězhàn yǒudiǎn yuǎn, dànshì cài de wèidào fēicháng zhèngzōng.)',
        translation: 'Nhà hàng này cách ga tàu điện ngầm hơi xa, nhưng hương vị món ăn rất chuẩn.',
      },
      {
        sentence: '我学汉语的时间不长，但是每天坚持听半小时录音。(Wǒ xué Hànyǔ de shíjiān bù cháng, dànshì měitiān jiānchí tīng bàn xiǎoshí lùyīn.)',
        translation: 'Thời gian tôi học tiếng Trung chưa lâu, nhưng mỗi ngày đều kiên trì nghe ghi âm nửa tiếng.',
      },
    ],
    ['可是', '不过'],
  ),
  createChineseCard(
    'hsk2-gram-5',
    'deck-hsk2-grammar',
    '不但',
    'búdàn',
    'BẤT ĐÃN',
    '一 (Nhất) + 亻(Nhân)',
    'Liên từ',
    'không những, không chỉ',
    'Dùng trong cấu trúc tăng tiến 不但…而且… (không những… mà còn…). Nếu cùng một chủ ngữ, 不但 đứng sau chủ ngữ; nếu hai chủ ngữ khác nhau, 不但 đứng đầu câu.',
    [
      { phrase: '不但…而且…', meaning: 'không chỉ… mà còn…' },
      { phrase: '不但便宜而且实用', meaning: 'vừa rẻ lại vừa thiết thực' },
    ],
    [
      {
        sentence: '这位老师不但发音标准，而且很懂得鼓励学生开口。(Zhè wèi lǎoshī búdàn fāyīn biāozhǔn, érqiě hěn dǒngde gǔlì xuéshēng kāikǒu.)',
        translation: 'Cô giáo này không chỉ phát âm chuẩn mà còn rất biết cách khích lệ học sinh mở miệng nói.',
      },
      {
        sentence: '早睡早起不但对皮肤好，而且能让白天精力更充沛。(Zǎo shuì zǎo qǐ búdàn duì pífū hǎo, érqiě néng ràng báitiān jīnglì gèng chōngpèi.)',
        translation: 'Ngủ sớm dậy sớm không những tốt cho da mà còn giúp ban ngày tràn đầy năng lượng hơn.',
      },
    ],
    ['不仅'],
  ),
  createChineseCard(
    'hsk2-gram-6',
    'deck-hsk2-grammar',
    '而且',
    'érqiě',
    'NHI THẢ',
    '而 (Nhi) + 一 (Nhất)',
    'Liên từ',
    'hơn nữa, mà còn',
    'Có thể đi sau 不但 để nối vế tăng tiến, hoặc đứng độc lập đầu câu/vế thứ hai để bổ sung thêm thông tin cùng chiều.',
    [
      { phrase: '而且还', meaning: 'hơn nữa còn' },
      { phrase: '价格合适而且质量好', meaning: 'giá hợp lý mà chất lượng lại tốt' },
    ],
    [
      {
        sentence: '公园里空气清新，而且早上人不多，最适合散步。(Gōngyuán lǐ kōngqì qīngxīn, érqiě zǎoshang rén bù duō, zuì shìhé sànbù.)',
        translation: 'Không khí trong công viên trong lành, hơn nữa buổi sáng ít người, thích hợp đi dạo nhất.',
      },
      {
        sentence: '这双运动鞋穿起来很轻，而且下雪天也不容易滑。(Zhè shuāng yùndòngxié chuān qǐlái hěn qīng, érqiě xiàxuětiān yě bù róngyì huá.)',
        translation: 'Đôi giày thể thao này mang rất nhẹ, mà ngày tuyết rơi cũng không dễ bị trượt.',
      },
    ],
    ['并且'],
  ),
  createChineseCard(
    'hsk2-gram-7',
    'deck-hsk2-grammar',
    '如果',
    'rúguǒ',
    'NHƯ QUẢ',
    '女 (Nữ) + 木 (Mộc)',
    'Liên từ',
    'nếu như, giả sử',
    'Đặt ở vế điều kiện, hay kết hợp với 就 (thì) hoặc 的话 ở cuối vế giả thiết: 如果…(的话)，就…',
    [
      { phrase: '如果…的话', meaning: 'nếu như…' },
      { phrase: '如果有需要', meaning: 'nếu có nhu cầu' },
    ],
    [
      {
        sentence: '如果周末天气晴朗，我们就一起去郊外爬山吧。(Rúguǒ zhōumò tiānqì qínglǎng, wǒmen jiù yìqǐ qù jiāowài páshān ba.)',
        translation: 'Nếu cuối tuần trời quang đãng thì chúng ta cùng đi ngoại thành leo núi nhé.',
      },
      {
        sentence: '你如果找不到地铁出口，可以随时给我打电话。(Nǐ rúguǒ zhǎo bu dào dìtiě chūkǒu, kěyǐ suíshí gěi wǒ dǎ diànhuà.)',
        translation: 'Nếu bạn không tìm thấy lối ra tàu điện ngầm thì cứ gọi cho tôi bất cứ lúc nào.',
      },
    ],
    ['要是', '假如'],
  ),
  createChineseCard(
    'hsk2-gram-8',
    'deck-hsk2-grammar',
    '不过',
    'búguò',
    'BẤT QUÁ',
    '一 (Nhất) + 辶 (Sước)',
    'Liên từ / Phó từ',
    'nhưng mà, tuy nhiên (nhẹ nhàng hơn 但是)',
    'Thường dùng để bổ sung một ngoại lệ nhỏ hoặc chuyển ý mềm mỏng sau lời khen/khẳng định, ngữ khí nhẹ hơn 但是.',
    [
      { phrase: '不过没关系', meaning: 'nhưng không sao đâu' },
      { phrase: '不过有一点', meaning: 'tuy nhiên có một điểm' },
    ],
    [
      {
        sentence: '这间卧室采光很好，不过楼下临街可能会有一点吵。(Zhè jiān wòshì cǎiguāng hěn hǎo, búguò lóuxià línjiē kěnéng huì yǒu yìdiǎn chǎo.)',
        translation: 'Phòng ngủ này ánh sáng rất tốt, tuy nhiên dưới lầu sát mặt đường có thể hơi ồn một chút.',
      },
      {
        sentence: '他的口语还不太流利，不过敢于和陌生人交流。(Tā de kǒuyǔ hái bú tài liúlì, búguò gǎnyú hé mòshēngrén jiāoliú.)',
        translation: 'Khẩu ngữ của anh ấy chưa lưu loát lắm, nhưng lại dám giao tiếp với người lạ.',
      },
    ],
    ['可是', '但是'],
  ),
  createChineseCard(
    'hsk2-gram-9',
    'deck-hsk2-grammar',
    '只要',
    'zhǐyào',
    'CHỈ YẾU',
    '口 (Khẩu) + 覀 (Á)',
    'Liên từ',
    'chỉ cần',
    'Nêu điều kiện đủ (khác với 只有 = chỉ có mới). Cấu trúc chuẩn: 只要 + điều kiện + 就 + kết quả.',
    [
      { phrase: '只要…就…', meaning: 'chỉ cần… là sẽ…' },
      { phrase: '只要坚持下去', meaning: 'chỉ cần kiên trì tiếp tục' },
    ],
    [
      {
        sentence: '只要每天复习十五分钟生词，一个月后就能看到明显进步。(Zhǐyào měitiān fùxí shíwǔ fēnzhōng shēngcí, yí gè yuè hòu jiù néng kàndào míngxiǎn jìnbù.)',
        translation: 'Chỉ cần mỗi ngày ôn từ mới 15 phút, sau một tháng sẽ thấy tiến bộ rõ rệt.',
      },
      {
        sentence: '只要提前网上预约，进入博物馆就不用排队等太久。(Zhǐyào tíqián wǎngshàng yùyuē, jìnrù bówùguǎn jiù bú yòng páiduì děng tài jiǔ.)',
        translation: 'Chỉ cần đặt lịch trước trên mạng, vào bảo tàng sẽ không phải xếp hàng chờ quá lâu.',
      },
    ],
    ['只有'],
  ),
  createChineseCard(
    'hsk2-gram-10',
    'deck-hsk2-grammar',
    '已经',
    'yǐjīng',
    'DĨ KINH',
    '己 (Kỷ) + 纟(Mịch)',
    'Phó từ',
    'đã, rồi',
    'Đặt trước động từ hoặc tính từ để biểu thị hành động hoặc trạng thái đã hoàn thành/xảy ra, thường đi cùng trợ từ 了 ở cuối câu. Phủ định là 还没(有)…呢.',
    [
      { phrase: '已经完成', meaning: 'đã hoàn thành' },
      { phrase: '已经习惯了', meaning: 'đã quen rồi' },
    ],
    [
      {
        sentence: '现在已经晚上十一点了，你怎么还在办公室加班？(Xiànzài yǐjīng wǎnshang shíyī diǎn le, nǐ zěnme hái zài bàngōngshì jiābān?)',
        translation: 'Bây giờ đã 11 giờ tối rồi, sao bạn vẫn còn làm thêm giờ ở văn phòng thế?',
      },
      {
        sentence: '奶奶住院一周后身体已经好多了，明天就能出院。(Nǎinai zhùyuàn yì zhōu hòu shēntǐ yǐjīng hǎo duō le, míngtiān jiù néng chūyuàn.)',
        translation: 'Sau một tuần nằm viện sức khỏe bà đã khá hơn nhiều, ngày mai có thể xuất viện rồi.',
      },
    ],
    ['早已'],
  ),
  createChineseCard(
    'hsk2-gram-11',
    'deck-hsk2-grammar',
    '刚才',
    'gāngcái',
    'CƯƠNG TÀI',
    '刂(Đao) + 扌(Thủ)',
    'Danh từ thời gian',
    'lúc nãy, vừa mới',
    'Là danh từ chỉ thời gian nên có thể đứng trước hoặc sau chủ ngữ (刚才他来了 / 他刚才来了), khác với phó từ 刚 chỉ đứng sau chủ ngữ.',
    [
      { phrase: '刚才说的', meaning: 'điều vừa nói lúc nãy' },
      { phrase: '刚才发生的事', meaning: 'chuyện vừa xảy ra lúc nãy' },
    ],
    [
      {
        sentence: '刚才前台打电话通知我们，快递已经送到楼下了。(Gāngcái qiántái dǎ diànhuà tōngzhī wǒmen, kuàidì yǐjīng sòngdào lóuxià le.)',
        translation: 'Lúc nãy lễ tân gọi điện báo chúng ta rằng bưu kiện đã được giao tới dưới lầu rồi.',
      },
      {
        sentence: '不好意思，我刚才没听清楚你问的问题，能再说一遍吗？(Bù hǎoyìsi, wǒ gāngcái méi tīng qīngchu nǐ wèn de wèntí, néng zài shuō yí biàn ma?)',
        translation: 'Ngại quá, lúc nãy tôi nghe không rõ câu hỏi của bạn, có thể nói lại một lần không?',
      },
    ],
    ['刚刚', '方才'],
  ),
  createChineseCard(
    'hsk2-gram-12',
    'deck-hsk2-grammar',
    '一直',
    'yìzhí',
    'NHẤT TRỰC',
    '一 (Nhất) + 目 (Mục)',
    'Phó từ',
    'luôn luôn, suốt, đi thẳng',
    'Mang hai nghĩa thông dụng: (1) hành động kéo dài liên tục không ngắt quãng ("suốt từ đó đến nay"), (2) chỉ hướng ("đi thẳng").',
    [
      { phrase: '一直往前走', meaning: 'đi thẳng về phía trước' },
      { phrase: '一直保持联系', meaning: 'luôn giữ liên lạc' },
    ],
    [
      {
        sentence: '从去年春天开始，他一直坚持每周跑三次步。(Cóng qùnián chūntiān kāishǐ, tā yìzhí jiānchí měi zhōu pǎo sāncì bù.)',
        translation: 'Từ mùa xuân năm ngoái, anh ấy luôn kiên trì chạy bộ 3 lần mỗi tuần.',
      },
      {
        sentence: '出门后一直往北走三百米，就能看到那家老书店。(Chūmén hòu yìzhí wǎng běi zǒu sānbǎi mǐ, jiù néng kàndào nà jiā lǎo shūdiàn.)',
        translation: 'Ra khỏi cửa rồi đi thẳng về hướng bắc 300 mét là thấy hiệu sách cũ đó.',
      },
    ],
    ['始终', '总是'],
  ),
  createChineseCard(
    'hsk2-gram-13',
    'deck-hsk2-grammar',
    '必须',
    'bìxū',
    'TẤT TU',
    '心 (Tâm) + 彡 (Sam)',
    'Phó từ / Trợ động từ',
    'nhất định phải, bắt buộc phải',
    'Mức độ bắt buộc cao (do quy định hoặc tất yếu khách quan), mạnh hơn 应该. Dạng phủ định thường dùng 不必 hoặc 不用 (chứ không dùng *不必须).',
    [
      { phrase: '必须注意', meaning: 'nhất thiết phải chú ý' },
      { phrase: '必须按时到达', meaning: 'phải đến đúng giờ' },
    ],
    [
      {
        sentence: '办理国际登机手续时，必须同时出示护照和机票。(Bànlǐ guójì dēngjī shǒuxù shí, bìxū tóngshí chūshì hùzhào hé jīpiào.)',
        translation: 'Khi làm thủ tục lên máy bay quốc tế, bắt buộc phải xuất trình cả hộ chiếu và vé máy bay.',
      },
      {
        sentence: '想提高听力水平，必须多听地道对话并及时整理笔记。(Xiǎng tígāo tīnglì shuǐpíng, bìxū duō tīng dìdào duìhuà bìng jíshí zhěnglǐ bǐjì.)',
        translation: 'Muốn nâng cao trình độ nghe hiểu thì bắt buộc phải nghe nhiều hội thoại chuẩn và ghi chú kịp thời.',
      },
    ],
    ['一定', '得'],
  ),
  createChineseCard(
    'hsk2-gram-14',
    'deck-hsk2-grammar',
    '应该',
    'yīnggāi',
    'ƯNG CAI',
    '广 (Nghiễm) + 讠(Ngôn)',
    'Động từ năng nguyện',
    'nên, phải; chắc là',
    'Dùng để khuyên nhủ về bổn phận/lẽ phải ("nên làm gì") hoặc suy đoán hợp lý ("chắc là đã đến rồi"). Phủ định là 不应该.',
    [
      { phrase: '应该提前准备', meaning: 'nên chuẩn bị trước' },
      { phrase: '应该没问题', meaning: 'chắc là không vấn đề gì' },
    ],
    [
      {
        sentence: '连续工作了两个小时，大家应该站起来活动一下身体。(Liánxù gōngzuò le liǎng gè xiǎoshí, dàjiā yīnggāi zhàn qǐlái huódòng yíxià shēntǐ.)',
        translation: 'Làm việc liên tục hai tiếng rồi, mọi người nên đứng dậy vận động cơ thể một chút.',
      },
      {
        sentence: '按照天气预报，今天下午的气温应该会慢慢回升。(Ànzhào tiānqì yùbào, jīntiān xiàwǔ de qìwēn yīnggāi huì mànmàn huíshēng.)',
        translation: 'Theo dự báo thời tiết, nhiệt độ chiều nay chắc sẽ dần tăng trở lại.',
      },
    ],
    ['应当', '该'],
  ),
  createChineseCard(
    'hsk2-gram-15',
    'deck-hsk2-grammar',
    '可能',
    'kěnéng',
    'KHẢ NĂNG',
    '口 (Khẩu) + 厶 (Tư)',
    'Động từ năng nguyện / Danh từ',
    'có thể, có lẽ; khả năng',
    'Khác với 可以 (được phép/có năng lực), 可能 chỉ xác suất xảy ra ("có lẽ/rất có khả năng"). Cũng làm danh từ trong cụm 有这个可能.',
    [
      { phrase: '很有可能', meaning: 'rất có khả năng' },
      { phrase: '可能来不及', meaning: 'có lẽ không kịp' },
    ],
    [
      {
        sentence: '天边乌云越来越厚，傍晚很有可能会下大雨。(Tiānbiān wūyún yuè lái yuè hòu, bàngwǎn hěn yǒu kěnéng huì xià dàyǔ.)',
        translation: 'Mây đen chân trời ngày càng dày, chiều tối rất có thể sẽ mưa to.',
      },
      {
        sentence: '这次方案虽然不错，但实施过程中也可能遇到新难题。(Zhè cì fāng\'àn suīrán búcuò, dàn shíshī guòchéng zhōng yě kěnéng yùdào xīn nántí.)',
        translation: 'Phương án lần này tuy khá ổn, nhưng trong quá trình triển khai cũng có thể gặp bài toán khó mới.',
      },
    ],
    ['也许', '大概'],
  ),
  createChineseCard(
    'hsk2-gram-16',
    'deck-hsk2-grammar',
    '更',
    'gèng',
    'CÁNH',
    '一 (Nhất) + 日 (Nhật)',
    'Phó từ',
    'hơn, càng thêm',
    'Dùng trước tính từ hoặc động từ tâm lý để so sánh cấp độ cao hơn ("tốt hơn nữa", "càng thích hơn"). Có thể đi với câu so sánh A 比 B 更…',
    [
      { phrase: '更清楚', meaning: 'rõ ràng hơn' },
      { phrase: '更重要的是', meaning: 'điều quan trọng hơn là' },
    ],
    [
      {
        sentence: '把重点词语整理成卡片后，背诵效率比以前更高了。(Bǎ zhòngdiǎn cíyǔ zhěnglǐ chéng kǎpiàn hòu, bèisòng xiàolǜ bǐ yǐqián gèng gāo le.)',
        translation: 'Sau khi hệ thống từ trọng điểm thành thẻ nhớ, hiệu suất học thuộc cao hơn trước nữa.',
      },
      {
        sentence: '比起在线聊天，我更喜欢和朋友面对面喝茶交流。(Bǐqǐ zàixiàn liáotiān, wǒ gèng xǐhuan hé péngyou miànduìmiàn hēchá jiāoliú.)',
        translation: 'So với nhắn tin trực tuyến, tôi thích ngồi uống trà trò chuyện trực tiếp với bạn bè hơn.',
      },
    ],
    ['更加'],
  ),
  createChineseCard(
    'hsk2-gram-17',
    'deck-hsk2-grammar',
    '越',
    'yuè',
    'VIỆT',
    '走 (Tẩu) + 戉 (Việt)',
    'Phó từ',
    'càng… càng…',
    'Thường dùng theo cấu trúc cặp 越 A 越 B: mức độ của B thay đổi tương ứng theo A (vd: 越学越有趣 = càng học càng thấy thú vị).',
    [
      { phrase: '越…越…', meaning: 'càng… càng…' },
      { phrase: '越早越好', meaning: 'càng sớm càng tốt' },
    ],
    [
      {
        sentence: '汉字的结构很有规律，你越认真分析越容易记住。(Hànzì de jiégòu hěn yǒu guīlǜ, nǐ yuè rènzhēn fēnxī yuè róngyì jìzhù.)',
        translation: 'Cấu trúc chữ Hán rất có quy luật, bạn càng phân tích kỹ càng dễ nhớ.',
      },
      {
        sentence: '这件事越早通知全体同事，大家越方便安排日程。(Zhè jiàn shì yuè zǎo tōngzhī quántǐ tóngshì, dàjiā yuè fāngbiàn ānpái rìchéng.)',
        translation: 'Việc này càng báo sớm cho toàn thể đồng nghiệp, mọi người càng dễ sắp xếp lịch trình.',
      },
    ],
    ['越来越'],
  ),
  createChineseCard(
    'hsk2-gram-18',
    'deck-hsk2-grammar',
    '越来越',
    'yuè lái yuè',
    'VIỆT LAI VIỆT',
    '走 (Tẩu) + 木 (Mộc)',
    'Phó từ',
    'ngày càng, càng lúc càng',
    'Biểu thị sự biến đổi mức độ tăng dần theo thời gian: Chủ ngữ + 越来越 + Tính từ / Động từ tâm lý (không dùng *很 trước tính từ sau 越来越).',
    [
      { phrase: '越来越流利', meaning: 'ngày càng lưu loát' },
      { phrase: '越来越方便', meaning: 'ngày càng thuận tiện' },
    ],
    [
      {
        sentence: '经过半年的练习，她的普通话说得越来越流利了。(Jīngguò bànnián de liànxí, tā de pǔtōnghuà shuō de yuè lái yuè liúlì le.)',
        translation: 'Qua nửa năm luyện tập, tiếng phổ thông của cô ấy nói ngày càng lưu loát rồi.',
      },
      {
        sentence: '现在城市里的公共交通越来越发达，出门基本不用开车。(Xiànzài chéngshì lǐ de gōnggòng jiāotōng yuè lái yuè fādá, chūmén jīběn bú yòng kāichē.)',
        translation: 'Hiện nay giao thông công cộng trong thành phố ngày càng phát triển, ra ngoài cơ bản không cần lái xe.',
      },
    ],
    ['日益'],
  ),
  createChineseCard(
    'hsk2-gram-19',
    'deck-hsk2-grammar',
    '让',
    'ràng',
    'NHƯỢNG',
    '讠(Ngôn) + 上 (Thượng)',
    'Động từ / Giới từ',
    'bảo, khiến cho, nhường',
    'Cấu trúc câu kiêm ngữ rất phổ biến: A 让 B + làm gì / cảm thấy thế nào (vd: 让我安心 = khiến tôi yên tâm; 让他先发言 = để anh ấy phát biểu trước).',
    [
      { phrase: '让人感动', meaning: 'khiến người ta cảm động' },
      { phrase: '让我想一想', meaning: 'để tôi suy nghĩ một chút' },
    ],
    [
      {
        sentence: '老师耐心的讲解让同学们立刻明白了这个难点。(Lǎoshī nàixīn de jiǎngjiě ràng tóngxuémen lìkè míngbai le zhège nándiǎn.)',
        translation: 'Lời giảng kiên nhẫn của thầy giáo khiến các bạn học lập tức hiểu ra điểm khó này.',
      },
      {
        sentence: '请让我先查看一下日程表，再给你准确的回复。(Qǐng ràng wǒ xiān chákàn yíxià rìchéngbiǎo, zài gěi nǐ zhǔnquè de huífù.)',
        translation: 'Hãy để tôi xem qua lịch trình trước rồi mới trả lời chính xác cho bạn.',
      },
    ],
    ['使', '叫'],
  ),
  createChineseCard(
    'hsk2-gram-20',
    'deck-hsk2-grammar',
    '差不多',
    'chàbuduō',
    'SAI BẤT ĐA',
    '羊 (Dương) + 夕 (Tịch)',
    'Phó từ / Tính từ',
    'gần như, xấp xỉ, tương đương',
    'Đứng trước số lượng/thời gian ("khoảng chừng/gần xong"), hoặc làm vị ngữ chỉ hai sự vật tương đồng nhau (A 跟 B 差不多).',
    [
      { phrase: '跟…差不多', meaning: 'tương đương với…' },
      { phrase: '差不多准备好了', meaning: 'gần như đã chuẩn bị xong' },
    ],
    [
      {
        sentence: '这两家酒店的价格和条件差不多，选离车站近的吧。(Zhè liǎng jiā jiǔdiàn de jiàgé hé tiáojiàn chàbuduō, xuǎn lí chēzhàn jìn de ba.)',
        translation: 'Giá cả và điều kiện hai khách sạn này xấp xỉ nhau, chọn cái gần nhà ga đi.',
      },
      {
        sentence: '我的阅读作业差不多写完了，还剩最后两道题。(Wǒ de yuèdú zuòyè chàbuduō xiěwán le, hái shèng zuìhòu liǎng dào tí.)',
        translation: 'Bài tập đọc hiểu của tôi gần như làm xong rồi, chỉ còn 2 câu cuối.',
      },
    ],
    ['大概', '左右'],
  ),

  // ==========================================================
  // DECK 2: HSK 2 · Tư duy, Cảm xúc & Giao tiếp Sâu (20 từ)
  // ==========================================================
  createChineseCard(
    'hsk2-mind-1',
    'deck-hsk2-mind',
    '认为',
    'rènwéi',
    'NHẬN VI',
    '讠(Ngôn) + 丶(Chủ)',
    'Động từ',
    'cho rằng, nhận định',
    'Dùng để trình bày quan điểm cá nhân dựa trên suy luận nghiêm túc ("tôi cho rằng…"), trang trọng và khách quan hơn 觉得.',
    [
      { phrase: '我个人认为', meaning: 'cá nhân tôi cho rằng' },
      { phrase: '普遍认为', meaning: 'mọi người đều cho rằng' },
    ],
    [
      {
        sentence: '很多老师认为，每天朗读课文比死记硬背更有效。(Hěn duō lǎoshī rènwéi, měitiān lǎngdú kèwén bǐ sǐjìyìngbèi gèng yǒuxiào.)',
        translation: 'Nhiều giáo viên cho rằng đọc thành tiếng bài khóa mỗi ngày hiệu quả hơn học vẹt.',
      },
      {
        sentence: '我认为做决定之前应该先听听团队成员的意见。(Wǒ rènwéi zuò juédìng zhīqián yīnggāi xiān tīngting tuánduì chéngyuán de yìjiàn.)',
        translation: 'Tôi cho rằng trước khi ra quyết định nên lắng nghe ý kiến của thành viên trong nhóm.',
      },
    ],
    ['觉得', '以为'],
  ),
  createChineseCard(
    'hsk2-mind-2',
    'deck-hsk2-mind',
    '以为',
    'yǐwéi',
    'DĨ VI',
    '人 (Nhân) + 丶(Chủ)',
    'Động từ',
    'tưởng rằng, cứ ngỡ là',
    'Điểm ngữ pháp cực quan trọng: 以为 hàm ý sự suy đoán ban đầu KHÔNG đúng với thực tế ("tưởng là… hóa ra không phải"). Khi nhận định đúng, dùng 认为 hoặc 觉得.',
    [
      { phrase: '我还以为', meaning: 'tôi cứ tưởng là' },
      { phrase: '原以为', meaning: 'vốn tưởng rằng' },
    ],
    [
      {
        sentence: '我以为今天是周末不用上课，结果差点儿迟到了。(Wǒ yǐwéi jīntiān shì zhōumò bú yòng shàngkè, jiéguǒ chàdiǎnr chídào le.)',
        translation: 'Tôi cứ tưởng hôm nay là cuối tuần không phải đi học, kết quả suýt chút nữa thì trễ giờ.',
      },
      {
        sentence: '大家都以为这道题很难，其实换个角度思考就明白了。(Dàjiā dōu yǐwéi zhè dào tí hěn nán, qíshí huàn gè jiǎodù sīkǎo jiù míngbai le.)',
        translation: 'Mọi người đều tưởng bài này rất khó, thật ra đổi góc độ suy nghĩ là hiểu ngay.',
      },
    ],
    ['认为'],
  ),
  createChineseCard(
    'hsk2-mind-3',
    'deck-hsk2-mind',
    '相信',
    'xiāngxìn',
    'TƯƠNG TÍN',
    '木 (Mộc) + 亻(Nhân)',
    'Động từ',
    'tin tưởng, tin rằng',
    'Có thể mang tân ngữ chỉ người ("tin bạn") hoặc cả mệnh đề ("tin rằng ngày mai sẽ tốt hơn"). Có thể bổ sung mức độ bằng phó từ: 非常相信.',
    [
      { phrase: '相信自己', meaning: 'tin tưởng vào bản thân' },
      { phrase: '完全相信', meaning: 'hoàn toàn tin tưởng' },
    ],
    [
      {
        sentence: '只要你保持现在的学习节奏，我相信一定能通过考试。(Zhǐyào nǐ bǎochí xiànzài de xuéxí jiézòu, wǒ xiāngxìn yídìng néng tōngguò kǎoshì.)',
        translation: 'Chỉ cần bạn giữ nhịp học hiện tại, tôi tin chắc bạn sẽ vượt qua kỳ thi.',
      },
      {
        sentence: '他是个守信用的人，大家都很相信他做出的承诺。(Tā shì gè shǒu xìnyòng de rén, dàjiā dōu hěn xiāngxìn tā zuòchū de chéngnuò.)',
        translation: 'Anh ấy là người giữ chữ tín, mọi người đều rất tin vào lời hứa của anh ấy.',
      },
    ],
    ['信任'],
  ),
  createChineseCard(
    'hsk2-mind-4',
    'deck-hsk2-mind',
    '打算',
    'dǎsuàn',
    'ĐẢ TOÁN',
    '扌(Thủ) + 竹 (Trúc)',
    'Động từ / Danh từ',
    'dự định, kế hoạch',
    'Dùng như động từ đứng trước hành động dự tính (打算明年去上海), hoặc làm danh từ (有什么打算 = có dự định gì không).',
    [
      { phrase: '打算做什么', meaning: 'dự định làm gì' },
      { phrase: '长远打算', meaning: 'kế hoạch lâu dài' },
    ],
    [
      {
        sentence: '今年暑假我打算去南方城市旅游顺便看望老朋友。(Jīnnián shǔjià wǒ dǎsuàn qù nánfāng chéngshì lǚyóu shùnbiàn kànwàng lǎo péngyou.)',
        translation: 'Kỳ nghỉ hè năm nay tôi dự định đi du lịch các thành phố miền Nam tiện thể thăm bạn cũ.',
      },
      {
        sentence: '关于毕业以后的打算，他已经和家人商量好了。(Guānyú bìyè yǐhòu de dǎsuàn, tā yǐjīng hé jiārén shāngliang hǎo le.)',
        translation: 'Về dự định sau khi tốt nghiệp, anh ấy đã bàn bạc xong với gia đình rồi.',
      },
    ],
    ['计划', '准备'],
  ),
  createChineseCard(
    'hsk2-mind-5',
    'deck-hsk2-mind',
    '发现',
    'fāxiàn',
    'PHÁT HIỆN',
    '又 (Hựu) + 王 (Vương)',
    'Động từ / Danh từ',
    'phát hiện, nhận ra',
    'Diễn tả việc nhận ra điều vốn tồn tại nhưng trước đó chưa biết (khác với 发明 = phát minh ra thứ mới). Dùng rất nhiều trong học tập và đời sống.',
    [
      { phrase: '突然发现', meaning: 'bỗng nhiên phát hiện' },
      { phrase: '发现问题', meaning: 'phát hiện vấn đề' },
    ],
    [
      {
        sentence: '复习错题本时，我发现自己总是分不清这两个近义词。(Fùxí cuòtíběn shí, wǒ fāxiàn zìjǐ zǒngshì fēnbuqīng zhè liǎng gè jìnyìcí.)',
        translation: 'Khi ôn sổ lỗi sai, tôi phát hiện mình luôn nhầm lẫn hai từ đồng nghĩa này.',
      },
      {
        sentence: '走出地铁站才发现外面下起雪了，地上白茫茫一片。(Zǒuchū dìtiězhàn cái fāxiàn wàimiàn xiàqǐ xuě le, dìshang báimángmáng yípiàn.)',
        translation: 'Ra khỏi ga tàu điện ngầm mới phát hiện bên ngoài tuyết đã rơi, mặt đất trắng xóa một vùng.',
      },
    ],
    ['发觉', '找到'],
  ),
  createChineseCard(
    'hsk2-mind-6',
    'deck-hsk2-mind',
    '表示',
    'biǎoshì',
    'BIỂU THỊ',
    '衣 (Y) + 小 (Tiểu)',
    'Động từ',
    'bày tỏ, biểu thị, cho biết',
    'Dùng khi thể hiện thái độ, tình cảm hoặc ý nghĩa qua lời nói, hành động hay ký hiệu: 表示感谢 (bày tỏ lòng cảm ơn), 表示同意 (bày tỏ sự đồng ý).',
    [
      { phrase: '表示感谢', meaning: 'bày tỏ sự cảm ơn' },
      { phrase: '表示欢迎', meaning: 'bày tỏ sự hoan nghênh' },
    ],
    [
      {
        sentence: '听到这个消息，全班同学都鼓掌表示热烈欢迎。(Tīngdào zhège xiāoxi, quánbān tóngxué dōu gǔzhǎng biǎoshì rèliè huānyíng.)',
        translation: 'Nghe tin này, cả lớp đều vỗ tay bày tỏ sự chào đón nồng nhiệt.',
      },
      {
        sentence: '她用一束鲜花向一直照顾自己的医生表示感谢。(Tā yòng yí shù xiānhuā xiàng yìzhí zhàogù zìjǐ de yīshēng biǎoshì gǎnxiè.)',
        translation: 'Cô ấy dùng một bó hoa tươi bày tỏ lòng biết ơn tới bác sĩ đã luôn chăm sóc mình.',
      },
    ],
    ['表达', '说明'],
  ),
  createChineseCard(
    'hsk2-mind-7',
    'deck-hsk2-mind',
    '说明',
    'shuōmíng',
    'THUYẾT MINH',
    '讠(Ngôn) + 日 (Nhật)',
    'Động từ / Danh từ',
    'giải thích, chứng tỏ; bản hướng dẫn',
    'Mang hai nghĩa chính: (1) giải thích rõ nguyên nhân/cách làm, (2) chứng minh cho một nhận định (这说明你很用心 = điều này chứng tỏ bạn rất để tâm).',
    [
      { phrase: '说明原因', meaning: 'giải thích nguyên nhân' },
      { phrase: '使用说明', meaning: 'hướng dẫn sử dụng' },
    ],
    [
      {
        sentence: '使用新设备之前，请先仔细阅读盒子里的使用说明。(Shǐyòng xīn shèbèi zhīqián, qǐng xiān zǐxì yuèdú hézi lǐ de shǐyòng shuōmíng.)',
        translation: 'Trước khi dùng thiết bị mới, xin hãy đọc kỹ hướng dẫn sử dụng trong hộp.',
      },
      {
        sentence: '你主动提前完成了所有复习任务，说明自制力很强。(Nǐ zhǔdòng tíqián wánchéng le suǒyǒu fùxí rènwu, shuōmíng zìzhìlì hěn qiáng.)',
        translation: 'Bạn chủ động hoàn thành trước mọi nhiệm vụ ôn tập, chứng tỏ khả năng tự kỷ luật rất tốt.',
      },
    ],
    ['解释', '证明'],
  ),
  createChineseCard(
    'hsk2-mind-8',
    'deck-hsk2-mind',
    '讨论',
    'tǎolùn',
    'THẢO LUẬN',
    '讠(Ngôn) + 讠(Ngôn)',
    'Động từ / Danh từ',
    'thảo luận, bàn bạc',
    'Thường dùng cho hai người trở lên trao đổi ý kiến về một chủ đề (讨论问题, 展开讨论). Không dùng cho bản thân tự suy nghĩ.',
    [
      { phrase: '小组讨论', meaning: 'thảo luận nhóm nhỏ' },
      { phrase: '讨论解决办法', meaning: 'bàn bạc cách giải quyết' },
    ],
    [
      {
        sentence: '课后我们留在教室里，继续讨论那个社会调查题目。(Kèhòu wǒmen liúzài jiàoshì lǐ, jìxù tǎolùn nàge shèhuì diàochá tímù.)',
        translation: 'Sau giờ học chúng tôi ở lại phòng học tiếp tục thảo luận đề tài khảo sát xã hội đó.',
      },
      {
        sentence: '大家围绕新年度的工作重点展开了热烈的讨论。(Dàjiā wéirào xīn niándù de gōngzuò zhòngdiǎn zhǎnkāi le rèliè de tǎolùn.)',
        translation: 'Mọi người đã thảo luận sôi nổi xoay quanh trọng điểm công việc năm mới.',
      },
    ],
    ['商量'],
  ),
  createChineseCard(
    'hsk2-mind-9',
    'deck-hsk2-mind',
    '答应',
    'dāying',
    'ĐÁP ỨNG',
    '竹 (Trúc) + 广 (Nghiễm)',
    'Động từ',
    'đồng ý, nhận lời, hứa',
    'Lưu ý thanh nhẹ ở chữ 应 (dāying). Biểu thị việc đồng ý yêu cầu của người khác hoặc hứa làm việc gì (答应帮忙 = nhận lời giúp đỡ).',
    [
      { phrase: '一口答应', meaning: 'đồng ý ngay lập tức' },
      { phrase: '答应过别人', meaning: 'đã hứa với người khác' },
    ],
    [
      {
        sentence: '既然我已经答应陪你去医院检查，就一定会按时到。(Jìrán wǒ yǐjīng dāying péi nǐ qù yīyuàn jiǎnchá, jiù yídìng huì ànshí dào.)',
        translation: 'Đã hứa đi bệnh viện kiểm tra cùng bạn rồi thì tôi nhất định sẽ đến đúng giờ.',
      },
      {
        sentence: '经理听完这个节省成本的建议后，马上答应试行一周。(Jīnglǐ tīngwán zhège jiéshěng chéngběn de jiànyì hòu, mǎshàng dāying shìxíng yì zhōu.)',
        translation: 'Sau khi nghe xong đề xuất tiết kiệm chi phí này, giám đốc đồng ý thử nghiệm ngay một tuần.',
      },
    ],
    ['同意'],
  ),
  createChineseCard(
    'hsk2-mind-10',
    'deck-hsk2-mind',
    '感动',
    'gǎndòng',
    'CẢM ĐỘNG',
    '心 (Tâm) + 力 (Lực)',
    'Tính từ / Động từ',
    'cảm động, làm xúc động',
    'Có thể làm tính từ ("rất cảm động": 我很感动) hoặc động từ gây cảm xúc ("khiến ai đó cảm động": 感动了很多人).',
    [
      { phrase: '让人十分感动', meaning: 'khiến người ta vô cùng cảm động' },
      { phrase: '感动得想哭', meaning: 'cảm động đến muốn khóc' },
    ],
    [
      {
        sentence: '看到老同学特意从外地赶来参加婚礼，她感动得眼圈红了。(Kàndào lǎo tóngxué tèyì cóng wàidì gǎnlái cānjiā hūnlǐ, tā gǎndòng de yǎnquān hóng le.)',
        translation: 'Thấy bạn học cũ đặc biệt từ tỉnh khác chạy về dự đám cưới, cô ấy cảm động đến đỏ hoe mắt.',
      },
      {
        sentence: '这部讲述普通人互相帮助的短片感动了无数观众。(Zhè bù jiǎngshù pǔtōngrén hùxiāng bāngzhù de duǎnpiàn gǎndòng le wúshù guānzhòng.)',
        translation: 'Bộ phim ngắn kể về những người bình thường giúp đỡ lẫn nhau này đã làm vô số khán giả xúc động.',
      },
    ],
    ['激动'],
  ),
  createChineseCard(
    'hsk2-mind-11',
    'deck-hsk2-mind',
    '满意',
    'mǎnyì',
    'MÃN Ý',
    '氵(Thủy) + 心 (Tâm)',
    'Tính từ',
    'hài lòng, vừa ý',
    'Cấu trúc chuẩn: 对 + đối tượng + (很/非常/不太) + 满意. Không dùng trực tiếp *满意什么东西 mà phải có giới từ 对.',
    [
      { phrase: '对结果很满意', meaning: 'rất hài lòng với kết quả' },
      { phrase: '令顾客满意', meaning: 'khiến khách hàng hài lòng' },
    ],
    [
      {
        sentence: '这次考试我发挥出了平时水平，对自己的成绩还算满意。(Zhè cì kǎoshì wǒ fāhuī chū le píngshí shuǐpíng, duì zìjǐ de chéngjì hái suàn mǎnyì.)',
        translation: 'Kỳ thi lần này tôi phát huy được trình độ thường ngày, khá hài lòng với kết quả của mình.',
      },
      {
        sentence: '房东刚把厨房重新装修了一遍，租客看房后非常满意。(Fángdōng gāng bǎ chúfáng chóngxīn zhuāngxiū le yíbiàn, zūkè kànfáng hòu fēicháng mǎnyì.)',
        translation: 'Chủ nhà vừa sửa sang lại bếp một lượt, khách thuê xem phòng xong vô cùng vừa ý.',
      },
    ],
    ['满足', '称心'],
  ),
  createChineseCard(
    'hsk2-mind-12',
    'deck-hsk2-mind',
    '难过',
    'nánguò',
    'NAN QUÁ',
    '又 (Hựu) + 辶 (Sước)',
    'Tính từ',
    'buồn bã, đau lòng, khó chịu',
    'Diễn tả nỗi buồn về tinh thần (nhớ nhà, thất bại, chia xa). Phân biệt với 难受 (vừa có thể là khó chịu cơ thể như ốm mệt, vừa là khó chịu tâm lý).',
    [
      { phrase: '心里很难过', meaning: 'trong lòng rất buồn' },
      { phrase: '别太难过了', meaning: 'đừng buồn quá nữa' },
    ],
    [
      {
        sentence: '小狗生病不肯吃东西，妹妹守在旁边心里别提多难过了。(Xiǎogǒu shēngbìng bù kěn chī dōngxi, mèimei shǒu zài pángbiān xīnlǐ biétí duō nánguò le.)',
        translation: 'Chú cún bị ốm không chịu ăn, em gái ngồi canh bên cạnh trong lòng buồn khôn tả.',
      },
      {
        sentence: '比赛输了难免难过，但总结经验后下次一定会做得更好。(Bǐsài shū le nánmiǎn nánguò, dàn zǒngjié jīngyàn hòu xiàcì yídìng huì zuò de gèng hǎo.)',
        translation: 'Thua trận khó tránh khỏi buồn bã, nhưng rút kinh nghiệm rồi lần sau nhất định sẽ làm tốt hơn.',
      },
    ],
    ['伤心', '难受'],
  ),
  createChineseCard(
    'hsk2-mind-13',
    'deck-hsk2-mind',
    '开心',
    'kāixīn',
    'KHAI TÂM',
    '廾 (Củng) + 心 (Tâm)',
    'Tính từ / Động từ',
    'vui vẻ, hớn hở',
    'Thường dùng nhiều trong khẩu ngữ thân mật để chỉ niềm vui tự nhiên, thoải mái trong lòng (过得很开心 = sống rất vui vẻ).',
    [
      { phrase: '玩得特别开心', meaning: 'chơi đặc biệt vui' },
      { phrase: '开心地笑了', meaning: 'cười một cách vui vẻ' },
    ],
    [
      {
        sentence: '周五下班后和同事去吃顿热腾腾的火锅，大家聊得真开心。(Zhōuwǔ xiàbān hòu hé tóngshì qù chī dùn rèténgténg de huǒguō, dàjiā liáo de zhēn kāixīn.)',
        translation: 'Thứ Sáu tan làm đi ăn nồi lẩu nóng hổi cùng đồng nghiệp, mọi người trò chuyện thật vui.',
      },
      {
        sentence: '爷爷看到孙女学会了自己骑自行车，比谁都开心。(Yéye kàndào sūnnǚ xuéhuì le zìjǐ qí zìxíngchē, bǐ shéi dōu kāixīn.)',
        translation: 'Ông nội thấy cháu gái học được cách tự đi xe đạp, vui hơn bất kỳ ai.',
      },
    ],
    ['高兴', '快乐'],
  ),
  createChineseCard(
    'hsk2-mind-14',
    'deck-hsk2-mind',
    '努力',
    'nǔlì',
    'NỖ LỰC',
    '女 (Nữ) + 力 (Lực)',
    'Động từ / Tính từ',
    'nỗ lực, cố gắng, chăm chỉ',
    'Vừa đứng trước động từ như trạng ngữ (努力工作 = chăm chỉ làm việc), vừa làm tính từ vị ngữ nhận phó từ mức độ (他非常努力 = anh ấy rất chăm chỉ).',
    [
      { phrase: '努力实现目标', meaning: 'nỗ lực thực hiện mục tiêu' },
      { phrase: '工作很努力', meaning: 'làm việc rất chăm chỉ' },
    ],
    [
      {
        sentence: '为了拿到奖学金，她整个学期都比以前更加努力复习。(Wèile nádào jiǎngxuéjīn, tā zhěnggè xuéqī dōu bǐ yǐqián gèngjiā nǔlì fùxí.)',
        translation: 'Để giành được học bổng, cả học kỳ này cô ấy ôn tập chăm chỉ hơn trước rất nhiều.',
      },
      {
        sentence: '老师常鼓励我们，只要肯努力，没有攻克不了的难题。(Lǎoshī cháng gǔlì wǒmen, zhǐyào kěn nǔlì, méiyǒu gōngkè bù liǎo de nántí.)',
        translation: 'Thầy giáo thường khích lệ chúng tôi rằng chỉ cần chịu cố gắng thì không có bài toán khó nào không vượt qua được.',
      },
    ],
    ['用功', '尽力'],
  ),
  createChineseCard(
    'hsk2-mind-15',
    'deck-hsk2-mind',
    '提高',
    'tígāo',
    'ĐỀ CAO',
    '扌(Thủ) + 亠(Đầu)',
    'Động từ',
    'nâng cao, cải thiện',
    'Đi với các danh từ trừu tượng như trình độ, hiệu suất, năng lực, thu nhập: 提高水平, 提高效率, 提高认识.',
    [
      { phrase: '提高口语水平', meaning: 'nâng cao trình độ khẩu ngữ' },
      { phrase: '提高工作效率', meaning: 'nâng cao hiệu suất làm việc' },
    ],
    [
      {
        sentence: '每天用目标语言写几句日记，能快速提高造句能力。(Měitiān yòng mùbiāo yǔyán xiě jǐ jù rìjì, néng kuàisù tígāo zàojù nénglì.)',
        translation: 'Mỗi ngày viết vài câu nhật ký bằng ngôn ngữ đích có thể nâng cao nhanh khả năng đặt câu.',
      },
      {
        sentence: '公司调整了沟通流程以后，跨部门合作的效率明显提高了。(Gōngsī tiáozhěng le gōutōng liúchéng yǐhòu, kuà bùmén hézuò de xiàolǜ míngxiǎn tígāo le.)',
        translation: 'Sau khi công ty điều chỉnh quy trình trao đổi, hiệu suất phối hợp liên phòng ban tăng lên rõ rệt.',
      },
    ],
    ['提升', '改进'],
  ),
  createChineseCard(
    'hsk2-mind-16',
    'deck-hsk2-mind',
    '习惯',
    'xíguàn',
    'TẬP QUÁN',
    '习 (Tập) + 忄(Tâm)',
    'Danh từ / Động từ',
    'thói quen; quen với',
    'Dùng kép rất linh hoạt: làm danh từ (养成好习惯 = rèn thói quen tốt) hoặc làm động từ (习惯了早起 = đã quen dậy sớm).',
    [
      { phrase: '生活习惯', meaning: 'thói quen sinh hoạt' },
      { phrase: '慢慢习惯了', meaning: 'dần dần đã quen rồi' },
    ],
    [
      {
        sentence: '睡前放下手机读十页书，是他保持多年的好习惯。(Shuìqián fàngxià shǒujī dú shí yè shū, shì tā bǎochí duōnián de hǎo xíguàn.)',
        translation: 'Đặt điện thoại xuống đọc 10 trang sách trước khi ngủ là thói quen tốt anh ấy giữ nhiều năm nay.',
      },
      {
        sentence: '刚到北方时我还不习惯冬天干燥的气候，住了两周就适应了。(Gāng dào běifāng shí wǒ hái bù xíguàn dōngtiān gānzào de qìhòu, zhù le liǎng zhōu jiù shìyìng le.)',
        translation: 'Mới đến phương Bắc tôi chưa quen khí hậu hanh khô mùa đông, ở hai tuần là thích nghi ngay.',
      },
    ],
    ['适应'],
  ),
  createChineseCard(
    'hsk2-mind-17',
    'deck-hsk2-mind',
    '想法',
    'xiǎngfǎ',
    'TƯỞNG PHÁP',
    '心 (Tâm) + 氵(Thủy)',
    'Danh từ',
    'ý tưởng, suy nghĩ, cách nghĩ',
    'Danh từ phổ biến chỉ ý định hoặc suy nghĩ riêng của một người (有什么想法 = có suy nghĩ gì không; 换个想法 = đổi cách nghĩ).',
    [
      { phrase: '很有创意的想法', meaning: 'ý tưởng rất sáng tạo' },
      { phrase: '谈谈你的想法', meaning: 'chia sẻ suy nghĩ của bạn' },
    ],
    [
      {
        sentence: '每个人对幸福的定义都有不同的想法，不必强求一致。(Měi gè rén duì xìngfú de dìngyì dōu yǒu bùtóng de xiǎngfǎ, búbì qiǎngqiú yízhì.)',
        translation: 'Mỗi người đều có cách nghĩ khác nhau về định nghĩa hạnh phúc, không cần ép phải giống hệt nhau.',
      },
      {
        sentence: '如果你对周末的活动安排有更好的想法，欢迎提出来。(Rúguǒ nǐ duì zhōumò de huódòng ānpái yǒu gèng hǎo de xiǎngfǎ, huānyíng tí chūlái.)',
        translation: 'Nếu bạn có ý tưởng hay hơn cho lịch hoạt động cuối tuần thì cứ đề xuất nhé.',
      },
    ],
    ['意见', '主意'],
  ),
  createChineseCard(
    'hsk2-mind-18',
    'deck-hsk2-mind',
    '意见',
    'yìjiàn',
    'Ý KIẾN',
    '心 (Tâm) + 见 (Kiến)',
    'Danh từ',
    'ý kiến, góp ý, bất đồng',
    'Ngoài nghĩa "quan điểm góp ý" (提意见 = góp ý), trong cụm 对某人有意见 còn mang nghĩa "có thành kiến/không hài lòng với ai".',
    [
      { phrase: '征求大家的意见', meaning: 'lấy ý kiến của mọi người' },
      { phrase: '不同意见', meaning: 'ý kiến khác biệt' },
    ],
    [
      {
        sentence: '设计稿改完以后，我们先发给客户征求修改意见。(Shèjìgǎo gǎiwán yǐhòu, wǒmen xiān fāgěi kèhù zhēngqiú xiūgǎi yìjiàn.)',
        translation: 'Sau khi sửa xong bản thiết kế, chúng ta gửi trước cho khách hàng xin ý kiến chỉnh sửa.',
      },
      {
        sentence: '团队里出现不同意见很正常，关键是理性地寻找共同点。(Tuánduì lǐ chūxiàn bùtóng yìjiàn hěn zhèngcháng, guānjiàn shì lǐxìng de xúnzhǎo gòngtóngdiǎn.)',
        translation: 'Trong nhóm xuất hiện ý kiến trái chiều là bình thường, mấu chốt là bình tĩnh tìm điểm chung.',
      },
    ],
    ['建议', '观点'],
  ),
  createChineseCard(
    'hsk2-mind-19',
    'deck-hsk2-mind',
    '信心',
    'xìnxīn',
    'TÍN TÂM',
    '亻(Nhân) + 心 (Tâm)',
    'Danh từ',
    'lòng tin, sự tự tin',
    'Cấu trúc chuẩn: 对…有信心 (có lòng tin vào…). Không dùng *有信心做 mà dùng 有信心能做到 hoặc 对自己有信心.',
    [
      { phrase: '充满信心', meaning: 'tràn đầy tự tin' },
      { phrase: '树立信心', meaning: 'xây dựng lòng tin' },
    ],
    [
      {
        sentence: '几次模拟测验成绩都不错，她对下周的面试更有信心了。(Jǐ cì mónǐ cèyàn chéngjì dōu búcuò, tā duì xià zhōu de miànshì gèng yǒu xìnxīn le.)',
        translation: 'Mấy lần thi thử điểm đều khá tốt nên cô ấy càng tự tin hơn vào buổi phỏng vấn tuần sau.',
      },
      {
        sentence: '老师的一句表扬，给了内向的小明很大信心去参加演讲比赛。(Lǎoshī de yí jù biǎoyáng, gěi le nèixiàng de Xiǎomíng hěn dà xìnxīn qù cānjiā yǎnjiǎng bǐsài.)',
        translation: 'Một lời khen của cô giáo đã tiếp cho Tiểu Minh vốn hướng nội rất nhiều tự tin tham gia thi hùng biện.',
      },
    ],
    ['自信'],
  ),
  createChineseCard(
    'hsk2-mind-20',
    'deck-hsk2-mind',
    '关心',
    'guānxīn',
    'QUAN TÂM',
    '丷(Bát) + 心 (Tâm)',
    'Động từ',
    'quan tâm, chăm lo',
    'Dùng trực tiếp với tân ngữ người hoặc sự việc: 关心父母 (quan tâm bố mẹ), 关心环保问题 (quan tâm vấn đề môi trường). Có thể nhận 很/非常.',
    [
      { phrase: '非常关心', meaning: 'vô cùng quan tâm' },
      { phrase: '互相照顾和关心', meaning: 'chăm sóc và quan tâm lẫn nhau' },
    ],
    [
      {
        sentence: '无论工作多忙，他每周都会抽空给外地的父母打个电话关心一下。(Wúlùn gōngzuò duō máng, tā měi zhōu dōu huì chōukòng gěi wàidì de fùmǔ dǎ gè diànhuà guānxīn yíxià.)',
        translation: 'Dù công việc bận rộn đến đâu, mỗi tuần anh ấy đều tranh thủ gọi hỏi thăm bố mẹ ở tỉnh khác.',
      },
      {
        sentence: '班长平时很关心同学们的学习情况，谁有困难他都会主动帮忙。(Bānzhǎng píngshí hěn guānxīn tóngxuémen de xuéxí qíngkuàng, shéi yǒu kùnnan tā dōu huì zhǔdòng bāngmáng.)',
        translation: 'Lớp trưởng bình thường rất quan tâm tình hình học tập của các bạn, ai gặp khó khăn cậu ấy cũng chủ động giúp.',
      },
    ],
    ['照顾', '关注'],
  ),

  // ==========================================================
  // DECK 3: HSK 2 · Học tập, Công việc & Tổ chức (20 từ)
  // ==========================================================
  createChineseCard(
    'hsk2-work-1',
    'deck-hsk2-work',
    '公司',
    'gōngsī',
    'CÔNG TY',
    '八 (Bát) + 𠃌(Ẩt)',
    'Danh từ',
    'công ty, doanh nghiệp',
    'Lượng từ thường dùng là 家 (一家公司 = một công ty). Chỉ nơi làm việc, hợp đồng, văn phòng.',
    [
      { phrase: '在一家外资公司工作', meaning: 'làm việc ở công ty vốn nước ngoài' },
      { phrase: '公司规定', meaning: 'quy định của công ty' },
    ],
    [
      {
        sentence: '这家科技公司虽然规模不大，但工作氛围自由又高效。(Zhè jiā kējì gōngsī suīrán guīmó bú dà, dàn gōngzuò fēnwéi zìyóu yòu gāoxiào.)',
        translation: 'Công ty công nghệ này tuy quy mô không lớn nhưng không khí làm việc tự do và hiệu quả.',
      },
      {
        sentence: '下个月公司要搬到靠近地铁站的新写字楼去了。(Xià gè yuè gōngsī yào bān dào kàojìn dìtiězhàn de xīn xiězìlóu qù le.)',
        translation: 'Tháng sau công ty sẽ chuyển sang tòa nhà văn phòng mới gần ga tàu điện ngầm.',
      },
    ],
    ['企业', '单位'],
  ),
  createChineseCard(
    'hsk2-work-2',
    'deck-hsk2-work',
    '办公室',
    'bàngōngshì',
    'BIỆN CÔNG THẤT',
    '力 (Lực) + 宀 (Miên)',
    'Danh từ',
    'văn phòng, phòng làm việc',
    'Lượng từ thường dùng là 间 hoặc 个. Ghép từ 办 (xử lý) + 公 (việc công) + 室 (phòng).',
    [
      { phrase: '在办公室开会', meaning: 'họp trong phòng làm việc' },
      { phrase: '打扫办公室', meaning: 'dọn dẹp văn phòng' },
    ],
    [
      {
        sentence: '老师不在办公室，可能去三楼的教室给学生讲题了。(Lǎoshī bú zài bàngōngshì, kěnéng qù sān lóu de jiàoshì gěi xuéshēng jiǎngtí le.)',
        translation: 'Thầy giáo không có ở văn phòng, có lẽ lên phòng học tầng 3 giảng bài cho học sinh rồi.',
      },
      {
        sentence: '我们在办公室窗边放了几盆绿植，空气显得更清新了。(Wǒmen zài bàngōngshì chuāngbiān fàng le jǐ pén lǜzhí, kōngqì xiǎnde gèng qīngxīn le.)',
        translation: 'Chúng tôi đặt mấy chậu cây xanh bên cửa sổ văn phòng, không khí trông trong lành hơn hẳn.',
      },
    ],
    ['工作室'],
  ),
  createChineseCard(
    'hsk2-work-3',
    'deck-hsk2-work',
    '同事',
    'tóngshì',
    'ĐỒNG SỰ',
    '口 (Khẩu) + 亅(Quyết)',
    'Danh từ',
    'đồng nghiệp',
    'Dùng cho người làm cùng cơ quan/công ty (同 = cùng, 事 = công việc). Lượng từ: 位 hoặc 个.',
    [
      { phrase: '部门同事', meaning: 'đồng nghiệp trong bộ phận' },
      { phrase: '和同事配合', meaning: 'phối hợp với đồng nghiệp' },
    ],
    [
      {
        sentence: '刚入职那几天，多亏旁边的同事热心帮我熟悉工作流程。(Gāng rùzhí nà jǐ tiān, duōkuī pángbiān de tóngshì rèxīn bāng wǒ shúxī gōngzuò liúchéng.)',
        translation: 'Mấy ngày mới nhận việc, nhờ đồng nghiệp ngồi cạnh nhiệt tình giúp tôi làm quen quy trình công việc.',
      },
      {
        sentence: '中午十二点一到，我和几位同事常一起去对面的小馆吃午饭。(Zhōngwǔ shí\'èr diǎn yí dào, wǒ hé jǐ wèi tóngshì cháng yìqǐ qù duìmiàn de xiǎoguǎn chī wǔfàn.)',
        translation: 'Cứ đúng 12 giờ trưa, tôi và vài đồng nghiệp hay rủ nhau sang quán nhỏ đối diện ăn cơm trưa.',
      },
    ],
    ['伙伴'],
  ),
  createChineseCard(
    'hsk2-work-4',
    'deck-hsk2-work',
    '经理',
    'jīnglǐ',
    'KINH LÝ',
    '纟(Mịch) + 王 (Vương)',
    'Danh từ',
    'giám đốc, quản lý',
    'Dùng để xưng hô hoặc chỉ chức vụ quản lý phòng ban/công ty: 李经理 (Giám đốc Lý / Quản lý Lý), 部门经理.',
    [
      { phrase: '项目经理', meaning: 'quản lý dự án' },
      { phrase: '向经理汇报', meaning: 'báo cáo với quản lý' },
    ],
    [
      {
        sentence: '陈经理正在会议室和客户商量明年的合作计划。(Chén jīnglǐ zhèngzài huìyìshì hé kèhù shāngliang míngnián de hézuò jìhuà.)',
        translation: 'Giám đốc Trần đang ở phòng họp bàn bạc kế hoạch hợp tác năm sau với khách hàng.',
      },
      {
        sentence: '他工作认真负责，去年年底被提拔为市场部经理。(Tā gōngzuò rènzhēn fùzé, qùnián niándǐ bèi tíbá wéi shìchǎngbù jīnglǐ.)',
        translation: 'Anh ấy làm việc nghiêm túc có trách nhiệm, cuối năm ngoái được đề bạt làm trưởng phòng marketing.',
      },
    ],
    ['主管', '老板'],
  ),
  createChineseCard(
    'hsk2-work-5',
    'deck-hsk2-work',
    '计划',
    'jìhuà',
    'KẾ HOẠCH',
    '讠(Ngôn) + 刂(Đao)',
    'Danh từ / Động từ',
    'kế hoạch; lên kế hoạch',
    'Thường trang trọng và chi tiết hơn 打算. Động từ kết hợp hay gặp: 制定计划 (lập kế hoạch), 按计划进行 (tiến hành theo kế hoạch).',
    [
      { phrase: '学习计划', meaning: 'kế hoạch học tập' },
      { phrase: '按计划完成', meaning: 'hoàn thành đúng kế hoạch' },
    ],
    [
      {
        sentence: '制定一份合理的复习计划，能让你考前不至于太紧张。(Zhìdìng yí fèn hélǐ de fùxí jìhuà, néng ràng nǐ kǎoqián búzhìyú tài jǐnzhāng.)',
        translation: 'Lập một bản kế hoạch ôn tập hợp lý giúp bạn trước kỳ thi không đến mức quá căng thẳng.',
      },
      {
        sentence: '由于暴雨影响了交通，原计划今天下午举行的户外比赛推迟了。(Yóuyú bàoyǔ yǐngxiǎng le jiāotōng, yuán jìhuà jīntiān xiàwǔ jǔxíng de hùwài bǐsài tuīchí le.)',
        translation: 'Do mưa lớn ảnh hưởng giao thông, trận thi đấu ngoài trời vốn định tổ chức chiều nay đã bị hoãn.',
      },
    ],
    ['打算', '安排'],
  ),
  createChineseCard(
    'hsk2-work-6',
    'deck-hsk2-work',
    '方法',
    'fāngfǎ',
    'PHƯƠNG PHÁP',
    '方 (Phương) + 氵(Thủy)',
    'Danh từ',
    'phương pháp, cách thức',
    'Chỉ phương pháp mang tính hệ thống (học tập, nghiên cứu, quản lý). Lượng từ: 种 hoặc 个 (一种方法 = một phương pháp).',
    [
      { phrase: '科学的学习方法', meaning: 'phương pháp học tập khoa học' },
      { phrase: '找到好方法', meaning: 'tìm thấy phương pháp hay' },
    ],
    [
      {
        sentence: '背单词不能只看表面，结合例句和搭配词才是最科学的方法。(Bèi dāncí bù néng zhǐ kàn biǎomiàn, jiéhé lìjù hé dāpèicí cái shì zuì kēxué de fāngfǎ.)',
        translation: 'Học từ vựng không thể chỉ nhìn bề mặt, kết hợp câu ví dụ và cụm từ đi kèm mới là phương pháp khoa học nhất.',
      },
      {
        sentence: '这位数学老师的教学方法很特别，总能把难懂的题讲活。(Zhè wèi shùxué lǎoshī de jiàoxué fāngfǎ hěn tèbié, zǒng néng bǎ nándǒng de tí jiǎng huó.)',
        translation: 'Phương pháp giảng dạy của thầy toán này rất đặc biệt, luôn biến bài khó hiểu trở nên sinh động.',
      },
    ],
    ['办法', '做法'],
  ),
  createChineseCard(
    'hsk2-work-7',
    'deck-hsk2-work',
    '办法',
    'bànfǎ',
    'BIỆN PHÁP',
    '力 (Lực) + 氵(Thủy)',
    'Danh từ',
    'cách giải quyết, biện pháp',
    'Khác nhẹ với 方法: 办法 thiên về cách xoay xở giải quyết một tình huống/khó khăn cụ thể (想办法 = nghĩ cách, 没办法 = hết cách rồi).',
    [
      { phrase: '想个好办法', meaning: 'nghĩ ra một cách hay' },
      { phrase: '暂时没有办法', meaning: 'tạm thời chưa có cách' },
    ],
    [
      {
        sentence: '遇到难题先别慌，大家坐下来一起想办法总能解决。(Yùdào nántí xiān bié huāng, dàjiā zuò xiàlái yìqǐ xiǎng bànfǎ zǒng néng jiějué.)',
        translation: 'Gặp bài toán khó đừng vội cuống, mọi người ngồi lại cùng nghĩ cách kiểu gì cũng giải quyết được.',
      },
      {
        sentence: '雨下得这么大，又打不到出租车，我们只好想别的办法回家了。(Yǔ xià de zhème dà, yòu dǎbudào chūzūchē, wǒmen zhǐhǎo xiǎng biéde bànfǎ huíjiā le.)',
        translation: 'Mưa to thế này lại không bắt được taxi, chúng ta đành nghĩ cách khác để về nhà thôi.',
      },
    ],
    ['方法', '措施'],
  ),
  createChineseCard(
    'hsk2-work-8',
    'deck-hsk2-work',
    '机会',
    'jīhuì',
    'CƠ HỘI',
    '木 (Mộc) + 人 (Nhân)',
    'Danh từ',
    'cơ hội, dịp',
    'Lượng từ là 个 hoặc 次. Cụm hay gặp: 抓住机会 (nắm bắt cơ hội), 错过机会 (bỏ lỡ cơ hội), 有机会的话 (nếu có dịp).',
    [
      { phrase: '抓住机会', meaning: 'nắm bắt cơ hội' },
      { phrase: '宝贵的实习机会', meaning: 'cơ hội thực tập quý giá' },
    ],
    [
      {
        sentence: '能够参加这次国际交流活动，对年轻学生来说是很难得的机会。(Nénggòu cānjiā zhè cì guójì jiāoliú huódòng, duì niánqīng xuéshēng láishuō shì hěn nándé de jīhuì.)',
        translation: 'Có thể tham gia hoạt động giao lưu quốc tế lần này là cơ hội hiếm có đối với sinh viên trẻ.',
      },
      {
        sentence: '平时多积累专业词汇，等到好机会来临时才能自信上场。(Píngshí duō jīlěi zhuānyè cíhuì, děngdào hǎo jīhuì láilín shí cái néng zìxìn shàngchǎng.)',
        translation: 'Bình thường tích lũy nhiều từ vựng chuyên ngành, đợi khi cơ hội tốt tới mới có thể tự tin bước ra.',
      },
    ],
    ['时机'],
  ),
  createChineseCard(
    'hsk2-work-9',
    'deck-hsk2-work',
    '条件',
    'tiáojiàn',
    'ĐIỀU KIỆN',
    '夂 (Tuy) + 亻(Nhân)',
    'Danh từ',
    'điều kiện, tiêu chuẩn',
    'Chỉ yêu cầu cần có (报名条件 = điều kiện đăng ký) hoặc hoàn cảnh môi trường (生活条件 = điều kiện sinh hoạt).',
    [
      { phrase: '符合条件', meaning: 'đáp ứng đủ điều kiện' },
      { phrase: '学习条件很好', meaning: 'điều kiện học tập rất tốt' },
    ],
    [
      {
        sentence: '这所大学图书馆学习条件特别好，晚上十点才闭馆。(Zhè suǒ dàxué túshūguǎn xuéxí tiáojiàn tèbié hǎo, wǎnshang shí diǎn cái bìguǎn.)',
        translation: 'Thư viện trường đại học này điều kiện học tập cực kỳ tốt, 10 giờ tối mới đóng cửa.',
      },
      {
        sentence: '申请这个岗位有两个基本条件：会说普通话并能使用办公软件。(Shēnqǐng zhège gǎngwèi yǒu liǎng gè jīběn tiáojiàn: huì shuō pǔtōnghuà bìng néng shǐyòng bàngōng ruǎnjiàn.)',
        translation: 'Ứng tuyển vị trí này có hai điều kiện cơ bản: biết nói tiếng phổ thông và sử dụng được phần mềm văn phòng.',
      },
    ],
    ['要求', '环境'],
  ),
  createChineseCard(
    'hsk2-work-10',
    'deck-hsk2-work',
    '成绩',
    'chéngjì',
    'THÀNH TÍCH',
    '戈 (Qua) + 纟(Mịch)',
    'Danh từ',
    'thành tích, điểm số, kết quả',
    'Dùng cho cả điểm số thi cử (考试成绩) lẫn thành quả công việc/thể thao (取得好成绩 = đạt thành tích tốt).',
    [
      { phrase: '取得优异成绩', meaning: 'đạt được thành tích xuất sắc' },
      { phrase: '查询成绩', meaning: 'tra cứu điểm số' },
    ],
    [
      {
        sentence: '虽然这次月考成绩比上次高了十分，他还是认真总结了错题。(Suīrán zhè cì yuèkǎo chéngjì bǐ shàngcì gāo le shí fēn, tā háishi rènzhēn zǒngjié le cuòtí.)',
        translation: 'Tuy điểm thi tháng này cao hơn lần trước 10 điểm, cậu ấy vẫn nghiêm túc tổng kết các câu sai.',
      },
      {
        sentence: '教练说，今天的好成绩离不开每位队员几个月来的汗水。(Jiàoliàn shuō, jīntiān de hǎo chéngjì líbukāi měi wèi duìyuán jǐ gè yuè lái de hànshuǐ.)',
        translation: 'Huấn luyện viên nói rằng thành tích tốt hôm nay không thể tách rời mồ hôi suốt mấy tháng qua của từng thành viên.',
      },
    ],
    ['分数', '成果'],
  ),
  createChineseCard(
    'hsk2-work-11',
    'deck-hsk2-work',
    '水平',
    'shuǐpíng',
    'THỦY BÌNH',
    '水 (Thủy) + 干 (Can)',
    'Danh từ',
    'trình độ, mức độ',
    'Collocation kinh điển: 汉语水平 (trình độ tiếng Hán), 提高水平 (nâng cao trình độ), 水平相当 (trình độ ngang nhau).',
    [
      { phrase: '汉语水平考试', meaning: 'kỳ thi trình độ Hán ngữ (HSK)' },
      { phrase: '保持高水平', meaning: 'duy trì trình độ cao' },
    ],
    [
      {
        sentence: '坚持跟读新闻广播半年以后，我的听说水平上了个新台阶。(Jiānchí gēndú xīnwén guǎngbō bànnián yǐhòu, wǒ de tīngshuō shuǐpíng shàng le gè xīn táijiē.)',
        translation: 'Sau nửa năm kiên trì đọc nhại theo bản tin, trình độ nghe nói của tôi đã bước lên một nấc thang mới.',
      },
      {
        sentence: '这两支排球队平时训练刻苦，比赛水平可以说非常接近。(Zhè liǎng zhī páiqiúduì píngshí xùnliàn kèkǔ, bǐsài shuǐpíng kěyǐ shuō fēicháng jiējìn.)',
        translation: 'Hai đội bóng chuyền này bình thường tập luyện khổ cực, trình độ thi đấu có thể nói rất sát sao.',
      },
    ],
    ['程度', '能力'],
  ),
  createChineseCard(
    'hsk2-work-12',
    'deck-hsk2-work',
    '复习',
    'fùxí',
    'PHỤC TẬP',
    '彳(Xích) + 习 (Tập)',
    'Động từ',
    'ôn tập, ôn lại bài',
    'Đối lập với 预习 (xem trước bài mới) và nối tiếp 学习 (học). Dùng nhiều với cụm 及时复习 (ôn tập kịp thời) để chống quên.',
    [
      { phrase: '按时复习', meaning: 'ôn tập đúng hạn' },
      { phrase: '考前总复习', meaning: 'tổng ôn tập trước kỳ thi' },
    ],
    [
      {
        sentence: '学过的新词如果不及时复习，几天后就很容易忘掉一半。(Xuéguò de xīncí rúguǒ bù jíshí fùxí, jǐ tiān hòu jiù hěn róngyì wàngdiào yíbàn.)',
        translation: 'Từ mới đã học nếu không ôn tập kịp thời, vài ngày sau rất dễ quên mất một nửa.',
      },
      {
        sentence: '这周末我不打算出门，想在家专心复习下周的汉字听写。(Zhè zhōumò wǒ bù dǎsuàn chūmén, xiǎng zài jiā zhuānxīn fùxí xià zhōu de Hànzì tīngxiě.)',
        translation: 'Cuối tuần này tôi không định ra ngoài, muốn ở nhà tập trung ôn cho bài nghe viết chữ Hán tuần sau.',
      },
    ],
    ['温习'],
  ),
  createChineseCard(
    'hsk2-work-13',
    'deck-hsk2-work',
    '练习',
    'liànxí',
    'LUYỆN TẬP',
    '纟(Mịch) + 习 (Tập)',
    'Động từ / Danh từ',
    'luyện tập, bài tập thực hành',
    'Vừa là động từ (练习口语 = luyện nói) vừa là danh từ (做练习 = làm bài tập thực hành). Phân biệt: 复习 là ôn kiến thức cũ, 练习 là rèn kỹ năng.',
    [
      { phrase: '反复练习发音', meaning: 'luyện phát âm lặp đi lặp lại' },
      { phrase: '做课后练习', meaning: 'làm bài tập sau buổi học' },
    ],
    [
      {
        sentence: '学习语言没有捷径，只有通过每天大声练习才能说得自然。(Xuéxí yǔyán méiyǒu jiéjìng, zhǐyǒu tōngguò měitiān dàshēng liànxí cái néng shuō de zìrán.)',
        translation: 'Học ngoại ngữ không có đường tắt, chỉ có thông qua luyện tập nói to mỗi ngày mới nói tự nhiên được.',
      },
      {
        sentence: '我把容易写错的汉字放进练习本里，每天抽十分钟默写一遍。(Wǒ bǎ róngyì xiěcuò de Hànzì fàngjìn liànxíběn lǐ, měitiān chōu shí fēnzhōng mòxiě yíbiàn.)',
        translation: 'Tôi đưa những chữ Hán hay viết nhầm vào vở luyện tập, mỗi ngày dành 10 phút viết lại theo trí nhớ một lượt.',
      },
    ],
    ['训练', '锻炼'],
  ),
  createChineseCard(
    'hsk2-work-14',
    'deck-hsk2-work',
    '检查',
    'jiǎnchá',
    'KIỂM TRA',
    '木 (Mộc) + 木 (Mộc)',
    'Động từ / Danh từ',
    'kiểm tra, rà soát, khám bệnh',
    'Dùng rộng rãi: kiểm tra bài làm/hành lý/email (检查作业, 检查行李) và khám sức khỏe (检查身体).',
    [
      { phrase: '仔细检查一遍', meaning: 'kiểm tra kỹ lại một lượt' },
      { phrase: '体检检查', meaning: 'kiểm tra sức khỏe' },
    ],
    [
      {
        sentence: '交卷之前一定要从头到尾检查一遍，避免粗心丢分。(Jiāojuàn zhīqián yídìng yào cóngtóu dàowěi jiǎnchá yíbiàn, bìmiǎn cūxīn diūfēn.)',
        translation: 'Trước khi nộp bài nhất định phải kiểm tra lại từ đầu đến cuối, tránh bất cẩn mất điểm.',
      },
      {
        sentence: '出发去机场前，请再次检查护照和身份证是否带齐了。(Chūfā qù jīchǎng qián, qǐng zàicì jiǎnchá hùzhào hé shēnfènzhèng shìfǒu dàiqí le.)',
        translation: 'Trước khi xuất phát ra sân bay, hãy kiểm tra lại lần nữa xem đã mang đủ hộ chiếu và căn cước chưa.',
      },
    ],
    ['查看', '核对'],
  ),
  createChineseCard(
    'hsk2-work-15',
    'deck-hsk2-work',
    '完成',
    'wánchéng',
    'HOÀN THÀNH',
    '宀 (Miên) + 戈 (Qua)',
    'Động từ',
    'hoàn thành, làm xong',
    'Dùng cho nhiệm vụ, kế hoạch, bài tập, dự án có quy mô hoặc mục tiêu rõ ràng (完成任务). Khác với 完 đứng làm bổ ngữ sau động từ khác (做完, 吃完).',
    [
      { phrase: '按时完成任务', meaning: 'hoàn thành nhiệm vụ đúng hạn' },
      { phrase: '顺利完成', meaning: 'hoàn thành thuận lợi' },
    ],
    [
      {
        sentence: '全组成员分工明确，所以比原定时间提前两天完成了报告。(Quánzǔ chéngyuán fēngōng míngquè, suǒyǐ bǐ yuándìng shíjiān tíqián liǎng tiān wánchéng le bàogào.)',
        translation: 'Thành viên cả tổ phân công rõ ràng nên đã hoàn thành báo cáo sớm hơn dự kiến hai ngày.',
      },
      {
        sentence: '今天的复习目标一完成，我就奖励自己出去跑五公里。(Jīntiān de fùxí mùbiāo yì wánchéng, wǒ jiù jiǎnglì zìjǐ chūqù pǎo wǔ gōnglǐ.)',
        translation: 'Hễ hoàn thành xong mục tiêu ôn tập hôm nay là tôi tự thưởng cho mình ra ngoài chạy 5 km.',
      },
    ],
    ['做好', '实现'],
  ),
  createChineseCard(
    'hsk2-work-16',
    'deck-hsk2-work',
    '参加',
    'cānjiā',
    'THAM GIA',
    '厶 (Tư) + 力 (Lực)',
    'Động từ',
    'tham gia, tham dự',
    'Dùng khi tham gia hoạt động, hội nghị, cuộc thi, tổ chức (参加比赛, 参加聚会). Chú ý: người xem/khán giả dùng 观看 hoặc 看, người trực tiếp tham dự dùng 参加.',
    [
      { phrase: '报名参加', meaning: 'đăng ký tham gia' },
      { phrase: '参加讨论会', meaning: 'tham dự buổi thảo luận' },
    ],
    [
      {
        sentence: '下周学校举行中文朗诵比赛，你想不想报名参加？(Xià zhōu xuéxiào jǔxíng Zhōngwén lǎngsòng bǐsài, nǐ xiǎng bu xiǎng bàomíng cānjiā?)',
        translation: 'Tuần sau trường tổ chức cuộc thi đọc diễn cảm tiếng Trung, bạn có muốn đăng ký tham gia không?',
      },
      {
        sentence: '虽然刚入职不久，她已经积极参加了公司所有的志愿活动。(Suīrán gāng rùzhí bù jiǔ, tā yǐjīng jījí cānjiā le gōngsī suǒyǒu de zhìyuàn huódòng.)',
        translation: 'Tuy mới vào công ty chưa lâu, cô ấy đã tích cực tham gia tất cả hoạt động tình nguyện của công ty.',
      },
    ],
    ['加入', '参与'],
  ),
  createChineseCard(
    'hsk2-work-17',
    'deck-hsk2-work',
    '帮助',
    'bāngzhù',
    'BANG TRỢ',
    '巾 (Cân) + 力 (Lực)',
    'Động từ / Danh từ',
    'giúp đỡ; sự giúp đỡ',
    'Trang trọng hơn 帮 một chút, dùng được cả làm động từ (帮助别人 = giúp người khác) lẫn danh từ (在大家的帮助下 = dưới sự giúp đỡ của mọi người).',
    [
      { phrase: '互相帮助', meaning: 'giúp đỡ lẫn nhau' },
      { phrase: '对学习很有帮助', meaning: 'rất có ích cho việc học' },
    ],
    [
      {
        sentence: '非常感谢你在我最忙的时候主动过来帮助整理这些文件。(Fēicháng gǎnxiè nǐ zài wǒ zuì máng de shíhou zhǔdòng guòlái bāngzhù zhěnglǐ zhèxiē wénjiàn.)',
        translation: 'Vô cùng cảm ơn bạn lúc tôi bận nhất đã chủ động qua giúp sắp xếp đống tài liệu này.',
      },
      {
        sentence: '多听中文播客对培养语感有很大帮助，走路时也能听。(Duō tīng Zhōngwén bōkè duì péiyǎng yǔgǎn yǒu hěn dà bāngzhù, zǒulù shí yě néng tīng.)',
        translation: 'Nghe nhiều podcast tiếng Trung giúp ích rất lớn cho việc rèn cảm giác ngôn ngữ, đi bộ cũng nghe được.',
      },
    ],
    ['帮忙', '协助'],
  ),
  createChineseCard(
    'hsk2-work-18',
    'deck-hsk2-work',
    '作用',
    'zuòyòng',
    'TÁC DỤNG',
    '亻(Nhân) + 用 (Dụng)',
    'Danh từ / Động từ',
    'tác dụng, vai trò, ảnh hưởng',
    'Cụm chuẩn: 对…有作用 (có tác dụng đối với…), 发挥重要作用 (phát huy vai trò quan trọng).',
    [
      { phrase: '起到关键作用', meaning: 'đóng vai trò then chốt' },
      { phrase: '副作用', meaning: 'tác dụng phụ' },
    ],
    [
      {
        sentence: '每天睡前十分钟的间隔重复记忆，对巩固词汇有很大作用。(Měitiān shuìqián shí fēnzhōng de jiàngé chóngfù jìyì, duì gǒnggù cíhuì yǒu hěn dà zuòyòng.)',
        translation: 'Mười phút ôn lặp lại ngắt quãng mỗi tối trước khi ngủ có tác dụng rất lớn để củng cố từ vựng.',
      },
      {
        sentence: '这位老医生开的药效果很好，而且对胃几乎没有刺激作用。(Zhè wèi lǎo yīshēng kāi de yào xiàoguǒ hěn hǎo, érqiě duì wèi jīhū méiyǒu cìjī zuòyòng.)',
        translation: 'Thuốc vị bác sĩ lớn tuổi này kê rất hiệu quả, lại hầu như không gây kích ứng dạ dày.',
      },
    ],
    ['效果', '影响'],
  ),
  createChineseCard(
    'hsk2-work-19',
    'deck-hsk2-work',
    '通知',
    'tōngzhī',
    'THÔNG TRI',
    '辶 (Sước) + 矢 (Thỉ)',
    'Động từ / Danh từ',
    'thông báo, báo cho biết',
    'Làm động từ mang 2 tân ngữ hoặc kiêm ngữ (通知大家明天开会 = thông báo mọi người mai họp); làm danh từ chỉ bản thông báo (收到一份通知).',
    [
      { phrase: '发通知', meaning: 'ra thông báo' },
      { phrase: '提前通知一声', meaning: 'báo trước một tiếng' },
    ],
    [
      {
        sentence: '如果会议时间有变动，请行政部门第一时间通知所有人。(Rúguǒ huìyì shíjiān yǒu biàndòng, qǐng xíngzhèng bùmén dìyī shíjiān tōngzhī suǒyǒu rén.)',
        translation: 'Nếu thời gian họp có thay đổi, xin bộ phận hành chính thông báo ngay cho tất cả mọi người.',
      },
      {
        sentence: '早上打开手机，我就收到了银行发来的到账短信通知。(Zǎoshang dǎkāi shǒujī, wǒ jiù shōudào le yínháng fālái de dàozhàng duǎnxìn tōngzhī.)',
        translation: 'Buổi sáng mở điện thoại lên, tôi đã nhận được tin nhắn thông báo tiền vào tài khoản từ ngân hàng.',
      },
    ],
    ['告诉', '公告'],
  ),
  createChineseCard(
    'hsk2-work-20',
    'deck-hsk2-work',
    '重视',
    'zhòngshì',
    'TRỌNG THỊ',
    '里 (Lý) + 见 (Kiến)',
    'Động từ',
    'coi trọng, chú trọng, đề cao',
    'Thường nhận phó từ mức độ: 非常重视, 高度重视. Mang nghĩa đặt sự quan tâm cao về mặt thái độ hoặc nguồn lực vào một vấn đề.',
    [
      { phrase: '高度重视', meaning: 'hết sức coi trọng' },
      { phrase: '重视实践能力', meaning: 'coi trọng năng lực thực hành' },
    ],
    [
      {
        sentence: '这家学校非常重视培养学生的独立思考与表达能力。(Zhè jiā xuéxiào fēicháng zhòngshì péiyǎng xuéshēng de dúlì sīkǎo yǔ biǎodá nénglì.)',
        translation: 'Ngôi trường này rất coi trọng việc rèn luyện năng lực tư duy độc lập và diễn đạt cho học sinh.',
      },
      {
        sentence: '大家在追求工作速度的同时，也一定要重视身体健康。(Dàjiā zài zhuīqiú gōngzuò sùdù de tóngshí, yě yídìng yào zhòngshì shēntǐ jiànkāng.)',
        translation: 'Trong lúc theo đuổi tốc độ công việc, mọi người nhất định cũng phải coi trọng sức khỏe bản thân.',
      },
    ],
    ['关注', '注重'],
  ),

  // ==========================================================
  // DECK 4: HSK 2 · Đời sống, Di chuyển & Sức khỏe (20 từ)
  // ==========================================================
  createChineseCard(
    'hsk2-life-1',
    'deck-hsk2-lifestyle',
    '地铁',
    'dìtiě',
    'ĐỊA THIẾT',
    '土 (Thổ) + 钅(Kim)',
    'Danh từ',
    'tàu điện ngầm',
    'Đi với động từ 坐 (ngồi/đi) hoặc 换乘 (chuyển tuyến): 坐地铁去市中心. Nhắc đến tuyến tàu dùng 号线 (như 二号线).',
    [
      { phrase: '坐地铁通勤', meaning: 'đi làm bằng tàu điện ngầm' },
      { phrase: '地铁站出口', meaning: 'lối ra ga tàu điện ngầm' },
    ],
    [
      {
        sentence: '早高峰路面容易堵车，坐地铁去公司反而又快又准时。(Zǎo gāofēng lùmiàn róngyì dǔchē, zuò dìtiě qù gōngsī fǎn\'ér yòu kuài yòu zhǔnshí.)',
        translation: 'Giờ cao điểm buổi sáng mặt đường dễ tắc xe, đi tàu điện ngầm đến công ty lại vừa nhanh vừa đúng giờ.',
      },
      {
        sentence: '这趟地铁坐三站之后，再换乘二号线就能直达机场。(Zhè tàng dìtiě zuò sān zhàn zhīhòu, zài huànchéng èr hào xiàn jiù néng zhídá jīchǎng.)',
        translation: 'Chuyến tàu điện ngầm này đi 3 bến rồi chuyển sang tuyến số 2 là tới thẳng sân bay.',
      },
    ],
    ['轻轨'],
  ),
  createChineseCard(
    'hsk2-life-2',
    'deck-hsk2-lifestyle',
    '公共汽车',
    'gōnggòng qìchē',
    'CÔNG CỘNG KHÍ XA',
    '八 (Bát) + 车 (Xa)',
    'Danh từ',
    'xe buýt công cộng',
    'Gọi đầy đủ là 公共汽车, trong khẩu ngữ hiện đại thường rút gọn thành 公交车. Lượng từ: 辆 (一辆公共汽车).',
    [
      { phrase: '乘公共汽车', meaning: 'đi xe buýt công cộng' },
      { phrase: '公共汽车站', meaning: 'trạm xe buýt' },
    ],
    [
      {
        sentence: '去植物园不用打车，门口那路公共汽车二十分钟就到了。(Qù zhíwùyuán bú yòng dǎchē, ménkǒu nà lù gōnggòng qìchē èrshí fēnzhōng jiù dào le.)',
        translation: 'Đi vườn bách thảo không cần bắt taxi đâu, tuyến xe buýt ngay trước cổng đi 20 phút là tới.',
      },
      {
        sentence: '在公共汽车上遇到老人或者孕妇，大家都会主动让座。(Zài gōnggòng qìchē shàng yùdào lǎorén huòzhě yùnfù, dàjiā dōu huì zhǔdòng ràngzuò.)',
        translation: 'Trên xe buýt gặp người lớn tuổi hoặc phụ nữ mang thai, mọi người đều chủ động nhường ghế.',
      },
    ],
    ['公交车'],
  ),
  createChineseCard(
    'hsk2-life-3',
    'deck-hsk2-lifestyle',
    '出租车',
    'chūzūchē',
    'XUẤT TÔ XA',
    '凵 (Khảm) + 车 (Xa)',
    'Danh từ',
    'xe taxi',
    'Từ ghép 3 chữ: 出租 (cho thuê) + 车 (xe). Gọi/bắt taxi trong khẩu ngữ dùng 打车 hoặc 打出租车, ngồi taxi dùng 坐出租车.',
    [
      { phrase: '叫一辆出租车', meaning: 'gọi một chiếc taxi' },
      { phrase: '出租车司机', meaning: 'tài xế taxi' },
    ],
    [
      {
        sentence: '行李箱这么重，我们还是在门口叫辆出租车直接去车站吧。(Xínglixiāng zhème zhòng, wǒmen háishi zài ménkǒu jiào liàng chūzūchē zhíjiē qù chēzhàn ba.)',
        translation: 'Vali nặng thế này, chúng ta cứ gọi chiếc taxi ngay cổng đi thẳng ra nhà ga nhé.',
      },
      {
        sentence: '刚才那位出租车司机非常热情，一路上给我们介绍了好多美食。(Gāngcái nà wèi chūzūchē sījī fēicháng rèqíng, yílùshàng gěi wǒmen jièshào le hǎoduō měishí.)',
        translation: 'Bác tài xế taxi lúc nãy vô cùng nhiệt tình, suốt dọc đường giới thiệu cho chúng tôi bao nhiêu món ngon.',
      },
    ],
    ['的士'],
  ),
  createChineseCard(
    'hsk2-life-4',
    'deck-hsk2-lifestyle',
    '自行车',
    'zìxíngchē',
    'TỰ HÀNH XA',
    '自 (Tự) + 车 (Xa)',
    'Danh từ',
    'xe đạp',
    'Động từ chuẩn đi kèm là 骑 (cưỡi/đạp): 骑自行车. Không dùng *开自行车 (开 dùng cho ô tô).',
    [
      { phrase: '骑自行车出行', meaning: 'đi lại bằng xe đạp' },
      { phrase: '共享自行车', meaning: 'xe đạp công cộng dùng chung' },
    ],
    [
      {
        sentence: '秋天傍晚微风凉爽，沿湖骑自行车既环保又让人心情舒畅。(Qiūtiān bàngwǎn wēifēng liángshuǎng, yán hú qí zìxíngchē jì huánbǎo yòu ràng rén xīnqíng shūchàng.)',
        translation: 'Chiều thu gió hiu hiu mát mẻ, đạp xe dọc hồ vừa bảo vệ môi trường vừa khiến tâm trạng thư thái.',
      },
      {
        sentence: '校园面积很大，很多同学喜欢骑自行车去图书馆和食堂。(Xiàoyuán miànjī hěn dà, hěn duō tóngxué xǐhuan qí zìxíngchē qù túshūguǎn hé shítáng.)',
        translation: 'Khuôn viên trường rất rộng nên nhiều sinh viên thích đạp xe đi thư viện và nhà ăn.',
      },
    ],
    ['单车'],
  ),
  createChineseCard(
    'hsk2-life-5',
    'deck-hsk2-lifestyle',
    '护照',
    'hùzhào',
    'HỘ CHIẾU',
    '扌(Thủ) + 灬 (Hỏa)',
    'Danh từ',
    'hộ chiếu',
    'Lượng từ thường dùng là 本 (一本护照). Cụm thực tế khi du lịch: 办护照 (làm hộ chiếu), 护照有效期 (thời hạn hộ chiếu).',
    [
      { phrase: '办理新护照', meaning: 'làm hộ chiếu mới' },
      { phrase: '保管好护照', meaning: 'giữ gìn hộ chiếu cẩn thận' },
    ],
    [
      {
        sentence: '出国旅行时一定要随身保管好护照，以免影响后续行程。(Chūguó lǚxíng shí yídìng yào suíshēn bǎoguǎn hǎo hùzhào, yǐmiǎn yǐngxiǎng hòuxù xíngchéng.)',
        translation: 'Khi đi du lịch nước ngoài nhất định phải giữ kỹ hộ chiếu bên mình để tránh ảnh hưởng lịch trình tiếp theo.',
      },
      {
        sentence: '他提前两个月就开始办理护照和签证，准备得十分周到。(Tā tíqián liǎng gè yuè jiù kāishǐ bànlǐ hùzhào hé qiānzhèng, zhǔnbèi de shífēn zhōudào.)',
        translation: 'Anh ấy bắt đầu làm hộ chiếu và visa trước hai tháng, chuẩn bị vô cùng chu đáo.',
      },
    ],
    ['证件'],
  ),
  createChineseCard(
    'hsk2-life-6',
    'deck-hsk2-lifestyle',
    '酒店',
    'jiǔdiàn',
    'TỬU ĐIẾM',
    '氵(Thủy) + 广 (Nghiễm)',
    'Danh từ',
    'khách sạn',
    'Từ phổ biến nhất hiện nay chỉ khách sạn (trước đây có 宾馆, 旅馆). Lượng từ: 家. Động từ: 预订酒店 (đặt phòng khách sạn), 住酒店.',
    [
      { phrase: '预订酒店房间', meaning: 'đặt phòng khách sạn' },
      { phrase: '酒店大堂', meaning: 'sảnh khách sạn' },
    ],
    [
      {
        sentence: '我们选的这家酒店就在老街旁边，出门吃饭和逛街都很方便。(Wǒmen xuǎn de zhè jiā jiǔdiàn jiù zài lǎojiē pángbiān, chūmén chīfàn hé guàngjiē dōu hěn fāngbiàn.)',
        translation: 'Khách sạn chúng tôi chọn nằm ngay cạnh phố cổ, ra ngoài ăn uống hay dạo phố đều rất tiện.',
      },
      {
        sentence: '旅游旺季房间紧张，最好提前两周在网上把酒店订好。(Lǚyóu wàngjì fángjiān jǐnzhāng, zuìhǎo tíqián liǎng zhōu zài wǎngshàng bǎ jiǔdiàn dìng hǎo.)',
        translation: 'Mùa cao điểm du lịch phòng hay hết, tốt nhất nên đặt khách sạn trên mạng trước hai tuần.',
      },
    ],
    ['宾馆', '饭店'],
  ),
  createChineseCard(
    'hsk2-life-7',
    'deck-hsk2-lifestyle',
    '饭馆',
    'fànguǎn',
    'PHẠN QUÁN',
    '饣(Thực) + 饣(Thực)',
    'Danh từ',
    'quán ăn, nhà hàng',
    'Chỉ quán ăn quy mô vừa và nhỏ ấm cúng (còn 餐厅 hoặc 饭店 thường mang sắc thái nhà hàng lớn/lịch sự hơn).',
    [
      { phrase: '特色小饭馆', meaning: 'quán ăn nhỏ mang hương vị riêng' },
      { phrase: '家常菜饭馆', meaning: 'quán cơm gia đình' },
    ],
    [
      {
        sentence: '巷子深处那家小饭馆虽然地方不大，但每到饭点总是坐满客人。(Xiàngzi shēnchù nà jiā xiǎo fànguǎn suīrán dìfang bú dà, dàn měi dào fàndiǎn zǒngshì zuòmǎn kèrén.)',
        translation: 'Quán ăn nhỏ cuối con ngõ kia tuy không gian không lớn nhưng cứ đến giờ cơm là luôn kín khách.',
      },
      {
        sentence: '周末不想做饭的时候，我们就去街角那家新开的饭馆尝尝鲜。(Zhōumò bù xiǎng zuòfàn de shíhou, wǒmen jiù qù jiējiǎo nà jiā xīn kāi de fànguǎn chángchangxiān.)',
        translation: 'Cuối tuần lúc nào lười nấu cơm, chúng tôi lại ra quán ăn mới mở ở góc phố nếm thử món mới.',
      },
    ],
    ['餐厅', '饭店'],
  ),
  createChineseCard(
    'hsk2-life-8',
    'deck-hsk2-lifestyle',
    '菜单',
    'càidān',
    'THÁI ĐƠN',
    '艹 (Thảo) + 丶(Chủ)',
    'Danh từ',
    'thực đơn (menu)',
    'Lượng từ: 份 hoặc 张. Câu giao tiếp nhà hàng hữu dụng: 服务员，请拿一份菜单 (Phục vụ ơi, cho tôi xin một cuốn thực đơn).',
    [
      { phrase: '看菜单点菜', meaning: 'xem thực đơn gọi món' },
      { phrase: '双语菜单', meaning: 'thực đơn song ngữ' },
    ],
    [
      {
        sentence: '这家餐厅很贴心，菜单上不仅有图片，还标明了每道菜的辣度。(Zhè jiā cāntīng hěn tiēxīn, càidān shàng bùjǐn yǒu túpiàn, hái biāomíng le měi dào cài de làdù.)',
        translation: 'Nhà hàng này rất chu đáo, trên thực đơn không chỉ có ảnh mà còn ghi rõ độ cay của từng món.',
      },
      {
        sentence: '我先把菜单上的招牌菜选出来，你再看看想加点什么汤。(Wǒ xiān bǎ càidān shàng de zhāopáicài xuǎn chūlái, nǐ zài kànkan xiǎng jiā diǎn shénme tāng.)',
        translation: 'Tôi chọn trước mấy món đặc sản trên thực đơn, rồi bạn xem thử muốn gọi thêm canh gì nhé.',
      },
    ],
    ['食谱'],
  ),
  createChineseCard(
    'hsk2-life-9',
    'deck-hsk2-lifestyle',
    '超市',
    'chāoshì',
    'SIÊU THỊ',
    '走 (Tẩu) + 巾 (Cân)',
    'Danh từ',
    'siêu thị',
    'Viết tắt của 超级市场 (chợ siêu cấp). Dùng rất phổ biến thay vì 商店 khi nói về việc đi mua thực phẩm, đồ dùng sinh hoạt (逛超市 = đi dạo siêu thị).',
    [
      { phrase: '去超市买食材', meaning: 'đi siêu thị mua nguyên liệu nấu ăn' },
      { phrase: '大型超市', meaning: 'siêu thị lớn' },
    ],
    [
      {
        sentence: '下班顺路去趟超市买点儿新鲜蔬菜、鸡蛋和酸奶带回家。(Xiàbān shùnlù qù tàng chāoshì mǎi diǎnr xīnxiān shūcài, jīdàn hé suānnǎi dài huíjiā.)',
        translation: 'Tan làm tiện đường ghé siêu thị mua ít rau tươi, trứng gà và sữa chua mang về nhà.',
      },
      {
        sentence: '周末晚上社区超市经常有水果打折活动，价格实惠极了。(Zhōumò wǎnshang shèqū chāoshì jīngcháng yǒu shuǐguǒ dǎzhé huódòng, jiàgé shíhuì jíle.)',
        translation: 'Tối cuối tuần siêu thị khu dân cư hay có chương trình giảm giá trái cây, giá cực kỳ hời.',
      },
    ],
    ['商场', '商店'],
  ),
  createChineseCard(
    'hsk2-life-10',
    'deck-hsk2-lifestyle',
    '银行',
    'yínháng',
    'NGÂN HÀNG',
    '钅(Kim) + 彳(Xích)',
    'Danh từ',
    'ngân hàng',
    'Chú ý đa âm tự 行 đọc là háng (hàng/ngành), KHÔNG đọc xíng. Dùng trong 银行卡 (thẻ ngân hàng), 去银行办业务 (đi ngân hàng làm thủ tục).',
    [
      { phrase: '银行卡密码', meaning: 'mật khẩu thẻ ngân hàng' },
      { phrase: '去银行取钱', meaning: 'ra ngân hàng rút tiền' },
    ],
    [
      {
        sentence: '银行门口写着营业时间：周一到周五上午九点至下午五点。(Yínháng ménkǒu xiězhe yíngyè shíjiān: zhōuyī dào zhōuwǔ shàngwǔ jiǔ diǎn zhì xiàwǔ wǔ diǎn.)',
        translation: 'Trước cửa ngân hàng ghi giờ làm việc: thứ Hai đến thứ Sáu từ 9 giờ sáng đến 5 giờ chiều.',
      },
      {
        sentence: '现在大部分转账都能在手机银行上完成，不用再排队等待了。(Xiànzài dàbùfen zhuǎnzhàng dōu néng zài shǒujī yínháng shàng wánchéng, bú yòng zài páiduì děngdài le.)',
        translation: 'Hiện nay phần lớn giao dịch chuyển khoản đều làm được trên ứng dụng ngân hàng điện thoại, không cần xếp hàng chờ nữa.',
      },
    ],
    ['金融机构'],
  ),
  createChineseCard(
    'hsk2-life-11',
    'deck-hsk2-lifestyle',
    '公园',
    'gōngyuán',
    'CÔNG VIÊN',
    '八 (Bát) + 囗 (Vi)',
    'Danh từ',
    'công viên',
    'Nơi sinh hoạt cộng đồng quen thuộc trong bài đọc HSK: 去公园散步 (đi dạo công viên), 逛公园 (đi chơi công viên).',
    [
      { phrase: '在公园散步', meaning: 'đi dạo trong công viên' },
      { phrase: '人民公园', meaning: 'công viên Nhân dân' },
    ],
    [
      {
        sentence: '每天清晨都有不少老人在公园的大树下打太极拳、听戏曲。(Měitiān qīngchén dōu yǒu bùshǎo lǎorén zài gōngyuán de dàshù xià dǎ tàijíquán, tīng xìqǔ.)',
        translation: 'Sáng sớm nào cũng có không ít người lớn tuổi tập thái cực quyền và nghe hí khúc dưới gốc cây lớn trong công viên.',
      },
      {
        sentence: '春天一到，湖边公园的桃花全开了，吸引了好多游客来拍照。(Chūntiān yí dào, húbiān gōngyuán de táohuā quán kāi le, xīyǐn le hǎoduō yóukè lái pāizhào.)',
        translation: 'Xuân vừa tới, hoa đào ở công viên ven hồ nở rộ, thu hút rất nhiều du khách đến chụp ảnh.',
      },
    ],
    ['花园', '广场'],
  ),
  createChineseCard(
    'hsk2-life-12',
    'deck-hsk2-lifestyle',
    '旅游',
    'lǚyóu',
    'LỮ DU',
    '方 (Phương) + 氵(Thủy)',
    'Động từ / Danh từ',
    'du lịch, đi chơi xa',
    'Nhấn mạnh đi tham quan ngắm cảnh giải trí (còn 旅行 có thể bao gồm cả đi công tác, đi xa dài ngày). Cụm hay dùng: 旅游景点, 自由行旅游.',
    [
      { phrase: '出国旅游', meaning: 'du lịch nước ngoài' },
      { phrase: '旅游纪念品', meaning: 'quà lưu niệm du lịch' },
    ],
    [
      {
        sentence: '每次去不同的城市旅游，我最喜欢逛当地的早市和博物馆。(Měicì qù bùtóng de chéngshì lǚyóu, wǒ zuì xǐhuan guàng dāngdì de zǎoshì hé bówùguǎn.)',
        translation: 'Mỗi lần đi du lịch ở một thành phố khác nhau, tôi thích nhất đi dạo chợ sớm và bảo tàng địa phương.',
      },
      {
        sentence: '秋高气爽，正是避开人流去山水小镇旅游的好季节。(Qiūgāo qìshuǎng, zhèng shì bìkāi rénliú qù shānshuǐ xiǎozhèn lǚyóu de hǎo jìjié.)',
        translation: 'Trời thu mát mẻ dễ chịu, đúng là mùa đẹp để tránh đám đông đi du lịch những thị trấn non nước.',
      },
    ],
    ['旅行', '观光'],
  ),
  createChineseCard(
    'hsk2-life-13',
    'deck-hsk2-lifestyle',
    '运动',
    'yùndòng',
    'VẬN ĐỘNG',
    '辶 (Sước) + 力 (Lực)',
    'Động từ / Danh từ',
    'tập thể dục, vận động; thể thao',
    'Dùng rộng hơn 锻炼: 做运动 (tập thể dục), 户外运动 (thể thao ngoài trời), 运动鞋 (giày thể thao).',
    [
      { phrase: '坚持户外运动', meaning: 'kiên trì vận động ngoài trời' },
      { phrase: '运动后多喝水', meaning: 'uống nhiều nước sau khi vận động' },
    ],
    [
      {
        sentence: '医生建议办公室职员每周至少保持三次有氧运动。(Yīshēng jiànyì bàngōngshì zhíyuán měi zhōu zhìshǎo bǎochí sāncì yǒuyǎng yùndòng.)',
        translation: 'Bác sĩ khuyên nhân viên văn phòng mỗi tuần duy trì ít nhất 3 buổi vận động hiếu khí.',
      },
      {
        sentence: '适当运动不仅能增强体质，还能缓解工作带来的紧张情绪。(Shìdàng yùndòng bùjǐn néng zēngqiáng tǐzhì, hái néng huǎnjiě gōngzuò dàilái de jǐnzhāng qíngxù.)',
        translation: 'Vận động điều độ không chỉ tăng cường thể chất mà còn giải tỏa căng thẳng do công việc mang lại.',
      },
    ],
    ['锻炼', '体育'],
  ),
  createChineseCard(
    'hsk2-life-14',
    'deck-hsk2-lifestyle',
    '健康',
    'jiànkāng',
    'KIỆN KHANG',
    '亻(Nhân) + 广 (Nghiễm)',
    'Tính từ / Danh từ',
    'khỏe mạnh; sức khỏe',
    'Vừa làm tính từ miêu tả lối sống/cơ thể (健康饮食 = ăn uống lành mạnh, 身体很健康) vừa làm danh từ (关心健康 = quan tâm sức khỏe).',
    [
      { phrase: '保持身体健康', meaning: 'giữ gìn sức khỏe cơ thể' },
      { phrase: '健康的生活方式', meaning: 'lối sống lành mạnh' },
    ],
    [
      {
        sentence: '少吃油炸食物、按时吃早餐，是最简单也最有效的健康习惯。(Shǎo chī yóuzhá shíwù, ànshí chī zǎocān, shì zuì jiǎndān yě zuì yǒuxiào de jiànkāng xíguàn.)',
        translation: 'Ít ăn đồ chiên rán, ăn sáng đúng giờ là thói quen sức khỏe đơn giản mà hiệu quả nhất.',
      },
      {
        sentence: '年纪越大越会明白，家人平平安安、健健康康才是最重要的。(Niánjì yuè dà yuè huì míngbai, jiārén píngpíng\'ān\'ān, jiànjiànkāngkāng cái shì zuì zhòngyào de.)',
        translation: 'Càng lớn tuổi càng hiểu rằng người nhà bình an, khỏe mạnh mới là điều quan trọng nhất.',
      },
    ],
    ['强壮', '健壮'],
  ),
  createChineseCard(
    'hsk2-life-15',
    'deck-hsk2-lifestyle',
    '住院',
    'zhùyuàn',
    'TRÚ VIỆN',
    '亻(Nhân) + 阝(Phụ)',
    'Động từ (ly hợp)',
    'nhập viện, nằm viện',
    'Là động từ ly hợp (住 + 院): có thể chèn bổ ngữ thời gian vào giữa như 住了三天院 (nằm viện 3 ngày). Đối nghĩa là 出院 (xuất viện).',
    [
      { phrase: '住院观察两天', meaning: 'nằm viện theo dõi hai ngày' },
      { phrase: '办理住院手续', meaning: 'làm thủ tục nhập viện' },
    ],
    [
      {
        sentence: '叔叔做完一个小手术后在医院住了三天，恢复得很快。(Shūshu zuòwán yí gè xiǎo shǒushù hòu zài yīyuàn zhù le sān tiān, huīfù de hěn kuài.)',
        translation: 'Sau khi làm một ca tiểu phẫu, chú nằm viện 3 ngày và hồi phục rất nhanh.',
      },
      {
        sentence: '听说同事因为发高烧住院了，大家下班后一起买了水果去看望他。(Tīngshuō tóngshì yīnwèi fā gāoshāo zhùyuàn le, dàjiā xiàbān hòu yìqǐ mǎi le shuǐguǒ qù kànwàng tā.)',
        translation: 'Nghe tin đồng nghiệp phải nhập viện vì sốt cao, tan làm mọi người cùng mua trái cây tới thăm anh ấy.',
      },
    ],
    ['就医'],
  ),
  createChineseCard(
    'hsk2-life-16',
    'deck-hsk2-lifestyle',
    '药店',
    'yàodiàn',
    'DƯỢC ĐIẾM',
    '艹 (Thảo) + 广 (Nghiễm)',
    'Danh từ',
    'hiệu thuốc, nhà thuốc',
    'Ghép từ 药 (thuốc) + 店 (cửa hàng). Lượng từ: 家. Mua thuốc tại nhà thuốc dùng 去药店买药.',
    [
      { phrase: '附近的24小时药店', meaning: 'hiệu thuốc 24 giờ gần đây' },
      { phrase: '在药店买感冒药', meaning: 'mua thuốc cảm ở hiệu thuốc' },
    ],
    [
      {
        sentence: '小区大门口对面就有一家药店，买常用药和口罩都很方便。(Xiǎoqū dàménkǒu duìmiàn jiù yǒu yì jiā yàodiàn, mǎi chángyòng yào hé kǒuzhào dōu hěn fāngbiàn.)',
        translation: 'Ngay đối diện cổng lớn khu dân cư có một hiệu thuốc, mua thuốc thông dụng và khẩu trang rất tiện.',
      },
      {
        sentence: '半夜孩子有点发烧，爸爸赶紧开车去二十四小时药店买退烧药。(Bànyè háizi yǒudiǎn fāshāo, bàba gǎnjǐn kāichē qù èrshísì xiǎoshí yàodiàn mǎi tuìshāoyào.)',
        translation: 'Nửa đêm con hơi sốt, bố vội lái xe ra hiệu thuốc 24 giờ mua thuốc hạ sốt.',
      },
    ],
    ['药房'],
  ),
  createChineseCard(
    'hsk2-life-17',
    'deck-hsk2-lifestyle',
    '舒服',
    'shūfu',
    'THƯ PHỤC',
    '舍 (Xá) + 月 (Nguyệt)',
    'Tính từ',
    'thoải mái, dễ chịu, khỏe khoắn',
    'Chú ý âm 2 đọc thanh nhẹ (shūfu). Dùng cho cảm giác cơ thể hoặc tâm trạng dễ chịu; khi ốm mệt dùng 不舒服 (không khỏe / khó chịu).',
    [
      { phrase: '觉得不太舒服', meaning: 'cảm thấy trong người không khỏe' },
      { phrase: '躺着很舒服', meaning: 'nằm rất thoải mái' },
    ],
    [
      {
        sentence: '洗完热水澡再喝一杯热牛奶，整个人都觉得舒服多了。(Xǐwán rèshuǐzǎo zài hē yì bēi rè niúnǎi, zhěnggè rén dōu juéde shūfu duō le.)',
        translation: 'Tắm nước nóng xong uống thêm ly sữa ấm, cả người cảm thấy dễ chịu hơn hẳn.',
      },
      {
        sentence: '如果早上起来觉得嗓子不太舒服，记得多喝温水并按时吃药。(Rúguǒ zǎoshang qǐlái juéde sǎngzi bú tài shūfu, jìde duō hē wēnshuǐ bìng ànshí chīyào.)',
        translation: 'Nếu sáng dậy thấy cổ họng hơi khó chịu, nhớ uống nhiều nước ấm và uống thuốc đúng giờ.',
      },
    ],
    ['舒适', '惬意'],
  ),
  createChineseCard(
    'hsk2-life-18',
    'deck-hsk2-lifestyle',
    '便宜',
    'piányi',
    'TIỆN NGHI',
    '亻(Nhân) + 宀 (Miên)',
    'Tính từ',
    'rẻ, phải chăng',
    'Chữ 便 ở đây đọc pián (KHÔNG đọc biàn như trong 方便), 宜 đọc thanh nhẹ. Phản nghĩa là 贵 (đắt). Không dùng *便宜的价钱 mà nói 价钱很便宜.',
    [
      { phrase: '价钱便宜', meaning: 'giá cả phải chăng' },
      { phrase: '占小便宜', meaning: 'ham lợi nhỏ' },
    ],
    [
      {
        sentence: '早市刚摘下来的蔬菜不但新鲜，而且比超市便宜一半左右。(Zǎoshì gāng zhāi xiàlái de shūcài búdàn xīnxiān, érqiě bǐ chāoshì piányi yíbàn zuǒyòu.)',
        translation: 'Rau ở chợ sớm vừa mới hái không chỉ tươi mà còn rẻ hơn siêu thị khoảng một nửa.',
      },
      {
        sentence: '淡季买机票便宜很多，还能把省下来的钱用来住更好的酒店。(Dànjì mǎi jīpiào piányi hěn duō, hái néng bǎ shěng xiàlái de qián yònglái zhù gèng hǎo de jiǔdiàn.)',
        translation: 'Mua vé máy bay mùa thấp điểm rẻ hơn nhiều, lại dùng số tiền tiết kiệm được để ở khách sạn tốt hơn.',
      },
    ],
    ['实惠', '低廉'],
  ),
  createChineseCard(
    'hsk2-life-19',
    'deck-hsk2-lifestyle',
    '照顾',
    'zhàogù',
    'CHIẾU CỐ',
    '灬 (Hỏa) + 厂 (Hán)',
    'Động từ',
    'chăm sóc, trông nom, chiếu cố',
    'Dùng cho chăm sóc người thân, trẻ em, thú cưng hoặc chú ý tới nhu cầu của người khác (照顾好自己 = tự chăm sóc tốt bản thân).',
    [
      { phrase: '照顾好自己', meaning: 'chăm sóc tốt bản thân' },
      { phrase: '轮流照顾老人', meaning: 'thay phiên chăm sóc người lớn tuổi' },
    ],
    [
      {
        sentence: '一个人在外地读书工作，一定要学会照顾好自己的饮食起居。(Yí gè rén zài wàidì dúshū gōngzuò, yídìng yào xuéhuì zhàogù hǎo zìjǐ de yǐnshí qǐjū.)',
        translation: 'Một mình đi học đi làm xa quê, nhất định phải học cách chăm lo tốt ăn uống sinh hoạt cho bản thân.',
      },
      {
        sentence: '周末朋友要出差，我答应帮她照顾两天家里的小猫。(Zhōumò péngyou yào chūchāi, wǒ dāying bāng tā zhàogù liǎng tiān jiālǐ de xiǎomāo.)',
        translation: 'Cuối tuần bạn tôi phải đi công tác, tôi nhận lời trông giúp cô ấy chú mèo nhỏ ở nhà hai ngày.',
      },
    ],
    ['照料', '关心'],
  ),
  createChineseCard(
    'hsk2-life-20',
    'deck-hsk2-lifestyle',
    '做饭',
    'zuòfàn',
    'TỐ PHẠN',
    '亻(Nhân) + 饣(Thực)',
    'Động từ (ly hợp)',
    'nấu cơm, nấu ăn',
    'Động từ ly hợp (做 + 饭): có thể xen định ngữ vào giữa như 做一顿好饭 (nấu một bữa cơm ngon), 做早饭 (nấu bữa sáng).',
    [
      { phrase: '自己做饭', meaning: 'tự nấu cơm' },
      { phrase: '做一顿丰盛的晚饭', meaning: 'nấu một bữa tối thịnh soạn' },
    ],
    [
      {
        sentence: '比起天天点外卖，自己买菜做饭既省钱又干净健康。(Bǐqǐ tiāntiān diǎn wàimài, zìjǐ mǎicài zuòfàn jì shěngqián yòu gānjìng jiànkāng.)',
        translation: 'So với ngày nào cũng đặt đồ ăn ngoài, tự mua đồ về nấu cơm vừa tiết kiệm vừa sạch sẽ lành mạnh.',
      },
      {
        sentence: '每次过节全家团聚，爸爸和妈妈总是一边做饭一边有说有笑。(Měicì guòjié quánjiā tuánjù, bàba hé māma zǒngshì yìbiān zuòfàn yìbiān yǒushuō yǒuxiào.)',
        translation: 'Mỗi dịp lễ cả nhà sum họp, bố và mẹ luôn vừa nấu cơm vừa nói cười vui vẻ.',
      },
    ],
    ['煮饭', '烧菜'],
  ),
];
