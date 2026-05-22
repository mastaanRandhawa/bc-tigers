import { NavLink } from 'react-router-dom';
import { Home, Trophy, Radio, User, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { getRoleDashboardPath } from '@/lib/auth-utils';

const baseItems = [
  { label: 'Home', href: '/', icon: Home, exact: true },
  { label: 'Tournaments', href: '/tournaments', icon: Trophy, exact: false },
  { label: 'Live', href: '/tournaments', icon: Radio, exact: false },
];

export default function MobileBottomNav() {
  const { isAuthenticated, user } = useAuthStore();

  const profileItem = isAuthenticated && user
    ? { label: 'My Portal', href: getRoleDashboardPath(user.role), icon: User, exact: false }
    : { label: 'Sign In', href: '/login', icon: LogIn, exact: false };

  const items = [...baseItems, profileItem];

  return (
    <nav
      aria-label="Mobile navigation"
      className={cn(
        'lg:hidden fixed bottom-0 inset-x-0 z-40',
        'bg-card/95 backdrop-blur-sm border-t border-border',
        'safe-b', // handles iOS notch
      )}
    >
      <div className="flex items-stretch">
        {items.map(({ label, href, icon: Icon, exact }) => (
          <NavLink
            key={href}
            to={href}
            end={exact}
            className={({ isActive }) =>
              cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5 py-2 px-1 text-[10px] font-medium transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )
            }
            aria-label={label}
          >
            <Icon className="h-5 w-5" aria-hidden />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
