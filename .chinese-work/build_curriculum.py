# -*- coding: utf-8 -*-
"""
Export a draft of the previous textbook grouping for editorial review.
The app uses the stable cards and lesson assignments under Chinese/.
"""

from __future__ import annotations

import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).parent
sys.path.insert(0, str(ROOT))

from catalogue import enrich, merge  # noqa: E402
from hanzi_meta import CHAR_META, EXTRA_CHAR_PINYIN, RAD_MAP, WORD_SV_OVERRIDES  # noqa: E402
from sentence_pinyin import build_vocab_lexicon, join_syllables, sentence_to_pinyin  # noqa: E402

VOCAB_DEST = ROOT / 'draft-curriculum.json'
MIGRATION_DEST = ROOT / 'draft-migration.txt'

# ---------------------------------------------------------------------------
# 1. Extra starter.json cards not in catalogue.merge() -> everyday supplement
# ---------------------------------------------------------------------------
EXTRA_STARTER_TOPIC = {
    'hsk2-gram-18': 'grammar',
    'hsk2-life-2': 'travel',
    'hsk2-mind-6': 'actions',
    'hsk2-mind-17': 'actions',
    'hsk2-mind-18': 'actions',
    'hsk2-mind-19': 'actions',
    'hsk2-work-9': 'work',
    'hsk2-work-18': 'work',
    'hsk2-work-20': 'work',
}

