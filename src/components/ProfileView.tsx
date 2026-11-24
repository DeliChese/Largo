import { useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { ArrowUpRight, Camera, Check, Flame, GraduationCap, ImagePlus, Pencil, Target, Trash2, Trophy } from 'lucide-react';
import type { StudySessionLog, UserProfile, VocabWord } from '../types/vocab';
import { getDailyProgress } from '../utils/studyPlan';
import { PROFILE_IMAGE_ACCEPT, type ProfileImageKind } from '../utils/profileImages';
import '../profile.css';

interface ProfileViewProps {
  profile: UserProfile;
  words: VocabWord[];
  logs: StudySessionLog[];
  avatarUrl?: string;
  coverUrl?: string;
  imagesReady: boolean;
  onUpdateImage: (kind: ProfileImageKind, file?: File) => Promise<void>;
  onUpdateProfile: (next: Partial<UserProfile>) => void;
  onOpenAchievements: () => void;
}

type ProfileDraft = Pick<UserProfile, 'name' | 'title' | 'bio'> & { dailyGoalWords: string };

const formatNumber = new Intl.NumberFormat('vi-VN');

export function ProfileView({
  profile, words, logs, avatarUrl, coverUrl, imagesReady, onUpdateImage, onUpdateProfile, onOpenAchievements,
}: ProfileViewProps) {
  const [draft, setDraft] = useState<ProfileDraft | null>(null);
  const [saved, setSaved] = useState(false);
  const [savingImage, setSavingImage] = useState(false);
  const [imageNotice, setImageNotice] = useState<{ text: string; failed?: boolean }>();
  const avatarInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const imageControlsDisabled = !imagesReady || savingImage;
  const nameParts = profile.name.trim().split(/\s+/);
  const initials = (Array.from(nameParts[0] || 'L')[0] + (nameParts.length > 1 ? Array.from(nameParts.at(-1)!)[0] : '')).toLocaleUpperCase('vi');
  const daily = getDailyProgress(profile, Date.now());
  const sessionCount = logs.filter((log) => !log.mode.startsWith('game_') && log.wordsReviewed > 0).length;
  const englishWords = words.filter((word) => word.language === 'en');
  const learnedCount = englishWords.filter((word) => word.srs.lastReviewedAt !== null).length;
  const totalCount = englishWords.length;

  async function updateImage(kind: ProfileImageKind, file?: File) {
    setImageNotice(undefined);
    setSavingImage(true);
    try {
      await onUpdateImage(kind, file);
      const name = kind === 'avatar' ? 'ảnh đại diện' : 'ảnh bìa';
      setImageNotice({ text: (file ? 'Đã lưu ' : 'Đã gỡ ') + name + '.' });
    } catch (error) {
      setImageNotice({ text: error instanceof Error ? error.message : 'Largo chưa lưu được ảnh.', failed: true });
    } finally {
      setSavingImage(false);
    }
  }

  function selectImage(kind: ProfileImageKind, event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (file) void updateImage(kind, file);
  }

  function startEditing() {
    setSaved(false);
    setDraft({
      name: profile.name,
      title: profile.title,
      bio: profile.bio,
      dailyGoalWords: String(profile.dailyGoalWords),
    });
  }

  function edit<K extends keyof ProfileDraft>(field: K, value: ProfileDraft[K]) {
    setDraft((current) => current ? { ...current, [field]: value } : current);
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;
    const dailyGoalWords = Math.max(5, Math.min(100, Number(draft.dailyGoalWords) || profile.dailyGoalWords));
    onUpdateProfile({
      name: draft.name.trim() || profile.name,
      title: draft.title.trim(),
      bio: draft.bio.trim(),
      dailyGoalWords,
    });
    setDraft(null);
    setSaved(true);
  }

  return (
    <div className="profile-page">
      <div className="profile-page-heading">
        <h1>Hồ sơ</h1>
        <button type="button" className="button-secondary" onClick={onOpenAchievements}>
          <Trophy size={17} aria-hidden="true" /> Thành tích <ArrowUpRight size={15} aria-hidden="true" />
        </button>
      </div>

      <div className="profile-grid">
        <section className="glass-panel profile-card" aria-labelledby="profile-name">
          <input id="profile-avatar-file" ref={avatarInput} type="file" hidden accept={PROFILE_IMAGE_ACCEPT}
            onChange={(event) => selectImage('avatar', event)} />
          <input id="profile-cover-file" ref={coverInput} type="file" hidden accept={PROFILE_IMAGE_ACCEPT}
            onChange={(event) => selectImage('cover', event)} />
          <div className="profile-cover">
            {coverUrl && <img className="profile-cover-image" src={coverUrl} alt="" />}
            <div className="profile-cover-actions">
              <button type="button" className="profile-cover-button" onClick={() => coverInput.current?.click()}
                disabled={imageControlsDisabled}>
                <ImagePlus size={17} aria-hidden="true" /> {coverUrl ? 'Đổi ảnh bìa' : 'Tải ảnh bìa'}
              </button>
              {coverUrl && (
                <button type="button" className="profile-cover-button" onClick={() => updateImage('cover')}
                  disabled={imageControlsDisabled} aria-label="Gỡ ảnh bìa" title="Gỡ ảnh bìa">
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
          <div className="profile-card-body">
            <div className="profile-identity">
              <div className="profile-avatar-frame">
                <span className="profile-avatar" aria-hidden="true">
                  {avatarUrl ? <img src={avatarUrl} alt="" /> : initials}
                </span>
                <button type="button" className="profile-avatar-button" onClick={() => avatarInput.current?.click()}
                  disabled={imageControlsDisabled} aria-label={avatarUrl ? 'Đổi ảnh đại diện' : 'Tải ảnh đại diện'}
                  title={avatarUrl ? 'Đổi ảnh đại diện' : 'Tải ảnh đại diện'}>
                  <Camera size={16} aria-hidden="true" />
                </button>
              </div>
              <div className="profile-person">
                <h2 id="profile-name">{profile.name}</h2>
                {profile.title && <p>{profile.title}</p>}
                {avatarUrl && (
                  <button type="button" className="text-button profile-remove-avatar"
                    disabled={imageControlsDisabled} onClick={() => updateImage('avatar')}>Gỡ ảnh đại diện</button>
                )}
              </div>
              {!draft && (
                <button type="button" className="button-secondary profile-edit" onClick={startEditing}>
                  <Pencil size={16} aria-hidden="true" /> Chỉnh sửa
                </button>
              )}
            </div>

            {savingImage && <p className="profile-image-notice" role="status">Đang lưu ảnh…</p>}
            {imageNotice && (
              <p className="profile-image-notice" data-error={imageNotice.failed} role={imageNotice.failed ? 'alert' : 'status'}>
                {imageNotice.text}
              </p>
            )}

            {profile.bio && !draft && <p className="profile-bio">{profile.bio}</p>}
            {saved && (
              <p className="profile-saved" role="status">
                <Check size={17} aria-hidden="true" /> Đã lưu hồ sơ.
              </p>
            )}

            {draft ? (
              <form className="profile-form" onSubmit={save}>
                <label>
                  <span>Họ và tên</span>
                  <input required value={draft.name} onChange={(event) => edit('name', event.target.value)} />
                </label>
                <label>
                  <span>Mục tiêu học tập</span>
                  <input value={draft.title} onChange={(event) => edit('title', event.target.value)} />
                </label>
                <label>
                  <span>Mục tiêu mỗi ngày</span>
                  <input type="number" min={5} max={100} step={1} required value={draft.dailyGoalWords}
                    onChange={(event) => edit('dailyGoalWords', event.target.value)} />
                </label>
                <label className="profile-form-wide">
                  <span>Giới thiệu</span>
                  <textarea rows={3} value={draft.bio} onChange={(event) => edit('bio', event.target.value)} />
                </label>
                <div className="profile-form-actions profile-form-wide">
                  <button type="button" className="button-secondary" onClick={() => setDraft(null)}>Hủy</button>
                  <button type="submit" className="button-primary">Lưu thay đổi</button>
                </div>
              </form>
            ) : (
              <ul className="profile-preferences" aria-label="Thiết lập học">
                <li>
                  <span className="metric-icon" data-tone="mint"><GraduationCap size={20} aria-hidden="true" /></span>
                  <div><span>Ngôn ngữ đang học</span><strong>Tiếng Anh</strong></div>
                </li>
                <li>
                  <span className="metric-icon" data-tone="violet"><Target size={20} aria-hidden="true" /></span>
                  <div><span>Mục tiêu mỗi ngày</span><strong>{formatNumber.format(profile.dailyGoalWords)} từ</strong></div>
                </li>
              </ul>
            )}
          </div>
        </section>

        <section className="glass-panel profile-activity" aria-labelledby="profile-activity-title">
          <div className="profile-section-heading">
            <span className="metric-icon" data-tone="peach"><Flame size={20} aria-hidden="true" /></span>
            <h2 id="profile-activity-title">Nhịp học</h2>
          </div>
          <dl className="profile-stats">
            <div><dt>Chuỗi hiện tại</dt><dd>{formatNumber.format(daily.streak)} <span>ngày</span></dd></div>
            <div><dt>Chuỗi dài nhất</dt><dd>{formatNumber.format(profile.longestStreak)} <span>ngày</span></dd></div>
            <div><dt>Phiên đã học</dt><dd>{formatNumber.format(sessionCount)}</dd></div>
          </dl>
        </section>

        <section className="glass-panel profile-language-card" aria-labelledby="profile-languages-title">
          <h2 id="profile-languages-title">Từ đã luyện</h2>
          <ul className="profile-language-list">
            <li>
              <span className="profile-language-code">EN</span>
              <div>
                <div className="profile-language-label">
                  <strong>Tiếng Anh</strong>
                  <span>{formatNumber.format(learnedCount)} / {formatNumber.format(totalCount)} từ</span>
                </div>
                {totalCount > 0 && (
                  <progress className="profile-progress" max={totalCount} value={learnedCount} aria-label="Từ đã luyện · Tiếng Anh">
                    {learnedCount} / {totalCount}
                  </progress>
                )}
              </div>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
