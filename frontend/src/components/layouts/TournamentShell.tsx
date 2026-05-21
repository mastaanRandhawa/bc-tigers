import { Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Flag,
  Image,
  Newspaper,
  Award,
  BookOpen,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import ContextShell from '@/components/layouts/ContextShell';
import TournamentHero from '@/components/tournaments/TournamentHero';
import type { SegmentedNavItem } from '@/components/design-system/SegmentedNav';
import { useMatches } from '@/hooks/useMatches';
import type { Tournament } from '@/types';

export type TournamentNavItem = SegmentedNavItem & { icon: LucideIcon };

interface TournamentShellProps {
  tournament: Tournament;
  basePath: string;
}

export function buildTournamentNavItems(basePath: string): TournamentNavItem[] {
  return [
    { label: 'Overview', href: basePath, icon: LayoutDashboard, end: true },
    { label: 'Divisions', href: `${basePath}/divisions`, icon: Flag },
    { label: 'Media', href: `${basePath}/media`, icon: Image },
    { label: 'News', href: `${basePath}/news`, icon: Newspaper },
    { label: 'Sponsors', href: `${basePath}/sponsors`, icon: Award },
    { label: 'Rules', href: `${basePath}/rules`, icon: BookOpen },
  ];
}

export function splitTournamentNavItems(items: TournamentNavItem[]) {
  return {
    primary: items.slice(0, 5),
    more: items.slice(5),
  };
}

export default function TournamentShell({ tournament, basePath }: TournamentShellProps) {
  const navItems = buildTournamentNavItems(basePath);
  const { data: matches = [] } = useMatches({ tournamentId: tournament.id });
  const liveCount = matches.filter((m) => m.status === 'LIVE').length;

  return (
    <ContextShell
      hero={<TournamentHero tournament={tournament} liveMatchCount={liveCount} />}
      breadcrumbItems={[
        { label: 'Tournaments', href: '/tournaments' },
        { label: tournament.name },
      ]}
      navItems={navItems}
      tickerVariant="dark"
      navPrimaryCount={5}
      rootClassName="bg-surface-muted"
    >
      <Outlet />
    </ContextShell>
  );
}