# ---------------------------------------------------------------------------
# 2. Missing partOfSpeech (278 cards) + POS normalization
# ---------------------------------------------------------------------------
MISSING_POS_BY_TERM = {
    # Grammar & function words
    '为什么': 'Đại từ', '就是': 'Phó từ', '人家': 'Đại từ', '本来': 'Phó từ',
    '原来': 'Phó từ', '挺': 'Phó từ', '不是': 'Phó từ', '也许': 'Phó từ',
    '或许': 'Phó từ', '没': 'Phó từ', '甚至': 'Phó từ / Liên từ', '根本': 'Phó từ',
    '到底': 'Phó từ', '反正': 'Phó từ', '呀': 'Trợ từ', '嘛': 'Trợ từ',
    '啦': 'Trợ từ', '哦': 'Thán từ', '嗯': 'Thán từ', '差点': 'Phó từ',
    '不可能': 'Cụm từ', '不过': 'Liên từ', '肯定': 'Phó từ / Tính từ', '真的': 'Phó từ / Tính từ',
    '要是': 'Liên từ', '就要': 'Phó từ', '敢': 'Động từ', '被': 'Giới từ',
    '把': 'Giới từ', '不管': 'Liên từ', '只好': 'Phó từ', '连': 'Giới từ',
    '所有': 'Tính từ / Đại từ', '要不': 'Liên từ', '任何': 'Đại từ', '要么': 'Liên từ',
    '不然': 'Liên từ', '一点': 'Số lượng từ', '确实': 'Phó từ', '居然': 'Phó từ',
    '完全': 'Phó từ / Tính từ', '竟然': 'Phó từ', '另外': 'Liên từ / Đại từ',
    '另一个': 'Đại từ', '同样': 'Tính từ / Phó từ', '等等': 'Trợ từ',
    '只能': 'Phó từ', '越来越': 'Phó từ',

    # Conversation & expressions
    '没关系': 'Cụm từ', '不客气': 'Cụm từ', '你好': 'Cụm từ', '不好意思': 'Cụm từ',
    '行': 'Động từ / Tính từ', '顺便': 'Phó từ', '怎么办': 'Cụm từ', '没问题': 'Cụm từ',
    '客气': 'Tính từ', '好吧': 'Cụm từ', '好的': 'Cụm từ', '对了': 'Cụm từ',
    '没办法': 'Cụm từ', '随便': 'Tính từ / Phó từ', '抱歉': 'Động từ / Tính từ',
    '棒': 'Tính từ', '厉害': 'Tính từ', '太好了': 'Cụm từ',

    # Quantity & Measure
    '第一': 'Số từ', '第二': 'Số từ', '很多': 'Tính từ / Số lượng từ',
    '太多': 'Cụm từ', '几个': 'Số từ', '左右': 'Phó từ / Danh từ',
    '超过': 'Động từ', '份': 'Lượng từ', '杯': 'Lượng từ', '公里': 'Lượng từ',
    '百分之': 'Số từ', '全部': 'Danh từ / Phó từ', '整个': 'Tính từ',

    # Time & Frequency
    '半夜': 'Danh từ', '凌晨': 'Danh từ', '之前': 'Danh từ / Giới từ',
    '之后': 'Danh từ / Giới từ', '赶紧': 'Phó từ', '通常': 'Phó từ',
    '有时候': 'Phó từ', '偶尔': 'Phó từ', '很少': 'Phó từ', '从不': 'Phó từ',
    '从来': 'Phó từ', '曾经': 'Phó từ', '还没': 'Phó từ', '同时': 'Danh từ / Liên từ',
    '暂时': 'Phó từ / Tính từ', '未来': 'Danh từ', '当时': 'Danh từ', '那时候': 'Đại từ',
    '正好': 'Phó từ / Tính từ', '刚好': 'Phó từ / Tính từ',
    '星期一': 'Danh từ', '星期二': 'Danh từ', '星期三': 'Danh từ',
    '星期四': 'Danh từ', '星期五': 'Danh từ', '星期六': 'Danh từ',
    '春节': 'Danh từ', '提前': 'Động từ', '准时': 'Tính từ / Phó từ',
    '推迟': 'Động từ', '过期': 'Động từ', '到期': 'Động từ', '秒': 'Lượng từ',
    '一整天': 'Cụm thời gian', '天天': 'Phó từ', '每周': 'Đại từ / Phó từ',
    '每月': 'Đại từ / Phó từ', '每天': 'Đại từ / Phó từ',
    '上个月': 'Danh từ', '这个月': 'Danh từ', '下个月': 'Danh từ',
    '上周': 'Danh từ', '这周': 'Danh từ', '下周': 'Danh từ',
    '常见': 'Tính từ', '常用': 'Tính từ',

    # People & Social
    '小孩': 'Danh từ', '年轻人': 'Danh từ', '家庭': 'Danh từ', '父母': 'Danh từ',
    '父亲': 'Danh từ', '母亲': 'Danh từ', '老公': 'Danh từ', '老婆': 'Danh từ',
    '对象': 'Danh từ', '陌生人': 'Danh từ', '对方': 'Danh từ', '外国人': 'Danh từ',
    '中国人': 'Danh từ', '本地人': 'Danh từ', '感情': 'Danh từ', '爱情': 'Danh từ',
    '友情': 'Danh từ', '婚姻': 'Danh từ', '年龄': 'Danh từ', '性别': 'Danh từ',
    '师傅': 'Danh từ', '小姐': 'Danh từ',

    # Position & Travel
    '周围': 'Danh từ', '对面': 'Danh từ', '位置': 'Danh từ', '地址': 'Danh từ',
    '楼上': 'Danh từ', '楼下': 'Danh từ', '哪边': 'Đại từ', '街上': 'Danh từ',
    '车票': 'Danh từ', '火车站': 'Danh từ', '地铁站': 'Danh từ', '电动车': 'Danh từ',
    '停车场': 'Danh từ', '公交站': 'Danh từ', '市中心': 'Danh từ', '身份证': 'Danh từ',

    # Home, Food, Shopping, School, Work
    '窗户': 'Danh từ', '钥匙': 'Danh từ', '乱': 'Tính từ', '眼镜': 'Danh từ',
    '家里': 'Danh từ', '瓶': 'Lượng từ / Danh từ', '厕所': 'Danh từ', '厨房': 'Danh từ',
    '卧室': 'Danh từ', '客厅': 'Danh từ', '做饭': 'Động từ ly hợp',
    '辣': 'Tính từ', '难吃': 'Tính từ', '面条': 'Danh từ', '鸡肉': 'Danh từ',
    '蔬菜': 'Danh từ', '早餐': 'Danh từ', '餐厅': 'Danh từ',
    '现金': 'Danh từ', '二维码': 'Danh từ', '订单': 'Danh từ', '快递': 'Danh từ / Động từ',
    '包裹': 'Danh từ / Động từ', '市场': 'Danh từ', '免费': 'Tính từ / Động từ',
    '值得': 'Động từ', '价格': 'Danh từ', '英语': 'Danh từ', '课程': 'Danh từ',
    '成功': 'Động từ / Danh từ', '老板': 'Danh từ', '领导': 'Danh từ / Động từ',
    '客户': 'Danh từ', '服务员': 'Danh từ', '警察': 'Danh từ', '部门': 'Danh từ',
    '团队': 'Danh từ', '员工': 'Danh từ', '文件': 'Danh từ', '资料': 'Danh từ',
    '项目': 'Danh từ', '任务': 'Danh từ', '合同': 'Danh từ', '工资': 'Danh từ',

    # Health, Media, Nature
    '困': 'Tính từ', '护士': 'Danh từ', '难受': 'Tính từ', '严重': 'Tính từ',
    '鼻子': 'Danh từ', '心': 'Danh từ', '肚子': 'Danh từ',
    '打电话': 'Cụm động từ', '好玩': 'Tính từ', '消息': 'Danh từ', '短信': 'Danh từ',
    '微信': 'Danh từ', '账号': 'Danh từ', '密码': 'Danh từ', '网络': 'Danh từ',
    '信号': 'Danh từ', '视频': 'Danh từ', '网友': 'Danh từ', '线上': 'Tính từ',
    '线下': 'Tính từ', '下雨': 'Động từ ly hợp', '暖和': 'Tính từ', '温度': 'Danh từ',
    '空气': 'Danh từ',

    # Description & Actions
    '没意思': 'Tính từ', '有意思': 'Tính từ', '感兴趣': 'Cụm động từ',
    '麻烦': 'Tính từ / Động từ', '重': 'Tính từ', '轻': 'Tính từ', '帅': 'Tính từ',
    '吵': 'Tính từ / Động từ', '闲': 'Tính từ', '危险': 'Tính từ / Danh từ',
    '复杂': 'Tính từ', '普通': 'Tính từ', '正常': 'Tính từ', '有趣': 'Tính từ',
    '无聊': 'Tính từ', '正确': 'Tính từ', '不同': 'Tính từ', '够': 'Tính từ / Phó từ',
    '满': 'Tính từ', '空': 'Tính từ', '有空': 'Cụm động từ', '友好': 'Tính từ',
    '笨': 'Tính từ', '仔细': 'Tính từ', '害羞': 'Tính từ', '直接': 'Tính từ / Phó từ',
    '幸福': 'Tính từ / Danh từ', '伤心': 'Tính từ', '惊讶': 'Tính từ',
    '激动': 'Tính từ', '感动': 'Động từ / Tính từ', '红': 'Tính từ', '白': 'Tính từ',
    '无所谓': 'Cụm từ', '黑': 'Tính từ', '可惜': 'Tính từ', '遗憾': 'Tính từ / Danh từ',
    '绿': 'Tính từ', '黄': 'Tính từ', '亮': 'Tính từ', '暗': 'Tính từ',
    '模糊': 'Tính từ', '湿': 'Tính từ', '紧': 'Tính từ', '破': 'Tính từ / Động từ',
    '情况': 'Danh từ', '原因': 'Danh từ', '结果': 'Danh từ',
}

