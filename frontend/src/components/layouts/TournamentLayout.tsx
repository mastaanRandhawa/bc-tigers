import { Outlet, useParams } from 'react-router-dom';
import PageLayout from '@/components/PageLayout';
import QueryState from '@/components/shared/QueryState';
import PageLoader from '@/components/shared/PageLoader';
import { TournamentProvider } from '@/context/TournamentContext';
import { useTournament } from '@/hooks/useTournaments';

export default function TournamentLayout() {
  const { tournamentSlug = '' } = useParams();
  const { data: tournament, isLoading, isError, refetch } = useTournament(tournamentSlug);

  if (isLoading) {
    return (
      <PageLayout showFooter={false}>
        <PageLoader />
      </PageLayout>
    );
  }

  return (
    <PageLayout showFooter={false}>
      <QueryState
        isError={isError}
        isEmpty={!tournament}
        onRetry={() => refetch()}
        emptyMessage="Tournament not found."
      >
        {tournament && (
          <TournamentProvider value={{ tournament, tournamentSlug }}>
            <Outlet />
          </TournamentProvider>
        )}
      </QueryState>
    </PageLayout>
  );
}
