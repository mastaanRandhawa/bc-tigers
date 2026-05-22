import { Route } from 'react-router-dom';
import { LazyPage } from '@/routes/LazyPage';
import DivisionInnerScheduleRedirect from '@/components/routes/DivisionInnerScheduleRedirect';
import DivisionStatsSubRedirect from '@/components/routes/DivisionStatsSubRedirect';
import DivisionBracketAliasRedirect from '@/components/routes/DivisionBracketAliasRedirect';
import {
  DivisionLayout,
  DivisionOverviewPage,
  DivisionTeamsPage,
  DivisionTeamDetailPage,
  DivisionPlayerDetailPage,
  DivisionPlayersListRedirect,
  DivisionPlayerLegacyRedirect,
  DivisionMatchesAndSchedulePage,
  DivisionMatchDetailPage,
  DivisionStandingsPage,
  DivisionStatsPage,
  DivisionBracketPage,
  DivisionVenuesPage,
  DivisionVenueDetailPage,
} from '@/routes/lazy-pages';

function L({ children }: { children: React.ReactNode }) {
  return <LazyPage>{children}</LazyPage>;
}

/**
 * Division route subtree — nested under
 * /tournaments/:tournamentSlug/divisions/:divisionSlug
 */
export function divisionRoutes() {
  return (
    <Route
      path="divisions/:divisionSlug"
      element={<L><DivisionLayout /></L>}
    >
      <Route index element={<L><DivisionOverviewPage /></L>} />
      <Route path="teams" element={<L><DivisionTeamsPage /></L>} />
      <Route path="teams/:teamSlug" element={<L><DivisionTeamDetailPage /></L>} />
      <Route path="teams/:teamSlug/players/:playerId" element={<L><DivisionPlayerDetailPage /></L>} />
      <Route path="players" element={<L><DivisionPlayersListRedirect /></L>} />
      <Route path="players/:playerId" element={<L><DivisionPlayerLegacyRedirect /></L>} />
      <Route path="schedule" element={<DivisionInnerScheduleRedirect />} />
      <Route path="matches" element={<L><DivisionMatchesAndSchedulePage /></L>} />
      <Route path="matches/:matchId" element={<L><DivisionMatchDetailPage /></L>} />
      <Route path="standings" element={<L><DivisionStandingsPage /></L>} />
      <Route path="stats" element={<L><DivisionStatsPage /></L>} />
      <Route path="stats/:statsSection" element={<DivisionStatsSubRedirect />} />
      <Route path="bracket" element={<DivisionBracketAliasRedirect />} />
      <Route path="brackets" element={<L><DivisionBracketPage /></L>} />
      <Route path="venues" element={<L><DivisionVenuesPage /></L>} />
      <Route path="venues/:venueSlug" element={<L><DivisionVenueDetailPage /></L>} />
    </Route>
  );
}
