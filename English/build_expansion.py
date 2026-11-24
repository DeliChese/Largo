"""Build the supplementary catalog using the sources listed in public/english-sources.txt."""

import argparse
import ast
import hashlib
import json
import re
import sqlite3
import unicodedata
from collections import defaultdict
from pathlib import Path

from build_vocabulary import (
    ROOT, IGNORED_WORDS, PARTS_OF_SPEECH, SENSE_PARTS_OF_SPEECH, TOPICS, TOPIC_IDS,
    Entry, cefr_rows, gloss_tokens, make_card, read_learner_glosses,
)


ENGLISH = ROOT / "English"
DRAFTS = ROOT / "tmp"
WORD = re.compile(r"[A-Za-z]+(?:[ '-][A-Za-z]+)*")
PUNCTUATION = str.maketrans("\u2018\u2019\u2010\u2011\u2013\u2014", "''----")
VIETNAMESE = re.compile(r"[đăâêôơưàáảãạèéẻẽẹìíỉĩịòóỏõọùúủũụỳýỷỹỵ]", re.I)
LEVEL_TARGETS = {"a1": 0.10, "a2": 0.22, "b1": 0.33, "b2": 0.35}
OMIT = IGNORED_WORDS | {"brand-new", "handicapped"}


def normalized(text):
    return " ".join(unicodedata.normalize("NFKC", text).translate(PUNCTUATION).lower().split()).rstrip(".?!")


def load_json(name):
    return json.loads((ENGLISH / name).read_text(encoding="utf8"))


def existing_terms():
    entries = set()
    variants = set()
    for name in ("Vocabulary", "Collocations", "PhrasalVerbs", "Regional"):
        for deck in load_json(f"english{name}.json"):
            for card in deck["cards"]:
                forms = [card[key] for key in ("american", "british") if isinstance(card.get(key), dict)]
                entries.add(normalized(card["term"] if "term" in card else card["american"]["term"]))
                variants.update(normalized(form["term"]) for form in forms if form.get("term"))
    source = (ROOT / "src/data/englishDecks.ts").read_text(encoding="utf8")
    before_loader = source.split("function buildEnglishWordId", 1)[0]
    entries.update(normalized(term) for _, term in re.findall(r"""^        term: (['"])(.*?)\1,""", before_loader, re.M))
    return entries, variants


class LiteralBranches(ast.NodeTransformer):
    def visit_IfExp(self, node):
        return self.visit(node.body if ast.literal_eval(node.test) else node.orelse)


def draft_value(file, variable):
    # Some earlier scripts write to disk on import. Read only their literal data.
    module = ast.parse(file.read_text(encoding="utf8"))
    for node in module.body:
        if isinstance(node, ast.Assign) and any(isinstance(t, ast.Name) and t.id == variable for t in node.targets):
            return ast.literal_eval(LiteralBranches().visit(node.value))
    raise ValueError(f"{variable} is missing from {file.name}")


def sentence_contains(term, sentence):
    # Ignore punctuation and spacing for spelling variants in the source drafts.
    words = re.findall(r"[a-z0-9]+", normalized(term))
    tokens = re.findall(r"[a-z0-9]+", normalized(sentence))
    return any(tokens[i:i + len(words)] == words for i in range(len(tokens))) if words else False


def bilingual_examples(term, pairs):
    examples = []
    seen = set()
    for sentence, translation in pairs:
        key = normalized(sentence)
        if key in seen or not VIETNAMESE.search(translation) or not sentence_contains(term, sentence):
            continue
        if not (12 <= len(sentence) <= 220 and 6 <= len(translation) <= 260):
            continue
        seen.add(key)
        examples.append({"sentence": sentence.strip(), "translation": translation.strip()})
    return examples


def draft_card(term, phonetic, pos, meaning, synonyms, antonyms, s1, t1, s2, t2, **extra):
    term = term.strip()
    examples = bilingual_examples(term, [(s1, t1), (s2, t2)])
    if not WORD.fullmatch(normalized(term)) or not VIETNAMESE.search(meaning) or not examples:
        return None
    return {"term": term, "phonetic": phonetic, "partOfSpeech": pos, "meaning": meaning,
            "examples": examples, "synonyms": synonyms, "antonyms": antonyms, **extra}


