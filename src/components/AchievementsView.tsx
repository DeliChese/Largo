import { BookOpenCheck, Check, Flame, Gamepad2, LockKeyhole, Sparkles, Trophy } from 'lucide-react';
import type { UserProfile, VocabWord } from '../types/vocab';
import '../profile.css';

interface AchievementsViewProps {
  profile: UserProfile;
  words: VocabWord[];
}

const formatNumber = new Intl.NumberFormat('vi-VN');

export function AchievementsView({ profile, words }: AchievementsViewProps) {
  const milestones = [
    { title: 'Khởi đầu bền bỉ', detail: 'Học trong 7 ngày liên tiếp.', progress: profile.longestStreak, goal: 7, unit: 'ngày', icon: Flame, tone: 'peach' },
    { title: 'Mốc Bloom cũ', detail: 'Mốc lịch sử cho 3 từ từng ở tầng 5 hoặc 6.', progress: words.filter((word) => word.bloomLevel >= 5).length, goal: 3, unit: 'từ', icon: BookOpenCheck, tone: 'mint' },
    { title: 'Tích lũy kinh nghiệm', detail: 'Tích lũy 1.000 XP qua các hoạt động học.', progress: profile.xp, goal: 1_000, unit: 'XP', icon: Sparkles, tone: 'violet' },
    { title: 'Ghép cặp nhanh', detail: 'Đạt 500 điểm trong một lượt Ghép cặp.', progress: profile.bestMatchScore, goal: 500, unit: 'điểm', icon: Gamepad2, tone: 'violet' },
  ];
  const completed = milestones.filter(({ progress, goal }) => progress >= goal).length;

  return (
    <div className="achievements-page">
      <div className="glass-panel achievement-hero">
        <div className="achievement-emblem"><Trophy size={30} strokeWidth={1.7} aria-hidden="true" /></div>
        <div>
          <h1>Thành tích</h1>
          <p>{completed} / {milestones.length} cột mốc đã đạt</p>
        </div>
      </div>

      <ul className="achievement-grid" aria-label="Các cột mốc học tập">
        {milestones.map(({ title, detail, progress, goal, unit, icon: Icon, tone }) => {
          const unlocked = progress >= goal;
          const tracked = Math.min(progress, goal);
          return (
            <li key={title} className="glass-panel achievement-card" data-unlocked={unlocked}>
              <div className="achievement-card-top">
                <span className="metric-icon" data-tone={tone}><Icon size={22} aria-hidden="true" /></span>
                <span className="achievement-status">
                  {unlocked ? <Check size={15} aria-hidden="true" /> : <LockKeyhole size={14} aria-hidden="true" />}
                  {unlocked ? 'Đã đạt' : 'Chưa đạt'}
                </span>
              </div>
              <h2>{title}</h2>
              <p>{detail}</p>
              <div className="achievement-progress">
                <progress className="profile-progress" max={goal} value={tracked} aria-label={title}>
                  {tracked} / {goal}
                </progress>
                <span>{formatNumber.format(tracked)} / {formatNumber.format(goal)} {unit}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
