import { ArrowDownRight, ArrowRight, BookOpen, CalendarDays, Clock3, Flame, Layers3, ListChecks, RotateCcw, Target, Volume2 } from 'lucide-react';
import type { CSSProperties } from 'react';
import { LANGUAGE_LABELS } from '../data/seedVocab';
import type { AnalyticsSubRoute, AppRoute, UserProfile, VocabDeck, VocabWord } from '../types/vocab';
import { computeForecastDays, localStudyDate } from '../utils/srsBloom';
import { getDailyProgress, getDailyStudyPlan } from '../utils/studyPlan';
import { speakPronunciation } from '../utils/soundEngine';

interface DashboardViewProps {
  profile: UserProfile;
  decks: VocabDeck[];
  words: VocabWord[];
  level?: string;
  speechRate: number;
  plan: ReturnType<typeof getDailyStudyPlan>;
  now: number;
  onStartDaily: () => void;
  onOpenPhrases: () => void;
  onNavigate: (route: AppRoute, subRoute?: AnalyticsSubRoute) => void;
}

const dateFormat = new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' });

export function DashboardView({ profile, decks, words, level, speechRate, plan, now, onStartDaily, onOpenPhrases, onNavigate }: DashboardViewProps) {
  const progress = getDailyProgress(profile, now);
  const remaining = Math.max(0, profile.dailyGoalWords - progress.studied);
  const goalPercent = Math.min(100, Math.round(progress.studied * 100 / Math.max(profile.dailyGoalWords, 1)));
  const studied = words.filter((word) => word.srs.lastReviewedAt !== null).length;
  const forecast = computeForecastDays(words, 7, now);
  const forecastTotal = forecast.reduce((sum, day) => sum + day.count, 0);
  const forecastMax = Math.max(1, ...forecast.map((day) => day.count));
  const suggestedDecks = decks.filter((deck) => words.some((word) => word.deckId === deck.id)).slice(0, 3);
  const usablePhrases = words.flatMap((word) => word.collocations
    .filter(({ phrase, meaning }) => phrase.trim() && meaning.trim() && !/…|\.\.\./.test(phrase))
    .map((collocation) => ({ ...collocation, language: word.language })));
  const featured = usablePhrases.length ? usablePhrases[(new Date(now).getDate() - 1) % usablePhrases.length] : undefined;

  const hasSession = plan.words.length > 0;
  const headline = plan.reviewCount && plan.newCount ? 'Ôn bài và học từ mới'
    : plan.reviewCount ? 'Ôn từ đến hạn'
    : plan.newCount ? 'Học từ mới'
    : words.length ? 'Đã xong kế hoạch' : 'Tạo bộ từ đầu tiên';
  const description = plan.reviewCount
    ? 'Tự nhớ trước khi xem đáp án. Từ bạn quên sẽ xuất hiện lại cuối phiên.'
    : plan.newCount
      ? 'Làm quen từng từ qua mặt chữ, cách đọc và ví dụ. Lịch ôn sẽ tự cập nhật sau mỗi thẻ.'
      : plan.unseenCount > 0 && remaining > 0
        ? 'Đã hết lượt từ mới đề xuất hôm nay. Bạn có thể chọn bài luyện trong kho.'
      : words.length
        ? 'Bạn có thể luyện thêm hoặc quay lại khi đến lượt ôn tiếp theo.'
        : 'Thêm từ vựng vào một bộ để tạo kế hoạch học và ôn tập.';

  const metrics = [
    { icon: RotateCcw, label: 'Từ đến hạn', value: plan.dueCount, detail: plan.reviewCount ? 'Đã xếp ' + plan.reviewCount + ' thẻ' : 'Đã bắt kịp lịch', tone: 'violet' },
    { icon: BookOpen, label: 'Từ đã học', value: studied, detail: words.length + ' từ trong kho', tone: 'mint' },
    { icon: Flame, label: 'Chuỗi ngày', value: progress.streak, detail: 'Kỷ lục ' + profile.longestStreak + ' ngày', tone: 'peach' },
  ];

  return (
    <div className="overview">
      <div className="page-intro overview-intro">
        <div>
          <p className="page-kicker">
            {LANGUAGE_LABELS[profile.targetLanguage].name}{level && ' · ' + level}
          </p>
          <h1>Hôm nay học gì?</h1>
        </div>
        <time className="date-pill" dateTime={localStudyDate(now)}>
          <CalendarDays size={16} aria-hidden="true" /> {dateFormat.format(now)}
        </time>
      </div>

      <div className="overview-grid">
        <section className="learning-hero" data-language={profile.targetLanguage} aria-labelledby="daily-plan-title">
          <div className="learning-hero-content">
            <div className="hero-kicker"><ListChecks size={15} aria-hidden="true" /> Kế hoạch hôm nay</div>
            <h2 id="daily-plan-title">{headline}</h2>
            <p>{description}</p>
            <div className="hero-actions">
              <button type="button" className="hero-button" onClick={hasSession ? onStartDaily : () => onNavigate(words.length ? 'study' : 'decks')}>
                {hasSession ? 'Bắt đầu phiên học' : words.length ? 'Chọn bài luyện' : 'Mở kho từ vựng'}
                <ArrowRight size={17} aria-hidden="true" />
              </button>
              {hasSession && (
                <span className="hero-estimate"><Clock3 size={15} aria-hidden="true" /> Khoảng {Math.max(1, Math.ceil(plan.words.length / 3))} phút</span>
              )}
            </div>
            {hasSession && (
              <div className="hero-queue">
                {plan.reviewCount > 0 && <span>{plan.reviewCount} từ ôn lại</span>}
                {plan.newCount > 0 && <span>{plan.newCount} từ mới</span>}
              </div>
            )}
          </div>
        </section>

        <section className="glass-panel goal-panel" aria-labelledby="daily-goal-title">
          <div className="panel-heading">
            <h2 id="daily-goal-title">Mục tiêu chung hôm nay</h2>
            <button type="button" className="icon-button" onClick={() => onNavigate('profile')} aria-label="Điều chỉnh mục tiêu" title="Điều chỉnh mục tiêu">
              <Target size={19} aria-hidden="true" />
            </button>
          </div>
          <div className="goal-ring" style={{ '--progress': goalPercent + '%' } as CSSProperties}
            role="progressbar" aria-label="Mục tiêu học từ hôm nay" aria-valuenow={goalPercent}
            aria-valuetext={progress.studied + ' trên ' + profile.dailyGoalWords + ' từ'}>
            <div className="goal-ring-inner">
              <span className="goal-value">{progress.studied}<span>/{profile.dailyGoalWords}</span></span>
              <span className="goal-unit">từ đã học</span>
            </div>
          </div>
          <p className="goal-status">{remaining > 0 ? 'Còn ' + remaining + ' từ để đạt mục tiêu' : 'Đã hoàn thành mục tiêu hôm nay'}</p>
        </section>
      </div>

      <div className="metric-grid" aria-label="Hoạt động học tập">
        {metrics.map(({ icon: Icon, label, value, detail, tone }) => (
          <div className="glass-panel metric-card" key={label}>
            <span className="metric-icon" data-tone={tone}><Icon size={20} aria-hidden="true" /></span>
            <div>
              <p className="metric-label">{label}</p>
              <div className="metric-number">{value.toLocaleString('vi-VN')}</div>
            </div>
            <span className="metric-detail">{detail}</span>
          </div>
        ))}
      </div>

      {featured && (
        <section className="glass-panel phrase-spotlight" aria-labelledby="featured-phrase">
          <div className="metric-icon" data-tone="mint"><Layers3 size={20} aria-hidden="true" /></div>
          <div className="phrase-spotlight-copy">
            <h2 id="featured-phrase">Cụm từ dùng ngay</h2>
            <p><strong lang={featured.language}>{featured.phrase}</strong><span>{featured.meaning}</span></p>
          </div>
          <button type="button" className="icon-button" onClick={() => speakPronunciation(featured.phrase, featured.language, speechRate)} aria-label="Nghe cụm từ">
            <Volume2 size={18} aria-hidden="true" />
          </button>
          <button type="button" className="button-secondary" onClick={onOpenPhrases}>Luyện cụm từ <ArrowRight size={16} aria-hidden="true" /></button>
        </section>
      )}

      <div className="overview-grid overview-bottom">
        <section className="glass-panel forecast-panel" aria-labelledby="forecast-title">
          <div className="panel-heading">
            <div>
              <h2 id="forecast-title">Lịch ôn 7 ngày</h2>
              <p>{forecastTotal > 0 ? forecastTotal + ' thẻ đã lên lịch' : 'Lịch sẽ xuất hiện sau phiên học đầu tiên'}</p>
            </div>
            <button type="button" className="icon-button" onClick={() => onNavigate('analytics', 'retention')} aria-label="Xem chi tiết lịch ôn" title="Xem chi tiết lịch ôn">
              <ArrowDownRight size={19} aria-hidden="true" />
            </button>
          </div>
          <ul className="forecast-chart" aria-label="Số thẻ cần ôn theo ngày">
            {forecast.map(({ dayLabel, count, isToday }) => (
              <li key={dayLabel} aria-label={dayLabel + ', ' + count + ' thẻ'}>
                <div className="forecast-track" aria-hidden="true">
                  <span className="forecast-fill" data-today={isToday} data-empty={count === 0}
                    style={{ height: count ? (count / forecastMax) * 100 + '%' : '4px' }}>
                    {count > 0 && <span>{count}</span>}
                  </span>
                </div>
                <span className={isToday ? 'forecast-today' : undefined}>{dayLabel}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="glass-panel library-panel" aria-labelledby="library-title">
          <div className="panel-heading">
            <div>
              <h2 id="library-title">Kho từ vựng</h2>
              <p>{decks.length} bộ · {words.length} từ</p>
            </div>
            <button type="button" className="icon-button" onClick={() => onNavigate('decks')} aria-label="Xem tất cả bộ từ" title="Xem tất cả bộ từ">
              <ArrowRight size={19} aria-hidden="true" />
            </button>
          </div>
          {suggestedDecks.length ? (
            <ul className="library-list">
              {suggestedDecks.map((deck, index) => {
                const entries = words.filter((word) => word.deckId === deck.id);
                const covered = entries.filter((word) => word.srs.lastReviewedAt !== null).length;
                return (
                  <li key={deck.id}>
                    <span className="metric-icon" data-tone={index === 1 ? 'mint' : index === 2 ? 'peach' : 'violet'}>
                      <Layers3 size={17} aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <div className="library-deck" title={deck.name}>{deck.name}</div>
                      <p>{covered}/{entries.length} từ đã học</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : <p className="panel-empty">Chưa có từ vựng trong kho.</p>}
        </section>
      </div>
    </div>
  );
}
