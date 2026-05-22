import { Route } from 'react-router-dom';
import { LazyPage } from '@/routes/LazyPage';
import { divisionRoutes } from '@/routes/division.routes';
import {
  TournamentsPage,
  TournamentLayout,
  TournamentDetailPage,
} from '@/routes/lazy-pages';

function L({ children }: { children: React.ReactNode }) {
  return <LazyPage>{children}</LazyPage>;
}

/** Tournament + division route subtree — /tournaments/* */
export function tournamentRoutes() {
  return (
    <>
      <Route path="/tournaments" element={<L><TournamentsPage /></L>} />
      <Route
        path="/tournaments/:tournamentSlug"
        element={<L><TournamentLayout /></L>}
      >
        <Route index element={<L><TournamentDetailPage /></L>} />
        {divisionRoutes()}
      </Route>
    </>
  );
}