CANONICAL_POS_TOKEN = {
    'Danh từ': 'Danh từ',
    'Động từ': 'Động từ',
    'Động từ ly hợp': 'Động từ ly hợp',
    'Động từ (ly hợp)': 'Động từ ly hợp',
    'Tính từ': 'Tính từ',
    'Phó từ': 'Phó từ',
    'Đại từ': 'Đại từ',
    'Số từ': 'Số từ',
    'Lượng từ': 'Lượng từ',
    'Giới từ': 'Giới từ',
    'Liên từ': 'Liên từ',
    'Trợ từ': 'Trợ từ',
    'Thán từ': 'Thán từ',
    'Tiền tố': 'Tiền tố',
    'Hậu tố': 'Hậu tố',
    'Cụm số lượng': 'Số lượng từ',
    'Số lượng từ': 'Số lượng từ',
    'Cụm thời gian': 'Cụm thời gian',
    'Cụm động từ': 'Cụm động từ',
    'Cụm từ': 'Cụm từ',
}


def normalize_pos(raw: str, term: str) -> str:
    if not raw or not raw.strip():
        return MISSING_POS_BY_TERM[term]
    # Remove parenthetical secondary annotations like ", (Danh từ, Lượng từ)" -> promote primary tags
    cleaned = re.sub(r'\(([^)]*)\)', '', raw)
    parts = [p.strip() for p in re.split(r'[,/·]+', cleaned) if p.strip()]
    normalized: list[str] = []
    for p in parts:
        canon = CANONICAL_POS_TOKEN.get(p, p)
        if canon not in normalized:
            normalized.append(canon)
    if not normalized:
        # Fallback if all tags were inside parens
        parts = [p.strip() for p in re.split(r'[,/·()]+', raw) if p.strip()]
        for p in parts:
            canon = CANONICAL_POS_TOKEN.get(p, p)
            if canon not in normalized:
                normalized.append(canon)
    # Keep concise (at most 2 main classes)
    return ' / '.join(normalized[:2])


