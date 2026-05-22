import {
  Trophy,
  LayoutDashboard,
  Flag,
  Shield,
  UserCircle,
  UserCog,
  Calendar,
  GitBranch,
  Megaphone,
  MapPin,
  Users,
  Image,
  Settings,
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
      { label: 'Venues', href: '/admin/venues', icon: MapPin },
    ],
  },
  {
    label: 'Bulk Operations',
    items: [
      { label: 'Players', href: '/admin/players', icon: UserCircle },
      { label: 'Coaches', href: '/admin/coaches', icon: UserCog },
      { label: 'Matches', href: '/admin/matches', icon: Calendar },
      { label: 'Teams', href: '/admin/teams', icon: Shield },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Users', href: '/admin/users', icon: Users },
      { label: 'Announcements', href: '/admin/announcements', icon: Megaphone },
      { label: 'Referees', href: '/admin/referees', icon: Shield },
      { label: 'Media', href: '/admin/media', icon: Image },
      { label: 'Settings', href: '/admin/settings', icon: Settings },
    ],
  },
];

export const adminNavItems = adminNavGroups.flatMap((group) => group.items);
