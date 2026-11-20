"""Build the CEFR-J word decks from the downloads listed in public/english-sources.txt."""

import argparse
import gzip
import html
import json
import re
import sqlite3
import struct
import unicodedata
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path
from xml.etree import ElementTree
from zipfile import ZipFile


ROOT = Path(__file__).resolve().parent.parent
LEVEL_SIZES = {"a1": 800, "a2": 900, "b1": 950, "b2": 950}
TOPICS = {
    "people": ("Con người và gia đình", (
        "Family life", "Personal information", "Personal identification", "Relations with other people",
    )),
    "daily": ("Nhà cửa, ăn uống và mua sắm", (
        "Daily life", "Objects and rooms", "House and home, environment", "Things in the town, shops and shopping",
        "Food and drink", "Shopping", "Clothes", "Colours",
    )),
    "work": ("Trường học và công việc", ("Education", "Language", "Work and jobs", "Technical and legal language")),
    "travel": ("Đi lại và địa điểm", (
        "Ways of travelling", "Travel", "Travel and services vocab", "Places", "Services", "Holidays", "Nationalities and countries",
    )),
    "life": ("Sức khỏe, giải trí và xã hội", (
        "Health and body care", "Hobbies and pastimes", "Free time, entertainment", "Leisure activities", "Weather",
        "Books and literature", "Arts", "Film", "Media", "News, lifestyles and current affairs",
    )),
    "general": ("Từ thường dùng", ()),
}
TOPIC_IDS = {tag: topic for topic, (_, tags) in TOPICS.items() for tag in tags}
PARTS_OF_SPEECH = {
    "noun": ("Danh từ", ("n.",), ("N", "noun", "n", "name")),
    "verb": ("Động từ", ("v.",), ("V", "verb")),
    "adjective": ("Tính từ", ("adj.",), ("A", "adj")),
    "adverb": ("Trạng từ", ("adv.",), ("D", "adv")),
    "determiner": ("Từ hạn định", ("det.", "art."), ("E", "Z", "X")),
    "pronoun": ("Đại từ", ("pron.",), ("O", "pron")),
    "preposition": ("Giới từ", ("prep.",), ("P",)),
    "conjunction": ("Liên từ", ("conj.",), ("C",)),
    "number": ("Số từ", ("num.",), ("M", "Z", "N")),
    "interjection": ("Thán từ", ("interj.",), ("X",)),
    "modal auxiliary": ("Động từ khuyết thiếu", ("aux.", "v."), ("V",)),
    "be-verb": ("Động từ", ("v.",), ("V", "S")),
    "do-verb": ("Động từ", ("v.",), ("V", "S")),
    "have-verb": ("Động từ", ("v.",), ("V", "S")),
    "infinitive-to": ("Dấu hiệu nguyên mẫu", (), ("X",)),
}
IPA_REGIONS = {
    "british": {"BrE", "UK", "uk", "Received-Pronunciation"},
    "american": {"NAmE", "US", "General-American"},
}
XLSX_NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
IGNORED_WORDS = {"I.", "goddamn", "goddamned", "mama"}
WORD_PATTERN = re.compile(r"[A-Za-z]+(?:[-'][A-Za-z]+)*")
KNOWN_SENSES = {
    "a": ("một (mạo từ đứng trước âm phụ âm)", "I have a question.", "Tôi có một câu hỏi."),
    "an": ("một (mạo từ đứng trước âm nguyên âm)", "She brought an umbrella.", "Cô ấy mang theo một chiếc ô."),
    "the": ("mạo từ xác định", "The keys are on the table.", "Chìa khóa nằm trên bàn."),
    "I": ("tôi (đại từ làm chủ ngữ)", "I like this book.", "Tôi thích cuốn sách này."),
    "am": ("dạng hiện tại của be dùng với I", "I am ready.", "Tôi đã sẵn sàng."),
    "are": ("dạng hiện tại của be dùng với you, we, they", "We are at home.", "Chúng tôi đang ở nhà."),
    "is": ("dạng hiện tại của be dùng với chủ ngữ ngôi ba số ít", "She is my sister.", "Cô ấy là chị tôi."),
    "be": ("là, ở, hoặc trong một trạng thái", "I want to be a teacher.", "Tôi muốn làm giáo viên."),
    "was": ("dạng quá khứ của be dùng với I, he, she, it", "It was cold yesterday.", "Hôm qua trời lạnh."),
    "were": ("dạng quá khứ của be dùng với you, we, they", "We were at the zoo yesterday.", "Hôm qua chúng tôi ở sở thú."),
    "can": ("có thể, biết làm gì", "I can swim.", "Tôi biết bơi."),
    "could": ("có thể, đã có thể", "Could you open the door?", "Bạn mở cửa giúp tôi được không?"),
    "shall": ("dùng để đề nghị hoặc hỏi ý kiến", "Shall we go home now?", "Bây giờ mình về nhà nhé?"),
    "will": ("sẽ", "I will call you tonight.", "Tối nay tôi sẽ gọi cho bạn."),
    "should": ("nên", "You should get some rest.", "Bạn nên nghỉ ngơi một chút."),
    "would": ("sẽ (giả định) hoặc dùng trong lời đề nghị lịch sự", "Would you like some tea?", "Bạn muốn dùng trà không?"),
    "you": ("bạn, các bạn (người đang nghe)", "Do you live near here?", "Bạn sống gần đây à?"),
    "we": ("chúng tôi, chúng ta", "We go to the same school.", "Chúng tôi học cùng trường."),
    "it": ("nó, cái đó (chỉ vật, sự việc)", "I found it under the bed.", "Tôi tìm thấy nó dưới giường."),
    "our": ("của chúng tôi, của chúng ta", "This is our classroom.", "Đây là phòng học của chúng tôi."),
    "your": ("của bạn, của các bạn", "Is this your bag?", "Đây là túi của bạn à?"),
    "to": ("đến, tới (chỉ hướng hoặc đích)", "We walk to school every day.", "Chúng tôi đi bộ đến trường mỗi ngày."),
    "of": ("của, thuộc về", "The door of the house is open.", "Cửa nhà đang mở."),
    "at": ("ở, tại (chỉ địa điểm); vào (chỉ giờ)", "Meet me at the station.", "Gặp tôi ở nhà ga nhé."),
    "in": ("ở trong, bên trong", "The apples are in the bag.", "Táo ở trong túi."),
    "on": ("ở trên, tiếp xúc với bề mặt", "The book is on the table.", "Cuốn sách ở trên bàn."),
    "as": ("như, với vai trò là", "She works as a nurse.", "Cô ấy làm y tá."),
    "because": ("vì, bởi vì", "We stayed inside because it was cold.", "Chúng tôi ở trong nhà vì trời lạnh."),
    "about": ("về, liên quan đến", "Tell me about your day.", "Kể cho tôi nghe hôm nay của bạn thế nào nhé."),
    "all": ("tất cả, toàn bộ", "All the children are here.", "Tất cả các em đều có mặt."),
    "book": ("sách, cuốn sách", "I'm reading a book about trains.", "Tôi đang đọc một cuốn sách về tàu hỏa."),
    "car": ("ô tô, xe hơi", "Her car is outside the house.", "Ô tô của cô ấy đỗ ngoài nhà."),
    "catch": ("bắt, đón kịp", "Can you catch the ball?", "Bạn bắt được bóng không?"),
    "class": ("lớp học, buổi học", "Our English class starts at nine.", "Lớp tiếng Anh của chúng tôi bắt đầu lúc chín giờ."),
    "cut": ("cắt, chặt", "Please cut the bread into slices.", "Hãy cắt bánh mì thành từng lát."),
    "day": ("ngày, ban ngày", "We spent the day at the beach.", "Chúng tôi dành cả ngày ở bãi biển."),
    "do": ("làm, thực hiện", "I do my homework after dinner.", "Tôi làm bài tập về nhà sau bữa tối."),
    "feel": ("cảm thấy", "I feel better today.", "Hôm nay tôi thấy khỏe hơn."),
    "fine": ("khỏe; ổn", "I'm fine, thanks.", "Tôi khỏe, cảm ơn bạn."),
    "first": ("đầu tiên, trước hết", "Write your name on the first page.", "Hãy viết tên bạn lên trang đầu tiên."),
    "get": ("nhận, lấy, có được", "Did you get my message?", "Bạn nhận được tin nhắn của tôi chưa?"),
    "give": ("cho, đưa, tặng", "I'll give you my phone number.", "Tôi sẽ cho bạn số điện thoại của tôi."),
    "help": ("giúp đỡ", "Can you help me carry this box?", "Bạn khiêng chiếc hộp này giúp tôi được không?"),
    "live": ("sống, sinh sống", "My grandparents live near the river.", "Ông bà tôi sống gần sông."),
    "make": ("làm, tạo ra", "We can make a cake together.", "Chúng ta có thể cùng làm một chiếc bánh."),
    "order": ("gọi món; đặt mua", "Are you ready to order?", "Bạn đã sẵn sàng gọi món chưa?"),
    "put": ("đặt, để", "Please put your bag under the chair.", "Hãy để túi của bạn dưới ghế."),
    "say": ("nói, bảo", "Can you say that more slowly?", "Bạn nói lại chậm hơn được không?"),
    "see": ("nhìn thấy; gặp", "Can you see the mountains from here?", "Từ đây bạn có thấy núi không?"),
    "take": ("lấy; mang theo", "Take your umbrella with you.", "Bạn mang ô theo nhé."),
    "use": ("sử dụng, dùng", "You can use my pen.", "Bạn có thể dùng bút của tôi."),
    "want": ("muốn", "Do you want to go home?", "Bạn muốn về nhà không?"),
    "work": ("làm việc", "I work at a hospital.", "Tôi làm việc ở bệnh viện."),
    "write": ("viết", "Please write your name here.", "Hãy viết tên của bạn ở đây."),
    "board": ("bảng; tấm ván", "Write your answer on the board.", "Hãy viết câu trả lời lên bảng."),
    "bank": ("ngân hàng; bờ sông", "I need to go to the bank.", "Tôi cần đến ngân hàng."),
    "account": ("tài khoản; bản tường thuật", "I opened an account at a local bank.", "Tôi mở tài khoản tại một ngân hàng địa phương."),
    "celebrity": ("người nổi tiếng", "A local celebrity opened the festival.", "Một người nổi tiếng ở địa phương khai mạc lễ hội."),
    "degree": ("mức độ; bằng cấp; độ (đơn vị đo)", "She has a degree in chemistry.", "Cô ấy có bằng về hóa học."),
    "develop": ("phát triển; hình thành", "The team will develop a new tool for teachers.", "Nhóm sẽ phát triển một công cụ mới cho giáo viên."),
    "edge": ("rìa, cạnh, mép", "Keep the glass away from the edge of the table.", "Đừng để chiếc ly sát mép bàn."),
    "essentially": ("về cơ bản, xét về bản chất", "The two plans are essentially the same.", "Về cơ bản, hai kế hoạch giống nhau."),
    "gain": ("đạt được, thu được, tích lũy", "Volunteers can gain valuable experience.", "Tình nguyện viên có thể tích lũy kinh nghiệm quý giá."),
    "price": ("giá, mức giá", "Did you check the price of the ticket?", "Bạn đã kiểm tra giá vé chưa?"),
    "perform": ("biểu diễn; thực hiện", "The students will perform on Saturday.", "Các em học sinh sẽ biểu diễn vào thứ Bảy."),
    "salon": ("tiệm làm tóc; tiệm làm đẹp", "She made an appointment at the salon.", "Cô ấy đã đặt lịch tại tiệm làm tóc."),
    "secondly": ("thứ hai, tiếp theo", "Secondly, we need a way to measure the results.", "Thứ hai, chúng ta cần một cách đo lường kết quả."),
    "support": ("ủng hộ, hỗ trợ; chống đỡ", "My friends support my decision.", "Bạn bè tôi ủng hộ quyết định của tôi."),
    "tan": ("làn da rám nắng", "I got a tan after a week by the sea.", "Da tôi rám nắng sau một tuần ở biển."),
    "progress": ("sự tiến bộ, tiến triển", "We made steady progress this month.", "Tháng này chúng tôi tiến bộ đều đặn."),
    "trip": ("chuyến đi", "We are planning a short trip to the coast.", "Chúng tôi đang lên kế hoạch cho chuyến đi ngắn ra bờ biển."),
}
SENSE_PARTS_OF_SPEECH = {
    "a": "determiner", "an": "determiner", "the": "determiner",
    "I": "pronoun", "it": "pronoun", "your": "determiner", "our": "determiner",
    "to": "preposition", "on": "preposition", "in": "preposition", "at": "preposition", "as": "preposition",
    "about": "preposition", "can": "modal auxiliary", "could": "modal auxiliary", "will": "modal auxiliary",
    "should": "modal auxiliary", "would": "modal auxiliary", "shall": "modal auxiliary", "board": "noun",
    "bank": "noun", "account": "noun", "support": "verb", "progress": "noun",
    "all": "determiner", "book": "noun", "catch": "verb", "class": "noun", "cut": "verb", "help": "verb",
    "live": "verb", "make": "verb", "order": "verb", "put": "verb", "take": "verb", "use": "verb",
    "work": "verb", "gain": "verb",
}


