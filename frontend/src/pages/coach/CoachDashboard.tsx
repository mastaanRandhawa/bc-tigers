import { Link } from 'react-router-dom';
import PortalLayout from '@/components/layouts/PortalLayout';
import QueryState from '@/components/shared/QueryState';
import Section from '@/components/shared/Section';
import SectionHeader from '@/components/shared/SectionHeader';
import { useTeams } from '@/hooks/useTeams';
import { useMatches } from '@/hooks/useMatches';
import { useTournaments } from '@/hooks/useTournaments';
import { useAuthStore } from '@/store/authStore';
import { formatDate, formatTime } from '@/lib/utils';
import { getMatchPath, getTeamPath, getDivisionMatchesPath } from '@/lib/division-routes';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Trophy,
  Clock,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect } from 'react';
import SearchField from '@/components/shared/SearchField';
import SearchEmpty from '@/components/shared/SearchEmpty';
import { useListSearch } from '@/hooks/useListSearch';
import { matchSearchText, teamSearchText } from '@/lib/search-text';

const nav = [
  { label: 'Dashboard', href: '/coach', icon: LayoutDashboard },
  { label: 'Tournaments', href: '/tournaments', icon: Trophy },
];

export default function CoachDashboard() {
  const { user, refreshUser } = useAuthStore();
  const { data: teams = [], isLoading: teamsLoading } = useTeams();
  const { data: matches = [], isLoading: matchesLoading } = useMatches();
  const { data: tournaments = [] } = useTournaments();

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const myTeamIds = new Set(
    user?.coach?.team_coaches?.map((tc) => tc.team?.id).filter(Boolean) as string[]
  );
  const myTeams = myTeamIds.size > 0 ? teams.filter((t) => myTeamIds.has(t.id)) : teams;
  const primaryTeam = myTeams[0];
  const matchesPath = primaryTeam?.division
    ? getDivisionMatchesPath(primaryTeam.division)
    : '/tournaments';

  const myMatches = myTeamIds.size > 0
    ? matches.filter((m) => myTeamIds.has(m.home_team_id) || myTeamIds.has(m.away_team_id))
    : matches;

  const upcoming = myMatches
    .filter((m) => m.status === 'SCHEDULED')
    .sort((a, b) => new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime())
    .slice(0, 6);

  const live = myMatches.filter((m) => m.status === 'LIVE');
  const livePath = live[0] ? getMatchPath(live[0]) : matchesPath ?? '/tournaments';

  const getMatchText = useCallback((m: (typeof upcoming)[0]) => matchSearchText(m), []);
  const {
    search: matchSearch,
    setSearch: setMatchSearch,
    filtered: filteredUpcoming,
    debouncedSearch: debouncedMatchSearch,
    hasQuery: hasMatchQuery,
  } = useListSearch(upcoming, getMatchText);

  const getTeamText = useCallback((t: (typeof myTeams)[0]) => teamSearchText(t), []);
  const {
    search: teamSearch,
    setSearch: setTeamSearch,
    filtered: filteredTeams,
    debouncedSearch: debouncedTeamSearch,
    hasQuery: hasTeamQuery,
  } = useListSearch(myTeams, getTeamText);

  const stats = [
    { label: 'Teams', value: myTeams.length, icon: Users, href: primaryTeam ? (getTeamPath(primaryTeam) ?? '/tournaments') : '/tournaments' },
    { label: 'Upcoming', value: upcoming.length, icon: Clock, href: matchesPath ?? '/tournaments' },
    { label: 'Live Now', value: live.length, icon: Zap, href: livePath },
    { label: 'Tournaments', value: tournaments.length, icon: Trophy, href: '/tournaments' },
  ];

  return (
    <PortalLayout title="Coach Portal" subtitle="Team Management" nav={nav}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {stats.map((stat) => (
          <Link key={stat.label} to={stat.href} className="group">
            <div className="portal-stat-card">
              <div className="portal-stat-icon">
                <stat.icon className="w-5 h-5" aria-hidden />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground tabular-nums">{stat.value}</p>
                <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Section className="p-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
            <SectionHeader
              title="Upcoming Matches"
              href={matchesPath ?? '/tournaments'}
              linkLabel="All Matches"
              className="mb-0"
            />
          </div>
          {upcoming.length > 3 && (
            <div className="border-b border-border px-4 py-2">
              <SearchField
                value={matchSearch}
                onChange={setMatchSearch}
                placeholder="Search matches…"
                className="max-w-full"
              />
            </div>
          )}
          <QueryState
            isLoading={matchesLoading}
            isEmpty={upcoming.length === 0}
            emptyMessage="No upcoming matches"
          >
            {hasMatchQuery && filteredUpcoming.length === 0 ? (
              <SearchEmpty query={debouncedMatchSearch} entityLabel="matches" />
            ) : (
              <div className="divide-y divide-border">
                {filteredUpcoming.map((m) => (
                  <Link
                    key={m.id}
                    to={getMatchPath(m)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors"
                  >
                    <div className="flex-1 min-w-0 text-sm">
                      <p className="font-semibold text-foreground truncate">
                        {m.home_team?.name} vs {m.away_team?.name}
                      </p>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        {formatDate(m.scheduled_start)} · {formatTime(m.scheduled_start)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </QueryState>
        </Section>

        <Section className="p-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
            <SectionHeader
              title="Teams"
              href="/tournaments"
              linkLabel="Browse Tournaments"
              className="mb-0"
            />
          </div>
          {myTeams.length > 3 && (
            <div className="border-b border-border px-4 py-2">
              <SearchField
                value={teamSearch}
                onChange={setTeamSearch}
                placeholder="Search teams…"
                className="max-w-full"
              />
            </div>
          )}
          <QueryState isLoading={teamsLoading} isEmpty={myTeams.length === 0} emptyMessage="No teams assigned">
            {hasTeamQuery && filteredTeams.length === 0 ? (
              <SearchEmpty query={debouncedTeamSearch} entityLabel="teams" />
            ) : (
              <div className="divide-y divide-border">
                {filteredTeams.slice(0, 6).map((team) => (
                  <Link
                    key={team.id}
                    to={getTeamPath(team) ?? '/tournaments'}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors"
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ backgroundColor: team.primary_color ?? 'var(--color-primary)' }}
                      aria-hidden
                    >
                      {team.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0 text-sm">
                      <p className="font-semibold text-foreground truncate">{team.name}</p>
                      <p className="text-muted-foreground text-xs">{team.division?.name ?? 'Division'}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </QueryState>
        </Section>
      </div>
    </PortalLayout>
  );
}
