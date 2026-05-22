import { Navigate, useParams } from 'react-router-dom';
import { divisionBracketsPath } from '@/lib/division-routes';

/** `/bracket` → `/brackets` */
export default function DivisionBracketAliasRedirect() {
  const { tournamentSlug = '', divisionSlug = '' } = useParams();
  return <Navigate to={divisionBracketsPath(tournamentSlug, divisionSlug)} replace />;
}