def draft_decks():
    for file in sorted(DRAFTS.glob("vocab_batch_*.py")):
        for deck in draft_value(file, file.stem.upper()):
            cards = []
            for row in deck["cards"]:
                term, ipa, pos, meaning, *details = row
                if len(details) == 7 and isinstance(details[0], list) and len(details[0]) == 2:
                    details = [*details[0], *details[1:]]
                if len(details) != 8:
                    continue
                phrase, phrase_meaning, synonyms, antonyms, s1, t1, s2, t2 = details
                collocations = [{"phrase": phrase, "meaning": phrase_meaning}] if phrase and phrase_meaning else []
                cards.append(draft_card(term, ipa, pos, meaning, synonyms, antonyms, s1, t1, s2, t2, collocations=collocations))
            yield {**deck, "collection": "vocabulary", "cards": cards}

    for part in range(1, 4):
        for deck in draft_value(DRAFTS / f"build_phrases_data_{part}.py", f"PHRASE_DECKS_PART_{part}"):
            cards = [draft_card(*card) for card in deck["cards"] if card[0] not in {"frought with risk", "nick of season", "uphill battle"}]
            yield {**deck, "collection": "phrases", "cards": cards}

    for item in draft_value(DRAFTS / "expand_collocations.py", "NEW_COL_DECKS"):
        deck_id, level, title, rows = item
        cards = [draft_card(term, "", "Collocation", meaning, *rest) for _, term, meaning, *rest in rows]
        yield {"id": deck_id, "level": level, "title": title, "category": title, "collection": "collocations", "cards": cards}
    for deck in draft_value(DRAFTS / "expand_collocations_2.py", "NEW_COLLOCATION_DECKS"):
        cards = [draft_card(term, "", "Collocation", meaning, *rest) for term, _, meaning, *rest in deck["cards"]]
        yield {**deck, "category": deck["title"], "collection": "collocations", "cards": cards}

    for deck in draft_value(DRAFTS / "expand_phrasals.py", "NEW_DECKS"):
        cards = [draft_card(term, ipa, "Cụm động từ", meaning, *rest, **({"notes": notes} if notes else {}))
                 for term, ipa, meaning, *rest, notes in deck["cards"]]
        level = "a2" if deck["topic"] in {"Nhà cửa và sinh hoạt", "Đi lại và vị trí"} else "b1"
        yield {"id": deck["id"], "level": level, "title": deck["title"], "category": deck["topic"],
               "collection": "phrasal", "cards": cards}


def choose_drafts(reserved):
    for deck in draft_decks():
        cards = []
        for card in deck["cards"]:
            if card and normalized(card["term"]) not in reserved:
                reserved.add(normalized(card["term"]))
                cards.append(card)
        if cards:
            yield {**deck, "cards": cards}


def example_overrides():
    overrides = {}
    for line in (ENGLISH / "englishExampleOverrides.tsv").read_text(encoding="utf8").splitlines():
        if line.startswith("#") or not line.strip():
            continue
        term, sentence, translation, *meaning = line.split("\t")
        overrides[normalized(term)] = (sentence, translation, *meaning)
    return overrides


def dictionary_example(term, sentence):
    lower = sentence.lower()
    key = term.lower()
    if not sentence or not sentence_contains(term, sentence) or VIETNAMESE.search(sentence) or "typo for" in lower:
        return False
    placeholders = {f"the {key} appeared in the report.", f"a {key} helped the team.", f"they discussed the {key} today."}
    return lower not in placeholders and sentence[-1] in ".?!"


def dictionary_entries(source, database, reserved):
    glosses = read_learner_glosses(source / "learner-dict.zip")
    ipa = dict(line.split("\t", 1) for line in (source / "en_US.txt").read_text(encoding="utf8").splitlines())
    frequencies = dict((term, int(count)) for term, count in
                       (line.split() for line in (source / "english-frequency.txt").read_text(encoding="utf8").splitlines()))
    overrides = example_overrides()
    rows = []
    for row in cefr_rows(source / "cefr-j-1.6.zip"):
        alternatives = row["A"].split("/")
        pos, level = row["B"], row["C"].lower()
        if pos not in PARTS_OF_SPEECH or level not in LEVEL_TARGETS or any(normalized(term) in reserved for term in alternatives):
            continue
        term = alternatives[0]
        if term in OMIT or pos != SENSE_PARTS_OF_SPEECH.get(term, pos) or not WORD.fullmatch(term):
            continue
        frequency = max((frequencies.get(form.lower(), 0) for form in alternatives), default=0)
        if not frequency and " " not in term:
            continue
        topic = next((TOPIC_IDS[row[key]] for key in ("D", "E", "F") if row.get(key) in TOPIC_IDS), "general")
        rows.append((Entry(term, level, pos, topic, frequency), alternatives))

    for entry, alternatives in sorted(rows, key=lambda item: (-item[0].frequency, item[0].term.lower())):
        card = make_card(entry, database, glosses, ipa)
        if not card or not VIETNAMESE.search(card["meaning"]) or len(gloss_tokens(card["meaning"])) == 0:
            continue
        # Use only context already attached to the selected dictionary sense.
        sentence = card.pop("sentence", "")
        translation = card.pop("translation", "")
        override = overrides.get(normalized(entry.term))
        if override:
            sentence, translation, *meaning = override
            if meaning:
                card["meaning"] = meaning[0]
        if not override and not dictionary_example(entry.term, sentence):
            continue
        card["examples"] = [{"sentence": sentence, "translation": translation}]
        if not card.get("phonetic"):
            english_forms = {locale: {"phonetic": card.pop(key)} for key, locale in
                             (("american", "en-US"), ("british", "en-GB")) if card.get(key)}
            if english_forms:
                card["englishForms"] = english_forms
        card.pop("british", None)
        card.pop("american", None)
        yield entry, alternatives, card


