import { Route } from 'react-router-dom';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { LazyPage } from '@/routes/LazyPage';
import {
  CoachDashboard,
  RefereeDashboard,
  PlayerDashboard,
} from '@/routes/lazy-pages';

function L({ children }: { children: React.ReactNode }) {
  return <LazyPage>{children}</LazyPage>;
}

/** Role portal routes — coach, player, referee dashboards */
export function portalRoutes() {
  return (
    <>
      <Route
        path="/coach"
        element={
          <ProtectedRoute allowedRoles={['COACH', 'ADMIN', 'TOURNAMENT_ADMIN']}>
            <L><CoachDashboard /></L>
          </ProtectedRoute>
        }
      />
      <Route
        path="/referee"
        element={
          <ProtectedRoute allowedRoles={['REFEREE', 'ADMIN', 'TOURNAMENT_ADMIN']}>
            <L><RefereeDashboard /></L>
          </ProtectedRoute>
        }
      />
      <Route
        path="/player"
        element={
          <ProtectedRoute allowedRoles={['PLAYER', 'ADMIN', 'TOURNAMENT_ADMIN']}>
            <L><PlayerDashboard /></L>
          </ProtectedRoute>
        }
      />
    </>
  );
}
