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
} from '@/lib/auth-utils';
import BrandLogo from '@/components/shared/BrandLogo';
import GlobalSearch from '@/components/shared/GlobalSearch';
import NotificationBell from '@/components/shared/NotificationBell';
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler';
import { cn } from '@/lib/utils';
import { useSmartHeader } from '@/hooks/useSmartHeader';

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

export default function SiteHeader({ variant = 'hero', showLiveTicker = true }: SiteHeaderProps) {
  const isAdmin = variant === 'admin';
  const isMinimal = variant === 'minimal';
  const { isVisible, isAtTop, isScrolled } = useSmartHeader();
  const { isAuthenticated, isInitialized, user } = useAuthStore();
  const showTicker = showLiveTicker && !isMinimal;
  const onDark = true;

  const orangeBar = cn(
    'site-header-orange site-header-smart fixed top-0 left-0 right-0 z-50 w-full text-white will-change-transform',
    !isVisible && 'site-header-hidden',
    isAtTop ? 'bg-primary' : 'bg-primary/95 shadow-md backdrop-blur-md supports-[backdrop-filter]:bg-primary/90',
    isScrolled && isVisible && !isAtTop && 'shadow-lg',
  );

  const barInner = (
    <>
      <div className="absolute inset-0 bg-brand-grid pointer-events-none opacity-60" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-white/10 pointer-events-none" />
    </>
  );

  if (isAdmin) {
    return (
      <header className={orangeBar} aria-hidden={!isVisible}>
        {barInner}
        <div className="page-container relative">
          <div className="flex h-14 items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-2.5">
              <BrandLogo compact />
              <span className="shrink-0 rounded-md border border-white/25 bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/90 sm:text-xs">
                Admin
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Link
                to="/"
                className="nav-pill nav-pill-light hidden items-center gap-1.5 sm:inline-flex"
              >
                <ExternalLink className="w-3.5 h-3.5" aria-hidden />
                View Site
              </Link>
              {isInitialized && (
                isAuthenticated && user ? (
                  <UserMenu onDark />
                ) : (
                  <SignInButton isHero />
                )
              )}
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className={orangeBar} aria-hidden={!isVisible}>
      {barInner}

      <div className="page-container relative">
        <div className="flex h-14 items-center gap-2 sm:gap-3">
          <BrandLogo compact />

          {showTicker && (
            <>
              <span className="hidden h-5 w-px shrink-0 bg-white/20 md:block" aria-hidden />
              <div className="hidden min-w-0 flex-1 overflow-hidden md:block">
                <LiveScoreTicker embedded alwaysShow variant="dark" />
              </div>
            </>
          )}

          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
            {!isMinimal && (
              <div className="hidden md:block">
                <GlobalSearch />
              </div>
            )}
            <TournamentsLink onDark={onDark} />
            <AnimatedThemeToggler onDark={onDark} />
            {isInitialized && (
              isAuthenticated && user ? (
                <>
                  {!isMinimal && <NotificationBell onDark={onDark} />}
                  <UserMenu onDark={onDark} />
                </>
              ) : (
                <SignInButton isHero />
              )
            )}
          </div>
        </div>

        {showTicker && (
          <div className="overflow-hidden border-t border-white/10 pb-2 pt-1.5 md:hidden">
            <LiveScoreTicker embedded alwaysShow variant="dark" />
          </div>
        )}
      </div>
    </header>
  );
}
