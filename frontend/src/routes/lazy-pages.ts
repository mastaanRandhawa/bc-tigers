import { lazy, type ComponentType } from 'react';

function lazyPage<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(factory);
}

// Public — keep home eager for fastest first paint
export { default as HomePage } from '@/pages/HomePage';

export const AboutPage = lazyPage(() => import('@/pages/AboutPage'));
export const ContactPage = lazyPage(() => import('@/pages/ContactPage'));
export const NewsPage = lazyPage(() => import('@/pages/NewsPage'));
export const NewsDetailPage = lazyPage(() => import('@/pages/NewsDetailPage'));
export const GalleryPage = lazyPage(() => import('@/pages/GalleryPage'));
export const RulesPage = lazyPage(() => import('@/pages/RulesPage'));

export const TournamentsPage = lazyPage(() => import('@/pages/tournaments/TournamentsPage'));
export const TournamentDetailPage = lazyPage(() => import('@/pages/tournaments/TournamentDetailPage'));
export const DivisionDetailPage = lazyPage(() => import('@/pages/divisions/DivisionDetailPage'));

export const MatchesPage = lazyPage(() => import('@/pages/matches/MatchesPage'));
export const MatchDetailPage = lazyPage(() => import('@/pages/matches/MatchDetailPage'));

export const TeamsPage = lazyPage(() => import('@/pages/teams/TeamsPage'));
export const TeamDetailPage = lazyPage(() => import('@/pages/teams/TeamDetailPage'));

export const PlayersPage = lazyPage(() => import('@/pages/players/PlayersPage'));
export const PlayerDetailPage = lazyPage(() => import('@/pages/players/PlayerDetailPage'));

export const VenuesPage = lazyPage(() => import('@/pages/venues/VenuesPage'));
export const VenueDetailPage = lazyPage(() => import('@/pages/venues/VenueDetailPage'));

export const SchedulePage = lazyPage(() => import('@/pages/schedule/SchedulePage'));
export const DivisionSchedulePage = lazyPage(() => import('@/pages/schedule/DivisionSchedulePage'));

export const StandingsPage = lazyPage(() => import('@/pages/standings/StandingsPage'));
export const DivisionStandingsPage = lazyPage(() => import('@/pages/standings/DivisionStandingsPage'));

export const StatsPage = lazyPage(() => import('@/pages/stats/StatsPage'));
export const TopScorersPage = lazyPage(() => import('@/pages/stats/TopScorersPage'));
export const TopAssistsPage = lazyPage(() => import('@/pages/stats/TopAssistsPage'));
export const DisciplinePage = lazyPage(() => import('@/pages/stats/DisciplinePage'));

export const BracketsPage = lazyPage(() => import('@/pages/brackets/BracketsPage'));
export const DivisionBracketPage = lazyPage(() => import('@/pages/brackets/DivisionBracketPage'));

export const LoginPage = lazyPage(() => import('@/pages/auth/LoginPage'));
export const RegisterPage = lazyPage(() => import('@/pages/auth/RegisterPage'));
export const ForgotPasswordPage = lazyPage(() => import('@/pages/auth/ForgotPasswordPage'));
export const ResetPasswordPage = lazyPage(() => import('@/pages/auth/ResetPasswordPage'));
export const ProfilePage = lazyPage(() => import('@/pages/ProfilePage'));

export const AdminDashboard = lazyPage(() => import('@/pages/admin/AdminDashboard'));
export const AdminTournaments = lazyPage(() => import('@/pages/admin/AdminTournaments'));
export const AdminDivisions = lazyPage(() => import('@/pages/admin/AdminDivisions'));
export const AdminTeams = lazyPage(() => import('@/pages/admin/AdminTeams'));
export const AdminPlayers = lazyPage(() => import('@/pages/admin/AdminPlayers'));
export const AdminMatches = lazyPage(() => import('@/pages/admin/AdminMatches'));
export const AdminSchedules = lazyPage(() => import('@/pages/admin/AdminSchedules'));
export const AdminStandings = lazyPage(() => import('@/pages/admin/AdminStandings'));
export const AdminBrackets = lazyPage(() => import('@/pages/admin/AdminBrackets'));
export const AdminVenues = lazyPage(() => import('@/pages/admin/AdminVenues'));
export const AdminReferees = lazyPage(() => import('@/pages/admin/AdminReferees'));
export const AdminMedia = lazyPage(() => import('@/pages/admin/AdminMedia'));
export const AdminUsers = lazyPage(() => import('@/pages/admin/AdminUsers'));
export const AdminSettings = lazyPage(() => import('@/pages/admin/AdminSettings'));

export const CoachDashboard = lazyPage(() => import('@/pages/coach/CoachDashboard'));
export const RefereeDashboard = lazyPage(() => import('@/pages/referee/RefereeDashboard'));
export const PlayerDashboard = lazyPage(() => import('@/pages/player/PlayerDashboard'));
