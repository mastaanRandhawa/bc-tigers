import { useCallback } from 'react';
import TeamCard from '@/components/teams/TeamCard';
import DivisionPageHeader from '@/components/divisions/DivisionPageHeader';
import ResourceList from '@/components/shared/ResourceList';
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
  const { search, setSearch, filtered, debouncedSearch, hasQuery } = useListSearch(teams, getText);

  return (
    <>
      <DivisionPageHeader title="Teams" subtitle="Registered squads in this division" />
      <ResourceList
        items={filtered}
        totalCount={teams.length}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search teams…"
        debouncedSearch={debouncedSearch}
        hasQuery={hasQuery}
        entityLabel="teams"
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        emptyMessage="No teams in this division."
      >
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
      </ResourceList>
    </>
  );
}
