import { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import {
  Trophy, LayoutDashboard, Flag, Users, UserCircle, Calendar,
  BarChart2, GitBranch, MapPin, Shield, Image, Settings,
  LogOut, Menu, X, ChevronRight, Bell
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import Footer from './Footer';

const adminNav = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Tournaments', href: '/admin/tournaments', icon: Trophy },
  { label: 'Divisions', href: '/admin/divisions', icon: Flag },
  { label: 'Teams', href: '/admin/teams', icon: Shield },
  { label: 'Players', href: '/admin/players', icon: UserCircle },
  { label: 'Matches', href: '/admin/matches', icon: Calendar },
  { label: 'Schedules', href: '/admin/schedules', icon: Calendar },
  { label: 'Standings', href: '/admin/standings', icon: BarChart2 },
  { label: 'Brackets', href: '/admin/brackets', icon: GitBranch },
  { label: 'Venues', href: '/admin/venues', icon: MapPin },
  { label: 'Referees', href: '/admin/referees', icon: Shield },
  { label: 'Media', href: '/admin/media', icon: Image },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const Sidebar = ({ mobile = false }) => (
    <aside className={cn(
      'bg-gray-900 text-white flex flex-col',
      mobile ? 'w-64' : 'w-64 min-h-screen sticky top-0 h-screen'
    )}>
      {/* Logo */}
      <div className="p-4 border-b border-gray-800">
        <Link to="/" className="flex items-center gap-2">
          <div className="bg-[#CCFF00] p-1.5 rounded-xl">
            <Trophy className="w-4 h-4 text-black" />
          </div>
          <div>
            <span className="font-black text-white text-base">BC</span>
            <span className="font-black text-[#CCFF00] text-base">TIGERS</span>
          </div>
        </Link>
        <p className="text-xs text-gray-500 mt-1 ml-8">Admin Panel</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {adminNav.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium mb-0.5 transition-colors group',
                isActive
                  ? 'bg-[#0038FF] text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-[#CCFF00]' : 'text-gray-500 group-hover:text-gray-300')} />
                <span>{item.label}</span>
                {isActive && <ChevronRight className="w-3 h-3 ml-auto text-[#CCFF00]" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-[#CCFF00] flex items-center justify-center flex-shrink-0">
            <span className="text-black text-xs font-black">{user?.first_name?.[0]}{user?.last_name?.[0]}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.first_name} {user?.last_name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-400 hover:bg-gray-800 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-dvh min-h-screen bg-gray-50 w-full overflow-x-hidden flex-col">
      <div className="flex flex-1 min-w-0 w-full">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block shrink-0">
          <Sidebar />
        </div>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <>
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
              <div className="absolute left-0 top-0 bottom-0">
                <Sidebar mobile />
              </div>
            </div>
          </>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 w-full">
          {/* Top Bar */}
          <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
            <div className="flex items-center justify-between px-4 h-16">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 text-gray-500 hover:text-gray-900"
                >
                  <Menu className="w-5 h-5" />
                </button>
                {title && (
                  <div>
                    <h1 className="text-lg font-bold text-gray-900">{title}</h1>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 text-gray-500 hover:text-gray-900 rounded-xl hover:bg-gray-100">
                  <Bell className="w-5 h-5" />
                </button>
                <Link
                  to="/"
                  className="text-xs px-3 py-1.5 rounded-full bg-[#0038FF] text-white font-medium hover:bg-[#001A99] transition-colors"
                >
                  View Site
                </Link>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 p-4 sm:p-6 min-w-0">
            {children}
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}