# ---------------------------------------------------------------------------
# 3. Meaning cleanup & concise overrides
# ---------------------------------------------------------------------------
MEANING_OVERRIDES = {
    'hsk1-core-2': 'ông, bà, ngài (lịch sự)',
    'zh-hsk3-201': 'nó (vật, con vật)',
    'zh-hsk3-203': 'họ (nam hoặc nhóm chung)',
    'zh-hsk3-205': 'họ (nhóm nữ)',
    'hsk1-core-8': 'của (trợ từ định ngữ, sở hữu)',
    'hsk1-core-9': 'rồi (trợ từ hoàn thành, thay đổi)',
    'hsk1-core-10': 'không, à (trợ từ nghi vấn)',
    'hsk1-core-11': 'còn... thì sao, nhé (trợ từ cuối câu)',
    'hsk1-core-12': 'nhé, nhỉ, đi (trợ từ đề nghị, phỏng đoán)',
    'zh-hsk3-301': 'a, à, nhé (trợ từ cảm thán)',
    'zh-hsk3-490': 'đang (trợ từ duy trì trạng thái)',
    'zh-hsk3-351': 'từng, đã từng (trợ từ kinh nghiệm)',
    'zh-hsk3-332': 'trợ từ nối bổ ngữ mức độ, kết quả',
    'zh-hsk3-333': 'trợ từ nối trạng ngữ với động từ',
    'zh-hsk3-124': 'hậu tố số nhiều (cho người)',
    'zh-hsk3-992': 'hậu tố danh từ (như 桌子, 杯子)',
    'zh-hsk3-188': 'là; đúng, vâng',
    'zh-hsk3-44': 'đúng; đối với; đôi, cặp',
    'zh-hsk3-91': 'gọi; tên là; bảo',
    'hsk1-act-5': 'biết (kỹ năng); sẽ; có thể',
    'hsk1-core-16': 'đều, tất cả; đã',
    'hsk2-gram-19': 'nhường; để, cho phép; bảo',
    'zh-a1000-823': 'chỉ có, chỉ khi',
    'zh-a1000-870': 'ngoài... ra, trừ',
    'zh-a1000-962': 'khác, những cái khác',
    'zh-hsk3-111': 'hai (đi trước lượng từ)',
    'zh-hsk3-46': 'nhiều; hơn, lẻ; bao nhiêu',
    'hsk1-space-20': 'hơi, có chút (trước tính từ)',
    'hsk1-life-11': 'cái, người (lượng từ chung)',
    'hsk1-life-12': 'quyển, cuốn (sách, vở)',
    'zh-hsk3-89': 'chiếc, món, việc (áo, sự việc)',
    'zh-hsk3-352': 'vẫn; hay là (lựa chọn); nên',
    'zh-hsk3-406': 'như thế, vậy thì',
    'zh-a1000-637': 'lại (tiếp diễn); vừa... vừa...',
    'zh-a1000-661': 'mới, vừa mới; chỉ khi',
    'zh-a1000-614': 'làm sao đây, phải làm thế nào',
    'zh-a1000-761': 'sẵn lòng, đồng ý, muốn',
    'zh-hsk3-146': 'bạn; anh, chị, em',
    'zh-hsk3-200': 'anh ấy, ông ấy',
    'zh-hsk3-202': 'cô ấy, chị ấy, bà ấy',
    'hsk1-core-1': 'chúng tôi, chúng ta',
    'zh-hsk3-148': 'các bạn, các anh chị',
    'hsk1-core-14': 'không có; chưa',
    'zh-hsk3-271': 'ở, tại; đang',
    'zh-hsk3-32': 'nhưng, nhưng mà',
    'hsk2-gram-6': 'hơn nữa, mà còn',
    'zh-a1000-32': 'chỉ là, chỉ',
    'zh-a1000-338': 'nghe nói',
    'zh-a1000-922': 'đương nhiên, tất nhiên',
    'zh-hsk3-121': 'không sao, không có việc gì',
    'zh-hsk3-977': 'chỉ có thể, đành phải',
}


def _strip_noise_parens(text: str) -> str:
    # Remove English-translated dictionary artifacts like (Ví dụ: "..."), (cái gì đó), etc.
    text = re.sub(r'\(\s*Ví dụ:[^)]*\)', '', text)
    text = re.sub(r'\(\s*(?:dùng cùng với|cái gì đó|ai đó|làm gì đó|điều gì đó hoặc ai đó)\s*\)', '', text)
    return re.sub(r'\s{2,}', ' ', text).strip()


def _base_sense(s: str) -> str:
    return re.sub(r'\s*\([^)]*\)', '', s).strip().lower()


def clean_meaning_text(card_id: str, raw: str) -> str:
    if card_id in MEANING_OVERRIDES:
        return MEANING_OVERRIDES[card_id]

    text = _strip_noise_parens(raw)
    # Normalize separator '/' -> '; ' only when not inside a tight slash pair like "bác/chú"
    parts = [p.strip(' ;,.') for p in re.split(r'\s*;\s*', text) if p.strip(' ;,.')]
    # Flatten redundant sub-splits
    deduped: list[str] = []
    seen_bases: set[str] = set()
    for p in parts:
        # Remove empty parens
        p = re.sub(r'\(\s*\)', '', p).strip()
        if not p:
            continue
        base = _base_sense(p)
        if not base or base in seen_bases:
            continue
        # Skip if base is already covered identically inside an earlier piece
        if any(base == _base_sense(prev) or (len(base) >= 3 and base in prev.lower().split(', ')) for prev in deduped):
            continue
        seen_bases.add(base)
        deduped.append(p)

    # Cap to max 3 concise senses and ~55 chars
    kept: list[str] = []
    for p in deduped:
        if len(kept) >= 3:
            break
        candidate = '; '.join([*kept, p])
        if kept and len(candidate) > 52:
            break
        kept.append(p)
    return '; '.join(kept) if kept else raw.strip()


EDITORIAL_NOTE_RE = re.compile(
    r'\b(?:khác thanh hoặc biến thể|cần kiểm tra từ loại hoặc cách diễn đạt|trùng chữ trong đề cương|nhiều mục từ điển)\b'
    r'|Dòng này ưu tiên[^.]*\.?|A1000 ưu tiên[^.]*\.?',
    re.IGNORECASE,
)


def clean_notes_text(raw: str) -> str:
    text = EDITORIAL_NOTE_RE.sub('', raw or '')
    text = re.sub(r'(?:\s*[,;.]\s*){2,}', '. ', text)
    text = re.sub(r'\s{2,}', ' ', text).lstrip(' ,;:.').rstrip(' ,;:')
    if text and text[0].islower() and not re.match(r'^[a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]+\s*=', text):
        text = text[0].upper() + text[1:]
    if text and text[-1] not in '.!?…”':
        text += '.'
    return text


