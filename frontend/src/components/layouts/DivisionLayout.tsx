import { useParams } from 'react-router-dom';
import QueryState from '@/components/shared/QueryState';
import PageLoader from '@/components/shared/PageLoader';
import DivisionShell from '@/components/layouts/DivisionShell';
import { DivisionProvider } from '@/context/DivisionContext';
import { useDivision } from '@/hooks/useDivisions';
import { divisionBasePath } from '@/lib/division-routes';
import { getDivisionTheme } from '@/lib/division-theme';

export default function DivisionLayout() {
  const { tournamentSlug = '', divisionSlug = '' } = useParams();
  const { data: division, isLoading, isError, refetch } = useDivision(
    tournamentSlug,
    divisionSlug,
  );

  if (isLoading) {
    return <PageLoader />;
  }

  const basePath = divisionBasePath(tournamentSlug, divisionSlug);
  const theme = division ? getDivisionTheme(division) : getDivisionTheme({ slug: divisionSlug });

  return (
    <QueryState
      isError={isError}
      isEmpty={!division}
      onRetry={() => refetch()}
      emptyMessage="Division not found."
    >
      {division && (
        <DivisionProvider
          value={{ division, tournamentSlug, divisionSlug, basePath, theme }}
        >
          <DivisionShell
            division={division}
            tournamentSlug={tournamentSlug}
            divisionSlug={divisionSlug}
            basePath={basePath}
            theme={theme}
          />
        </DivisionProvider>
      )}
    </QueryState>
  );
}
