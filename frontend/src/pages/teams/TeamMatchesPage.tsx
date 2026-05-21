import { useCallback, useMemo } from 'react';
import SearchField from '@/components/shared/SearchField';
import SearchEmpty from '@/components/shared/SearchEmpty';
import Section from '@/components/shared/Section';
import SectionHeader from '@/components/shared/SectionHeader';
import MatchCard from '@/components/MatchCard';
import { useTeamRoute } from '@/context/TeamContext';
import { useDivisionMatches } from '@/hooks/useDivisionResources';
import { useListSearch } from '@/hooks/useListSearch';
import { matchSearchText } from '@/lib/search-text';

export default function TeamMatchesPageContent() {
  const { team, tournamentSlug, divisionSlug } = useTeamRoute();
  const { data: allMatches = [] } = useDivisionMatches(tournamentSlug, divisionSlug);

  const teamMatches = useMemo(
    () =>
      allMatches.filter((m) => m.home_team_id === team.id || m.away_team_id === team.id),
    [allMatches, team.id],
  );

  const getMatchText = useCallback((m: (typeof teamMatches)[0]) => matchSearchText(m), []);
  const {
    search,
    setSearch,
    filtered,
    debouncedSearch,
    hasQuery,
  } = useListSearch(teamMatches, getMatchText);

  return (
    <Section>
      <SectionHeader title="Matches" />
      {teamMatches.length > 0 && (
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Search opponents or venue…"
          className="mb-4 max-w-md"
        />
      )}
      {hasQuery && filtered.length === 0 ? (
        <SearchEmpty query={debouncedSearch} entityLabel="matches" />
      ) : filtered.length > 0 ? (
        <div className="divide-y divide-border">
          {filtered.map((m) => (
            <MatchCard key={m.id} match={m} flat />
          ))}
        </div>
      ) : (
        <p className="text-sm text-zinc-500">No matches for this team yet.</p>
      )}
    </Section>
  );
}
