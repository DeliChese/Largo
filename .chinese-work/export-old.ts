import { writeFileSync } from 'node:fs';
import { HSK1_WORDS } from '../Chinese/hsk1Deck';
import { HSK2_WORDS } from '../Chinese/hsk2Deck';

writeFileSync('.chinese-work/starter.json', JSON.stringify([...HSK1_WORDS, ...HSK2_WORDS]));
