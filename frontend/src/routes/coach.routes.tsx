import { Route } from 'react-router-dom';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { LazyPage } from '@/routes/LazyPage';
import { CoachDashboardPage } from '@/routes/lazy-pages';

function L({ children }: { children: React.ReactNode }) {
  return <LazyPage>{children}</LazyPage>;
}

export function coachRoutes() {
  return (
    <>
      <Route
        path="/coach"
        element={
          <ProtectedRoute coachOnly>
            <L><CoachDashboardPage /></L>
          </ProtectedRoute>
        }
      />
    </>
  );
}
