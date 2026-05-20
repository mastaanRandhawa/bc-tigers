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
import { cn } from '@/lib/utils';

const navLinks = [{ label: 'Tournaments', href: '/tournaments' }];

interface SiteHeaderProps {
  variant?: 'site' | 'hero' | 'minimal' | 'admin';
}

function SiteLogo({ compact = false, onDark = true }: { compact?: boolean; onDark?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-1 flex-shrink-0">
      <div
        className={cn(
          'font-black tracking-tight rounded-2xl rounded-bl-sm relative shadow-sm font-display',
          compact ? 'text-xs px-2.5 py-1' : 'text-xs md:text-sm px-3 py-1.5',
          onDark ? 'bg-white text-black' : 'bg-primary-muted text-foreground',
        )}
      >
        BC
        {onDark && (
          <div
            className="absolute -bottom-1.5 left-0 w-3 h-3 bg-white"
            style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}
          />
        )}
      </div>
      <div
        className={cn(
          'font-black rounded-full shadow-sm font-display',
          compact ? 'text-xs px-2.5 py-1' : 'text-xs md:text-sm px-3 py-1.5',
          onDark
            ? 'bg-primary-muted text-primary border-[1.5px] border-white'
            : 'bg-primary text-white',
        )}
      >
        TIGERS
      </div>
    </Link>
  );
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

export default function SiteHeader({ variant = 'site' }: SiteHeaderProps) {
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
      <header className="sticky top-0 z-50 w-full bg-primary text-white shadow-md">
        <div className="absolute inset-0 bg-brand-grid pointer-events-none opacity-80" />
        <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 safe-x">
          <div className="flex items-center justify-between gap-4 h-14">
            <div className="flex items-center gap-2.5 min-w-0">
              <SiteLogo compact />
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider bg-white/15 px-2.5 py-1 rounded-full border border-white/25 shrink-0">
                Admin
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link to="/tournaments" className="nav-pill-light hidden sm:inline-flex">
                <ExternalLink className="w-3.5 h-3.5" aria-hidden />
                View Site
              </Link>
              {isAuthenticated && user && <UserMenu onDark />}
            </div>
          </div>
        </div>
      </header>
    );
  }

  if (isMinimal) {
    return (
      <header className="sticky top-0 z-50 w-full bg-white border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 safe-x">
          <div className="flex items-center justify-between h-14 gap-4">
            <SiteLogo compact onDark={false} />
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
        'z-50 w-full bg-primary text-white',
        isHero ? 'relative' : 'sticky top-0 shadow-md',
      )}
    >
      <div className="absolute inset-0 bg-brand-grid pointer-events-none opacity-60" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-white/10 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 safe-x">
        <div className="flex items-center gap-3 py-2.5 min-w-0">
          <SiteLogo compact />

          <div className="hidden md:flex flex-1 min-w-0 border-l border-white/15 pl-3">
            <LiveScoreTicker embedded alwaysShow />
          </div>

          <div className="flex items-center gap-2 ml-auto shrink-0">
            <nav aria-label="Main navigation" className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <NavLink key={link.href} to={link.href} className={navLinkClass}>
                  {link.label}
                </NavLink>
              ))}
            </nav>

            {isAuthenticated && user ? (
              <UserMenu onDark />
            ) : (
              <Link to="/login" className="nav-pill-light hidden sm:inline-flex">
                Sign In
              </Link>
            )}

            <button
              type="button"
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              className="lg:hidden p-2 rounded-full text-white hover:bg-white/10 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="md:hidden pb-2.5 border-t border-white/10 pt-2">
          <LiveScoreTicker embedded alwaysShow />
        </div>
      </div>

      {mobileOpen && (
        <nav
          aria-label="Mobile navigation"
          className="lg:hidden relative border-t border-white/20 bg-primary"
        >
          <div className="px-4 py-3 space-y-1 safe-x">
            {navLinks.map((link) => (
              <NavLink
                key={link.href}
                to={link.href}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn('block nav-pill w-full justify-center', isActive ? 'nav-pill-light-active' : 'nav-pill-light')
                }
              >
                {link.label}
              </NavLink>
            ))}
            {!isAuthenticated && (
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="block nav-pill-light w-full justify-center"
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
