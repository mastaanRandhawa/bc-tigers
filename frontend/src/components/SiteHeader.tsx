import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
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
import { cn } from '@/lib/utils';

const navLinks = [{ label: 'Tournaments', href: '/tournaments' }];

interface SiteHeaderProps {
  variant?: 'site' | 'hero' | 'minimal' | 'admin';
  /** Hide embedded live ticker (e.g. home hero shows scores in the banner). */
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
            : 'border border-border bg-white hover:bg-muted',
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
        <span className={cn('text-sm font-medium hidden sm:block', onDark ? 'text-white' : 'text-foreground')}>
          {user.first_name}
        </span>
        <ChevronDown
          className={cn('w-3 h-3 hidden sm:block', onDark ? 'text-white/70' : 'text-muted-foreground')}
        />
      </button>
      {userMenuOpen && (
        <>
          <div
            role="menu"
            className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-xl shadow-lg border border-border overflow-hidden z-50"
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
              <Settings className="w-4 h-4" /> Settings
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

export default function SiteHeader({ variant = 'site', showLiveTicker = true }: SiteHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated, user } = useAuthStore();
  const isHero = variant === 'hero';
  const isMinimal = variant === 'minimal';
  const isAdmin = variant === 'admin';
  const onDark = !isMinimal;

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'nav-pill text-xs sm:text-sm',
      onDark
        ? isActive
          ? 'nav-pill-light-active'
          : 'nav-pill-light'
        : isActive
          ? 'nav-pill-dark-active'
          : 'nav-pill-dark',
    );

  if (isAdmin) {
    return (
      <header className="admin-topbar">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 safe-x">
          <div className="flex h-14 items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-2.5">
              <BrandLogo compact />
              <span className="shrink-0 rounded-md border border-border bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-600 sm:text-xs">
                Admin
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Link
                to="/tournaments"
                className="nav-pill-dark hidden items-center gap-1.5 sm:inline-flex"
              >
                <ExternalLink className="w-3.5 h-3.5" aria-hidden />
                View Site
              </Link>
              {isAuthenticated && user && <UserMenu onDark={false} />}
            </div>
          </div>
        </div>
      </header>
    );
  }

  if (isMinimal) {
    return (
      <header className="sticky top-0 z-50 w-full bg-white border-b border-border shadow-sm">
        <div className="page-container">
          <div className="flex items-center justify-between h-14 gap-4">
            <BrandLogo compact />
            <nav aria-label="Main navigation" className="flex items-center gap-2">
              {navLinks.map((link) => (
                <NavLink key={link.href} to={link.href} className={navLinkClass}>
                  {link.label}
                </NavLink>
              ))}
            </nav>
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
          : 'sticky top-0 border-b border-border bg-white/95 text-foreground shadow-sm backdrop-blur-sm',
      )}
    >
      {isHero && (
        <>
          <div className="absolute inset-0 bg-brand-grid pointer-events-none opacity-60" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-white/10 pointer-events-none" />
        </>
      )}

      <div className="page-container relative">
        <div
          className={cn(
            'flex min-w-0 items-center gap-3',
            isHero ? 'py-3.5 sm:py-3' : 'py-2.5',
          )}
        >
          <BrandLogo compact />

          {showLiveTicker && (
            <div
              className={cn(
                'hidden min-w-0 flex-1 md:flex',
                isHero ? 'border-l border-white/15 pl-3' : 'border-l border-border pl-3',
              )}
            >
              <LiveScoreTicker embedded alwaysShow variant={isHero ? 'dark' : 'light'} />
            </div>
          )}

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <nav aria-label="Main navigation" className="hidden items-center gap-1 lg:flex">
              {navLinks.map((link) => (
                <NavLink key={link.href} to={link.href} className={navLinkClass}>
                  {link.label}
                </NavLink>
              ))}
            </nav>

            {isAuthenticated && user ? (
              <UserMenu onDark={isHero} />
            ) : (
              <Link
                to="/login"
                className={cn(
                  'hidden items-center rounded-lg px-4 py-1.5 text-sm font-semibold transition-all duration-200 sm:inline-flex',
                  isHero
                    ? 'border border-white/30 text-white hover:bg-white hover:text-primary'
                    : 'bg-primary text-white hover:bg-primary-hover shadow-sm',
                )}
              >
                Sign In
              </Link>
            )}

            <button
              type="button"
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              className={cn(
                'rounded-lg p-2 transition-colors lg:hidden',
                isHero ? 'text-white hover:bg-white/10' : 'text-foreground hover:bg-muted',
              )}
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {showLiveTicker && (
          <div
            className={cn(
              'border-t pb-2.5 pt-2 md:hidden',
              isHero ? 'border-white/10' : 'border-border',
            )}
          >
            <LiveScoreTicker embedded alwaysShow variant={isHero ? 'dark' : 'light'} />
          </div>
        )}
      </div>

      {mobileOpen && (
        <nav
          aria-label="Mobile navigation"
          className={cn(
            'relative border-t lg:hidden',
            isHero ? 'border-white/20 bg-primary' : 'border-border bg-white',
          )}
        >
          <div className="space-y-1 px-4 py-3 safe-x">
            {navLinks.map((link) => (
              <NavLink
                key={link.href}
                to={link.href}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'block w-full justify-center nav-pill',
                    isHero
                      ? isActive
                        ? 'nav-pill-light-active'
                        : 'nav-pill-light'
                      : isActive
                        ? 'nav-pill-dark-active'
                        : 'nav-pill-dark',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
            {!isAuthenticated && (
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'block w-full justify-center nav-pill',
                  isHero ? 'nav-pill-light' : 'nav-pill-dark',
                )}
              >
                Sign In
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