@dataclass
class Entry:
    term: str
    level: str
    pos: str
    topic: str
    frequency: int


def cefr_rows(path):
    with ZipFile(path) as outer, ZipFile(outer.open("CEFR-J Wordlist Ver1.6.xlsx")) as workbook:
        strings = [
            "".join(node.text or "" for node in item.iter(XLSX_NS + "t"))
            for item in ElementTree.fromstring(workbook.read("xl/sharedStrings.xml"))
        ]
        sheet = ElementTree.fromstring(workbook.read("xl/worksheets/sheet2.xml"))
        for row in list(sheet.find(XLSX_NS + "sheetData"))[1:]:
            values = {}
            for cell in row:
                value = cell.findtext(XLSX_NS + "v")
                if value is not None:
                    values[cell.attrib["r"][0]] = strings[int(value)] if cell.get("t") == "s" else value
            yield values


def read_learner_glosses(path):
    with ZipFile(path) as archive:
        data = gzip.decompress(archive.read("thichhoc-en-vi.dict.dz"))
        index = archive.read("thichhoc-en-vi.idx")
    glosses = {}
    start = 0
    while start < len(index):
        end = index.index(0, start)
        term = index[start:end].decode()
        offset, size = struct.unpack(">II", index[end + 1:end + 9])
        glosses[term] = data[offset:offset + size].decode()
        start = end + 9
    return glosses


