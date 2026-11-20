import React from 'react';
import { BarChart3, Brain, Calendar, History } from 'lucide-react';
import type { AnalyticsSubRoute, StudySessionLog, VocabWord } from '../types/vocab';
import {
  BLOOM_META,
  calculateRetentionProbability,
  computeBloomDistribution,
  computeForecastDays,
  formatIntervalVi,
  localStudyDate,
} from '../utils/srsBloom';
import { STUDY_MODE_LABELS } from '../utils/studyPlan';

interface AnalyticsViewProps {
  subRoute: AnalyticsSubRoute;
  onChangeSubRoute: (sub: AnalyticsSubRoute) => void;
  words: VocabWord[];
  logs: StudySessionLog[];
  now: number;
}

const SUB_ROUTES: Array<{
  id: AnalyticsSubRoute;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'overview', label: 'Tổng hợp', icon: BarChart3 },
  { id: 'bloom', label: 'Mức Bloom', icon: Brain },
  { id: 'retention', label: 'Lịch ôn', icon: Calendar },
  { id: 'history', label: 'Lịch sử', icon: History },
];

const LOG_LABELS: Record<StudySessionLog['mode'], string> = {
  ...STUDY_MODE_LABELS,
  game_match: 'Ghép cặp',
  game_wordfall: 'Thợ săn từ',
  game_scramble: 'Sắp xếp chữ',
  game_audioblitz: 'Phản xạ nghe',
};

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  subRoute,
  onChangeSubRoute,
  words,
  logs,
  now,
}) => {
  const knownWords = words.filter((word) => word.srs.lastReviewedAt !== null);
  const bloomDist = computeBloomDistribution(knownWords);
  const forecast = computeForecastDays(words, 10, now);
  const maxForecast = Math.max(1, ...forecast.map((d) => d.count));

  const averageRetention = (timestamp: number) => Math.round(
    knownWords.reduce((sum, word) => sum + calculateRetentionProbability(word, timestamp), 0) * 100 / Math.max(1, knownWords.length),
  );
  const avgRetention = averageRetention(now);

  const studyLogs = logs.filter((log) => !log.mode.startsWith('game_'));
  const totalReviewed = studyLogs.reduce((acc, l) => acc + l.wordsReviewed, 0);
  const totalCorrect = studyLogs.reduce((acc, l) => acc + l.correctCount, 0);
  const overallAccuracy = totalReviewed > 0 ? Math.round((totalCorrect / totalReviewed) * 100) : null;

  // 12-week (84 days) activity heatmap
  const heatmapDays = Array.from({ length: 84 }, (_, idx) => {
    const day = new Date(now);
    day.setDate(day.getDate() + idx - 83);
    const key = localStudyDate(day.getTime());
    const count = studyLogs
      .filter((log) => localStudyDate(log.timestamp) === key)
      .reduce((acc, l) => acc + l.wordsReviewed, 0);
    return { key, count };
  });

  // Forgetting curve SVG points (t = 0 to 14 days)
  const curvePoints = Array.from({ length: 15 }, (_, day) => {
    const retention = averageRetention(now + day * 86_400_000);
    const x = 40 + (day / 14) * 520;
    const y = 180 - (retention / 100) * 145;
    return { day, retention, x, y };
  });
  const curvePath = curvePoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // Radar SVG for Bloom 6 levels
  const radarMax = Math.max(1, ...bloomDist.map((b) => b.count));
  const cx = 180;
  const cy = 155;
  const radarPoints = bloomDist.map((b, i) => {
    const angle = (-Math.PI / 2) + (i * 2 * Math.PI) / 6;
    const radius = 18 + (b.count / radarMax) * 66;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const textAnchor: 'start' | 'middle' | 'end' =
      Math.abs(cos) < 0.2 ? 'middle' : cos > 0 ? 'start' : 'end';
    return {
      x: cx + cos * radius,
      y: cy + sin * radius,
      labelX: cx + cos * 102,
      labelY: cy + sin * 102,
      textAnchor,
      label: `${b.level}. ${b.label}`,
      count: b.count,
    };
  });
  const radarPolygon = radarPoints.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className="space-y-6">
      <div className="page-intro">
        <h1>Tiến độ học tập</h1>
        <p>Theo dõi kết quả luyện tập, mức Bloom và lịch ôn sắp tới.</p>
      </div>

      {/* Sub-router Navigation Tabs */}
      <nav
        aria-label="Điều hướng biểu đồ phân tích"
        className="glass-panel flex flex-wrap items-center gap-1.5 p-1.5"
      >
        {SUB_ROUTES.map((tab) => {
          const Icon = tab.icon;
          const active = subRoute === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChangeSubRoute(tab.id)}
              aria-current={active ? 'page' : undefined}
              className="flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
              style={{
                backgroundColor: active ? 'var(--accent-soft)' : 'transparent',
                color: active ? 'var(--accent-text)' : 'var(--text-secondary)',
              }}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className="glass-panel p-4"
        >
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Độ nhớ ước tính
          </div>
          <div className="mt-1 font-display text-2xl font-bold tabular-nums">{knownWords.length ? avgRetention + '%' : '—'}</div>
        </div>
        <div
          className="glass-panel p-4"
        >
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Lượt luyện tập
          </div>
          <div className="mt-1 font-display text-2xl font-bold tabular-nums">{totalReviewed}</div>
        </div>
        <div
          className="glass-panel p-4"
        >
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Tỉ lệ chính xác
          </div>
          <div className="mt-1 font-display text-2xl font-bold tabular-nums">{overallAccuracy === null ? '—' : overallAccuracy + '%'}</div>
        </div>
        <div
          className="glass-panel p-4"
        >
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Đạt tầng Bloom 4–6
          </div>
          <div className="mt-1 font-display text-2xl font-bold tabular-nums">
            {knownWords.filter((w) => w.bloomLevel >= 4).length}
          </div>
        </div>
      </div>

      {/* SUB-ROUTE: OVERVIEW */}
      {subRoute === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div
            className="glass-panel lg:col-span-7 p-5 space-y-4"
          >
            <h2 className="font-display text-base font-semibold">Bản đồ nhiệt 12 tuần gần nhất</h2>
            <div className="grid grid-cols-12 gap-1.5">
              {heatmapDays.map((day) => {
                const opacity =
                  day.count === 0 ? 0.12 : day.count < 5 ? 0.35 : day.count < 12 ? 0.65 : 1;
                return (
                  <div
                    key={day.key}
                    title={`${day.key}: ${day.count} từ`}
                    className="aspect-square rounded-[4px]"
                    style={{
                      backgroundColor: day.count === 0 ? 'var(--bg-subtle)' : 'var(--accent-primary)',
                      opacity: day.count === 0 ? 1 : opacity,
                    }}
                  />
                );
              })}
            </div>
            <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
              <span>12 tuần trước</span>
              <span>Hôm nay</span>
            </div>
          </div>

          <div
            className="glass-panel lg:col-span-5 p-5 space-y-4"
          >
            <h2 className="font-display text-base font-semibold">Dự báo thẻ đến hạn 10 ngày</h2>
            <div className="flex items-end gap-2 h-44 pt-4">
              {forecast.map((d) => (
                <div key={d.dayLabel} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <span className="text-[11px] font-mono tabular-nums" style={{ color: 'var(--text-muted)' }}>
                    {d.count}
                  </span>
                  <div
                    className="w-full rounded-t-md transition-all"
                    style={{
                      height: (d.count === 0 ? 3 : Math.max(7, Math.round((d.count / maxForecast) * 110))) + 'px',
                      backgroundColor: d.isToday ? 'var(--accent-primary)' : 'var(--accent-soft)',
                    }}
                  />
                  <span className="text-[10px] truncate max-w-full" style={{ color: 'var(--text-muted)' }}>
                    {d.dayLabel}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-ROUTE: BLOOM TAXONOMY */}
      {subRoute === 'bloom' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div
            className="glass-panel lg:col-span-5 p-5 sm:p-6 flex flex-col justify-between items-center"
          >
            <h2 className="font-display text-base font-semibold self-start">
              Phân bố mức Bloom
            </h2>
            <svg viewBox="0 0 360 310" className="w-full max-w-[360px] my-auto">
              {[28, 56, 84].map((r) => (
                <circle
                  key={r}
                  cx="180"
                  cy="155"
                  r={r}
                  fill="none"
                  stroke="currentColor"
                  strokeOpacity="0.14"
                />
              ))}
              <polygon
                points={radarPolygon}
                fill="var(--accent-primary)"
                fillOpacity="0.22"
                stroke="var(--accent-primary)"
                strokeWidth="2"
              />
              {radarPoints.map((p, idx) => (
                <g key={idx}>
                  <circle cx={p.x} cy={p.y} r="4" fill="var(--accent-primary)" />
                  <text
                    x={p.labelX}
                    y={p.labelY}
                    textAnchor={p.textAnchor}
                    dominantBaseline="middle"
                    fontSize="11"
                    fontWeight="500"
                    fill="currentColor"
                    opacity="0.88"
                  >
                    {p.label}
                  </text>
                </g>
              ))}
            </svg>
            <p className="text-xs text-center leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Biểu đồ tính trên các từ đã học.
            </p>
          </div>

          <div
            className="glass-panel lg:col-span-7 p-5 sm:p-6 space-y-4"
          >
            <h2 className="font-display text-base font-semibold">Kỹ năng theo từng mức</h2>
            <div className="space-y-3">
              {[...bloomDist].reverse().map((item) => {
                const meta = BLOOM_META[item.level];
                return (
                  <div
                    key={item.level}
                    className="rounded-xl p-3.5 flex items-center justify-between gap-4"
                    style={{ backgroundColor: 'var(--bg-subtle)' }}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold">
                        Tầng {item.level}: {meta.nameVi} ({meta.nameEn})
                      </div>
                      <div className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>
                        {meta.focus}
                      </div>
                    </div>
                    <div className="text-right shrink-0 font-mono text-xs tabular-nums">
                      <div className="font-bold">{item.count} từ</div>
                      <div style={{ color: 'var(--text-muted)' }}>{item.percentage}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUB-ROUTE: RETENTION & FORECAST */}
      {subRoute === 'retention' && (
        <div className="space-y-6">
          <div
            className="glass-panel p-5 sm:p-6 space-y-4"
          >
            <h2 className="font-display text-base font-semibold">
              Độ nhớ ước tính trong 14 ngày
            </h2>
            {knownWords.length === 0 ? <p className="panel-empty">Học vài từ để xem ước tính ghi nhớ.</p> : (
            <svg viewBox="0 0 600 210" className="w-full h-52" role="img" aria-label="Dự báo độ nhớ nếu không ôn thêm">
              <line x1="40" y1="35" x2="40" y2="180" stroke="currentColor" strokeOpacity="0.2" />
              <line x1="40" y1="180" x2="570" y2="180" stroke="currentColor" strokeOpacity="0.2" />
              <path d={curvePath} fill="none" stroke="var(--accent-primary)" strokeWidth="3" />
              {curvePoints
                .filter((_, idx) => idx % 2 === 0)
                .map((p) => (
                  <g key={p.day}>
                    <circle cx={p.x} cy={p.y} r="4" fill="var(--accent-primary)" />
                    <text x={p.x} y="198" textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.65">
                      N{p.day}
                    </text>
                  </g>
                ))}
              <text x="14" y="42" fontSize="10" fill="currentColor" opacity="0.65">
                100%
              </text>
              <text x="14" y="180" fontSize="10" fill="currentColor" opacity="0.65">
                0%
              </text>
            </svg>
            )}
          </div>

          <div
            className="glass-panel p-5 sm:p-6 space-y-3"
          >
            <h2 className="font-display text-base font-semibold">Lượt ôn sắp tới</h2>
            {knownWords.length === 0 ? <p className="panel-empty">Chưa có từ nào được lên lịch.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--border-hairline)', color: 'var(--text-muted)' }}>
                    <th className="py-2 pr-4 font-medium">Từ vựng</th>
                    <th className="py-2 pr-4 font-medium">Bloom</th>
                    <th className="py-2 pr-4 font-medium text-right">Lần ôn tiếp theo</th>
                    <th className="py-2 font-medium text-right">Độ nhớ ước tính</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border-hairline)' }}>
                  {[...knownWords].sort((a, b) => a.srs.nextReviewAt - b.srs.nextReviewAt).slice(0, 12).map((w) => {
                    const ret = Math.round(calculateRetentionProbability(w, now) * 100);
                    return (
                      <tr key={w.id} style={{ borderColor: 'var(--border-hairline)' }}>
                        <td className="py-2.5 pr-4 font-semibold">{w.term}</td>
                        <td className="py-2.5 pr-4" style={{ color: 'var(--text-secondary)' }}>
                          {w.bloomLevel}. {BLOOM_META[w.bloomLevel].nameVi}
                        </td>
                        <td className="py-2.5 pr-4 text-right font-mono tabular-nums">
                          {w.srs.nextReviewAt <= now ? 'Đến hạn' : 'Sau ' + formatIntervalVi((w.srs.nextReviewAt - now) / 86_400_000)}
                        </td>
                        <td className="py-2.5 text-right font-mono tabular-nums font-semibold">
                          {ret}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-ROUTE: HISTORY */}
      {subRoute === 'history' && (
        <div
          className="glass-panel p-5 sm:p-6 space-y-4"
        >
          <h2 className="font-display text-base font-semibold">Lịch sử các phiên luyện tập gần đây</h2>
          {logs.length === 0 ? (
            <p className="py-6 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
              Chưa có phiên luyện tập nào được ghi nhận.
            </p>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--border-hairline)' }}>
              {[...logs]
                .sort((a, b) => b.timestamp - a.timestamp)
                .map((log) => (
                  <div
                    key={log.id}
                    className="py-3 flex items-center justify-between gap-4 text-xs"
                    style={{ borderColor: 'var(--border-hairline)' }}
                  >
                    <div>
                      <div className="font-semibold">{LOG_LABELS[log.mode] ?? log.mode}</div>
                      <div style={{ color: 'var(--text-muted)' }}>
                        {new Date(log.timestamp).toLocaleString('vi-VN')}
                      </div>
                    </div>
                    <div className="text-right font-mono tabular-nums">
                      {!log.mode.startsWith('game_') && <div>
                        {log.correctCount}/{log.wordsReviewed} đúng
                      </div>}
                      <div style={{ color: 'var(--accent-text)' }}>+{log.xpEarned} XP</div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
