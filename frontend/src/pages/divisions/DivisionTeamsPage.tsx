import { useCallback } from 'react';
import QueryState from '@/components/shared/QueryState';
import SearchField from '@/components/shared/SearchField';
import SearchEmpty from '@/components/shared/SearchEmpty';
import TeamCard from '@/components/teams/TeamCard';
import DivisionPageHeader from '@/components/divisions/DivisionPageHeader';
import { useDivisionRoute } from '@/context/DivisionContext';
import { useDivisionTeams } from '@/hooks/useDivisionResources';
import { useListSearch } from '@/hooks/useListSearch';
import { teamSearchText } from '@/lib/search-text';

export default function DivisionTeamsPage() {
  const { tournamentSlug, divisionSlug } = useDivisionRoute();
  const { data: teams = [], isLoading, isError, refetch } = useDivisionTeams(
    tournamentSlug,
    divisionSlug,
  );

  const getText = useCallback((t: (typeof teams)[0]) => teamSearchText(t), []);
  const { search, setSearch, filtered, debouncedSearch, hasQuery } = useListSearch(
    teams,
    getText,
  );

  return (
    <>
      <DivisionPageHeader title="Teams" subtitle="Registered squads in this division" />
      {teams.length > 0 && (
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Search teams…"
          className="mb-5"
        />
      )}
      <QueryState
        isLoading={isLoading}
        isError={isError}
        isEmpty={teams.length === 0}
        onRetry={() => refetch()}
        emptyMessage="No teams in this division."
      >
        {hasQuery && filtered.length === 0 ? (
          <SearchEmpty query={debouncedSearch} entityLabel="teams" />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                tournamentSlug={tournamentSlug}
                divisionSlug={divisionSlug}
              />
            ))}
          </div>
        )}
      </QueryState>
    </>
  );
}
