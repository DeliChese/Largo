import React, { useEffect, useMemo, useState } from 'react';
import { Bell, Check, Download, Moon, RotateCcw, Sun, Upload, Volume2, Wifi } from 'lucide-react';
import type {
  AppSettings,
  ColorSchemeMode,
  EnglishLocale,
  LanguageCode,
  SRSMode,
  ThemeId,
  UIDensity,
} from '../types/vocab';
import { SRS_MODE_META } from '../utils/srsBloom';
import { soundEngine, speakPronunciation, stopPronunciation } from '../utils/soundEngine';
import { ENGLISH_LOCALES, ENGLISH_LOCALE_LABEL, getEnglishLocale, getSpeechVoice } from '../utils/englishStudy';
import { PWAInstallButton } from './PWAInstallButton';
import { LANGUAGE_LABELS } from '../data/seedVocab';
import { previewBackup, type BackupPreview } from '../utils/backup';
import type { LearningAttemptEvent } from '../utils/learningAttempt';
import type { AdaptiveStudyPlan } from '../utils/adaptivePlanner';
import { summarizeAdaptiveStudy, type compareAdaptivePlans } from '../utils/plannerMetrics';

interface SettingsViewProps {
  settings: AppSettings;
  isOnline: boolean;
  activeLanguage: LanguageCode;
  attempts: readonly LearningAttemptEvent[];
  plannerPreview?: {
    comparison: ReturnType<typeof compareAdaptivePlans>;
    strategy: AdaptiveStudyPlan['strategy'];
    durationMs: number;
  };
  onUpdateSettings: (patch: Partial<AppSettings>) => void;
  onExportFullBackup: () => Promise<void>;
  onRestoreFullBackup: (backup: BackupPreview) => Promise<void>;
  backupReady: boolean;
  onResetAllData: () => Promise<void>;
}

interface AzureVoice {
  id: string;
  locale: string;
  name: string;
}

const VOICE_SAMPLES: Record<LanguageCode, string> = {
  en: 'Could you say that again, please?',
  zh: '不好意思，请再说一遍。',
  ja: 'すみません、もう一度お願いします。',
  fr: 'Pourriez-vous répéter, s’il vous plaît ?',
  ko: '한 번 더 말씀해 주시겠어요?',
  es: '¿Podrías repetirlo, por favor?',
};

