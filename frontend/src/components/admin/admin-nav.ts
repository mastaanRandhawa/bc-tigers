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
      { label: 'Coaches', href: '/admin/coaches', icon: UserCog },
      { label: 'Matches', href: '/admin/matches', icon: Calendar },
      { label: 'Brackets', href: '/admin/brackets', icon: GitBranch },
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
