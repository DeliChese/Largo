import json
import re
import sys
import unicodedata
import xml.etree.ElementTree as ET
from collections import Counter, defaultdict
from pathlib import Path
from zipfile import ZipFile

ROOT = Path(__file__).parent
MAIN = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'
REL = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}'
PKG = '{http://schemas.openxmlformats.org/package/2006/relationships}'


def string(node):
    if node is None:
        return ''
    return ''.join(t.text or '' for t in node.findall(f'{MAIN}t') + node.findall(f'{MAIN}r/{MAIN}t'))


def rows(path):
    with ZipFile(path) as archive:
        book = ET.fromstring(archive.read('xl/workbook.xml'))
        sheet = next(el for el in book.find(f'{MAIN}sheets') if el.get('name') == 'HSK 3')
        rels = ET.fromstring(archive.read('xl/_rels/workbook.xml.rels'))
        entry = next(el for el in rels.findall(f'{PKG}Relationship') if el.get('Id') == sheet.get(f'{REL}id'))
        target = entry.get('Target')
        path = target.lstrip('/') if target.startswith('/') else f'xl/{target}'
        shared = [string(el) for el in ET.fromstring(archive.read('xl/sharedStrings.xml'))] if 'xl/sharedStrings.xml' in archive.namelist() else []
        with archive.open(path) as inp:
            for _, row in ET.iterparse(inp, events=('end',)):
                if row.tag != f'{MAIN}row':
                    continue
                cells = {}
                for cell in row.findall(f'{MAIN}c'):
                    col = re.match('[A-Z]+', cell.get('r'))[0]
                    val = cell.findtext(f'{MAIN}v')
                    if cell.get('t') == 's' and val is not None:
                        val = shared[int(val)]
                    elif cell.get('t') == 'inlineStr':
                        val = string(cell.find(f'{MAIN}is'))
                    if val is not None and val.strip():
                        cells[col] = unicodedata.normalize('NFC', val.strip())
                yield cells
                row.clear()


def reading(text):
    return re.sub(r"[\s'’‘-]+", '', unicodedata.normalize('NFC', text).lower())


def term(text):
    return re.sub(r'\s+|[0-9]+$', '', unicodedata.normalize('NFKC', text))


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    source = Path(sys.argv[1])
    rows = list(rows(source))
    print('Header', next(row for row in rows if row.get('A') == 'ID gốc'))
    data = [row for row in rows if row.get('A', '').isdigit()]
    assert all(r['B'] == '3' for r in data)
    print('Count', len(data), data[0]['A'], data[-1]['A'], Counter(r.get('F') for r in data))
    print('Non-standard headwords', [(r['A'], r['C'], r['D'], r['E']) for r in data if re.search(r'[^\u3400-\u9fff]', r['C']) or '/' in r['D']])
    (ROOT / 'hsk3.json').write_text(json.dumps(data, ensure_ascii=False), encoding='utf-8')
    current = json.loads(Path(sys.argv[2]).read_text(encoding='utf-8'))
    words = defaultdict(list)
    for group in current:
        for card in group['cards']:
            words[term(card['term'])].append((group['id'], card))
    print('Same written form in current deck:')
    for row in data:
        same = words[term(row['C'])]
        if same:
            print(f"{row['A']} {row['C']} {row['D']} {row['E']} -> " + ' / '.join(
                f"{c['id']} {c['phonetic']} {c['meaning']}" for _, c in same))
    print('All HSK 3 rows:', ' '.join(r['A'] + ':' + r['C'] for r in data))
