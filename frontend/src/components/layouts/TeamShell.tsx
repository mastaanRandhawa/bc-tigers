import { Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Swords,
  Trophy,
  TrendingUp,
  UserCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import ContextShell from '@/components/layouts/ContextShell';
import TeamHero from '@/components/teams/TeamHero';
import type { SegmentedNavItem } from '@/components/design-system/SegmentedNav';
import { divisionBasePath } from '@/lib/division-routes';
import { teamBasePath } from '@/lib/team-routes';
import { divisionThemeStyle, type DivisionTheme } from '@/lib/division-theme';
import type { Team } from '@/types';

export type TeamNavItem = SegmentedNavItem & { icon: LucideIcon };

interface TeamShellProps {
  team: Team;
  tournamentSlug: string;
  divisionSlug: string;
  divisionName: string;
  tournamentName: string;
  theme: DivisionTheme;
}

export function buildTeamNavItems(
  tournamentSlug: string,
  divisionSlug: string,
  teamSlug: string,
): TeamNavItem[] {
  const base = teamBasePath(tournamentSlug, divisionSlug, teamSlug);
  return [
    { label: 'Overview', href: base, icon: LayoutDashboard, end: true },
    { label: 'Roster', href: `${base}/roster`, icon: Users },
    { label: 'Matches', href: `${base}/matches`, icon: Swords },
    { label: 'Standings', href: `${base}/standings`, icon: Trophy },
    { label: 'Stats', href: `${base}/stats`, icon: TrendingUp },
    { label: 'Coaches', href: `${base}/coaches`, icon: UserCircle },
  ];
}

export function splitTeamNavItems(items: TeamNavItem[]) {
  return {
    primary: items.slice(0, 5),
    more: items.slice(5),
  };
}

export default function TeamShell({
  team,
  tournamentSlug,
  divisionSlug,
  divisionName,
  tournamentName,
  theme,
}: TeamShellProps) {
  const divisionPath = divisionBasePath(tournamentSlug, divisionSlug);
  const navItems = buildTeamNavItems(tournamentSlug, divisionSlug, team.slug);

  return (
    <ContextShell
      hero={<TeamHero team={team} />}
      breadcrumbItems={[
        { label: 'Tournaments', href: '/tournaments' },
        { label: tournamentName, href: `/tournaments/${tournamentSlug}` },
        { label: divisionName, href: divisionPath },
        { label: 'Teams', href: `${divisionPath}/teams` },
        { label: team.name },
      ]}
      navItems={navItems}
      theme={theme}
      themeStyle={divisionThemeStyle(theme)}
      accentBar
      navPrimaryCount={5}
    >
      <Outlet />
    </ContextShell>
  );
}
