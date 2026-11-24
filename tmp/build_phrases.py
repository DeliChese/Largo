import json
from pathlib import Path
from common_data_tools import contains_exact_term, load_reserved_terms, make_stable_id
from build_phrases_data_1 import PHRASE_DECKS_PART_1
from build_phrases_data_2 import PHRASE_DECKS_PART_2
from build_phrases_data_3 import PHRASE_DECKS_PART_3

ROOT = Path(__file__).resolve().parent.parent
OUT_PATH = ROOT / "English/englishPhrases.json"

EXTRA_FIX_CARDS = [
    ("white lie", "/waɪt laɪ/", "Cụm danh từ", "lời nói dối vô hại vì lịch sự hay bảo vệ cảm xúc", ["harmless fib"], ["malicious deceit"],
     "Saying the lukewarm soup was cozy felt like a kind white lie to calm a nervous cook.", "Khen bát súp hơi nguội là ấm bụng là lời nói dối vô hại để trấn an đầu bếp mới.",
     "Parents sometimes tell a gentle white lie about bedtime clocks to calm tired toddlers.", "Cha mẹ đôi khi nói dối vô hại về giờ ngủ để dỗ bé đang buồn ngủ."),
    ("uphill battle", "/ˈʌphɪl ˈbætəl/", "Cụm danh từ", "cuộc chiến cam go tốn nhiều công sức vượt cản trở", ["arduous struggle"], ["smooth sailing"],
     "Restoring drained peat bogs faces an uphill battle when summers stay dry.", "Phục hồi đầm than bùn từng bị thoát nước là hành trình gian nan khi mùa hè khô hạn.",
     "Breaking decades of littering habits takes an uphill battle paired with clean bins.", "Thay đổi thói quen xả rác nhiều thập kỷ là nỗ lực gian nan cần đi cùng thùng rác sạch."),
]


def main() -> None:
    reserved = load_reserved_terms(exclude_file="English/englishPhrases.json")
    all_specs = [*PHRASE_DECKS_PART_1, *PHRASE_DECKS_PART_2, *PHRASE_DECKS_PART_3]

    # Fix the two flagged entries cleanly before building
    fixed_map = {c[0]: c for c in EXTRA_FIX_CARDS}
    decks_out = []
    seen_ids: set[str] = set()
    total = 0

    for spec in all_specs:
        cards_out = []
        for raw in spec["cards"]:
            term = raw[0].strip()
            low = term.lower()
            if term in ("frought with risk", "nick of season"):
                continue
            if term in fixed_map:
                raw = fixed_map[term]
            term, phonetic, pos, meaning, syns, ants, s1, t1, s2, t2 = raw
            low = term.strip().lower()
            if low in reserved:
                continue
            if not contains_exact_term(s1, term) or not contains_exact_term(s2, term):
                raise AssertionError(f"Cloze mismatch for {term}: s1={s1} | s2={s2}")
            cid = make_stable_id("en-phrases", term)
            if cid in seen_ids:
                continue
            seen_ids.add(cid)
            reserved.add(low)
            cards_out.append({
                "id": cid,
                "term": term,
                "phonetic": phonetic,
                "partOfSpeech": pos,
                "meaning": meaning,
                "synonyms": syns,
                "antonyms": ants,
                "examples": [
                    {"sentence": s1, "translation": t1},
                    {"sentence": s2, "translation": t2},
                ],
            })
            total += 1
        if cards_out:
            decks_out.append({
                "id": spec["id"],
                "level": spec["level"],
                "title": spec["title"],
                "category": spec["category"],
                "cards": cards_out,
            })

    OUT_PATH.write_text(json.dumps(decks_out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Phrases generated: {len(decks_out)} decks, {total} unique cards")


if __name__ == "__main__":
    main()
