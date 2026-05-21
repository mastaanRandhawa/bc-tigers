import { Outlet } from 'react-router-dom';
import {
  Users,
  Calendar,
  Swords,
  Trophy,
  TrendingUp,
  GitBranch,
  MapPin,
  LayoutDashboard,
  BookOpen,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import ContextShell from '@/components/layouts/ContextShell';
import DivisionHero from '@/components/divisions/DivisionHero';
import type { SegmentedNavItem } from '@/components/design-system/SegmentedNav';
import { divisionThemeStyle, type DivisionTheme } from '@/lib/division-theme';
import type { Division } from '@/types';

export type DivisionNavItem = SegmentedNavItem & { icon: LucideIcon };

interface DivisionShellProps {
  division: Division;
  tournamentSlug: string;
  divisionSlug: string;
  basePath: string;
  theme: DivisionTheme;
}

export function buildDivisionNavItems(basePath: string): DivisionNavItem[] {
  return [
    { label: 'Overview', href: basePath, icon: LayoutDashboard, end: true },
    { label: 'Teams', href: `${basePath}/teams`, icon: Users },
    { label: 'Schedule', href: `${basePath}/schedule`, icon: Calendar },
    { label: 'Standings', href: `${basePath}/standings`, icon: Trophy },
    { label: 'Matches', href: `${basePath}/matches`, icon: Swords },
    { label: 'Stats', href: `${basePath}/stats`, icon: TrendingUp },
    { label: 'Brackets', href: `${basePath}/brackets`, icon: GitBranch },
    { label: 'Venues', href: `${basePath}/venues`, icon: MapPin },
    { label: 'Rules', href: `${basePath}/rules`, icon: BookOpen },
  ];
}

export function splitDivisionNavItems(items: DivisionNavItem[]) {
  return {
    primary: items.slice(0, 5),
    more: items.slice(5),
  };
}

export default function DivisionShell({
  division,
  basePath,
  theme,
}: DivisionShellProps) {
  const navItems = buildDivisionNavItems(basePath);
  const tournament = division.tournament;

  const breadcrumbItems = [
    { label: 'Tournaments', href: '/tournaments' },
    ...(tournament
      ? [{ label: tournament.name, href: `/tournaments/${tournament.slug}` }]
      : []),
    { label: division.name },
  ];

  return (
    <ContextShell
      hero={<DivisionHero division={division} theme={theme} />}
      breadcrumbItems={breadcrumbItems}
      navItems={navItems}
      theme={theme}
      themeStyle={divisionThemeStyle(theme)}
      divisionId={division.id}
      accentBar
      navPrimaryCount={5}
    >
      <Outlet />
    </ContextShell>
  );
}