function PronunciationSettings({ settings, isOnline, activeLanguage, onUpdateSettings }: Pick<
  SettingsViewProps, 'settings' | 'isOnline' | 'activeLanguage' | 'onUpdateSettings'
>) {
  const [voiceLanguage, setVoiceLanguage] = useState<LanguageCode | EnglishLocale>(() =>
    activeLanguage === 'en' ? getEnglishLocale(settings) : activeLanguage,
  );
  const [voices, setVoices] = useState<AzureVoice[]>([]);
  const [catalogStatus, setCatalogStatus] = useState('loading');
  const [attempt, setAttempt] = useState(0);
  const [previewMessage, setPreviewMessage] = useState('');
  const englishLocale = voiceLanguage === 'en-GB' || voiceLanguage === 'en-US' ? voiceLanguage : undefined;
  const language = voiceLanguage === 'en-GB' || voiceLanguage === 'en-US' ? 'en' : voiceLanguage;
  const voiceId = getSpeechVoice(settings.speechVoices, language, englishLocale) ?? '';
  const options = voices.filter(({ locale }) => englishLocale
    ? locale.toLowerCase() === englishLocale.toLowerCase()
    : locale.toLowerCase().startsWith(language + '-'),
  );

  useEffect(() => {
    if (!isOnline) return;
    const controller = new AbortController();
    setCatalogStatus('loading');
    void (async () => {
      try {
        const response = await fetch('/api/speech/voices', { signal: controller.signal, cache: 'no-store' });
        const data = await response.json();
        if (controller.signal.aborted) return;
        if (!response.ok || !Array.isArray(data.voices)) {
          setVoices([]);
          setCatalogStatus(data.error === 'not_configured' ? 'not_configured' : 'error');
          return;
        }
        const availableVoices: AzureVoice[] = data.voices;
        setVoices(availableVoices.sort((a, b) => a.locale.localeCompare(b.locale) || a.name.localeCompare(b.name)));
        setCatalogStatus('ready');
      } catch {
        if (!controller.signal.aborted) {
          setVoices([]);
          setCatalogStatus('error');
        }
      }
    })();
    return () => controller.abort();
  }, [isOnline, attempt]);

  const status = !isOnline ? 'Đang ngoại tuyến. Bạn có thể nghe lại các bản ghi Azure đã lưu.'
    : catalogStatus === 'not_configured' ? 'Thiết lập khóa và vùng Azure Speech trên máy chủ để tải danh sách giọng.'
    : catalogStatus === 'error' ? 'Chưa tải được danh sách giọng Azure.'
    : catalogStatus === 'loading' ? 'Đang tải giọng Azure…'
    : options.length === 0 ? 'Azure chưa trả về giọng cho ngôn ngữ này.' : '';

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Giọng đọc theo ngôn ngữ</h3>
      <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto] gap-3 items-end">
        <div className="control-field">
          <label htmlFor="voice-language">Ngôn ngữ</label>
          <select id="voice-language" value={voiceLanguage} onChange={(event) => {
            stopPronunciation();
            setVoiceLanguage(event.target.value as LanguageCode | EnglishLocale);
            setPreviewMessage('');
          }}>
            {Object.entries(LANGUAGE_LABELS).flatMap(([code, label]) => code === 'en'
              ? ENGLISH_LOCALES.map((locale) => <option key={locale} value={locale}>{ENGLISH_LOCALE_LABEL[locale]}</option>)
              : <option key={code} value={code}>{label.name}</option>)}
          </select>
        </div>
        <div className="control-field">
          <label htmlFor="pronunciation-voice">Giọng đọc</label>
          <select id="pronunciation-voice" value={voiceId} onChange={(event) => {
            stopPronunciation();
            setPreviewMessage('');
            const next = { ...settings.speechVoices };
            if (event.target.value) next[voiceLanguage] = event.target.value;
            else {
              delete next[voiceLanguage];
              if (englishLocale && next.en?.startsWith(englishLocale + '-')) delete next.en;
            }
            onUpdateSettings({ speechVoices: next });
          }}>
            <option value="">Mặc định của thiết bị</option>
            {voiceId && !options.some((voice) => voice.id === voiceId) && <option value={voiceId}>{voiceId}</option>}
            {options.map((voice) => <option key={voice.id} value={voice.id}>{voice.name} · {voice.locale}</option>)}
          </select>
        </div>
        <button type="button" className="button-secondary" onClick={() => {
          setPreviewMessage('');
          speakPronunciation(VOICE_SAMPLES[language], voiceLanguage, settings.speechRate, undefined, undefined, () => {
            setPreviewMessage('Giọng Azure chưa phát được. Largo đang thử giọng của thiết bị.');
          });
        }}>
          <Volume2 size={16} aria-hidden="true" /> Nghe thử
        </button>
      </div>
      <p className="text-xs text-[var(--text-secondary)]">Largo dùng lại bản ghi khi văn bản, giọng và tốc độ giống nhau.</p>
      {(status || previewMessage) && <p role="status" className="text-xs text-[var(--text-secondary)]">{previewMessage || status}</p>}
      {isOnline && catalogStatus === 'error' && (
        <button type="button" className="text-button" onClick={() => setAttempt((value) => value + 1)}>Tải lại danh sách giọng</button>
      )}
    </div>
  );
}

