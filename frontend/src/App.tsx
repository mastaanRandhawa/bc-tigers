import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { LazyPage } from '@/routes/LazyPage';
import {
  HomePage,
  AboutPage,
  ContactPage,
  NewsPage,
  NewsDetailPage,
  GalleryPage,
  RulesPage,
  TournamentsPage,
  TournamentDetailPage,
  DivisionDetailPage,
  MatchesPage,
  MatchDetailPage,
  TeamsPage,
  TeamDetailPage,
  PlayersPage,
  PlayerDetailPage,
  VenuesPage,
  VenueDetailPage,
  SchedulePage,
  DivisionSchedulePage,
  StandingsPage,
  DivisionStandingsPage,
  StatsPage,
  TopScorersPage,
  TopAssistsPage,
  DisciplinePage,
  BracketsPage,
  DivisionBracketPage,
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  ProfilePage,
  AdminDashboard,
  AdminTournaments,
  AdminDivisions,
  AdminTeams,
  AdminPlayers,
  AdminMatches,
  AdminSchedules,
  AdminStandings,
  AdminBrackets,
  AdminVenues,
  AdminReferees,
  AdminMedia,
  AdminUsers,
  AdminSettings,
  CoachDashboard,
  RefereeDashboard,
  PlayerDashboard,
} from '@/routes/lazy-pages';

function L({ children }: { children: React.ReactNode }) {
  return <LazyPage>{children}</LazyPage>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

      <Route path="/about" element={<L><AboutPage /></L>} />
      <Route path="/contact" element={<L><ContactPage /></L>} />
      <Route path="/news" element={<L><NewsPage /></L>} />
      <Route path="/news/:slug" element={<L><NewsDetailPage /></L>} />
      <Route path="/gallery" element={<L><GalleryPage /></L>} />
      <Route path="/rules" element={<L><RulesPage /></L>} />

      <Route path="/tournaments" element={<L><TournamentsPage /></L>} />
      <Route path="/tournaments/:tournamentSlug" element={<L><TournamentDetailPage /></L>} />
      <Route path="/tournaments/:tournamentSlug/divisions/:divisionSlug" element={<L><DivisionDetailPage /></L>} />

      <Route path="/matches" element={<L><MatchesPage /></L>} />
      <Route path="/matches/:matchId" element={<L><MatchDetailPage /></L>} />

      <Route path="/teams" element={<L><TeamsPage /></L>} />
      <Route path="/teams/:teamSlug" element={<L><TeamDetailPage /></L>} />

      <Route path="/players" element={<L><PlayersPage /></L>} />
      <Route path="/players/:playerSlug" element={<L><PlayerDetailPage /></L>} />

      <Route path="/venues" element={<L><VenuesPage /></L>} />
      <Route path="/venues/:venueSlug" element={<L><VenueDetailPage /></L>} />

      <Route path="/schedule" element={<L><SchedulePage /></L>} />
      <Route path="/schedule/:divisionSlug" element={<L><DivisionSchedulePage /></L>} />

      <Route path="/standings" element={<L><StandingsPage /></L>} />
      <Route path="/standings/:divisionSlug" element={<L><DivisionStandingsPage /></L>} />

      <Route path="/stats" element={<L><StatsPage /></L>} />
      <Route path="/stats/top-scorers" element={<L><TopScorersPage /></L>} />
      <Route path="/stats/top-assists" element={<L><TopAssistsPage /></L>} />
      <Route path="/stats/discipline" element={<L><DisciplinePage /></L>} />

      <Route path="/brackets" element={<L><BracketsPage /></L>} />
      <Route path="/brackets/:divisionSlug" element={<L><DivisionBracketPage /></L>} />

      <Route path="/login" element={<L><LoginPage /></L>} />
      <Route path="/register" element={<L><RegisterPage /></L>} />
      <Route path="/forgot-password" element={<L><ForgotPasswordPage /></L>} />
      <Route path="/reset-password" element={<L><ResetPasswordPage /></L>} />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <L><ProfilePage /></L>
          </ProtectedRoute>
        }
      />

      {/* Role portals */}
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

      {/* Admin */}
      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/admin/dashboard" element={<ProtectedRoute adminOnly><L><AdminDashboard /></L></ProtectedRoute>} />
      <Route path="/admin/tournaments" element={<ProtectedRoute adminOnly><L><AdminTournaments /></L></ProtectedRoute>} />
      <Route path="/admin/divisions" element={<ProtectedRoute adminOnly><L><AdminDivisions /></L></ProtectedRoute>} />
      <Route path="/admin/teams" element={<ProtectedRoute adminOnly><L><AdminTeams /></L></ProtectedRoute>} />
      <Route path="/admin/players" element={<ProtectedRoute adminOnly><L><AdminPlayers /></L></ProtectedRoute>} />
      <Route path="/admin/matches" element={<ProtectedRoute adminOnly><L><AdminMatches /></L></ProtectedRoute>} />
      <Route path="/admin/schedules" element={<ProtectedRoute adminOnly><L><AdminSchedules /></L></ProtectedRoute>} />
      <Route path="/admin/standings" element={<ProtectedRoute adminOnly><L><AdminStandings /></L></ProtectedRoute>} />
      <Route path="/admin/brackets" element={<ProtectedRoute adminOnly><L><AdminBrackets /></L></ProtectedRoute>} />
      <Route path="/admin/venues" element={<ProtectedRoute adminOnly><L><AdminVenues /></L></ProtectedRoute>} />
      <Route path="/admin/referees" element={<ProtectedRoute adminOnly><L><AdminReferees /></L></ProtectedRoute>} />
      <Route path="/admin/media" element={<ProtectedRoute adminOnly><L><AdminMedia /></L></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute adminOnly><L><AdminUsers /></L></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute adminOnly><L><AdminSettings /></L></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
