import { useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import QueryState from '@/components/shared/QueryState';
import SearchField from '@/components/shared/SearchField';
import SearchEmpty from '@/components/shared/SearchEmpty';
import Section from '@/components/shared/Section';
import SectionHeader from '@/components/shared/SectionHeader';
import MatchCard from '@/components/MatchCard';
import TeamHero from '@/components/teams/TeamHero';
import RosterList from '@/components/teams/RosterList';
import StatCard from '@/components/shared/StatCard';
import { useDivisionRoute } from '@/context/DivisionContext';
import {
  useDivisionTeam,
  useDivisionMatches,
  useDivisionStandingsResource,
} from '@/hooks/useDivisionResources';
import { useListSearch } from '@/hooks/useListSearch';
import { matchSearchText, playerSearchText } from '@/lib/search-text';
import type { Player } from '@/types';

export default function DivisionTeamDetailPage() {
  const { teamSlug = '' } = useParams();
  const { tournamentSlug, divisionSlug, theme } = useDivisionRoute();
  const { data: team, isLoading, isError, refetch } = useDivisionTeam(
    tournamentSlug,
    divisionSlug,
    teamSlug,
  );
  const { data: allMatches = [] } = useDivisionMatches(tournamentSlug, divisionSlug);
  const { data: standings = [] } = useDivisionStandingsResource(tournamentSlug, divisionSlug);

  const roster = useMemo(
    () => (team?.rosters?.map((r) => r.player).filter(Boolean) as Player[]) ?? [],
    [team],
  );

  const teamMatches = useMemo(
    () =>
      allMatches.filter((m) => m.home_team_id === team?.id || m.away_team_id === team?.id),
    [allMatches, team?.id],
  );

  const getPlayerText = useCallback((p: Player) => playerSearchText(p), []);
  const {
    search: rosterSearch,
    setSearch: setRosterSearch,
    filtered: filteredRoster,
    debouncedSearch: debouncedRosterSearch,
    hasQuery: hasRosterQuery,
  } = useListSearch(roster, getPlayerText);

  const getMatchText = useCallback((m: (typeof teamMatches)[0]) => matchSearchText(m), []);
  const {
    search: matchSearch,
    setSearch: setMatchSearch,
    filtered: filteredMatches,
    debouncedSearch: debouncedMatchSearch,
    hasQuery: hasMatchQuery,
  } = useListSearch(teamMatches, getMatchText);

  const standing = standings.find((s) => s.team_id === team?.id);

  return (
    <QueryState
      isLoading={isLoading}
      isError={isError}
      isEmpty={!team}
      onRetry={() => refetch()}
      emptyMessage="Team not found in this division."
    >
      {team && (
        <div className="space-y-5">
          <TeamHero team={team} />

          {standing && (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
              <StatCard value={standing.played} label="Played" theme={theme} />
              <StatCard value={standing.wins} label="Wins" theme={theme} />
              <StatCard value={standing.points} label="Points" accent theme={theme} />
              <StatCard
                value={
                  standing.goal_difference > 0
                    ? `+${standing.goal_difference}`
                    : standing.goal_difference
                }
                label="Goal diff"
                theme={theme}
              />
            </div>
          )}

          <Section>
            <SectionHeader title="Roster" />
            {roster.length > 0 && (
              <SearchField
                value={rosterSearch}
                onChange={setRosterSearch}
                placeholder="Search players…"
                className="mb-4 max-w-md"
              />
            )}
            {hasRosterQuery && filteredRoster.length === 0 ? (
              <SearchEmpty query={debouncedRosterSearch} entityLabel="players" />
            ) : (
              <RosterList
                players={filteredRoster}
                tournamentSlug={tournamentSlug}
                divisionSlug={divisionSlug}
                teamSlug={teamSlug}
              />
            )}
          </Section>

          <Section>
            <SectionHeader title="Matches" />
            {teamMatches.length > 0 && (
              <SearchField
                value={matchSearch}
                onChange={setMatchSearch}
                placeholder="Search opponents or venue…"
                className="mb-4 max-w-md"
              />
            )}
            {hasMatchQuery && filteredMatches.length === 0 ? (
              <SearchEmpty query={debouncedMatchSearch} entityLabel="matches" />
            ) : filteredMatches.length > 0 ? (
              <div className="divide-y divide-border">
                {filteredMatches.map((m) => (
                  <MatchCard key={m.id} match={m} flat />
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500">No matches for this team yet.</p>
            )}
          </Section>
        </div>
      )}
    </QueryState>
  );
}
