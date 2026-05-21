import { useParams } from 'react-router-dom';
import QueryState from '@/components/shared/QueryState';
import PageLoader from '@/components/shared/PageLoader';
import TeamShell from '@/components/layouts/TeamShell';
import { TeamProvider } from '@/context/TeamContext';
import { useDivisionRoute } from '@/context/DivisionContext';
import { useDivisionTeam } from '@/hooks/useDivisionResources';
import { teamBasePath } from '@/lib/team-routes';

export default function TeamLayout() {
  const { teamSlug = '' } = useParams();
  const { tournamentSlug, divisionSlug, theme, division } = useDivisionRoute();
  const { data: team, isLoading, isError, refetch } = useDivisionTeam(
    tournamentSlug,
    divisionSlug,
    teamSlug,
  );

  if (isLoading) {
    return <PageLoader />;
  }

  const basePath = teamBasePath(tournamentSlug, divisionSlug, teamSlug);

  return (
    <QueryState
      isError={isError}
      isEmpty={!team}
      onRetry={() => refetch()}
      emptyMessage="Team not found in this division."
    >
      {team && (
        <TeamProvider
          value={{
            team,
            teamSlug,
            tournamentSlug,
            divisionSlug,
            basePath,
            theme,
          }}
        >
          <TeamShell
            team={team}
            tournamentSlug={tournamentSlug}
            divisionSlug={divisionSlug}
            divisionName={division.name}
            tournamentName={division.tournament?.name ?? tournamentSlug}
            theme={theme}
          />
        </TeamProvider>
      )}
    </QueryState>
  );
}
