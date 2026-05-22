import PortalLayout from '@/components/layouts/PortalLayout';
import PortalStatGrid from '@/components/shared/PortalStatGrid';
import PortalMatchList from '@/components/shared/PortalMatchList';
import QueryState from '@/components/shared/QueryState';
import Section from '@/components/shared/Section';
import SectionHeader from '@/components/shared/SectionHeader';
import SearchField from '@/components/shared/SearchField';
import SearchEmpty from '@/components/shared/SearchEmpty';
import { useMatches } from '@/hooks/useMatches';
import { useTopScorers } from '@/hooks/useStats';
import { useTournaments } from '@/hooks/useTournaments';
import { useAuthStore } from '@/store/authStore';
import { getDivisionMatchesPath, getDivisionStatsPath } from '@/lib/division-routes';
import { LayoutDashboard, Trophy, Clock, Target, Calendar } from 'lucide-react';
import { useCallback, useEffect } from 'react';
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

  useEffect(() => { refreshUser(); }, [refreshUser]);

  const myTeamIds = new Set(
    user?.player?.rosters?.map((r) => r.team?.id).filter(Boolean) as string[],
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
    search: matchSearch, setSearch: setMatchSearch,
    filtered: filteredUpcoming, debouncedSearch: debouncedMatchSearch, hasQuery: hasMatchQuery,
  } = useListSearch(upcomingAll, getMatchText);

  const displayUpcoming = hasMatchQuery ? filteredUpcoming : filteredUpcoming.slice(0, 5);

  const getScorerText = useCallback((e: (typeof scorers)[0]) => playerStatSearchText(e), []);
  const {
    search: scorerSearch, setSearch: setScorerSearch,
    filtered: filteredScorers, debouncedSearch: debouncedScorerSearch, hasQuery: hasScorerQuery,
  } = useListSearch(scorers, getScorerText);

  const stats = [
    { label: 'Upcoming', value: upcomingAll.length, icon: Clock, href: matchesPath ?? '/tournaments' },
    { label: 'My Teams', value: myTeamIds.size, icon: Calendar, href: '/tournaments' },
    { label: 'Top Scorers', value: scorers.length, icon: Target, href: statsPath },
    { label: 'Tournaments', value: tournaments.length, icon: Trophy, href: '/tournaments' },
  ];

  return (
    <PortalLayout title="Player Portal" subtitle="Your Tournament Hub" nav={nav}>
      <PortalStatGrid stats={stats} columns={4} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <PortalMatchList
          title="Upcoming Matches"
          matches={upcomingAll}
          search={matchSearch}
          onSearchChange={setMatchSearch}
          filteredMatches={displayUpcoming}
          debouncedSearch={debouncedMatchSearch}
          hasQuery={hasMatchQuery}
          isLoading={matchesLoading}
          emptyMessage="No upcoming matches"
          href={matchesPath ?? '/tournaments'}
          linkLabel="All Matches"
        />

        <Section className="p-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
            <SectionHeader title="Top Scorers" href={statsPath} linkLabel="Full Stats" className="mb-0" />
          </div>
          {scorers.length > 3 && (
            <div className="border-b border-border px-4 py-2">
              <SearchField value={scorerSearch} onChange={setScorerSearch} placeholder="Search scorers…" className="max-w-full" />
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
                      <p className="text-muted-foreground text-xs">
                        {entry.team?.name ?? entry.player?.team?.name ?? '—'}
                      </p>
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
