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
  variant?: 'site' | 'hero' | 'minimal';
}

function SiteLogo({ compact = false, onDark = true }: { compact?: boolean; onDark?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-1 flex-shrink-0">
      <div
        className={cn(
          'font-black tracking-tight rounded-2xl rounded-bl-sm relative shadow-sm',
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
          'font-black rounded-full shadow-sm',
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

export default function SiteHeader({ variant = 'site' }: SiteHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const isHero = variant === 'hero';
  const isMinimal = variant === 'minimal';
  const onDark = !isMinimal;

  const handleLogout = () => {
    logout();
    navigate('/');
    setUserMenuOpen(false);
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap shrink-0',
      onDark
        ? isActive
          ? 'bg-white text-primary'
          : 'border border-white/30 text-white hover:bg-white/10'
        : isActive
          ? 'bg-primary-muted text-primary'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted',
    );

  if (isMinimal) {
    return (
      <header className="sticky top-0 z-50 w-full bg-surface border-b border-border shadow-sm">
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
      <div className="absolute inset-x-0 bottom-0 h-px bg-white/10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 safe-x">
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
              <div className="relative">
                <button
                  type="button"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="menu"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-white/30 text-white hover:bg-white/10 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-sm font-medium hidden sm:block">{user.first_name}</span>
                  <ChevronDown className="w-3 h-3 text-white/70 hidden sm:block" />
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
                className="hidden sm:inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold border border-white text-white hover:bg-white hover:text-primary transition-colors"
              >
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
          className="lg:hidden border-t border-white/20 bg-primary"
        >
          <div className="px-4 py-3 space-y-1 safe-x">
            {navLinks.map((link) => (
              <NavLink
                key={link.href}
                to={link.href}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'block px-4 py-2.5 rounded-full text-sm font-medium',
                    isActive ? 'bg-white text-primary' : 'text-white hover:bg-white/10',
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
                className="block px-4 py-2.5 rounded-full text-sm font-semibold text-white border border-white/30"
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
