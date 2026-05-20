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
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import {
  isAdminRole,
  getRoleDashboardPath,
  getRoleLabel,
} from '@/lib/auth-utils';
import type { UserRole } from '@/types';
import { cn } from '@/lib/utils';

const navLinks = [
  { label: 'Tournaments', href: '/tournaments' },
  { label: 'Schedule', href: '/schedule' },
  { label: 'Matches', href: '/matches' },
  { label: 'Standings', href: '/standings' },
  { label: 'Brackets', href: '/brackets' },
  { label: 'Teams', href: '/teams' },
  { label: 'Players', href: '/players' },
  { label: 'Stats', href: '/stats' },
  { label: 'Venues', href: '/venues' },
];

interface NavbarProps {
  variant?: 'default' | 'hero';
}

export default function Navbar({ variant = 'default' }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const isHero = variant === 'hero';

  const handleLogout = () => {
    logout();
    navigate('/');
    setUserMenuOpen(false);
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'px-3 xl:px-4 py-1.5 rounded-full text-xs xl:text-sm font-semibold transition-colors whitespace-nowrap shrink-0',
      isHero
        ? isActive
          ? 'bg-white text-primary'
          : 'border border-white/30 text-white hover:bg-white/10'
        : isActive
          ? 'bg-primary-muted text-primary'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
    );

  return (
    <header
      className={cn(
        'z-50 w-full',
        isHero
          ? 'relative bg-primary'
          : 'sticky top-0 bg-surface border-b border-border shadow-sm'
      )}
    >
      <div
        className={cn(
          'max-w-[1440px] mx-auto safe-x',
          isHero ? 'px-6 py-6 md:px-10 md:py-8' : 'px-4 sm:px-6 lg:px-8'
        )}
      >
        <div className={cn('flex items-center justify-between gap-4', !isHero && 'h-16')}>
          <Link to="/" className="flex items-center gap-1 flex-shrink-0">
            <div
              className={cn(
                'font-black tracking-tight text-xs md:text-sm px-3 py-1.5 rounded-2xl rounded-bl-sm relative shadow-sm',
                isHero ? 'bg-white text-black' : 'bg-primary-muted text-foreground'
              )}
            >
              BC
              {isHero && (
                <div
                  className="absolute -bottom-1.5 left-0 w-3 h-3 bg-white"
                  style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}
                />
              )}
            </div>
            <div
              className={cn(
                'font-black text-xs md:text-sm px-3 py-1.5 rounded-full shadow-sm',
                isHero
                  ? 'bg-primary-muted text-primary border-[1.5px] border-white'
                  : 'bg-primary text-white'
              )}
            >
              TIGERS
            </div>
          </Link>

          <nav
            aria-label="Main navigation"
            className="hidden lg:flex items-center gap-1 overflow-x-auto no-scrollbar min-w-0"
          >
            {navLinks.map((link) => (
              <NavLink key={link.href} to={link.href} className={linkClass}>
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2 flex-shrink-0">
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  type="button"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="menu"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors',
                    isHero
                      ? 'border border-white/30 text-white hover:bg-white/10'
                      : 'border border-border bg-surface hover:bg-muted'
                  )}
                >
                  <div
                    className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center',
                      isHero ? 'bg-white/20' : 'bg-primary-muted'
                    )}
                  >
                    <User className={cn('w-3.5 h-3.5', isHero ? 'text-white' : 'text-primary')} />
                  </div>
                  <span
                    className={cn(
                      'text-sm font-medium hidden sm:block',
                      isHero ? 'text-white' : 'text-foreground'
                    )}
                  >
                    {user.first_name}
                  </span>
                  <ChevronDown
                    className={cn('w-3 h-3', isHero ? 'text-white/70' : 'text-muted-foreground')}
                  />
                </button>
                {userMenuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full mt-1 w-48 bg-surface rounded-lg shadow-lg border border-border overflow-hidden z-50"
                  >
                    {(['COACH', 'REFEREE', 'PLAYER'] as UserRole[]).includes(user.role) && (
                      <Link
                        role="menuitem"
                        to={getRoleDashboardPath(user.role)}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted"
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
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted"
                      >
                        <LayoutDashboard className="w-4 h-4" /> Admin Dashboard
                      </Link>
                    )}
                    <Link
                      role="menuitem"
                      to="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted"
                    >
                      <Settings className="w-4 h-4" /> Settings
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className={cn(
                  'hidden md:inline-flex items-center px-6 py-2 rounded-full text-xs md:text-sm font-semibold transition-colors',
                  isHero
                    ? 'border border-white text-white hover:bg-white hover:text-primary'
                    : 'bg-primary text-white hover:bg-primary-hover'
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
                'lg:hidden p-2 rounded-full transition-colors',
                isHero ? 'text-white hover:bg-white/10' : 'text-foreground hover:bg-muted'
              )}
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <nav
          aria-label="Mobile navigation"
          className={cn(
            'lg:hidden border-t',
            isHero ? 'border-white/20 bg-primary' : 'border-border bg-surface'
          )}
        >
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.href}
                to={link.href}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'block px-4 py-2.5 rounded-full text-sm font-medium',
                    isHero
                      ? isActive
                        ? 'bg-white text-primary'
                        : 'text-white hover:bg-white/10'
                      : isActive
                        ? 'bg-primary-muted text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
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
                  'block px-4 py-2.5 rounded-full text-sm font-semibold',
                  isHero ? 'text-white border border-white/30' : 'text-primary hover:bg-primary-muted'
                )}
              >
                Sign In
              </Link>
            )}
          </div>
        </nav>
      )}

      {userMenuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} aria-hidden />
      )}
    </header>
  );
}