def tidy(text):
    return " ".join(text.strip().strip(".; ").split())


def learner_meanings(entry, parts):
    for pos, sense in re.findall(r'<span class="pos">([^<]+)</span>\s*<span class="sn">(.*?)</span>', entry):
        if pos not in parts:
            continue
        for definition in re.split(r"<b>[0-9]+\.</b>", sense):
            text = tidy(html.unescape(re.sub(r"<[^>]+>", "", definition)))
            if 1 <= len(text) <= 105 and not text.startswith(("như trên", "xem ")) and not text.endswith("…"):
                yield text


def gloss_tokens(meaning):
    decomposed = unicodedata.normalize("NFD", meaning.lower().replace("đ", "d"))
    tokens = re.findall("[a-z]+", "".join(char for char in decomposed if not unicodedata.combining(char)))
    return {token for token in tokens if len(token) > 2}


def suitable_example(sentence, term):
    if not sentence or not 16 <= len(sentence) <= 140 or "..." in sentence:
        return False
    if not (sentence[0].isupper() and sentence[-1] in ".?!"):
        return False
    if sentence.lower() in {
        f"the {term.lower()} was important at work.",
        f"the {term.lower()} played a key role.",
        f"he kept the {term.lower()} on the desk.",
        f"he kept the {term.lower()} in a drawer.",
    }:
        return False
    return re.search(r"(?<!\w)" + re.escape(term) + r"(?!\w)", sentence, re.I) is not None


