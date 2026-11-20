import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

from read_hsk3 import reading, term

ROOT = Path(__file__).parent
DESTINATION = ROOT / 'draft-catalogue.json'

# These meanings have a different use from the same written form already in the catalogue.
DISTINCT = {506, 519, 578, 683, 858, 908}
# For these words HSK spells the same use differently (sandhi or a light tone).
VARIANTS = {'大人', '耳朵', '凉快', '清楚', '行李', '一定', '一共', '一样', '一般', '一直', '脏', '着急'}
LEGACY_VARIANTS = {'越'}
HSK_TOPIC = {506:'quantity', 519:'home', 578:'home', 583:'actions', 587:'grammar', 641:'time', 660:'time',
             683:'work', 858:'description', 908:'travel', 966:'actions', 968:'description', 975:'grammar'}


def load(name):
    return json.loads((ROOT / name).read_text(encoding='utf-8'))


def clean_meaning(value):
    return '; '.join(dict.fromkeys(
        piece.strip() for piece in value.split(';')
        if piece.strip() and not piece.strip().endswith(':')
    ))


def merge():
    topics = load('original.json')
    old = {w['id']: w for w in load('starter.json')}
    by_term = defaultdict(list)
    cards = []
    for topic in topics:
        for card in topic.pop('cards'):
            card['_topic'] = topic['id']
            by_term[term(card['term'])].append(card)
            cards.append(card)

    old_ids = {c['id'] for c in cards}
    legacy = {term(w['term']): w for key, w in old.items() if key not in old_ids}

    for r in load('hsk3.json'):
        number = int(r['A'])
        key = term(r['C'])
        prior = [c for c in by_term[key] if not c.get('hskLevel')]
        matches = [c for c in prior if reading(c['phonetic']) == reading(r['D'])]
        if not matches and key in VARIANTS:
            matches = prior
        if number in DISTINCT:
            matches = []
        assert len(matches) <= 1, (r, matches)
        if matches:
            card = matches[0]
            gloss = clean_meaning(r['E'])
            if not all(part.strip() in card['meaning'] for part in gloss.split(';')):
                card['meaning'] = clean_meaning(card['meaning'].replace(' / ', '; ') + '; ' + gloss)
            card['phonetic'] = r['D']
        else:
            other = legacy.get(key)
            if other and not (reading(other['phonetic']) == reading(r['D']) or key in LEGACY_VARIANTS):
                raise ValueError((r, other))
            card = {
                'id': other['id'] if other else f'zh-hsk3-{number}',
                'term': key,
                'phonetic': r['D'],
                'meaning': clean_meaning(r['E']),
            }
            cards.append(card)
        card.update(hskId=number, hskLevel=3)
        if r.get('F'):
            card['partOfSpeech'] = r['F']
        if r.get('L'):
            card['notes'] = ' '.join(filter(None, (card.get('notes'), r['L'])))
        topic = HSK_TOPIC.get(number)
        if topic:
            card['_topic'] = topic

    # Reuse reviewed teaching material from the earlier deck for matching IDs.
    for card in cards:
        extra = old.get(card['id'])
        if extra:
            card['notes'] = ' '.join(dict.fromkeys(filter(None, (extra['notes'], card.get('notes')))))
            card['examples'] = extra['examples']
            collocations = {p['phrase']: p for p in extra['collocations']}
            for item in card.get('collocations', []):
                collocations.setdefault(item['phrase'], item)
            card['collocations'] = list(collocations.values())
    return topics, cards


def identify(cards_by_term, selector):
    word, suffix, tag = selector.strip().partition('@')
    options = cards_by_term[word]
    if suffix:
        if tag.removeprefix('a').isdigit():
            field = 'a1000Id' if tag.startswith('a') else 'hskId'
            options = [c for c in options if c.get(field) == int(tag.removeprefix('a'))]
        else:
            options = [c for c in options if reading(c['phonetic']) == reading(tag)]
    assert len(options) == 1, f'{selector!r} matched {[c["id"] for c in options]}'
    return options[0]


def default_note(word, phrase, meaning):
    before, _, after = phrase.partition(word)
    if before and not after:
        return f'Trong cụm {phrase}, từ này đứng sau {before}.'
    if after and not before:
        return f'Kết hợp với {after} như trong {phrase} (“{meaning}”).'
    if before and after:
        return f'Trong cụm {phrase}, dùng từ này sau {before} và trước {after}.'
    return f'Dùng trọn cụm {phrase} khi muốn nói “{meaning}”.'


