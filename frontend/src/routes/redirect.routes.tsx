import { Route } from 'react-router-dom';
import { LazyPage } from '@/routes/LazyPage';
import BlockedGlobalRoute from '@/components/routes/BlockedGlobalRoute';
import GlobalMatchRedirect from '@/components/routes/GlobalMatchRedirect';
import { DivisionSlugRedirect } from '@/routes/lazy-pages';

function L({ children }: { children: React.ReactNode }) {
  return <LazyPage>{children}</LazyPage>;
}

/**
 * Legacy redirects + blocked global resource paths.
 * These prevent direct navigation to /teams, /divisions, /players
 * (all content is scoped under tournament/division slugs).
 */
export function redirectRoutes() {
  return (
    <>
      {/* Blocked global resource paths */}
      <Route path="/teams" element={<BlockedGlobalRoute />} />
      <Route path="/teams/*" element={<BlockedGlobalRoute />} />
      <Route path="/divisions" element={<BlockedGlobalRoute />} />
      <Route path="/divisions/*" element={<BlockedGlobalRoute />} />
      <Route path="/players" element={<BlockedGlobalRoute />} />
      <Route path="/players/*" element={<BlockedGlobalRoute />} />

      {/* Global match resolver — redirects to division-scoped match page */}
      <Route path="/matches/:matchId" element={<L><GlobalMatchRedirect /></L>} />

      {/* Legacy slug-based redirects */}
      <Route path="/schedule/:divisionSlug" element={<L><DivisionSlugRedirect /></L>} />
      <Route path="/standings/:divisionSlug" element={<L><DivisionSlugRedirect /></L>} />
      <Route path="/brackets/:divisionSlug" element={<L><DivisionSlugRedirect /></L>} />
    </>
  );
}