# ---------------------------------------------------------------------------
# 4. Hán-Việt, Radical, and Pinyin normalization
# ---------------------------------------------------------------------------
def build_sino_vietnamese(card: dict, starter_sv: dict[str, str]) -> str:
    term = card['term']
    py = card['phonetic'].split('/')[0].strip()
    if (term, py) in WORD_SV_OVERRIDES:
        return WORD_SV_OVERRIDES[(term, py)]
    if term in WORD_SV_OVERRIDES:
        return WORD_SV_OVERRIDES[term]
    if starter_sv.get(card['id']):
        return starter_sv[card['id']].upper()
    parts = []
    for ch in term:
        if '\u4e00' <= ch <= '\u9fff':
            parts.append(CHAR_META[ch][0])
    return ' '.join(parts)


def build_radical(card: dict) -> str:
    rads: list[str] = []
    for ch in card['term']:
        if '\u4e00' <= ch <= '\u9fff':
            rad_key = CHAR_META[ch][1]
            label = RAD_MAP[rad_key]
            if label not in rads:
                rads.append(label)
    return ' + '.join(rads)


def normalize_card_pinyin(card: dict) -> str:
    py = card['phonetic'].strip()
    if '/' in py or card.get('hskLevel') in (1, 2, 3):
        return py
    parts = py.split()
    hanzi = [ch for ch in card['term'] if '\u4e00' <= ch <= '\u9fff']
    # Join closed 2-syllable compounds cleanly (e.g. 'běn lái' -> 'běnlái') while preserving phrases
    if len(parts) == len(hanzi) and len(hanzi) == 2:
        return join_syllables(parts)
    return py


from textbook_data import EXTRA_TEXTBOOK_CARDS, HSK20_SYLLABUS, HSK30_SYLLABUS  # noqa: E402


# ---------------------------------------------------------------------------
# 5. Dual-Edition Textbook Syllabus Builder (HSK 2.0 & HSK 3.0)
# ---------------------------------------------------------------------------
STANDARD_CATEGORY_LABELS = {
    'hsk20': {
        'hsk1': 'HSK 1 · Giáo trình 2.0',
        'hsk2': 'HSK 2 · Giáo trình 2.0',
        'hsk3': 'HSK 3 · Giáo trình 2.0',
    },
    'hsk30': {
        'hsk1': 'HSK 1 · Giáo trình 3.0',
        'hsk2': 'HSK 2 · Giáo trình 3.0',
        'hsk3': 'HSK 3 · Giáo trình 3.0',
    },
}

HSK30_TOPIC_LESSON_FALLBACK = {
    1: {
        'grammar': 1, 'conversation': 1, 'people': 3, 'quantity': 4,
        'actions': 5, 'time': 6, 'food': 8, 'shopping': 9,
        'position': 10, 'home': 10, 'travel': 11, 'school': 12,
        'work': 13, 'health': 13, 'media': 13, 'nature': 14, 'description': 15,
    },
    2: {
        'grammar': 1, 'conversation': 1, 'people': 2, 'food': 3,
        'shopping': 4, 'position': 5, 'travel': 6, 'media': 7,
        'time': 8, 'actions': 9, 'school': 10, 'work': 10,
        'health': 11, 'quantity': 12, 'nature': 13, 'description': 14, 'home': 15,
    },
    3: {
        'home': 1, 'people': 2, 'work': 3, 'school': 4,
        'health': 5, 'food': 6, 'shopping': 7, 'travel': 8, 'position': 8,
        'nature': 9, 'media': 10, 'conversation': 11,
        'actions': 13, 'description': 15, 'quantity': 15,
        'time': 17, 'grammar': 18,
    },
}


def resolve_card_selector(
    selector: str,
    by_term: dict[str, list[dict]],
    preferred_level: int | None = None,
) -> dict | None:
    term_part, sep, tag = selector.strip().partition('@')
    candidates = list(by_term.get(term_part, []))
    if not candidates:
        return None
    if sep:
        if tag.isdigit():
            matched = [c for c in candidates if c.get('hskId') == int(tag)]
            if matched:
                return matched[0]
        matched = [c for c in candidates if c['phonetic'].split('/')[0].strip().lower().replace(' ', '') == tag.lower().replace(' ', '')]
        if matched:
            return matched[0]
    if preferred_level is not None:
        exact_lvl = [c for c in candidates if c.get('hskLevel') == preferred_level]
        if exact_lvl:
            return exact_lvl[0]
    # Prefer lowest hskLevel (or non-None) deterministically
    candidates.sort(key=lambda c: (c.get('hskLevel') or 99, c.get('hskId') or 9999, c['id']))
    return candidates[0]


