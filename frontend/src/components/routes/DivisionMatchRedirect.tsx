import { Navigate, useParams } from 'react-router-dom';

/** Division-nested match URLs redirect to canonical global match page */
export default function DivisionMatchRedirect() {
  const { matchId } = useParams();
  if (!matchId) return <Navigate to="/tournaments" replace />;
  return <Navigate to={`/matches/${matchId}`} replace />;
}
