import { CHINESE_WORDS } from '../../Chinese/chineseDecks';
import { compactPhonetic, searchable } from './vocabSearch';

export interface ChineseDictEntry {
  term: string;
  phonetic: string;
  sinoVietnamese: string;
  radical: string;
  partOfSpeech: string;
  meaning: string;
  notes?: string;
  collocations: Array<{ phrase: string; meaning: string }>;
  examples: Array<{ sentence: string; translation: string }>;
  synonyms: string[];
  source: 'local' | 'live_lookup';
}

// Extended built-in offline Chinese-Vietnamese lexicon (Hanzii-style format)
const EXTRA_ZH_LEXICON: ChineseDictEntry[] = [
  {
    term: '你好',
    phonetic: 'nǐ hǎo',
    sinoVietnamese: 'NHĨ HẢO',
    radical: '亻(Nhân) + 女 (Nữ)',
    partOfSpeech: 'Cụm chào hỏi',
    meaning: 'xin chào',
    notes: 'Câu chào phổ biến nhất với bạn bè, người ngang hàng hoặc người mới quen; với người lớn tuổi hoặc cấp trên dùng 您好.',
    collocations: [{ phrase: '说声你好', meaning: 'nói lời xin chào' }],
    examples: [{ sentence: '你好，请问去地铁站怎么走？(Nǐ hǎo, qǐngwèn qù dìtiězhàn zěnme zǒu?)', translation: 'Xin chào, xin hỏi đi ra ga tàu điện ngầm thế nào ạ?' }],
    synonyms: ['您好'],
    source: 'local',
  },
  {
    term: '谢谢',
    phonetic: 'xièxie',
    sinoVietnamese: 'TẠ TẠ',
    radical: '讠(Ngôn)',
    partOfSpeech: 'Động từ',
    meaning: 'cảm ơn',
    notes: 'Chữ 谢 thứ hai đọc thanh nhẹ. Đáp lại lời cảm ơn dùng 不客气 (đừng khách sáo) hoặc 没关系.',
    collocations: [{ phrase: '非常感谢', meaning: 'vô cùng cảm ơn' }],
    examples: [{ sentence: '谢谢你在我忙的时候过来帮忙！(Xièxie nǐ zài wǒ máng de shíhou guòlái bāngmáng!)', translation: 'Cảm ơn bạn đã qua giúp khi tôi đang bận!' }],
    synonyms: ['感谢', '多谢'],
    source: 'local',
  },
  {
    term: '朋友',
    phonetic: 'péngyou',
    sinoVietnamese: 'BẰNG HỮU',
    radical: '月 (Nguyệt) + 又 (Hựu)',
    partOfSpeech: 'Danh từ',
    meaning: 'bạn bè, người bạn',
    notes: 'Chữ 友 đọc thanh nhẹ. Ghép phổ biến: 好朋友 (bạn thân), 交朋友 (kết bạn), 老朋友 (bạn cũ).',
    collocations: [{ phrase: '交朋友', meaning: 'kết bạn' }],
    examples: [{ sentence: '周末我和几个好朋友约好去公园散步。(Zhōumò wǒ hé jǐ gè hǎo péngyou yuēhǎo qù gōngyuán sànbù.)', translation: 'Cuối tuần tôi và mấy người bạn thân hẹn nhau đi dạo công viên.' }],
    synonyms: ['伙伴', '知己'],
    source: 'local',
  },
  {
    term: '成功',
    phonetic: 'chénggōng',
    sinoVietnamese: 'THÀNH CÔNG',
    radical: '戈 (Qua) + 力 (Lực)',
    partOfSpeech: 'Động từ / Danh từ',
    meaning: 'thành công, đạt kết quả tốt',
    notes: 'Vừa làm động từ (他成功了) vừa làm danh từ (获得成功). Hay đi trong mẫu 只要努力，就会成功.',
    collocations: [{ phrase: '获得成功', meaning: 'giành được thành công' }],
    examples: [{ sentence: '只要方法科学又肯坚持，你一定能成功。(Zhǐyào fāngfǎ kēxué yòu kěn jiānchí, nǐ yídìng néng chénggōng.)', translation: 'Chỉ cần phương pháp khoa học lại chịu kiên trì, bạn nhất định sẽ thành công.' }],
    synonyms: ['胜利', '成就'],
    source: 'local',
  },
  {
    term: '文化',
    phonetic: 'wénhuà',
    sinoVietnamese: 'VĂN HÓA',
    radical: '文 (Văn) + 亻(Nhân)',
    partOfSpeech: 'Danh từ',
    meaning: 'văn hóa, trình độ học vấn',
    notes: 'Chỉ văn hóa xã hội hoặc học vấn cá nhân (传统文化 = văn hóa truyền thống, 文化交流 = giao lưu văn hóa).',
    collocations: [{ phrase: '传统文化', meaning: 'văn hóa truyền thống' }],
    examples: [{ sentence: '我对中国茶文化非常感兴趣。(Wǒ duì Zhōngguó chá wénhuà fēicháng gǎn xìngqù.)', translation: 'Tôi rất có hứng thú với văn hóa trà Trung Hoa.' }],
    synonyms: ['文明'],
    source: 'local',
  },
];

