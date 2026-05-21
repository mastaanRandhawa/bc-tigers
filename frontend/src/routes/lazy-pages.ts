import { lazy, type ComponentType } from "react";

function lazyPage(
  factory: () => Promise<{ default: ComponentType<Record<string, unknown>> }>,
) {
  return lazy(factory);
}

export { default as HomePage } from "@/pages/HomePage";

export const TournamentsPage = lazyPage(
  () => import("@/pages/tournaments/TournamentsPage"),
);

export const TournamentLayout = lazyPage(
  () => import("@/components/layouts/TournamentLayout"),
);
export const TournamentOverviewPage = lazyPage(
  () => import("@/pages/tournaments/TournamentOverviewPage"),
);
export const TournamentDivisionsPage = lazyPage(
  () => import("@/pages/tournaments/TournamentDivisionsPage"),
);
export const TournamentMediaPage = lazyPage(
  () => import("@/pages/tournaments/TournamentMediaPage"),
);
export const TournamentNewsPage = lazyPage(
  () => import("@/pages/tournaments/TournamentNewsPage"),
);
export const TournamentSponsorsPage = lazyPage(
  () => import("@/pages/tournaments/TournamentSponsorsPage"),
);
export const TournamentRulesPage = lazyPage(
  () => import("@/pages/tournaments/TournamentRulesPage"),
);

export const DivisionLayout = lazyPage(
  () => import("@/components/layouts/DivisionLayout"),
);
export const DivisionOverviewPage = lazyPage(
  () => import("@/pages/divisions/DivisionOverviewPage"),
);
export const DivisionTeamsPage = lazyPage(
  () => import("@/pages/divisions/DivisionTeamsPage"),
);
export const TeamLayout = lazyPage(
  () => import("@/components/layouts/TeamLayout"),
);
export const TeamOverviewPage = lazyPage(
  () => import("@/pages/teams/TeamOverviewPage"),
);
export const TeamRosterPage = lazyPage(
  () => import("@/pages/teams/TeamRosterPage"),
);
export const TeamMatchesPage = lazyPage(
  () => import("@/pages/teams/TeamMatchesPage"),
);
export const TeamStandingsPage = lazyPage(
  () => import("@/pages/teams/TeamStandingsPage"),
);
export const TeamStatsPage = lazyPage(
  () => import("@/pages/teams/TeamStatsPage"),
);
export const TeamCoachesPage = lazyPage(
  () => import("@/pages/teams/TeamCoachesPage"),
);
export const DivisionPlayerDetailPage = lazyPage(
  () => import("@/pages/divisions/DivisionPlayerDetailPage"),
);
export const DivisionPlayersListRedirect = lazyPage(
  () =>
    import("@/pages/divisions/DivisionPlayersRedirect").then((m) => ({
      default: m.DivisionPlayersListRedirect,
    })),
);
export const DivisionPlayerLegacyRedirect = lazyPage(
  () =>
    import("@/pages/divisions/DivisionPlayersRedirect").then((m) => ({
      default: m.DivisionPlayerLegacyRedirect,
    })),
);
export const DivisionSchedulePage = lazyPage(
  () => import("@/pages/divisions/DivisionSchedulePage"),
);
export const DivisionMatchesPage = lazyPage(
  () => import("@/pages/divisions/DivisionMatchesPage"),
);
export const DivisionMatchDetailPage = lazyPage(
  () => import("@/pages/divisions/DivisionMatchDetailPage"),
);
export const GlobalMatchDetailPage = lazyPage(
  () => import("@/pages/matches/GlobalMatchDetailPage"),
);
export const DivisionStandingsPage = lazyPage(
  () => import("@/pages/divisions/DivisionStandingsPage"),
);
export const DivisionStatsPage = lazyPage(
  () => import("@/pages/divisions/DivisionStatsPage"),
);
export const DivisionTopScorersPage = lazyPage(
  () => import("@/pages/divisions/DivisionTopScorersPage"),
);
export const DivisionTopAssistsPage = lazyPage(
  () => import("@/pages/divisions/DivisionTopAssistsPage"),
);
export const DivisionDisciplinePage = lazyPage(
  () => import("@/pages/divisions/DivisionDisciplinePage"),
);
export const DivisionBracketPage = lazyPage(
  () => import("@/pages/divisions/DivisionBracketPage"),
);
export const DivisionRulesPage = lazyPage(
  () => import("@/pages/divisions/DivisionRulesPage"),
);
export const DivisionVenuesPage = lazyPage(
  () => import("@/pages/divisions/DivisionVenuesPage"),
);
export const DivisionVenueDetailPage = lazyPage(
  () => import("@/pages/divisions/DivisionVenueDetailPage"),
);

export const DivisionSlugRedirect = lazyPage(
  () => import("@/components/shared/DivisionSlugRedirect"),
);

export const LoginPage = lazyPage(() => import("@/pages/auth/LoginPage"));
export const RegisterPage = lazyPage(() => import("@/pages/auth/RegisterPage"));
export const ForgotPasswordPage = lazyPage(
  () => import("@/pages/auth/ForgotPasswordPage"),
);
export const ResetPasswordPage = lazyPage(
  () => import("@/pages/auth/ResetPasswordPage"),
);
export const ProfilePage = lazyPage(() => import("@/pages/ProfilePage"));

export const AdminDashboard = lazyPage(
  () => import("@/pages/admin/AdminDashboard"),
);
export const AdminTournaments = lazyPage(
  () => import("@/pages/admin/AdminTournaments"),
);
export const AdminDivisions = lazyPage(
  () => import("@/pages/admin/AdminDivisions"),
);
export const AdminTeams = lazyPage(() => import("@/pages/admin/AdminTeams"));
export const AdminPlayers = lazyPage(
  () => import("@/pages/admin/AdminPlayers"),
);
export const AdminMatches = lazyPage(
  () => import("@/pages/admin/AdminMatches"),
);
export const AdminSchedules = lazyPage(
  () => import("@/pages/admin/AdminSchedules"),
);
export const AdminStandings = lazyPage(
  () => import("@/pages/admin/AdminStandings"),
);
export const AdminBrackets = lazyPage(
  () => import("@/pages/admin/AdminBrackets"),
);
export const AdminVenues = lazyPage(() => import("@/pages/admin/AdminVenues"));
export const AdminReferees = lazyPage(
  () => import("@/pages/admin/AdminReferees"),
);
export const AdminMedia = lazyPage(() => import("@/pages/admin/AdminMedia"));
export const AdminUsers = lazyPage(() => import("@/pages/admin/AdminUsers"));
export const AdminSettings = lazyPage(
  () => import("@/pages/admin/AdminSettings"),
);
export const AdminAnalytics = lazyPage(
  () => import("@/pages/admin/AdminAnalytics"),
);

export const RefereeDashboard = lazyPage(
  () => import("@/pages/referee/RefereeDashboard"),
);
export const PlayerDashboard = lazyPage(
  () => import("@/pages/player/PlayerDashboard"),
);
