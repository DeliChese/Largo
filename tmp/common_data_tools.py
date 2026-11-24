import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def load_reserved_terms(exclude_file: str | None = None) -> set[str]:
    existing: set[str] = set()
    files = [
        "English/englishVocabulary.json",
        "English/englishCollocations.json",
        "English/englishPhrasalVerbs.json",
        "English/englishPhrases.json",
        "English/englishExpansionVocab.json",
    ]
    for rel in files:
        if exclude_file and rel == exclude_file:
            continue
        p = ROOT / rel
        if not p.exists():
            continue
        data = json.loads(p.read_text(encoding="utf-8"))
        for deck in data:
            for card in deck.get("cards", []):
                existing.add(card["term"].strip().lower())

    reg_path = ROOT / "English/englishRegional.json"
    if reg_path.exists():
        for deck in json.loads(reg_path.read_text(encoding="utf-8")):
            for card in deck.get("cards", []):
                existing.add(card["american"]["term"].strip().lower())
                existing.add(card["british"]["term"].strip().lower())

    starter_src = (ROOT / "src/data/englishDecks.ts").read_text(encoding="utf-8")
    for m in re.findall(r"term:\s*'([^']+)'|term:\s*\"([^\"]+)\"", starter_src):
        t = (m[0] or m[1]).strip().lower()
        existing.add(t)
    return existing


def make_stable_id(prefix: str, term: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", term.lower()).strip("-")
    digest = hashlib.sha1(term.lower().encode("utf-8")).hexdigest()[:10]
    return f"{prefix}-{slug[:42]}-{digest}"


def contains_exact_term(sentence: str, term: str) -> bool:
    pattern = re.escape(term.strip()).replace(r"\ ", r"\s+")
    return bool(re.search(rf"(?<![A-Za-z0-9]){pattern}(?![A-Za-z0-9])", sentence, re.IGNORECASE))
