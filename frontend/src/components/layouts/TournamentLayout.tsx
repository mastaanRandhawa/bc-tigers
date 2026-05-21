import { useParams } from 'react-router-dom';
import QueryState from '@/components/shared/QueryState';
import PageLoader from '@/components/shared/PageLoader';
import TournamentShell from '@/components/layouts/TournamentShell';
import { TournamentProvider } from '@/context/TournamentContext';
import { useTournament } from '@/hooks/useTournaments';
import { tournamentBasePath } from '@/lib/tournament-routes';

export default function TournamentLayout() {
  const { tournamentSlug = '' } = useParams();
  const { data: tournament, isLoading, isError, refetch } = useTournament(tournamentSlug);

  if (isLoading) {
    return <PageLoader />;
  }

  const basePath = tournamentBasePath(tournamentSlug);

  return (
    <QueryState
      isError={isError}
      isEmpty={!tournament}
      onRetry={() => refetch()}
      emptyMessage="Tournament not found."
    >
      {tournament && (
        <TournamentProvider value={{ tournament, tournamentSlug, basePath }}>
          <TournamentShell tournament={tournament} basePath={basePath} />
        </TournamentProvider>
      )}
    </QueryState>
  );
}