def enrich(cards):
    lookup = defaultdict(list)
    for card in cards:
        lookup[card['term']].append(card)
    total = 0
    for path in sorted(ROOT.glob('*.practice')):
        for number, line in enumerate(path.read_text(encoding='utf-8').splitlines(), start=1):
            if not line.strip() or line.startswith('#'):
                continue
            try:
                sentence, translation, *uses = [x.strip() for x in line.split('|')]
                assert sentence.endswith(('。','？','！','”')) and translation.endswith(('.', '?', '!', '”'))
                for use in uses:
                    keys, rest = use.split(':', 1)
                    phrase, meaning = rest.split('=', 1)
                    meaning, _, note = meaning.partition('~')
                    phrase, meaning, note = phrase.strip(), meaning.strip(), note.strip()
                    assert phrase in sentence, (phrase, sentence)
                    for selector in keys.split(','):
                        card = identify(lookup, selector)
                        word = card['term']
                        assert word in phrase, (word, phrase)
                        card.setdefault('_topic', path.stem.split('-')[0])
                        if card.get('examples') and card.get('collocations') and card.get('notes'):
                            continue
                        example = {'sentence': sentence, 'translation': translation}
                        collocation = {'phrase': phrase, 'meaning': meaning}
                        rest = [x for x in card.get('collocations', []) if x['phrase'] != phrase]
                        card['collocations'] = [collocation, *rest]
                        card['examples'] = [example]
                        note = note or default_note(word, phrase, meaning)
                        card['notes'] = ' '.join(dict.fromkeys(filter(None, (card.get('notes'), note))))
                        total += 1
            except Exception as error:
                raise ValueError(f'{path.name}:{number}: {error}') from error
    return total


def finish(topics, cards):
    assert all(c.get(field) for c in cards for field in ('notes', 'examples', 'collocations', '_topic'))
    assert {c.get('hskId') for c in cards if c.get('hskId')} == set(range(1, 1001))
    assert {c.get('a1000Id') for c in cards if c.get('a1000Id')} == set(range(1, 1001))
    assert len({c['id'] for c in cards}) == len(cards)
    assert all(any(c['term'] in ex['sentence'] and ex['translation'] for ex in c['examples']) for c in cards)
    grouped = defaultdict(list)
    for card in cards:
        grouped[card.pop('_topic')].append(card)
    assert set(grouped) == {t['id'] for t in topics}
    output = ['[']
    for idx, group in enumerate(topics):
        output.append('  {')
        for field in ('id', 'name', 'description'):
            output.append(f'    "{field}": {json.dumps(group[field], ensure_ascii=False)},')
        output.append('    "cards": [')
        bucket = sorted(grouped[group['id']], key=lambda c: (
            c.get('hskLevel', 4), c.get('a1000Id', 1001), c.get('hskId', 1001), c['id'],
        ))
        for i, card in enumerate(bucket):
            output.append('      ' + json.dumps(card, ensure_ascii=False) + (',' if i + 1 < len(bucket) else ''))
        output.append('    ]')
        output.append('  }' + (',' if idx + 1 < len(topics) else ''))
    output.append(']')
    DESTINATION.write_text('\n'.join(output) + '\n', encoding='utf-8')


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    topics, cards = merge()
    count = enrich(cards)
    missing = defaultdict(list)
    variants = Counter(c['term'] for c in cards)
    for card in cards:
        if not all(card.get(field) for field in ('notes', 'examples', 'collocations', '_topic')):
            word = card['term']
            if variants[word] > 1:
                word += '@' + (str(card['hskId']) if card.get('hskId') else reading(card['phonetic']))
            missing[card.get('_topic', 'unplaced')].append(word)
    print('Totals', len(cards), Counter(c.get('hskLevel', 'everyday') for c in cards), 'authored', count)
    selected = sys.argv[1:]
    print('Missing', {k:len(v) for k,v in missing.items()})
    if '--write' in selected:
        if missing:
            raise SystemExit('Author the missing cards before writing.')
        finish(topics, cards)
    else:
        for group, words in missing.items():
            if not selected or group in selected:
                print(group, ' '.join(words))
