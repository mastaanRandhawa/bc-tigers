import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy,
  LayoutDashboard,
  Flag,
  Users,
  UserCircle,
  Calendar,
  BarChart2,
  GitBranch,
  MapPin,
  Shield,
  Image,
  Settings,
} from 'lucide-react';
import AppShell from '@/components/layouts/AppShell';
import SubNav from '@/components/layouts/SubNav';

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
  return (
    <AppShell
      showFooter={false}
      subNav={<SubNav items={adminNav} label="Admin" />}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 safe-x w-full">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          {title && <h1 className="text-display text-2xl md:text-3xl">{title}</h1>}
          <Link
            to="/"
            className="inline-flex h-9 items-center px-4 rounded-lg border border-border bg-surface text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            View Public Site
          </Link>
        </div>
        {children}
      </div>
    </AppShell>
  );
}