def valid_ipa(text):
    return text is not None and re.fullmatch(r"/[^/(),0-9]{1,58}/", text) is not None


def pronunciations(database, word_id, us_ipa):
    forms = {}
    fallback = ""
    for ipa, region in database.execute("SELECT ipa, region FROM pronunciations WHERE word_id = ? ORDER BY id", (word_id,)):
        if not valid_ipa(ipa):
            continue
        if region is None:
            fallback = fallback or ipa
        for key, regions in IPA_REGIONS.items():
            if region in regions:
                forms.setdefault(key, ipa)
    if "american" not in forms and valid_ipa(us_ipa):
        forms["american"] = us_ipa
    if fallback and not forms:
        forms["phonetic"] = fallback
    return forms


def make_card(entry, database, glosses, ipa):
    term = entry.term
    pos_label, learner_pos, db_pos = PARTS_OF_SPEECH[entry.pos]
    head = database.execute(
        "SELECT id FROM words WHERE word = ? AND lang_code = 'en' ORDER BY id LIMIT 1", (term.lower(),)
    ).fetchone()
    word_id = head[0] if head else 0
    matching_senses = [
        (tidy(definition), sentence or "")
        for definition, pos, sentence in database.execute(
            """SELECT d.definition, d.pos, wd.example FROM word_definitions wd
            JOIN definitions d ON d.id = wd.definition_id
            WHERE wd.word_id = ? ORDER BY wd.id""",
            (word_id,),
        )
        if pos in db_pos and 1 <= len(definition) <= 125 and not definition.startswith(("(như)", "Xem ", "Dạng "))
    ]
    meanings = list(learner_meanings(glosses.get(term, glosses.get(term.lower(), "")), learner_pos))
    card = {"term": term, "partOfSpeech": pos_label}
    if term in KNOWN_SENSES:
        card["meaning"], card["sentence"], card["translation"] = KNOWN_SENSES[term]
    elif meanings:
        primary = meanings[0]
        card["meaning"] = primary
        tokens = gloss_tokens(primary)
        # Keep the example attached to a sense whose Vietnamese gloss overlaps the selected one.
        choices = [
            (len(tokens & gloss_tokens(definition)), sentence)
            for definition, sentence in matching_senses
            if suitable_example(sentence, term)
        ]
        score, example = max(choices, default=(0, ""), key=lambda pair: pair[0])
        if score:
            card["sentence"] = example
    elif matching_senses:
        meaning, example = matching_senses[0]
        card["meaning"] = meaning
        if suitable_example(example, term):
            card["sentence"] = example
    else:
        return None
    card.update(pronunciations(database, word_id, ipa.get(term.lower())))
    return card


