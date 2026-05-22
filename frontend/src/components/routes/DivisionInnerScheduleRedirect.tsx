import { Navigate, useParams } from 'react-router-dom';
import { divisionMatchesCalendarPath } from '@/lib/division-routes';

/** Division nested `/schedule` → `/matches?view=calendar` */
export default function DivisionInnerScheduleRedirect() {
  const { tournamentSlug = '', divisionSlug = '' } = useParams();
  return <Navigate to={divisionMatchesCalendarPath(tournamentSlug, divisionSlug)} replace />;
}
