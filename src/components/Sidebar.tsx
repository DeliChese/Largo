import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  BarChart3,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  Gamepad2,
  LayoutDashboard,
  Moon,
  Settings,
  Sun,
  User,
  WifiOff,
  X,
} from 'lucide-react';
import type { AppRoute, ColorSchemeMode, UserProfile } from '../types/vocab';
import { PWAInstallButton } from './PWAInstallButton';

interface SidebarProps {
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  dueCount: number;
  profile: UserProfile;
  colorScheme: ColorSchemeMode;
  isDarkActive: boolean;
  onToggleDark: () => void;
  isOnline: boolean;
}

const NAV_ITEMS: Array<{
  id: AppRoute;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { id: 'study', label: 'Chế độ học (7)', icon: BookOpen },
  { id: 'games', label: 'Trò chơi từ vựng', icon: Gamepad2 },
  { id: 'decks', label: 'Bộ từ HSK & Cá nhân', icon: FolderKanban },
  { id: 'analytics', label: 'Biểu đồ & Bloom', icon: BarChart3 },
  { id: 'profile', label: 'Hồ sơ học tập', icon: User },
  { id: 'settings', label: 'Cài đặt & Theme', icon: Settings },
];

const SPRING_MACOS = { type: 'spring' as const, stiffness: 360, damping: 34, mass: 0.85 };

export const Sidebar: React.FC<SidebarProps> = ({
  activeRoute,
  onNavigate,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  dueCount,
  profile,
  isDarkActive,
  onToggleDark,
  isOnline,
}) => {
  const handleSelect = (route: AppRoute) => {
    onNavigate(route);
    onCloseMobile();
  };

  const renderSidebarBody = (isMobileDrawer: boolean) => {
    const isCompact = !isMobileDrawer && collapsed;
    return (
      <>
        {/* Brand Header */}
        <div
          className={`flex h-16 items-center border-b px-3.5 ${
            isCompact ? 'justify-center gap-1.5' : 'justify-between'
          }`}
          style={{ borderColor: 'var(--glass-border)' }}
        >
          <button
            type="button"
            onClick={() => handleSelect('dashboard')}
            className="flex items-center gap-2.5 text-left focus-visible:outline-2 focus-visible:outline-offset-2 cursor-pointer min-w-0"
          >
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-display text-sm font-bold text-white shadow-sm"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            >
              汉
            </div>
            {!isCompact && (
              <div className="min-w-0">
                <div className="font-display text-[15px] font-bold tracking-tight whitespace-nowrap truncate leading-tight">
                  LexisBloom
                </div>
                <div className="text-[11px] font-medium truncate" style={{ color: 'var(--text-muted)' }}>
                  HSK 1 · HSK 2
                </div>
              </div>
            )}
          </button>

          {!isMobileDrawer ? (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={collapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'}
              className="hidden lg:flex h-7 w-7 items-center justify-center rounded-lg border transition-colors hover:opacity-80 cursor-pointer shrink-0"
              style={{
                borderColor: 'var(--glass-border)',
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--bg-surface)',
              }}
            >
              {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </button>
          ) : (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Đóng thanh điều hướng"
              className="flex h-8 w-8 items-center justify-center rounded-lg cursor-pointer"
              style={{ color: 'var(--text-secondary)' }}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-3.5 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeRoute === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                title={isCompact ? item.label : undefined}
                aria-current={isActive ? 'page' : undefined}
                className={`relative w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  isCompact ? 'justify-center px-2' : 'justify-between'
                }`}
                style={{
                  color: isActive ? 'var(--accent-text)' : 'var(--text-secondary)',
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId={isMobileDrawer ? 'macos-nav-pill-mobile' : 'macos-nav-active-pill'}
                    transition={SPRING_MACOS}
                    className="absolute inset-0 rounded-xl"
                    style={{ backgroundColor: 'var(--accent-soft)' }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-3 min-w-0">
                  <Icon className="w-4 h-4 shrink-0" />
                  {!isCompact && <span className="truncate">{item.label}</span>}
                </span>
                {!isCompact && item.id === 'study' && dueCount > 0 && (
                  <span
                    className="relative z-10 text-[11px] font-mono tabular-nums font-semibold"
                    style={{ color: isActive ? 'var(--accent-text)' : 'var(--text-muted)' }}
                  >
                    {dueCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Utility Zone */}
        <div
          className="border-t p-3 space-y-2"
          style={{ borderColor: 'var(--glass-border)' }}
        >
          {!isOnline && !isCompact && (
            <div
              className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-medium"
              style={{
                backgroundColor: 'var(--bg-subtle)',
                color: 'var(--text-secondary)',
              }}
            >
              <WifiOff className="w-3.5 h-3.5 shrink-0" />
              <span>Chế độ Offline</span>
            </div>
          )}

          {!isCompact && (
            <div
              className="flex items-center justify-between rounded-xl px-3 py-2 text-xs"
              style={{ backgroundColor: 'var(--bg-subtle)' }}
            >
              <span className="truncate font-medium" style={{ color: 'var(--text-secondary)' }}>
                Chuỗi {profile.streakDays} ngày
              </span>
              <span className="font-mono tabular-nums font-semibold" style={{ color: 'var(--accent-text)' }}>
                {profile.xp} XP
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={onToggleDark}
            aria-label={isDarkActive ? 'Chuyển sang giao diện sáng' : 'Chuyển sang chế độ tối'}
            className={`w-full flex items-center gap-2.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              isCompact ? 'justify-center px-2' : 'justify-between'
            }`}
            style={{
              borderColor: 'var(--glass-border)',
              color: 'var(--text-primary)',
              backgroundColor: 'var(--bg-surface)',
            }}
          >
            <span className="flex items-center gap-2">
              {isDarkActive ? <Sun className="w-3.5 h-3.5 shrink-0" /> : <Moon className="w-3.5 h-3.5 shrink-0" />}
              {!isCompact && <span>{isDarkActive ? 'Giao diện Sáng' : 'Chế độ Tối'}</span>}
            </span>
          </button>

          <PWAInstallButton compact={isCompact} />
        </div>
      </>
    );
  };

  return (
    <>
      {/* Desktop Floating macOS Sidebar */}
      <motion.aside
        aria-label="Thanh điều hướng chính"
        initial={false}
        animate={{ width: collapsed ? 82 : 260 }}
        transition={SPRING_MACOS}
        className="hidden lg:flex flex-col shrink-0 m-3.5 mr-0 h-[calc(100vh-1.75rem)] sticky top-3.5 rounded-2xl border backdrop-blur-xl overflow-hidden z-30"
        style={{
          backgroundColor: 'var(--glass-bg)',
          borderColor: 'var(--glass-border)',
          boxShadow: 'var(--glass-shadow)',
        }}
      >
        {renderSidebarBody(false)}
      </motion.aside>

      {/* Mobile Floating Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="mobile-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-40 bg-black/35 backdrop-blur-xs lg:hidden"
              onClick={onCloseMobile}
              aria-hidden="true"
            />
            <motion.aside
              key="mobile-drawer"
              aria-label="Thanh điều hướng di động"
              initial={{ x: -290, opacity: 0.7 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -290, opacity: 0.7 }}
              transition={SPRING_MACOS}
              className="fixed inset-y-3 left-3 z-50 w-[268px] flex flex-col rounded-2xl border backdrop-blur-xl overflow-hidden lg:hidden"
              style={{
                backgroundColor: 'var(--glass-bg)',
                borderColor: 'var(--glass-border)',
                boxShadow: 'var(--glass-shadow)',
              }}
            >
              {renderSidebarBody(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
