import assert from 'node:assert/strict';
import test from 'node:test';
import { CURRENT_DATA_VERSION } from '../data/seedVocab';
import { createBackup, previewBackup } from './backup';
import {
  DELETED_HSK_CARD, FIXTURE_AVATAR, SHARED_HSK_CARD, legacyStudyBackup,
  reviewedStudySnapshot, studySnapshotMissingLesson,
} from './fixtures/studySnapshots';

test('v2 JSON round-trip keeps the snapshot and avatar bytes', async () => {
  const state = reviewedStudySnapshot('hsk30', 'en-GB');
  const backup = createBackup(state, { avatar: FIXTURE_AVATAR }, new Date(0));
  const preview = await previewBackup(new Blob([JSON.stringify(backup)]));
  const { savedAt, ...expected } = state;
  assert.deepEqual(JSON.parse(JSON.stringify(preview.state)), JSON.parse(JSON.stringify(expected)));
  assert.equal(preview.summary.logs, 128);
  assert.equal(preview.summary.images, 1);
  assert.equal(preview.images.avatar?.type, 'image/png');
  assert.equal(btoa(String.fromCharCode(...new Uint8Array(await preview.images.avatar!.arrayBuffer()))), FIXTURE_AVATAR.split(',')[1]);
});

test('legacy preview migrates old seed data and repairs a missing current lesson without reviving deleted cards', async () => {
  for (const backup of [legacyStudyBackup(), studySnapshotMissingLesson()]) {
    const saved = backup.words.find(({ id }) => id === SHARED_HSK_CARD)!;
    const { state } = await previewBackup(new Blob([JSON.stringify(backup)]));
    assert.equal(state.version, CURRENT_DATA_VERSION);
    assert.deepEqual(state.words.find(({ id }) => id === saved.id)?.srs, saved.srs);
    assert.ok(!state.words.some(({ id }) => id === DELETED_HSK_CARD));
    assert.deepEqual(state.profile.todayWordIds, backup.profile.todayWordIds);
  }
});

test('preview rejects corrupted, ambiguous and future backup data', async () => {
  const state = reviewedStudySnapshot();
  const backup = createBackup(state, {}, new Date(0));
  const reject = (value: unknown) => assert.rejects(previewBackup(new Blob([JSON.stringify(value)])));
  await assert.rejects(previewBackup(new Blob(['{'])));
  await assert.rejects(previewBackup(new Blob(['{"constructor":{"prototype":{}}}'])));
  await reject({ ...backup, formatVersion: 99 });
  await reject({ ...backup, appDataVersion: 99 });
  await reject({ ...backup, idbSchemaVersion: 99 });
  await reject({ ...backup, snapshot: { ...backup.snapshot, profile: { xp: '1' } } });
  await reject({ ...backup, snapshot: { ...backup.snapshot, images: { avatar: 'data:image/svg+xml;base64,PHN2Zz4=' } } });
  const [word, ...words] = state.words;
  await reject({ ...backup, snapshot: { ...backup.snapshot, words: [word, word, ...words] } });
  await reject({ ...backup, snapshot: { ...backup.snapshot, words: [{ ...word, srs: { ...word.srs, nextReviewAt: 'tomorrow' } }, ...words] } });
  await reject({ ...backup, snapshot: { ...backup.snapshot, words: [{ ...word, deckId: 'missing-deck', id: 'custom-orphan' }, ...words] } });
  const [deck, ...decks] = state.decks;
  await reject({ ...backup, snapshot: { ...backup.snapshot, decks: [{ ...deck, nativeName: 12 }, ...decks] } });
});
