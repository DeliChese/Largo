import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  BookOpen, ChartNoAxesColumnIncreasing, Gamepad2, Layers3, LayoutGrid,
  Settings2, Trophy, UserRound, WifiOff, X,
} from 'lucide-react';
import type { AppRoute, UserProfile } from '../types/vocab';
import { PWAInstallButton } from './PWAInstallButton';

interface SidebarProps {
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  dueCount: number;
  profile: UserProfile;
  avatarUrl?: string;
  isOnline: boolean;
}

export const NAV_LABELS: Record<AppRoute, string> = {
  dashboard: 'Tổng quan',
  study: 'Luyện tập',
  decks: 'Bộ từ vựng',
  games: 'Trò chơi',
  analytics: 'Tiến độ',
  profile: 'Hồ sơ',
  achievements: 'Thành tích',
  settings: 'Cài đặt',
};

const NAV_GROUPS = [
  { label: 'Học tập', links: [
    { route: 'dashboard', icon: LayoutGrid },
    { route: 'study', icon: BookOpen },
    { route: 'decks', icon: Layers3 },
    { route: 'games', icon: Gamepad2 },
    { route: 'analytics', icon: ChartNoAxesColumnIncreasing },
  ] },
  { label: 'Cá nhân', links: [
    { route: 'profile', icon: UserRound },
    { route: 'achievements', icon: Trophy },
    { route: 'settings', icon: Settings2 },
  ] },
] as const;

export function Sidebar({ activeRoute, onNavigate, mobileOpen, onCloseMobile, dueCount, profile, avatarUrl, isOnline }: SidebarProps) {
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!mobileOpen) return;
    const trigger = document.activeElement as HTMLElement | null;
    closeButton.current?.focus();
    return () => trigger?.focus();
  }, [mobileOpen]);

  const selectRoute = (route: AppRoute) => {
    onNavigate(route);
    if (mobileOpen) onCloseMobile();
  };

  function renderNavigation(isMobile: boolean) {
    return (
      <>
        <div className="sidebar-brand">
          <button type="button" className="brand-link" onClick={() => selectRoute('dashboard')} aria-label="Largo, trang tổng quan">
            <img src="/icon.svg" className="brand-mark" width="39" height="39" alt="" />
            <span className="brand-title rail-label">Largo</span>
          </button>
          {isMobile && (
            <button type="button" ref={closeButton} className="icon-button" onClick={onCloseMobile} aria-label="Đóng menu">
              <X size={18} aria-hidden="true" />
            </button>
          )}
        </div>
        <nav className="sidebar-nav" aria-label="Điều hướng chính">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="nav-group">
              <p className="rail-label">{group.label}</p>
              {group.links.map(({ route, icon: Icon }) => (
                <a key={route} href={'#/' + route}
                  className="nav-link" aria-current={activeRoute === route ? 'page' : undefined}
                  aria-label={NAV_LABELS[route]}
                  onClick={(event) => { event.preventDefault(); selectRoute(route); }}>
                  <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
                  <span className="rail-label">{NAV_LABELS[route]}</span>
                  {route === 'study' && dueCount > 0 && <small className="rail-label" aria-hidden="true">{dueCount}</small>}
                </a>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          {!isOnline && <p className="offline-note"><WifiOff size={15} aria-hidden="true" /><span className="rail-label">Đang học ngoại tuyến</span></p>}
          <PWAInstallButton compact={!isMobile} />
          <button type="button" className="sidebar-profile" onClick={() => selectRoute('profile')} aria-label="Mở hồ sơ học tập">
            <span className="profile-initial" aria-hidden="true">
              {avatarUrl ? <img src={avatarUrl} alt="" /> : Array.from(profile.name.trim())[0]?.toUpperCase() || 'L'}
            </span>
              <span className="profile-text rail-label">
                <strong>{profile.name}</strong>
                <small>{profile.xp.toLocaleString('vi-VN')} XP</small>
              </span>
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="desktop-sidebar-region">
        <aside className="desktop-sidebar">{renderNavigation(false)}</aside>
      </div>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div className="mobile-nav-layer" key="mobile-navigation"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onKeyDown={(event) => { if (event.key === 'Escape') onCloseMobile(); }}>
            <button type="button" className="mobile-nav-backdrop" onClick={onCloseMobile} tabIndex={-1} aria-label="Đóng menu" />
            <motion.aside className="mobile-sidebar" role="dialog" aria-modal="true" aria-label="Menu điều hướng"
              initial={{ x: -24 }} animate={{ x: 0 }} exit={{ x: -24 }} transition={{ duration: 0.18 }}>
              {renderNavigation(true)}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
