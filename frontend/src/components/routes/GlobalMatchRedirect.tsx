import { Navigate, useParams } from 'react-router-dom';
import PageLoader from '@/components/shared/PageLoader';
import { useMatch } from '@/hooks/useMatches';
import { getMatchPath } from '@/lib/division-routes';

/** Legacy `/matches/:matchId` → contextual division match URL */
export default function GlobalMatchRedirect() {
  const { matchId } = useParams();
  const { data: match, isLoading, isError } = useMatch(matchId);

  if (isLoading) return <PageLoader />;
  if (isError || !match) return <Navigate to="/tournaments" replace />;

  return <Navigate to={getMatchPath(match)} replace />;
}