def build_hsk20_decks(by_term: dict[str, list[dict]]) -> list[dict]:
    decks_out: list[dict] = []
    used_card_ids: set[str] = set()
    for lvl_id, lesson_num, title, desc, selectors in HSK20_SYLLABUS:
        lvl_num = int(lvl_id[3:])
        bucket: list[dict] = []
        seen_in_lesson: set[str] = set()
        for sel in selectors:
            card = resolve_card_selector(sel, by_term, preferred_level=lvl_num)
            if not card:
                raise KeyError(f'HSK 2.0 selector not found: {sel} (lesson {lvl_id} L{lesson_num})')
            if card['id'] in seen_in_lesson:
                continue
            # Keep every card unique within its primary introduced lesson if already introduced earlier
            if card['id'] in used_card_ids:
                continue
            seen_in_lesson.add(card['id'])
            used_card_ids.add(card['id'])
            bucket.append(card)
        assert bucket, f'Empty HSK 2.0 lesson {lvl_id} L{lesson_num}'
        decks_out.append({
            'id': f'deck-zh20-{lvl_id}-l{lesson_num:02d}',
            'name': f'HSK {lvl_num} · Bài {lesson_num} · {title}',
            'textbookTitle': title,
            'lessonNumber': lesson_num,
            'standard': 'hsk20',
            'description': desc,
            'level': lvl_id,
            'category': STANDARD_CATEGORY_LABELS['hsk20'][lvl_id],
            'cards': bucket,
        })
    return decks_out


def build_hsk30_decks(all_cards: list[dict], by_term: dict[str, list[dict]]) -> list[dict]:
    placed_ids: set[str] = set()
    lesson_buckets: dict[tuple[int, int], list[dict]] = defaultdict(list)
    lesson_meta: dict[tuple[int, int], tuple[str, int, str, str]] = {}

    for lvl_id, lesson_num, title, desc, selectors in HSK30_SYLLABUS:
        lvl_num = int(lvl_id[3:])
        lesson_meta[(lvl_num, lesson_num)] = (lvl_id, lesson_num, title, desc)
        for sel in selectors:
            card = resolve_card_selector(sel, by_term, preferred_level=lvl_num)
            if not card:
                raise KeyError(f'HSK 3.0 selector not found: {sel} (lesson {lvl_id} L{lesson_num})')
            # Only place words belonging to this HSK 3.0 level (plus authored supplements without hskLevel)
            c_lvl = card.get('hskLevel')
            if c_lvl is not None and c_lvl != lvl_num:
                continue
            if c_lvl is None and sel not in ('下雪', '大兴', '手机号'):
                continue
            if card['id'] in placed_ids:
                continue
            placed_ids.add(card['id'])
            lesson_buckets[(lvl_num, lesson_num)].append(card)

    # Ensure 100% of HSK 3.0 L1..L3 words (hskId 1..1000) are placed into their level's textbook lessons
    unplaced = [
        c for c in all_cards
        if c.get('hskLevel') in (1, 2, 3) and c['id'] not in placed_ids
    ]
    unplaced.sort(key=lambda c: (c['hskLevel'], c.get('hskId', 9999), c['id']))

    for card in unplaced:
        lvl_num = card['hskLevel']
        topic = card.get('_topic', 'actions')
        target_lesson = HSK30_TOPIC_LESSON_FALLBACK[lvl_num].get(topic, 1)
        placed_ids.add(card['id'])
        lesson_buckets[(lvl_num, target_lesson)].append(card)

    # Rebalance oversized buckets inside the same level so lessons feel cohesive (<= 34 cards where possible)
    for lvl_num in (1, 2, 3):
        lvl_keys = sorted(k for k in lesson_meta if k[0] == lvl_num)
        for k in lvl_keys:
            while len(lesson_buckets[k]) > 34:
                smallest = min(lvl_keys, key=lambda cand: len(lesson_buckets[cand]))
                if len(lesson_buckets[smallest]) >= 30:
                    break
                lesson_buckets[smallest].append(lesson_buckets[k].pop())

    decks_out: list[dict] = []
    for (lvl_num, lesson_num), (lvl_id, _, title, desc) in sorted(lesson_meta.items()):
        bucket = lesson_buckets[(lvl_num, lesson_num)]
        assert bucket, f'Empty HSK 3.0 lesson {lvl_id} L{lesson_num}'
        decks_out.append({
            'id': f'deck-zh30-{lvl_id}-l{lesson_num:02d}',
            'name': f'HSK {lvl_num} · Bài {lesson_num} · {title}',
            'textbookTitle': title,
            'lessonNumber': lesson_num,
            'standard': 'hsk30',
            'description': desc,
            'level': lvl_id,
            'category': STANDARD_CATEGORY_LABELS['hsk30'][lvl_id],
            'cards': bucket,
        })

    hsk30_hsk_ids = {
        c['hskId']
        for d in decks_out
        for c in d['cards']
        if c.get('hskId') is not None
    }
    assert hsk30_hsk_ids == set(range(1, 1001)), (
        f'Missing HSK 3.0 IDs: {sorted(set(range(1, 1001)) - hsk30_hsk_ids)[:20]}'
    )
    return decks_out


