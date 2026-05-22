import { Link, useLocation } from 'react-router-dom';
import { Home, Trophy, Radio, User, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { getRoleDashboardPath } from '@/lib/auth-utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  /** Custom active matcher — defaults to startsWith(href), or exact for '/' */
  isActive?: (pathname: string) => boolean;
}

const baseItems: NavItem[] = [
  {
    label: 'Home',
    href: '/',
    icon: Home,
    isActive: (p) => p === '/',
  },
  {
    label: 'Tournaments',
    href: '/tournaments',
    icon: Trophy,
    isActive: (p) => p.startsWith('/tournaments'),
  },
  {
    label: 'Live',
    href: '/live',
    icon: Radio,
    isActive: (p) => p === '/live',
  },
];

export default function MobileBottomNav() {
  const { isAuthenticated, user } = useAuthStore();
  const { pathname } = useLocation();

  const profileItem: NavItem = isAuthenticated && user
    ? {
        label: 'My Portal',
        href: getRoleDashboardPath(user.role),
        icon: User,
        isActive: (p) => p.startsWith(getRoleDashboardPath(user.role)),
      }
    : { label: 'Sign In', href: '/login', icon: LogIn, isActive: (p) => p === '/login' };

  const items = [...baseItems, profileItem];

  return (
    <nav
      aria-label="Mobile navigation"
      className={cn(
        'lg:hidden fixed bottom-0 inset-x-0 z-40',
        'bg-card/95 backdrop-blur-sm border-t border-border',
        'safe-b',
      )}
    >
      <div className="flex items-stretch">
        {items.map(({ label, href, icon: Icon, isActive }) => {
          const active = isActive ? isActive(pathname) : pathname.startsWith(href);
          return (
            <Link
              key={label}
              to={href}
              className={cn(
                'relative flex-1 flex flex-col items-center justify-center gap-0.5 py-2 px-1 text-[10px] font-medium transition-all duration-[var(--motion-normal)] active:scale-95',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
            >
              <Icon
                className={cn(
                  'h-5 w-5 transition-transform duration-[var(--motion-normal)]',
                  active && 'scale-110',
                )}
                aria-hidden
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
