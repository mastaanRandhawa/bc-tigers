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
    // Routine division setup is now inline on the main site; portal = bulk/advanced
    label: 'Advanced — tournament setup',
    items: [
      { label: 'Tournaments', href: '/admin/tournaments', icon: Trophy },
      { label: 'Divisions (bulk)', href: '/admin/divisions', icon: Flag },
      { label: 'Venues', href: '/admin/venues', icon: MapPin },
    ],
  },
  {
    // Teams & matches are editable inline; portal = bulk operations and player CRUD
    label: 'Advanced — division content',
    items: [
      { label: 'Teams (bulk)', href: '/admin/teams', icon: Shield },
      { label: 'Players', href: '/admin/players', icon: UserCircle },
      { label: 'Coaches', href: '/admin/coaches', icon: UserCog },
      { label: 'Matches (bulk)', href: '/admin/matches', icon: Calendar },
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
