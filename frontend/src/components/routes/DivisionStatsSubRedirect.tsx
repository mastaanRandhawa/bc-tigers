import { Navigate, useParams } from 'react-router-dom';
import { divisionStatsTabPath } from '@/lib/division-routes';

const TAB_MAP: Record<string, 'scorers' | 'assists' | 'discipline'> = {
  'top-scorers': 'scorers',
  'top-assists': 'assists',
  discipline: 'discipline',
};

/** Legacy stats sub-routes → tabbed `/stats?tab=` */
export default function DivisionStatsSubRedirect() {
  const { tournamentSlug = '', divisionSlug = '', statsSection = '' } = useParams();
  const tab = TAB_MAP[statsSection] ?? 'scorers';
  return (
    <Navigate
      to={divisionStatsTabPath(tournamentSlug, divisionSlug, tab)}
      replace
    />
  );
}
