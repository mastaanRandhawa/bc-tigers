import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy,
  LayoutDashboard,
  Flag,
  Shield,
  UserCircle,
  Calendar,
  BarChart2,
  GitBranch,
  MapPin,
  Users,
  Image,
  Settings,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import AppShell from '@/components/layouts/AppShell';
import { cn } from '@/lib/utils';

export interface AdminNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface AdminNavGroup {
  label: string;
  items: AdminNavItem[];
}

const adminNavGroups: AdminNavGroup[] = [
  {
    label: 'Hub',
    items: [{ label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Tournament setup',
    items: [
      { label: 'Tournaments', href: '/admin/tournaments', icon: Trophy },
      { label: 'Divisions', href: '/admin/divisions', icon: Flag },
      { label: 'Venues', href: '/admin/venues', icon: MapPin },
    ],
  },
  {
    label: 'Division content',
    items: [
      { label: 'Teams', href: '/admin/teams', icon: Shield },
      { label: 'Players', href: '/admin/players', icon: UserCircle },
      { label: 'Matches', href: '/admin/matches', icon: Calendar },
      { label: 'Schedules', href: '/admin/schedules', icon: Calendar },
      { label: 'Standings', href: '/admin/standings', icon: BarChart2 },
      { label: 'Brackets', href: '/admin/brackets', icon: GitBranch },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Users', href: '/admin/users', icon: Users },
      { label: 'Referees', href: '/admin/referees', icon: Shield },
      { label: 'Media', href: '/admin/media', icon: Image },
      { label: 'Settings', href: '/admin/settings', icon: Settings },
    ],
  },
];

function AdminSubNav({ groups }: { groups: AdminNavGroup[] }) {
  return (
    <div className="border-b border-border bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 safe-x space-y-4">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">
              {group.label}
            </p>
            <nav
              aria-label={`${group.label} admin navigation`}
              className="flex gap-1.5 overflow-x-auto no-scrollbar"
            >
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0',
                    'border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors',
                  )}
                >
                  <item.icon className="w-3.5 h-3.5" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        ))}
      </div>
    </div>
  );
}

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  return (
    <AppShell showFooter={false} headerMode="minimal" subNav={<AdminSubNav groups={adminNavGroups} />}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 safe-x w-full">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          {title && <h1 className="text-display text-2xl md:text-3xl">{title}</h1>}
          <Link
            to="/tournaments"
            className="inline-flex h-9 items-center px-4 rounded-full border border-border bg-surface text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            View Public Site
          </Link>
        </div>
        {children}
      </div>
    </AppShell>
  );
}