def select_entries(directory, excluded, database, glosses, ipa):
    frequencies = {term: int(freq) for term, freq in (row.split() for row in (directory / "english-frequency.txt").read_text(encoding="utf8").splitlines())}
    candidates = defaultdict(list)
    for row in cefr_rows(directory / "cefr-j-1.6.zip"):
        alternatives = row["A"].split("/")
        if any(term.lower() in excluded for term in alternatives):
            continue
        pos, level = row["B"], row["C"].lower()
        for term in alternatives:
            if pos == SENSE_PARTS_OF_SPEECH.get(term, pos) and term not in IGNORED_WORDS and WORD_PATTERN.fullmatch(term):
                topic = next((TOPIC_IDS[row[key]] for key in ("D", "E", "F") if row.get(key) in TOPIC_IDS), "general")
                candidates[level].append(Entry(term, level, pos, topic, frequencies.get(term.lower(), 0)))
                break
    for level, size in LEVEL_SIZES.items():
        picked = defaultdict(list)
        for entry in sorted(candidates[level], key=lambda item: (-item.frequency, item.term.lower())):
            if entry.term.lower() in excluded:
                continue
            card = make_card(entry, database, glosses, ipa)
            if card:
                excluded.add(entry.term.lower())
                picked[entry.topic].append(card)
            if sum(map(len, picked.values())) == size:
                break
        count = sum(map(len, picked.values()))
        if count != size:
            raise ValueError(f"{level.upper()}: expected {size} words, selected {count}")
        yield level, picked


def build_decks(directory):
    excluded = set(
        match.lower() for _, match in re.findall(
            r"""^        term: (['"])(.*?)\1,""", (ROOT / "src/data/englishDecks.ts").read_text(encoding="utf8"), re.M,
        )
    )
    for lesson in json.loads((ROOT / "English/englishRegional.json").read_text(encoding="utf8")):
        for card in lesson["cards"]:
            excluded.update((card["british"]["term"].lower(), card["american"]["term"].lower()))
    glosses = read_learner_glosses(directory / "learner-dict.zip")
    ipa = dict(line.split("\t", 1) for line in (directory / "en_US.txt").read_text(encoding="utf8").splitlines())
    with sqlite3.connect(directory / "english-vietnamese.db") as database:
        for level, words_by_topic in select_entries(directory, excluded, database, glosses, ipa):
            for topic, (title, _) in TOPICS.items():
                cards = words_by_topic[topic]
                # Keep short topics in one lesson and balance the size of larger series.
                lesson_count = (len(cards) + 39) // 40
                for index in range(lesson_count):
                    start = index * len(cards) // lesson_count
                    end = (index + 1) * len(cards) // lesson_count
                    yield {
                        "id": f"deck-en-{level}-words-{topic}-{index + 1:02d}",
                        "level": level,
                        "title": title + (f" {index + 1:02d}" if lesson_count > 1 else ""),
                        "category": title,
                        "cards": cards[start:end],
                    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source_dir", type=Path)
    args = parser.parse_args()
    decks = list(build_decks(args.source_dir))
    output = ["["]
    for index, deck in enumerate(decks):
        cards = deck.pop("cards")
        output.append("  {")
        output.extend(f"    {json.dumps(key)}: {json.dumps(value, ensure_ascii=False)}," for key, value in deck.items())
        output.append('    "cards": [')
        for card_index, card in enumerate(cards):
            output.append("      " + json.dumps(card, ensure_ascii=False) + ("," if card_index + 1 < len(cards) else ""))
        output.append("    ]")
        output.append("  }" + ("," if index + 1 < len(decks) else ""))
    output.append("]")
    (ROOT / "English/englishVocabulary.json").write_text("\n".join(output) + "\n", encoding="utf8")


if __name__ == "__main__":
    main()
