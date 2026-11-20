import React, { useState } from 'react';
import { Award, Check, Edit3, Flame, Target, Trophy } from 'lucide-react';
import type { LanguageCode, StudySessionLog, UserProfile, VocabWord } from '../types/vocab';
import { LANGUAGE_LABELS } from '../data/seedVocab';

interface ProfileViewProps {
  profile: UserProfile;
  words: VocabWord[];
  logs: StudySessionLog[];
  onUpdateProfile: (next: Partial<UserProfile>) => void;
}

const AVATAR_URL = '/src/assets/images/avatar_learner_profile_1795099450577.jpg';
const BANNER_URL = '/src/assets/images/hero_language_desk_1795099450280.jpg';

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  words,
  logs,
  onUpdateProfile,
}) => {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.name);
  const [title, setTitle] = useState(profile.title);
  const [bio, setBio] = useState(profile.bio);
  const [targetLanguage, setTargetLanguage] = useState<LanguageCode>(profile.targetLanguage);
  const [dailyGoalWords, setDailyGoalWords] = useState(profile.dailyGoalWords);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      name: name.trim() || profile.name,
      title: title.trim() || profile.title,
      bio: bio.trim(),
      targetLanguage,
      dailyGoalWords: Math.max(5, Math.min(100, Number(dailyGoalWords) || 15)),
    });
    setEditing(false);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const bloomMasterCount = words.filter((w) => w.bloomLevel >= 5).length;

  const milestones = [
    {
      id: 'm1',
      title: 'Khởi đầu bền bỉ',
      desc: 'Duy trì chuỗi học từ 7 ngày liên tiếp trở lên',
      unlocked: profile.longestStreak >= 7,
    },
    {
      id: 'm2',
      title: 'Nhà phân tích ngôn ngữ',
      desc: 'Đưa ít nhất 3 từ vựng đạt tầng Bloom 5-6 (Đánh giá & Sáng tạo)',
      unlocked: bloomMasterCount >= 3,
    },
    {
      id: 'm3',
      title: 'Tích lũy 1.000 XP',
      desc: 'Hoàn thành đa dạng bài ôn tập và trò chơi từ vựng',
      unlocked: profile.xp >= 1000,
    },
    {
      id: 'm4',
      title: 'Thiện xạ Ghép cặp',
      desc: 'Đạt tối thiểu 500 điểm ở trò chơi Ghép Cặp Tia Chớp',
      unlocked: profile.bestMatchScore >= 500,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Editorial Profile Header Card */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-hairline)',
        }}
      >
        <div className="relative h-40 sm:h-48 w-full overflow-hidden" style={{ backgroundColor: 'var(--bg-subtle)' }}>
          <img
            src={BANNER_URL}
            alt="Không gian học từ vựng LexisBloom"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
        </div>

        <div className="px-6 pb-6">
          <div className="relative -mt-12 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <div
                className="h-24 w-24 rounded-2xl border-4 overflow-hidden shrink-0 shadow-md"
                style={{
                  borderColor: 'var(--bg-surface)',
                  backgroundColor: 'var(--bg-subtle)',
                }}
              >
                <img
                  src={AVATAR_URL}
                  alt={`Ảnh đại diện của ${profile.name}`}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="pb-1">
                <h1 className="font-display text-xl sm:text-2xl font-bold">{profile.name}</h1>
                <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {profile.title} · Ngôn ngữ trọng tâm: {LANGUAGE_LABELS[profile.targetLanguage].name}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setEditing((v) => !v)}
              className="flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-semibold cursor-pointer self-start sm:self-auto"
              style={{
                borderColor: 'var(--border-hairline)',
                backgroundColor: 'var(--bg-canvas)',
              }}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{editing ? 'Đóng chỉnh sửa' : 'Chỉnh sửa hồ sơ'}</span>
            </button>
          </div>

          {savedNotice && (
            <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <Check className="w-4 h-4" />
              <span>Đã lưu thông tin hồ sơ cá nhân.</span>
            </div>
          )}

          {!editing ? (
            <p className="mt-4 text-sm leading-relaxed max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
              {profile.bio || 'Chưa có giới thiệu cá nhân. Nhấn "Chỉnh sửa hồ sơ" để thiết lập mục tiêu học tập của bạn.'}
            </p>
          ) : (
            <form onSubmit={handleSave} className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-5" style={{ borderColor: 'var(--border-hairline)' }}>
              <div>
                <label htmlFor="prof-name" className="block text-xs font-medium mb-1">
                  Họ và tên
                </label>
                <input
                  id="prof-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-hairline)' }}
                />
              </div>
              <div>
                <label htmlFor="prof-title" className="block text-xs font-medium mb-1">
                  Danh hiệu / Mục tiêu
                </label>
                <input
                  id="prof-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-hairline)' }}
                />
              </div>
              <div>
                <label htmlFor="prof-lang" className="block text-xs font-medium mb-1">
                  Ngôn ngữ ưu tiên
                </label>
                <select
                  id="prof-lang"
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value as LanguageCode)}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-hairline)' }}
                >
                  {Object.entries(LANGUAGE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.name} ({v.native})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="prof-goal" className="block text-xs font-medium mb-1">
                  Mục tiêu từ mỗi ngày
                </label>
                <input
                  id="prof-goal"
                  type="number"
                  min={5}
                  max={100}
                  value={dailyGoalWords}
                  onChange={(e) => setDailyGoalWords(Number(e.target.value))}
                  className="w-full rounded-lg border px-3 py-2 text-sm font-mono"
                  style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-hairline)' }}
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="prof-bio" className="block text-xs font-medium mb-1">
                  Giới thiệu bản thân
                </label>
                <textarea
                  id="prof-bio"
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-hairline)' }}
                />
              </div>
              <div className="sm:col-span-2 flex justify-end">
                <button
                  type="submit"
                  className="rounded-lg px-5 py-2 text-xs font-semibold text-white cursor-pointer"
                  style={{ backgroundColor: 'var(--accent-primary)' }}
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border p-4" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-hairline)' }}>
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>Chuỗi dài nhất</span>
          </div>
          <div className="mt-1.5 font-display text-2xl font-bold tabular-nums">{profile.longestStreak} ngày</div>
        </div>
        <div className="rounded-xl border p-4" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-hairline)' }}>
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            <Trophy className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
            <span>Tổng điểm XP</span>
          </div>
          <div className="mt-1.5 font-display text-2xl font-bold tabular-nums">{profile.xp}</div>
        </div>
        <div className="rounded-xl border p-4" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-hairline)' }}>
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            <Target className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
            <span>Số phiên đã học</span>
          </div>
          <div className="mt-1.5 font-display text-2xl font-bold tabular-nums">{logs.length}</div>
        </div>
        <div className="rounded-xl border p-4" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-hairline)' }}>
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            <Award className="w-3.5 h-3.5 text-emerald-500" />
            <span>Từ Bloom 5-6</span>
          </div>
          <div className="mt-1.5 font-display text-2xl font-bold tabular-nums">{bloomMasterCount}</div>
        </div>
      </div>

      {/* Milestones */}
      <div
        className="rounded-2xl border p-6 space-y-4"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-hairline)' }}
      >
        <h2 className="font-display text-base font-semibold">Cột mốc thành tựu cá nhân</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {milestones.map((m) => (
            <div
              key={m.id}
              className="rounded-xl border p-4 flex items-start justify-between gap-3"
              style={{
                backgroundColor: m.unlocked ? 'var(--accent-soft)' : 'var(--bg-canvas)',
                borderColor: 'var(--border-hairline)',
                opacity: m.unlocked ? 1 : 0.7,
              }}
            >
              <div>
                <div className="text-sm font-semibold">{m.title}</div>
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                  {m.desc}
                </p>
              </div>
              <span
                className="text-xs font-semibold shrink-0"
                style={{ color: m.unlocked ? 'var(--accent-text)' : 'var(--text-muted)' }}
              >
                {m.unlocked ? 'Đã đạt' : 'Chưa mở'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