def choose_dictionary(source, reserved, remaining):
    with sqlite3.connect((source / "english-vietnamese.db").resolve().as_uri() + "?mode=ro&immutable=1", uri=True) as db:
        entries = list(dictionary_entries(source, db, reserved))
    # Favor bilingual entries and then the more frequent headwords.
    entries.sort(key=lambda item: (not item[2]["examples"][0]["translation"], -item[0].frequency))
    result = defaultdict(list)
    count = 0
    for level, fraction in LEVEL_TARGETS.items():
        target = round(remaining * fraction) if level != "b2" else remaining - count
        selected = 0
        for entry, alternatives, card in entries:
            if selected >= target:
                break
            if entry.level != level or any(normalized(term) in reserved for term in alternatives):
                continue
            reserved.update(normalized(term) for term in alternatives)
            result[(level, entry.topic)].append(card)
            selected += 1
        count += selected
    for entry, alternatives, card in entries:
        if count >= remaining:
            break
        if any(normalized(term) in reserved for term in alternatives):
            continue
        reserved.update(normalized(term) for term in alternatives)
        result[(entry.level, entry.topic)].append(card)
        count += 1
    if count != remaining:
        raise ValueError(f"Selected {count} of {remaining} dictionary entries")
    for (level, topic), cards in result.items():
        title = TOPICS[topic][0] if topic != "general" else "Từ vựng tổng hợp"
        for start in range(0, len(cards), 32):
            number = start // 32 + 1
            yield {"id": f"deck-en-extra-{level}-{topic}-{number:02d}", "level": level,
                   "title": f"{title} · Bổ sung {number}", "category": title, "collection": "vocabulary",
                   "cards": cards[start:start + 32]}


def filter_relations(decks, known_terms):
    cards = {normalized(card["term"]): card for deck in decks for card in deck["cards"]}
    ant = {term: {normalized(value) for value in card.get("antonyms", [])} for term, card in cards.items()}
    opposites = defaultdict(list)
    for first, second in load_json("englishOpposites.json"):
        opposites[first].append(second)
        opposites[second].append(first)
    for term, card in cards.items():
        synonyms = card.pop("synonyms", [])
        antonyms = card.pop("antonyms", [])
        synonyms = [value for value in synonyms if normalized(value) in known_terms and normalized(value) != term]
        antonyms = [value for value in antonyms if term in ant.get(normalized(value), ())]
        antonyms = [*opposites[term], *antonyms]
        if synonyms:
            card["synonyms"] = list(dict.fromkeys(synonyms))[:4]
        if antonyms:
            card["antonyms"] = list(dict.fromkeys(antonyms))[:4]


def assign_ids(decks):
    for deck in decks:
        for card in deck["cards"]:
            key = normalized(card["term"])
            slug = re.sub(r"[^a-z0-9]+", "-", key).strip("-")[:45]
            digest = hashlib.sha256(key.encode("utf8")).hexdigest()[:10]
            card["id"] = f"en-extra-{slug}-{digest}"


def write_decks(path, decks):
    lines = ["["]
    for index, deck in enumerate(decks):
        lines.append("  {")
        lines.extend(f"    {json.dumps(key)}: {json.dumps(value, ensure_ascii=False)}," for key, value in deck.items() if key != "cards")
        lines.append('    "cards": [')
        for i, card in enumerate(deck["cards"]):
            lines.append("      " + json.dumps(card, ensure_ascii=False) + ("," if i + 1 < len(deck["cards"]) else ""))
        lines.extend(("    ]", "  }" + ("," if index + 1 < len(decks) else "")))
    lines.append("]")
    path.write_text("\n".join(lines) + "\n", encoding="utf8")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("sources", type=Path)
    args = parser.parse_args()
    base, variants = existing_terms()
    reserved = base | variants
    drafts = list(choose_drafts(reserved))
    draft_count = sum(len(deck["cards"]) for deck in drafts)
    additional = list(choose_dictionary(args.sources, reserved, 7_000 - len(base) - draft_count))
    filter_relations([*drafts, *additional], reserved)
    assign_ids([*drafts, *additional])
    write_decks(ENGLISH / "englishExpansion.json", drafts)
    write_decks(ENGLISH / "englishExtraVocabulary.json", additional)
    print(f"{len(base)} existing + {draft_count} draft + {sum(len(d['cards']) for d in additional)} dictionary entries")


if __name__ == "__main__":
    main()
