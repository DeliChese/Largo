import React, { useState } from 'react';
import { Bell, Check, Download, Moon, RotateCcw, Sun, Volume2, Wifi } from 'lucide-react';
import type {
  AppSettings,
  ColorSchemeMode,
  SRSMode,
  ThemeId,
  UIDensity,
} from '../types/vocab';
import { SRS_MODE_META } from '../utils/srsBloom';
import { soundEngine, speakPronunciation } from '../utils/soundEngine';
import { PWAInstallButton } from './PWAInstallButton';

interface SettingsViewProps {
  settings: AppSettings;
  isOnline: boolean;
  onUpdateSettings: (patch: Partial<AppSettings>) => void;
  onExportFullBackup: () => void;
  onResetAllData: () => void;
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
    name: 'Tri thức Cổ điển',
    desc: 'Giấy sáng thanh lịch & Xanh Indigo',
    lightSwatch: '#f8fafc',
    darkSwatch: '#0b1120',
    accentSwatch: '#4338ca',
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
  onUpdateSettings,
  onExportFullBackup,
  onResetAllData,
}) => {
  const [notifStatus, setNotifStatus] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const requestNotificationPermission = async () => {
    if (typeof Notification === 'undefined') {
      setNotifStatus('Trình duyệt này không hỗ trợ Web Notification API.');
      return;
    }
    const res = await Notification.requestPermission();
    if (res === 'granted') {
      onUpdateSettings({ reminderEnabled: true });
      setNotifStatus('Đã cấp quyền thông báo nhắc nhở học tập!');
      new Notification('LexisBloom', {
        body: 'Nhắc nhở thông minh SRS & Bloom đã sẵn sàng hoạt động.',
      });
    } else {
      setNotifStatus('Quyền thông báo chưa được cấp. Nhắc nhở vẫn hiển thị trực tiếp trong bảng điều khiển.');
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Cài đặt &amp; Giao diện</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Tùy biến hệ thống theme, chế độ tối chuyên dụng, thuật toán SRS, phát âm và bộ nhớ ngoại tuyến.
        </p>
      </div>

      {/* 1. Theme & Dedicated Dark Mode */}
      <section
        className="rounded-2xl border p-6 space-y-5"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-hairline)' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-semibold">Hệ thống Theme &amp; Chế độ Tối chuyên dụng</h2>
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
        className="rounded-2xl border p-6 space-y-5"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-hairline)' }}
      >
        <div>
          <h2 className="font-display text-base font-semibold">Chế độ SRS &amp; Nhắc nhở thông minh</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Chọn thuật toán giãn cách ôn tập và ngưỡng cảnh báo đường cong quên Ebbinghaus.
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4" style={{ borderColor: 'var(--border-hairline)' }}>
          <div>
            <label htmlFor="reminder-hour" className="block text-xs font-medium mb-1">
              Giờ nhắc nhở học tập hằng ngày
            </label>
            <div className="flex items-center gap-2">
              <input
                id="reminder-hour"
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
                <span>Bật thông báo trình duyệt</span>
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
        className="rounded-2xl border p-6 space-y-4"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-hairline)' }}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold">Âm thanh &amp; Phát âm chuẩn</h2>
          <button
            type="button"
            onClick={() => speakPronunciation('Resilient vocabulary learning', 'en', settings.speechRate)}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium cursor-pointer"
            style={{ borderColor: 'var(--border-hairline)' }}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Nghe thử giọng đọc</span>
          </button>
        </div>

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
      </section>

      {/* 4. Offline & Data Backup */}
      <section
        className="rounded-2xl border p-6 space-y-4"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-hairline)' }}
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
            onClick={onExportFullBackup}
            className="flex items-center gap-1.5 rounded-lg border px-4 py-2 text-xs font-semibold cursor-pointer"
            style={{ borderColor: 'var(--border-hairline)' }}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Sao lưu toàn bộ dữ liệu (JSON)</span>
          </button>

          {!confirmReset ? (
            <button
              type="button"
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
                onClick={() => {
                  onResetAllData();
                  setConfirmReset(false);
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
      </section>
    </div>
  );
};
