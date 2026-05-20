import { Navigate, useLocation, useParams } from 'react-router-dom';
import PageLoader from '@/components/shared/PageLoader';
import { useDivisionLookup } from '@/hooks/useDivisionResources';
import { divisionBasePath } from '@/lib/division-routes';
import type { Division } from '@/types';

export default function DivisionSlugRedirect() {
  const { divisionSlug = '' } = useParams();
  const location = useLocation();
  const section = location.pathname.split('/')[1] as 'schedule' | 'standings' | 'brackets';
  const { data, isLoading, isError } = useDivisionLookup(divisionSlug);

  if (isLoading) return <PageLoader />;

  const division = Array.isArray(data) ? data[0] : (data as Division | undefined);
  if (isError || !division?.tournament) {
    return <Navigate to="/tournaments" replace />;
  }

  const tournamentSlug = division.tournament.slug;
  const suffix = section === 'brackets' ? 'brackets' : section;
  const target = `${divisionBasePath(tournamentSlug, division.slug)}/${suffix}`;

  return <Navigate to={target} replace />;
}
