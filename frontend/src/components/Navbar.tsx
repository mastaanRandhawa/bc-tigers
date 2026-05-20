import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Trophy, Menu, X, ChevronDown, User, LogOut, Settings, LayoutDashboard } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { isAdminRole, getRoleDashboardPath, getRoleLabel } from '@/lib/auth-utils';
import type { UserRole } from '@/types';
import { cn } from '@/lib/utils';

const navLinks = [
  { label: 'Tournaments', href: '/tournaments' },
  { label: 'Schedule', href: '/schedule' },
  { label: 'Standings', href: '/standings' },
  { label: 'Stats', href: '/stats' },
  {
    label: 'More',
    children: [
      { label: 'Teams', href: '/teams' },
      { label: 'Players', href: '/players' },
      { label: 'Venues', href: '/venues' },
      { label: 'Brackets', href: '/brackets' },
      { label: 'News', href: '/news' },
      { label: 'Gallery', href: '/gallery' },
    ],
  },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    setUserMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#0038FF] shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 safe-x">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="bg-[#CCFF00] p-1.5 rounded-xl">
              <Trophy className="w-5 h-5 text-black" />
            </div>
            <div className="flex items-center gap-0.5">
              <span className="font-black text-white text-lg tracking-tight">BC</span>
              <span className="font-black text-[#CCFF00] text-lg tracking-tight">TIGERS</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) =>
              link.children ? (
                <div key={link.label} className="relative">
                  <button
                    onClick={() => setMoreOpen(!moreOpen)}
                    className="flex items-center gap-1 px-4 py-2 rounded-full text-white/90 text-sm font-semibold hover:bg-white/10 transition-colors"
                  >
                    {link.label}
                    <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', moreOpen && 'rotate-180')} />
                  </button>
                  {moreOpen && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 z-50">
                      {link.children.map((child) => (
                        <NavLink
                          key={child.href}
                          to={child.href}
                          onClick={() => setMoreOpen(false)}
                          className={({ isActive }) =>
                            cn('block px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors', isActive ? 'text-[#0038FF] font-semibold' : 'text-gray-700')
                          }
                        >
                          {child.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <NavLink
                  key={link.href}
                  to={link.href!}
                  className={({ isActive }) =>
                    cn('px-4 py-2 rounded-full text-sm font-semibold transition-colors', isActive ? 'bg-white/20 text-white' : 'text-white/90 hover:bg-white/10')
                  }
                >
                  {link.label}
                </NavLink>
              )
            )}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-2">
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-[#CCFF00] flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-black" />
                  </div>
                  <span className="text-white text-sm font-semibold hidden sm:block">
                    {user.first_name}
                  </span>
                  <ChevronDown className="w-3 h-3 text-white" />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                    {(['COACH', 'REFEREE', 'PLAYER'] as UserRole[]).includes(user.role) && (
                      <Link
                        to={getRoleDashboardPath(user.role)}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <LayoutDashboard className="w-4 h-4" /> {getRoleLabel(user.role)} Portal
                      </Link>
                    )}
                    {isAdminRole(user.role) && (
                      <Link
                        to="/admin/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <LayoutDashboard className="w-4 h-4" /> Admin Dashboard
                      </Link>
                    )}
                    <Link
                      to="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Settings className="w-4 h-4" /> Settings
                    </Link>
                    <button
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
                className="hidden md:inline-flex px-5 py-2 rounded-full border border-white text-white text-sm font-semibold hover:bg-white hover:text-[#0038FF] transition-colors"
              >
                Sign In
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 text-white"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-[#001A99] border-t border-white/10">
          <div className="px-4 py-3 space-y-1">
            {navLinks.flatMap((link) =>
              link.children
                ? link.children.map((child) => (
                    <NavLink
                      key={child.href}
                      to={child.href}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        cn('block px-4 py-2 rounded-xl text-sm font-medium', isActive ? 'bg-white/20 text-white' : 'text-white/80 hover:bg-white/10')
                      }
                    >
                      {child.label}
                    </NavLink>
                  ))
                : [
                    <NavLink
                      key={link.href}
                      to={link.href!}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        cn('block px-4 py-2 rounded-xl text-sm font-medium', isActive ? 'bg-white/20 text-white' : 'text-white/80 hover:bg-white/10')
                      }
                    >
                      {link.label}
                    </NavLink>,
                  ]
            )}
            {!isAuthenticated && (
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-2 rounded-xl text-sm font-medium text-[#CCFF00] hover:bg-white/10"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Backdrop for dropdowns */}
      {(moreOpen || userMenuOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => { setMoreOpen(false); setUserMenuOpen(false); }}
        />
      )}
    </nav>
  );
}
