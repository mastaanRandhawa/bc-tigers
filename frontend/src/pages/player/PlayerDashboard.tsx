import { Link } from 'react-router-dom';
import PortalLayout from '@/components/layouts/PortalLayout';
import QueryState from '@/components/shared/QueryState';
import Section from '@/components/shared/Section';
import SectionHeader from '@/components/shared/SectionHeader';
import { useMatches } from '@/hooks/useMatches';
import { useTopScorers } from '@/hooks/useStats';
import { useTournaments } from '@/hooks/useTournaments';
import { useAuthStore } from '@/store/authStore';
import { formatDate, formatTime } from '@/lib/utils';
import { getMatchPath, getDivisionMatchesPath, getDivisionStatsPath } from '@/lib/division-routes';
import {
  LayoutDashboard,
  Calendar,
  Trophy,
  Clock,
  Target,
} from 'lucide-react';
import { useCallback, useEffect } from 'react';
import SearchField from '@/components/shared/SearchField';
import SearchEmpty from '@/components/shared/SearchEmpty';
import { useListSearch } from '@/hooks/useListSearch';
import { matchSearchText, playerStatSearchText } from '@/lib/search-text';

const nav = [
  { label: 'Dashboard', href: '/player', icon: LayoutDashboard },
  { label: 'Tournaments', href: '/tournaments', icon: Trophy },
];

export default function PlayerDashboard() {
  const { user, refreshUser } = useAuthStore();
  const { data: matches = [], isLoading: matchesLoading } = useMatches();
  const { data: scorers = [], isLoading: scorersLoading } = useTopScorers({ limit: 5 });
  const { data: tournaments = [] } = useTournaments();

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const myTeamIds = new Set(
    user?.player?.rosters?.map((r) => r.team?.id).filter(Boolean) as string[]
  );
  const myDivision = user?.player?.rosters?.[0]?.team?.division;
  const matchesPath = myDivision ? getDivisionMatchesPath(myDivision) : '/tournaments';
  const statsPath = myDivision ? getDivisionStatsPath(myDivision) ?? '/tournaments' : '/tournaments';

  const myMatches = myTeamIds.size > 0
    ? matches.filter((m) => myTeamIds.has(m.home_team_id) || myTeamIds.has(m.away_team_id))
    : matches;

  const upcomingAll = myMatches
    .filter((m) => m.status === 'SCHEDULED')
    .sort((a, b) => new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime());

  const getMatchText = useCallback((m: (typeof upcomingAll)[0]) => matchSearchText(m), []);
  const {
    search: matchSearch,
    setSearch: setMatchSearch,
    filtered: filteredUpcoming,
    debouncedSearch: debouncedMatchSearch,
    hasQuery: hasMatchQuery,
  } = useListSearch(upcomingAll, getMatchText);

  const displayUpcoming = hasMatchQuery ? filteredUpcoming : filteredUpcoming.slice(0, 5);

  const getScorerText = useCallback((e: (typeof scorers)[0]) => playerStatSearchText(e), []);
  const {
    search: scorerSearch,
    setSearch: setScorerSearch,
    filtered: filteredScorers,
    debouncedSearch: debouncedScorerSearch,
    hasQuery: hasScorerQuery,
  } = useListSearch(scorers, getScorerText);

  const stats = [
    { label: 'Upcoming', value: upcomingAll.length, icon: Clock, href: matchesPath ?? '/tournaments' },
    { label: 'My Teams', value: myTeamIds.size, icon: Calendar, href: '/tournaments' },
    { label: 'Top Scorers', value: scorers.length, icon: Target, href: statsPath },
    { label: 'Tournaments', value: tournaments.length, icon: Trophy, href: '/tournaments' },
  ];

  return (
    <PortalLayout title="Player Portal" subtitle="Your Tournament Hub" nav={nav}>
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
          {upcomingAll.length > 3 && (
            <div className="border-b border-border px-4 py-2">
              <SearchField
                value={matchSearch}
                onChange={setMatchSearch}
                placeholder="Search matches…"
                className="max-w-full"
              />
            </div>
          )}
          <QueryState isLoading={matchesLoading} isEmpty={upcomingAll.length === 0} emptyMessage="No upcoming matches">
            {hasMatchQuery && displayUpcoming.length === 0 ? (
              <SearchEmpty query={debouncedMatchSearch} entityLabel="matches" />
            ) : (
              <div className="divide-y divide-border">
                {displayUpcoming.map((m) => (
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
              title="Top Scorers"
              href={statsPath}
              linkLabel="Full Stats"
              className="mb-0"
            />
          </div>
          {scorers.length > 3 && (
            <div className="border-b border-border px-4 py-2">
              <SearchField
                value={scorerSearch}
                onChange={setScorerSearch}
                placeholder="Search scorers…"
                className="max-w-full"
              />
            </div>
          )}
          <QueryState isLoading={scorersLoading} isEmpty={scorers.length === 0} emptyMessage="No stats available">
            {hasScorerQuery && filteredScorers.length === 0 ? (
              <SearchEmpty query={debouncedScorerSearch} entityLabel="scorers" />
            ) : (
              <div className="divide-y divide-border">
                {filteredScorers.map((entry, i) => (
                  <div key={entry.player_id ?? i} className="flex items-center gap-3 px-4 py-3">
                    <span className="w-6 text-center text-sm font-bold text-muted-foreground tabular-nums shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0 text-sm">
                      <p className="font-semibold text-foreground truncate">
                        {entry.player?.first_name} {entry.player?.last_name}
                      </p>
                      <p className="text-muted-foreground text-xs">{entry.team?.name ?? entry.player?.team?.name ?? '—'}</p>
                    </div>
                    <span className="text-lg font-bold text-primary tabular-nums shrink-0">
                      {entry.goals ?? 0}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </QueryState>
        </Section>
      </div>
    </PortalLayout>
  );
}
