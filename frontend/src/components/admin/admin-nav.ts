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
import { managementRoutes } from '@/lib/management-routes';

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
    items: [{ label: 'Dashboard', href: managementRoutes.dashboard, icon: LayoutDashboard }],
  },
  {
    label: 'Tournament setup',
    items: [
      { label: 'Tournaments', href: managementRoutes.tournaments, icon: Trophy },
      { label: 'Divisions', href: managementRoutes.divisions, icon: Flag },
      { label: 'Venues', href: managementRoutes.venues, icon: MapPin },
    ],
  },
  {
    label: 'Division content',
    items: [
      { label: 'Teams', href: managementRoutes.teams, icon: Shield },
      { label: 'Players', href: managementRoutes.players, icon: UserCircle },
      { label: 'Matches', href: managementRoutes.matches, icon: Calendar },
      { label: 'Schedules', href: managementRoutes.schedules, icon: Calendar },
      { label: 'Standings', href: managementRoutes.standings, icon: BarChart2 },
      { label: 'Brackets', href: managementRoutes.brackets, icon: GitBranch },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Analytics', href: managementRoutes.analytics, icon: BarChart2 },
      { label: 'Users', href: managementRoutes.users, icon: Users },
      { label: 'Referees', href: managementRoutes.referees, icon: Shield },
      { label: 'Media', href: managementRoutes.media, icon: Image },
      { label: 'Settings', href: managementRoutes.settings, icon: Settings },
    ],
  },
];

export const adminNavItems = adminNavGroups.flatMap((group) => group.items);
