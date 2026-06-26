import { Navigate } from 'react-router-dom';
import { useDivisionRoute } from '@/context/DivisionContext';
import { isScheduleOnlyDivision } from '@/lib/division-display';

/** Redirects schedule-only divisions away from competitive pages (standings, stats, brackets). */
export function DivisionCompetitiveRouteGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { division, basePath } = useDivisionRoute();
  if (isScheduleOnlyDivision(division)) {
    return <Navigate to={basePath} replace />;
  }
  return children;
}
