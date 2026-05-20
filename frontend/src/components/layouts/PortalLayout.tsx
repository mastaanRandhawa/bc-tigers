import { useState, type ReactNode } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Trophy, LogOut, Menu, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { getRoleLabel } from '@/lib/auth-utils';
import { cn } from '@/lib/utils';
import Footer from '@/components/Footer';

export interface PortalNavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface PortalLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  nav: PortalNavItem[];
  accentColor?: string;
}

export default function PortalLayout({
  children,
  title,
  subtitle,
  nav,
  accentColor = '#0038FF',
}: PortalLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside
      className={cn(
        'bg-gray-900 text-white flex flex-col',
        mobile ? 'w-64' : 'w-64 min-h-screen sticky top-0 h-screen'
      )}
    >
      <div className="p-4 border-b border-gray-800">
        <Link to="/" className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl" style={{ backgroundColor: accentColor === '#0038FF' ? '#CCFF00' : accentColor }}>
            <Trophy className="w-4 h-4 text-black" />
          </div>
          <div>
            <span className="font-black text-white text-base">BC</span>
            <span className="font-black text-[#CCFF00] text-base">TIGERS</span>
          </div>
        </Link>
        <p className="text-xs text-gray-500 mt-1 ml-8">{subtitle ?? title}</p>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {nav.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            onClick={() => setSidebarOpen(false)}
            end={item.href !== '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium mb-0.5 transition-colors group',
                isActive ? 'text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )
            }
            style={({ isActive }) => (isActive ? { backgroundColor: accentColor } : undefined)}
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-[#CCFF00]' : 'text-gray-500')} />
                <span>{item.label}</span>
                {isActive && <ChevronRight className="w-3 h-3 ml-auto text-[#CCFF00]" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-[#CCFF00] flex items-center justify-center flex-shrink-0">
            <span className="text-black text-xs font-black">
              {user?.first_name?.[0]}
              {user?.last_name?.[0]}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.role ? getRoleLabel(user.role) : ''}
            </p>
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
        <div className="hidden lg:block shrink-0">
          <Sidebar />
        </div>

        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
            <div className="absolute left-0 top-0 bottom-0">
              <Sidebar mobile />
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col min-w-0 w-full">
          <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
            <div className="flex items-center justify-between px-4 h-16">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 text-gray-500 hover:text-gray-900"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <h1 className="text-lg font-bold text-gray-900">{title}</h1>
              </div>
              <Link
                to="/"
                className="text-xs px-3 py-1.5 rounded-full text-white font-medium transition-colors"
                style={{ backgroundColor: accentColor }}
              >
                Public Site
              </Link>
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6 min-w-0">{children}</main>
        </div>
      </div>
      <Footer />
    </div>
  );
}
