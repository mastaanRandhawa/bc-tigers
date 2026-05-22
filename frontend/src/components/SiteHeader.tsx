import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  User,
  LogOut,
  Settings,
  LayoutDashboard,
  ExternalLink,
} from 'lucide-react';
import LiveScoreTicker from '@/components/LiveScoreTicker';
import { useAuthStore } from '@/store/authStore';
import {
  isAdminRole,
  getRoleDashboardPath,
  getRoleLabel,
} from '@/lib/auth-utils';
import type { UserRole } from '@/types';
import BrandLogo from '@/components/shared/BrandLogo';
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler';
import { cn } from '@/lib/utils';

interface SiteHeaderProps {
  variant?: 'site' | 'hero' | 'minimal' | 'admin';
  /** Hide embedded live ticker (e.g. when a page renders its own full-width ticker). */
  showLiveTicker?: boolean;
}

function UserMenu({ onDark = true }: { onDark?: boolean }) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/');
    setUserMenuOpen(false);
  };

  const displayName =
    [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Account';

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={userMenuOpen}
        aria-haspopup="menu"
        onClick={() => setUserMenuOpen(!userMenuOpen)}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-colors',
          onDark
            ? 'border border-white/30 text-white hover:bg-white/10'
            : 'border border-border bg-card hover:bg-muted',
        )}
      >
        <div
          className={cn(
            'w-7 h-7 rounded-full flex items-center justify-center',
            onDark ? 'bg-white/20' : 'bg-primary-muted',
          )}
        >
          <User className={cn('w-3.5 h-3.5', onDark ? 'text-white' : 'text-primary')} />
        </div>
        <span
          className={cn(
            'text-sm font-medium hidden sm:block max-w-[8rem] truncate',
            onDark ? 'text-white' : 'text-foreground',
          )}
        >
          {displayName}
        </span>
        <ChevronDown
          className={cn('w-3 h-3 hidden sm:block', onDark ? 'text-white/70' : 'text-muted-foreground')}
        />
      </button>
      {userMenuOpen && (
        <>
          <div
            role="menu"
            className="absolute right-0 top-full mt-1.5 w-52 bg-popover rounded-xl shadow-lg border border-border overflow-hidden z-50"
          >
            {(['COACH', 'REFEREE', 'PLAYER'] as UserRole[]).includes(user.role) && (
              <Link
                role="menuitem"
                to={getRoleDashboardPath(user.role)}
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" />
                {getRoleLabel(user.role)} Portal
              </Link>
            )}
            {isAdminRole(user.role) && (
              <Link
                role="menuitem"
                to="/admin/dashboard"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" /> Admin Dashboard
              </Link>
            )}
            <Link
              role="menuitem"
              to="/profile"
              onClick={() => setUserMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
            >
              <Settings className="w-4 h-4" /> Profile
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
          <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} aria-hidden />
        </>
      )}
    </div>
  );
}

function SignInButton({ isHero }: { isHero: boolean }) {
  return (
    <Link
      to="/login"
      className={cn(
        'inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 sm:px-4 sm:text-sm',
        isHero
          ? 'border border-white/30 text-white hover:bg-white hover:text-primary'
          : 'bg-primary text-white hover:bg-primary-hover shadow-sm',
      )}
    >
      Sign In
    </Link>
  );
}

function TournamentsLink({ onDark }: { onDark: boolean }) {
  return (
    <NavLink
      to="/tournaments"
      className={({ isActive }) =>
        cn(
          'nav-pill text-xs sm:text-sm',
          onDark
            ? isActive
              ? 'nav-pill-light-active'
              : 'nav-pill-light'
            : isActive
              ? 'nav-pill-dark-active'
              : 'nav-pill-dark',
        )
      }
    >
      Tournaments
    </NavLink>
  );
}

export default function SiteHeader({ variant = 'site', showLiveTicker = true }: SiteHeaderProps) {
  const { isAuthenticated, user } = useAuthStore();
  const isHero = variant === 'hero';
  const isMinimal = variant === 'minimal';
  const isAdmin = variant === 'admin';
  const onDark = !isMinimal;

  if (isAdmin) {
    return (
      <header className="admin-topbar">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 safe-x">
          <div className="flex h-14 items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-2.5">
              <BrandLogo compact />
              <span className="shrink-0 rounded-md border border-border bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-xs">
                Admin
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Link
                to="/"
                className="nav-pill-dark hidden items-center gap-1.5 sm:inline-flex"
              >
                <ExternalLink className="w-3.5 h-3.5" aria-hidden />
                View Site
              </Link>
              {isAuthenticated && user ? (
                <UserMenu onDark={false} />
              ) : (
                <SignInButton isHero={false} />
              )}
            </div>
          </div>
        </div>
      </header>
    );
  }

  if (isMinimal) {
    return (
      <header className="sticky top-0 z-50 w-full bg-card border-b border-border shadow-sm">
        <div className="page-container overflow-hidden">
          <div className="flex h-14 items-center justify-between gap-2 sm:gap-3">
            <BrandLogo compact />
            <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
              <TournamentsLink onDark={false} />
              <AnimatedThemeToggler />
              {isAuthenticated && user ? (
                <UserMenu onDark={false} />
              ) : (
                <SignInButton isHero={false} />
              )}
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header
      className={cn(
        'z-50 w-full',
        isHero
          ? 'relative bg-primary text-white'
          : 'sticky top-0 border-b border-border bg-card/95 text-foreground shadow-sm backdrop-blur-sm',
      )}
    >
      {isHero && (
        <>
          <div className="absolute inset-0 bg-brand-grid pointer-events-none opacity-60" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-white/10 pointer-events-none" />
        </>
      )}

      <div className="page-container relative">
        {/* Fixed-height row keeps logo, ticker, and actions anchored regardless of content */}
        <div className="flex h-14 items-center gap-2 sm:gap-3">
          <BrandLogo compact />

          {showLiveTicker && (
            <>
              {/* Vertical divider */}
              <span
                className={cn(
                  'hidden h-5 w-px shrink-0 md:block',
                  isHero ? 'bg-white/20' : 'bg-border',
                )}
                aria-hidden
              />
              {/* Ticker — overflow-hidden prevents it from stretching the row */}
              <div className="hidden min-w-0 flex-1 overflow-hidden md:block">
                <LiveScoreTicker embedded alwaysShow variant={isHero ? 'dark' : 'light'} />
              </div>
            </>
          )}

          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
            <TournamentsLink onDark={isHero} />
            <AnimatedThemeToggler />
            {isAuthenticated && user ? (
              <UserMenu onDark={isHero} />
            ) : (
              <SignInButton isHero={isHero} />
            )}
          </div>
        </div>

        {/* Mobile ticker — sits in its own row below the main bar */}
        {showLiveTicker && (
          <div
            className={cn(
              'overflow-hidden border-t pb-2 pt-1.5 md:hidden',
              isHero ? 'border-white/10' : 'border-border',
            )}
          >
            <LiveScoreTicker embedded alwaysShow variant={isHero ? 'dark' : 'light'} />
          </div>
        )}
      </div>
    </header>
  );
}