def split_starter_example(ex: dict) -> dict:
    sent = ex['sentence'].strip()
    m = re.match(r'^(.+?)\s*\(([^)]+)\)\s*$', sent)
    assert m, f'Starter example missing trailing pinyin: {ex}'
    return {
        'sentence': m.group(1).strip(),
        'phonetic': m.group(2).strip(),
        'translation': ex['translation'].strip(),
    }


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    topics, cards = merge()
    enrich(cards)
    starter = json.loads((ROOT / 'starter.json').read_text(encoding='utf-8'))
    starter_by_id = {w['id']: w for w in starter}
    starter_sv = {w['id']: w.get('sinoVietnamese', '').strip() for w in starter}

    merged_ids = {c['id'] for c in cards}
    extra_starter = []
    for w in starter:
        if w['id'] not in merged_ids:
            copy = dict(w)
            copy['_topic'] = EXTRA_STARTER_TOPIC[w['id']]
            extra_starter.append(copy)

    base_cards = cards + extra_starter
    assert len(base_cards) == 1382, f'Expected 1382 base cards, got {len(base_cards)}'

    extra_authored = [dict(c) for c in EXTRA_TEXTBOOK_CARDS]
    all_cards = base_cards + extra_authored

    # Build lexicon for sentence pinyin before normalizing cards
    lex, char_py = build_vocab_lexicon(all_cards)
    char_py.update(EXTRA_CHAR_PINYIN)

    by_term: dict[str, list[dict]] = defaultdict(list)
    for c in all_cards:
        by_term[c['term']].append(c)

    # Track historical versions (v1..v5) for lossless SRS migration -> v6
    v5_snap_path = ROOT / 'v5_snapshot.json'
    v5_snapshot = json.loads(v5_snap_path.read_text(encoding='utf-8')) if v5_snap_path.exists() else {}

    legacy_deck_map = {
        'deck-hsk1-core': 'deck-zh20-hsk1-l01',
        'deck-hsk1-actions': 'deck-zh20-hsk1-l06',
        'deck-hsk1-life': 'deck-zh20-hsk1-l08',
        'deck-hsk1-space': 'deck-zh20-hsk1-l09',
        'deck-hsk2-grammar': 'deck-zh20-hsk2-l05',
        'deck-hsk2-mind': 'deck-zh20-hsk2-l08',
        'deck-hsk2-work': 'deck-zh20-hsk2-l04',
        'deck-hsk2-lifestyle': 'deck-zh20-hsk2-l03',
    }
    for lvl_num in (1, 2, 3):
        lvl = f'hsk{lvl_num}'
        legacy_deck_map[f'deck-zh-{lvl}-core'] = f'deck-zh20-{lvl}-l01'
        for suffix in (
            'grammar', 'grammar-1', 'grammar-2', 'conversation', 'quantity',
            'time', 'time-1', 'time-2', 'people', 'position', 'travel', 'home',
            'food', 'shopping', 'school', 'work', 'health', 'media', 'nature',
            'description', 'description-1', 'description-2', 'actions', 'actions-1', 'actions-2',
        ):
            legacy_deck_map[f'deck-zh-{lvl}-{suffix}'] = f'deck-zh20-{lvl}-l01'
    for suffix in (
        'grammar', 'grammar-1', 'grammar-2', 'conversation', 'quantity',
        'time', 'time-1', 'time-2', 'people', 'position', 'travel', 'home',
        'food', 'shopping', 'school', 'work', 'health', 'media', 'nature',
        'description', 'description-1', 'description-2', 'actions', 'actions-1', 'actions-2',
    ):
        legacy_deck_map[f'deck-zh-everyday-{suffix}'] = 'deck-zh20-hsk3-l01'

    hsk20_groups = build_hsk20_decks(by_term)
    hsk30_groups = build_hsk30_decks(all_cards, by_term)
    deck_groups = hsk20_groups + hsk30_groups

    # Transform cards & assign canonical IDs zh20-0001.. and zh30-0001..
    old_id_to_new_ids: dict[str, list[str]] = defaultdict(list)
    term_phonetic_to_new_ids: dict[tuple[str, str], list[str]] = defaultdict(list)

    seq_by_std = {'hsk20': 0, 'hsk30': 0}
    cleaned_groups = []
    for group in deck_groups:
        std = group['standard']
        prefix = 'zh20' if std == 'hsk20' else 'zh30'
        cleaned_cards = []
        for card in group['cards']:
            seq_by_std[std] += 1
            old_id = card['id']
            new_id = f'{prefix}-{seq_by_std[std]:04d}'
            if new_id not in old_id_to_new_ids[old_id]:
                old_id_to_new_ids[old_id].append(new_id)

            norm_py = normalize_card_pinyin(card)
            tp_key = (card['term'], norm_py)
            if new_id not in term_phonetic_to_new_ids[tp_key]:
                term_phonetic_to_new_ids[tp_key].append(new_id)

            raw_examples = card.get('examples', [])
            clean_examples = []
            for ex in raw_examples:
                if re.search(r'\s*\([^)]+\)\s*$', ex['sentence']):
                    clean_examples.append(split_starter_example(ex))
                else:
                    clean_examples.append({
                        'sentence': ex['sentence'].strip(),
                        'phonetic': ex.get('phonetic') or sentence_to_pinyin(ex['sentence'].strip(), lex, char_py),
                        'translation': ex['translation'].strip(),
                    })

            clean_card = {
                'id': new_id,
                'term': card['term'],
                'phonetic': norm_py,
                'partOfSpeech': normalize_pos(card.get('partOfSpeech', ''), card['term']),
                'meaning': clean_meaning_text(old_id, card['meaning']),
                'sinoVietnamese': build_sino_vietnamese(card, starter_sv),
                'radical': build_radical(card),
                'collocations': card['collocations'],
                'examples': clean_examples,
                'synonyms': card.get('synonyms', starter_by_id.get(old_id, {}).get('synonyms', [])),
                'notes': clean_notes_text(card.get('notes', '')),
            }
            if 'hskLevel' in card:
                clean_card['hskLevel'] = card['hskLevel']
            if 'hskId' in card:
                clean_card['hskId'] = card['hskId']
            if 'a1000Id' in card:
                clean_card['a1000Id'] = card['a1000Id']

            assert clean_card['partOfSpeech'], f'Empty POS on {new_id} {clean_card["term"]}'
            assert clean_card['sinoVietnamese'], f'Empty SV on {new_id} {clean_card["term"]}'
            assert clean_card['radical'], f'Empty radical on {new_id} {clean_card["term"]}'
            assert clean_card['collocations'], f'Empty collocations on {new_id} {clean_card["term"]}'
            assert clean_card['examples'] and all(e.get('phonetic') and e.get('translation') for e in clean_card['examples']), (
                f'Incomplete example on {new_id} {clean_card["term"]}'
            )
            assert not EDITORIAL_NOTE_RE.search(clean_card['notes']), (
                f'Editorial artifact left in notes on {new_id}: {clean_card["notes"]}'
            )
            assert not re.search(r'\([^)]+\)\s*$', clean_card['examples'][0]['sentence']), (
                f'Trailing pinyin left on {new_id}: {clean_card["examples"][0]["sentence"]}'
            )
            cleaned_cards.append(clean_card)

        cleaned_groups.append({
            'id': group['id'],
            'name': group['name'],
            'textbookTitle': group['textbookTitle'],
            'lessonNumber': group['lessonNumber'],
            'standard': group['standard'],
            'description': group['description'],
            'level': group['level'],
            'category': group['category'],
            'cards': cleaned_cards,
        })

    # Map every v5 snapshot ID (`zh-0001..zh-1382`) to new textbook ID(s) by `(term, phonetic)`
    legacy_word_id_map: dict[str, list[str]] = {}
    for old_id, new_ids in sorted(old_id_to_new_ids.items()):
        if new_ids:
            legacy_word_id_map[old_id] = new_ids
    for v5_id, meta in sorted(v5_snapshot.items()):
        targets = term_phonetic_to_new_ids.get((meta['term'], meta['phonetic']), [])
        if not targets:
            # Fallback match by term if phonetic whitespace differs slightly
            for (t, p), ids in term_phonetic_to_new_ids.items():
                if t == meta['term'] and p.replace(' ', '') == meta['phonetic'].replace(' ', ''):
                    targets = ids
                    break
        if targets:
            legacy_word_id_map[v5_id] = targets

    # Write the draft catalogue.
    lines = ['[']
    for g_idx, g in enumerate(cleaned_groups):
        lines.append('  {')
        for f in ('id', 'name', 'textbookTitle', 'lessonNumber', 'standard', 'description', 'level', 'category'):
            lines.append(f'    "{f}": {json.dumps(g[f], ensure_ascii=False)},')
        lines.append('    "cards": [')
        for c_idx, c in enumerate(g['cards']):
            comma = ',' if c_idx + 1 < len(g['cards']) else ''
            lines.append('      ' + json.dumps(c, ensure_ascii=False) + comma)
        lines.append('    ]')
        lines.append('  }' + (',' if g_idx + 1 < len(cleaned_groups) else ''))
    lines.append(']')
    VOCAB_DEST.write_text('\n'.join(lines) + '\n', encoding='utf-8')

    # Write src/data/seedMigration.ts
    ts_lines = [
        '// Auto-generated by .chinese-work/build_curriculum.py — maps v1..v5 IDs and decks to v6 dual-edition textbooks.',
        '',
        'export const LEGACY_WORD_ID_MAP: Record<string, string[]> = '
        + json.dumps(legacy_word_id_map, ensure_ascii=False, indent=2) + ';',
        '',
        'export const LEGACY_DECK_ID_MAP: Record<string, string> = '
        + json.dumps(legacy_deck_map, ensure_ascii=False, indent=2) + ';',
        '',
    ]
    MIGRATION_DEST.write_text('\n'.join(ts_lines), encoding='utf-8')

    # Summary stats
    for std in ('hsk20', 'hsk30'):
        sub = [g for g in cleaned_groups if g['standard'] == std]
        lvl_counts = Counter(g['level'] for g in sub)
        deck_sizes = [len(g['cards']) for g in sub]
        total_cards = sum(deck_sizes)
        print(f'[{std}] {len(sub)} lessons, {total_cards} cards. Per level: {dict(lvl_counts)}, sizes min/max: {min(deck_sizes)}/{max(deck_sizes)}')


if __name__ == '__main__':
    main()