const THEME_CARDS: Array<{
  id: ThemeId;
  name: string;
  desc: string;
  lightSwatch: string;
  darkSwatch: string;
  accentSwatch: string;
}> = [
  {
    id: 'indigo',
    name: 'Tím chàm',
    desc: 'Tím nhạt và kính mờ',
    lightSwatch: '#f1eff9',
    darkSwatch: '#151122',
    accentSwatch: '#6347bd',
  },
  {
    id: 'botanical',
    name: 'Rừng Trầm Tĩnh',
    desc: 'Xanh ngọc dịu mắt giúp tập trung lâu',
    lightSwatch: '#f6f8f7',
    darkSwatch: '#091310',
    accentSwatch: '#0f766e',
  },
  {
    id: 'amber',
    name: 'Hổ Phách Ấm Áp',
    desc: 'Tông giấy ấm áp kết hợp vàng hổ phách',
    lightSwatch: '#faf9f6',
    darkSwatch: '#120e0a',
    accentSwatch: '#b45309',
  },
  {
    id: 'midnight',
    name: 'Đêm Chuyên Sâu',
    desc: 'Độ tương phản sắc nét với xanh trời',
    lightSwatch: '#f9fafb',
    darkSwatch: '#09090b',
    accentSwatch: '#0284c7',
  },
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  isOnline,
  activeLanguage,
  attempts,
  plannerPreview,
  onUpdateSettings,
  onExportFullBackup,
  onRestoreFullBackup,
  backupReady,
  onResetAllData,
}) => {
  const [notifStatus, setNotifStatus] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [backupError, setBackupError] = useState(false);
  const [preview, setPreview] = useState<BackupPreview>();
  const [importStatus, setImportStatus] = useState<'reading' | 'restoring' | 'done'>();
  const [importError, setImportError] = useState('');
  const backupBusy = exporting || importStatus === 'reading' || importStatus === 'restoring';
  const plannerMetrics = useMemo(() => summarizeAdaptiveStudy(attempts), [attempts]);

  async function inspectBackup(file: File) {
    setConfirmReset(false);
    setPreview(undefined);
    setImportError('');
    setImportStatus('reading');
    try {
      setPreview(await previewBackup(file));
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Largo chưa đọc được tệp sao lưu.');
    } finally {
      setImportStatus(undefined);
    }
  }

  async function restoreBackup() {
    if (!preview) return;
    setImportError('');
    setImportStatus('restoring');
    try {
      await onRestoreFullBackup(preview);
      setPreview(undefined);
      setImportStatus('done');
    } catch {
      setImportError('Largo chưa lưu được bản sao lưu. Dữ liệu hiện tại vẫn được giữ.');
      setImportStatus(undefined);
    }
  }

  const requestNotificationPermission = async () => {
    if (typeof Notification === 'undefined') {
      setNotifStatus('Trình duyệt này không hỗ trợ Web Notification API.');
      return;
    }
    try {
      const res = await Notification.requestPermission();
      if (res === 'granted') {
        onUpdateSettings({ reminderEnabled: true });
        setNotifStatus('Đã bật. Thông báo sẽ đến vào giờ đã chọn khi ứng dụng đang mở.');
      } else {
        setNotifStatus('Bạn có thể xem nhắc nhở ngay trong ứng dụng hoặc cấp quyền trong trình duyệt.');
      }
    } catch {
      setNotifStatus('Bạn có thể xem nhắc nhở qua chuông trên thanh công cụ.');
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="page-intro">
        <h1>Cài đặt</h1>
        <p>Điều chỉnh giao diện, nhịp ôn tập và âm thanh.</p>
      </div>

      {/* 1. Theme & Dedicated Dark Mode */}
      <section
        className="glass-panel p-5 sm:p-6 space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-semibold">Giao diện</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Mỗi bảng màu đều được tối ưu tương phản cho cả nền sáng và nền tối ban đêm.
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 rounded-lg self-start" style={{ backgroundColor: 'var(--bg-subtle)' }}>
            {([
              { id: 'light' as ColorSchemeMode, label: 'Sáng', icon: Sun },
              { id: 'dark' as ColorSchemeMode, label: 'Tối chuyên sâu', icon: Moon },
              { id: 'system' as ColorSchemeMode, label: 'Hệ thống', icon: null },
            ]).map((item) => {
              const Icon = item.icon;
              const active = settings.colorScheme === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onUpdateSettings({ colorScheme: item.id })}
                  className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium cursor-pointer whitespace-nowrap"
                  style={{
                    backgroundColor: active ? 'var(--bg-surface)' : 'transparent',
                    color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                  }}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {THEME_CARDS.map((t) => {
            const active = settings.theme === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onUpdateSettings({ theme: t.id })}
                className="text-left rounded-xl border p-3.5 transition-all cursor-pointer space-y-2.5"
                style={{
                  backgroundColor: active ? 'var(--accent-soft)' : 'var(--bg-canvas)',
                  borderColor: active ? 'var(--accent-primary)' : 'var(--border-hairline)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="h-4 w-4 rounded-full border border-black/10" style={{ backgroundColor: t.lightSwatch }} />
                    <span className="h-4 w-4 rounded-full border border-white/15" style={{ backgroundColor: t.darkSwatch }} />
                    <span className="h-4 w-4 rounded-full" style={{ backgroundColor: t.accentSwatch }} />
                  </div>
                  {active && <Check className="w-4 h-4" style={{ color: 'var(--accent-text)' }} />}
                </div>
                <div>
                  <div className="text-xs font-semibold">{t.name}</div>
                  <div className="text-[11px] mt-0.5 leading-snug" style={{ color: 'var(--text-secondary)' }}>
                    {t.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="border-t pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ borderColor: 'var(--border-hairline)' }}>
          <div>
            <div className="text-xs font-semibold">Mật độ bố cục giao diện (UI Style)</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Tùy chỉnh khoảng trắng và độ gọn của thẻ học
            </div>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-lg self-start" style={{ backgroundColor: 'var(--bg-subtle)' }}>
            {([
              { id: 'airy' as UIDensity, label: 'Thoáng đãng' },
              { id: 'compact' as UIDensity, label: 'Gọn gàng' },
              { id: 'zen' as UIDensity, label: 'Tập trung Zen' },
            ]).map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => onUpdateSettings({ uiDensity: d.id })}
                className="rounded-md px-3 py-1.5 text-xs font-medium cursor-pointer whitespace-nowrap"
                style={{
                  backgroundColor: settings.uiDensity === d.id ? 'var(--bg-surface)' : 'transparent',
                  color: settings.uiDensity === d.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                }}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 2. SRS Mode & Smart Reminders */}
      <section
        className="glass-panel p-5 sm:p-6 space-y-5"
      >
        <div>
          <h2 className="font-display text-base font-semibold">Nhịp học và nhắc nhở</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Chọn khoảng cách giữa các lần ôn và giới hạn từ mới trong kế hoạch.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(Object.keys(SRS_MODE_META) as SRSMode[]).map((modeKey) => {
            const meta = SRS_MODE_META[modeKey];
            const active = settings.srsMode === modeKey;
            return (
              <button
                key={modeKey}
                type="button"
                onClick={() => onUpdateSettings({ srsMode: modeKey })}
                className="text-left rounded-xl border p-4 cursor-pointer space-y-1"
                style={{
                  backgroundColor: active ? 'var(--accent-soft)' : 'var(--bg-canvas)',
                  borderColor: active ? 'var(--accent-primary)' : 'var(--border-hairline)',
                }}
              >
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span>{meta.label}</span>
                  <span className="font-mono" style={{ color: 'var(--text-muted)' }}>
                    {meta.intervalMultiplier}x
                  </span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {meta.description}
                </p>
              </button>
            );
          })}
        </div>

        <div className="control-field">
          <label htmlFor="new-word-limit">Từ mới tối đa mỗi ngày</label>
          <select className="max-w-48" id="new-word-limit" value={settings.dailyNewWordLimit}
            onChange={(event) => onUpdateSettings({ dailyNewWordLimit: Number(event.target.value) })}>
            {[0, 3, 5, 8, 10, 12, 15, 20].map((limit) => (
              <option key={limit} value={limit}>{limit === 0 ? 'Chỉ ôn từ cũ' : limit + ' từ'}</option>
            ))}
          </select>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Áp dụng cho kế hoạch hôm nay. Các từ đến hạn được xếp trước.</p>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input id="adaptive-planner" type="checkbox" checked={settings.adaptivePlanner ?? false} disabled={!backupReady}
              onChange={(event) => onUpdateSettings({ adaptivePlanner: event.target.checked })} />
            Dùng thử kế hoạch cá nhân hóa
          </label>
          <p className="text-xs">Largo chọn dạng bài theo kết quả học đã lưu trên thiết bị. Thay đổi áp dụng từ phiên kế tiếp.</p>
          {plannerPreview && (
            <details className="rounded-lg border p-3 text-xs" style={{ borderColor: 'var(--border-hairline)' }}>
              <summary className="cursor-pointer font-semibold">So sánh và theo dõi kế hoạch</summary>
              <div className="mt-2 space-y-2" data-planner-preview={plannerPreview.strategy}>
                {plannerPreview.strategy === 'legacy' ? <p>Phạm vi hiện tại dùng thứ tự quen thuộc trong khi chờ thêm kết quả chấm độc lập.</p> : (
                  <>
                    <p>Hai kế hoạch chọn chung {plannerPreview.comparison.commonReviews} thẻ ôn. Kế hoạch cá nhân hóa chọn {plannerPreview.comparison.weakSkillExercises} bài theo kỹ năng cần luyện.</p>
                    <p>Thẻ đến hạn lâu nhất {plannerPreview.comparison.includesOldest ? 'có trong kế hoạch' : 'chưa được xếp trong phiên này'}.</p>
                  </>
                )}
                <p>Lập kế hoạch trên máy này trong {plannerPreview.durationMs.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} ms.</p>
                {plannerMetrics.sessionsWithAnswers > 0 ? (
                  <div className="space-y-1">
                    <p>Đã hoàn thành {plannerMetrics.sessionsCompleted}/{plannerMetrics.sessionsWithAnswers} phiên cá nhân hóa có câu trả lời.</p>
                    <p>{plannerMetrics.weakSkillAnswers}/{plannerMetrics.answers} lượt đầu luyện kỹ năng cần củng cố. {plannerMetrics.incorrectAnswers} lượt sai, {plannerMetrics.hintedAnswers} lượt có gợi ý và {plannerMetrics.retryAnswers} lượt làm lại.</p>
                    <p>{plannerMetrics.followUpObserved
                      ? `Ôn đến hạn lần sau có chấm độc lập · ${plannerMetrics.followUpCorrect}/${plannerMetrics.followUpObserved} lượt đúng.`
                      : 'Chưa có lượt ôn đến hạn lần sau được chấm độc lập.'}</p>
                  </div>
                ) : <p>Chưa có phiên cá nhân hóa đã trả lời trên thiết bị này.</p>}
              </div>
            </details>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4" style={{ borderColor: 'var(--border-hairline)' }}>
          <div>
            <label className="flex items-center gap-2 text-xs font-semibold mb-2">
              <input type="checkbox" checked={settings.reminderEnabled}
                onChange={(event) => onUpdateSettings({ reminderEnabled: event.target.checked })} />
              Nhắc học khi ứng dụng đang mở
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <input
                id="reminder-hour"
                aria-label="Giờ nhắc học"
                type="time"
                value={settings.reminderHour}
                onChange={(e) => onUpdateSettings({ reminderHour: e.target.value })}
                className="rounded-lg border px-3 py-1.5 text-sm font-mono"
                style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-hairline)' }}
              />
              <button
                type="button"
                onClick={requestNotificationPermission}
                className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium cursor-pointer"
                style={{ borderColor: 'var(--border-hairline)' }}
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Cấp quyền thông báo</span>
              </button>
            </div>
            {notifStatus && (
              <p className="mt-1.5 text-xs" style={{ color: 'var(--accent-text)' }}>
                {notifStatus}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="retention-slider" className="block text-xs font-medium mb-1">
              Ngưỡng cảnh báo sắp quên: <strong className="font-mono">{Math.round(settings.retentionThreshold * 100)}%</strong>
            </label>
            <input
              id="retention-slider"
              type="range"
              min={60}
              max={90}
              step={5}
              value={Math.round(settings.retentionThreshold * 100)}
              onChange={(e) => onUpdateSettings({ retentionThreshold: Number(e.target.value) / 100 })}
              className="w-full"
            />
          </div>
        </div>
      </section>

      {/* 3. Audio & Pronunciation */}
      <section
        className="glass-panel p-5 sm:p-6 space-y-4"
      >
        <h2 className="font-display text-base font-semibold">Âm thanh và phát âm</h2>
        <PronunciationSettings key={activeLanguage} settings={settings} isOnline={isOnline}
          activeLanguage={activeLanguage} onUpdateSettings={onUpdateSettings} />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="speech-rate" className="block text-xs font-medium mb-1">
              Tốc độ phát âm: <span className="font-mono">{settings.speechRate}x</span>
            </label>
            <select
              id="speech-rate"
              value={settings.speechRate}
              onChange={(e) => onUpdateSettings({ speechRate: Number(e.target.value) })}
              className="w-full rounded-lg border px-3 py-2 text-xs"
              style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-hairline)' }}
            >
              <option value={0.7}>0.7x (Chậm rõ)</option>
              <option value={0.85}>0.85x (Vừa phải)</option>
              <option value={1.0}>1.0x (Chuẩn bản xứ)</option>
              <option value={1.15}>1.15x (Nhanh tự nhiên)</option>
            </select>
          </div>

          <label className="flex items-center gap-2.5 text-xs font-medium cursor-pointer pt-4">
            <input
              type="checkbox"
              checked={settings.autoPlayAudio}
              onChange={(e) => onUpdateSettings({ autoPlayAudio: e.target.checked })}
            />
            <span>Tự động phát âm khi mở thẻ mới</span>
          </label>

          <label className="flex items-center gap-2.5 text-xs font-medium cursor-pointer pt-4">
            <input
              type="checkbox"
              checked={settings.soundEnabled}
              onChange={(e) => {
                soundEngine.enabled = e.target.checked;
                onUpdateSettings({ soundEnabled: e.target.checked });
              }}
            />
            <span>Bật hiệu ứng âm thanh tương tác</span>
          </label>
        </div>

        <label className="flex items-center gap-2.5 text-xs font-medium cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={settings.showExamplePhonetic ?? true}
            onChange={(e) => onUpdateSettings({ showExamplePhonetic: e.target.checked })}
          />
          <span>Hiển thị pinyin ở câu ví dụ (tiếng Trung)</span>
        </label>
      </section>

      {/* 4. Offline & Data Backup */}
      <section
        className="glass-panel p-5 sm:p-6 space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-semibold">Hỗ trợ Học Offline &amp; Dữ liệu</h2>
            <p className="text-xs mt-0.5 flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
              <Wifi className="w-3.5 h-3.5" />
              <span>
                Trạng thái mạng: {isOnline ? 'Đang kết nối (Service Worker & IndexedDB đã đồng bộ)' : 'Đang ngoại tuyến — toàn bộ dữ liệu vẫn hoạt động bình thường'}
              </span>
            </p>
          </div>
          <div className="w-full sm:w-auto">
            <PWAInstallButton />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            disabled={!backupReady || backupBusy}
            onClick={async () => {
              setBackupError(false);
              setExporting(true);
              try {
                await onExportFullBackup();
              } catch {
                setBackupError(true);
              } finally {
                setExporting(false);
              }
            }}
            className="flex items-center gap-1.5 rounded-lg border px-4 py-2 text-xs font-semibold cursor-pointer"
            style={{ borderColor: 'var(--border-hairline)' }}
          >
            <Download className="w-3.5 h-3.5" />
            <span>{exporting ? 'Đang tạo bản sao lưu…' : 'Sao lưu toàn bộ dữ liệu (JSON)'}</span>
          </button>

          <label className="flex items-center gap-2 text-xs font-semibold">
            <Upload className="w-3.5 h-3.5" aria-hidden="true" />
            Khôi phục từ bản sao lưu JSON
            <input type="file" accept=".json,application/json" disabled={!backupReady || backupBusy}
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                event.currentTarget.value = '';
                if (file) void inspectBackup(file);
              }} />
          </label>

          {!confirmReset ? (
            <button
              type="button"
              disabled={!backupReady || backupBusy || !!preview}
              onClick={() => setConfirmReset(true)}
              className="flex items-center gap-1.5 rounded-lg border px-4 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 cursor-pointer"
              style={{ borderColor: 'var(--border-hairline)' }}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Khôi phục dữ liệu mẫu mặc định</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  setConfirmReset(false);
                  setImportError('');
                  setImportStatus('restoring');
                  try {
                    await onResetAllData();
                  } catch {
                    setImportError('Largo chưa đặt lại được dữ liệu.');
                  } finally {
                    setImportStatus(undefined);
                  }
                }}
                className="rounded-lg bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white cursor-pointer"
              >
                Xác nhận khôi phục
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="rounded-lg border px-3 py-2 text-xs cursor-pointer"
                style={{ borderColor: 'var(--border-hairline)' }}
              >
                Hủy
              </button>
            </div>
          )}
        </div>
        {preview && (
          <div className="space-y-2 rounded-lg border p-3 text-sm" style={{ borderColor: 'var(--border-hairline)' }}>
            <h3 className="font-semibold">Xem trước bản sao lưu</h3>
            <p>{preview.summary.decks} bộ · {preview.summary.words} thẻ · {preview.summary.logs} phiên · {preview.summary.attempts} lượt trả lời · {preview.summary.images} ảnh</p>
            <p>Khôi phục sẽ thay thế dữ liệu học và ảnh hồ sơ trên trình duyệt này bằng dữ liệu trong tệp.</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="button-primary" disabled={backupBusy} onClick={() => void restoreBackup()}>
                Thay thế bằng bản sao lưu
              </button>
              <button type="button" className="button-secondary" disabled={backupBusy}
                onClick={() => { setPreview(undefined); setImportError(''); }}>Hủy</button>
            </div>
          </div>
        )}
        {importStatus === 'reading' && <p role="status">Đang kiểm tra tệp…</p>}
        {importStatus === 'restoring' && <p role="status">Đang khôi phục dữ liệu…</p>}
        {importStatus === 'done' && <p role="status">Đã khôi phục dữ liệu từ bản sao lưu.</p>}
        {importError && <p className="form-error" role="alert">{importError}</p>}
        {backupError && <p className="form-error" role="alert">Largo chưa tạo được bản sao lưu. Hãy thử lại.</p>}
      </section>
    </div>
  );
};