const extraEntries = new Map(EXTRA_ZH_LEXICON.map((entry) => [entry.term, entry]));
const CURRICULUM_ENTRIES: ChineseDictEntry[] = CHINESE_WORDS.map((word) => {
  const extra = extraEntries.get(word.term);
  return {
    term: word.term,
    phonetic: word.phonetic,
    sinoVietnamese: word.sinoVietnamese || extra?.sinoVietnamese || '',
    radical: word.radical || extra?.radical || '',
    partOfSpeech: word.partOfSpeech || extra?.partOfSpeech || '',
    meaning: word.meaning,
    notes: word.examples.length ? word.notes : [extra?.notes, word.notes].filter(Boolean).join(' ') || undefined,
    collocations: word.collocations.length ? word.collocations : extra?.collocations ?? [],
    examples: word.examples.length ? word.examples : extra?.examples ?? [],
    synonyms: word.synonyms.length ? word.synonyms : extra?.synonyms ?? [],
    source: 'local',
  };
});

const existingTerms = new Set(CURRICULUM_ENTRIES.map((e) => e.term));
const LOCAL_ZH_ENTRIES: ChineseDictEntry[] = [
  ...CURRICULUM_ENTRIES,
  ...EXTRA_ZH_LEXICON.filter((e) => !existingTerms.has(e.term)),
];

export async function searchChineseDictionary(query: string): Promise<ChineseDictEntry[]> {
  const q = query.trim();
  if (!q) return LOCAL_ZH_ENTRIES.slice(0, 8);

  const queryText = searchable(q);
  const phoneticQuery = compactPhonetic(q);
  const localMatches = LOCAL_ZH_ENTRIES.filter(
    (entry) =>
      searchable(entry.term).includes(queryText) ||
      (phoneticQuery && compactPhonetic(entry.phonetic).includes(phoneticQuery)) ||
      searchable(entry.sinoVietnamese).includes(queryText) ||
      searchable(entry.meaning).includes(queryText),
  );

  if (localMatches.length > 0) {
    return localMatches.sort((a, b) => Number(b.term === q) - Number(a.term === q)).slice(0, 10);
  }

  // Fallback live Chinese-Vietnamese lookup when online
  const hasHanzi = /[\u4e00-\u9fff]/.test(q);
  try {
    const langPair = hasHanzi ? 'zh-CN|vi' : 'vi|zh-CN';
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(q)}&langpair=${langPair}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = (await res.json()) as {
      responseData?: { translatedText?: string };
    };
    const translated = data.responseData?.translatedText?.trim();
    if (!translated) return [];

    return [
      {
        term: hasHanzi ? q : translated,
        phonetic: 'Tra cứu trực tuyến',
        sinoVietnamese: 'Từ điển trực tuyến',
        radical: 'Tự động đồng bộ',
        partOfSpeech: 'từ / cụm từ',
        meaning: hasHanzi ? translated : q,
        collocations: [],
        examples: [],
        synonyms: [],
        source: 'live_lookup',
      },
    ];
  } catch {
    return [];
  }
}
