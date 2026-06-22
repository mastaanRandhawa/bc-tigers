import {
  Trophy,
  LayoutDashboard,
  Shield,
  Layers,
  Calendar,
  Megaphone,
  MapPin,
  Users,
  GitBranch,
  ClipboardList,
  BarChart3,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface AdminNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface AdminNavGroup {
  label: string;
  items: AdminNavItem[];
}

export const adminNavGroups: AdminNavGroup[] = [
  {
    label: 'Hub',
    items: [{ label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Tournament Setup',
    items: [
      { label: 'Tournaments', href: '/admin/tournaments', icon: Trophy },
      { label: 'Divisions', href: '/admin/divisions', icon: Layers },
      { label: 'Point Formats', href: '/admin/point-formats', icon: BarChart3 },
      { label: 'Venues', href: '/admin/venues', icon: MapPin },
    ],
  },
  {
    label: 'Bulk Operations',
    items: [
      { label: 'Matches', href: '/admin/matches', icon: Calendar },
      { label: 'Teams', href: '/admin/teams', icon: Shield },
      { label: 'Brackets', href: '/admin/brackets', icon: GitBranch },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Users', href: '/admin/users', icon: Users },
      { label: 'Announcements', href: '/admin/announcements', icon: Megaphone },
      { label: 'Activity Log', href: '/admin/activity', icon: ClipboardList },
    ],
  },
];
