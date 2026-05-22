import { lazy, type ComponentType } from "react";

function lazyPage(
  factory: () => Promise<{ default: ComponentType<Record<string, unknown>> }>,
) {
  return lazy(factory);
}

// Public — keep home eager for fastest first paint
export { default as HomePage } from "@/pages/HomePage";

export const LiveMatchesPage = lazyPage(
  () => import("@/pages/LiveMatchesPage"),
);

export const TournamentsPage = lazyPage(
  () => import("@/pages/tournaments/TournamentsPage"),
);
export const TournamentLayout = lazyPage(
  () => import("@/components/layouts/TournamentLayout"),
);
export const TournamentDetailPage = lazyPage(
  () => import("@/pages/tournaments/TournamentDetailPage"),
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
export const DivisionTeamDetailPage = lazyPage(
  () => import("@/pages/divisions/DivisionTeamDetailPage"),
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
export const DivisionMatchesAndSchedulePage = lazyPage(
  () => import("@/pages/divisions/DivisionMatchesAndSchedulePage"),
);
export const DivisionMatchDetailPage = lazyPage(
  () => import("@/pages/divisions/DivisionMatchDetailPage"),
);
export const DivisionStandingsPage = lazyPage(
  () => import("@/pages/divisions/DivisionStandingsPage"),
);
export const DivisionStatsPage = lazyPage(
  () => import("@/pages/divisions/DivisionStatsPage"),
);
export const DivisionBracketPage = lazyPage(
  () => import("@/pages/divisions/DivisionBracketPage"),
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

// Auth
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
export const AdminTournamentWorkspace = lazyPage(
  () => import("@/pages/admin/TournamentWorkspacePage"),
);
export const AdminDivisionWorkspace = lazyPage(
  () => import("@/pages/admin/DivisionWorkspacePage"),
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
export const AdminVenues = lazyPage(() => import("@/pages/admin/AdminVenues"));
export const AdminReferees = lazyPage(
  () => import("@/pages/admin/AdminReferees"),
);
export const AdminMedia = lazyPage(() => import("@/pages/admin/AdminMedia"));
export const AdminUsers = lazyPage(() => import("@/pages/admin/AdminUsers"));
export const AdminSettings = lazyPage(
  () => import("@/pages/admin/AdminSettings"),
);
export const AdminCoaches = lazyPage(
  () => import("@/pages/admin/AdminCoaches"),
);
export const AdminBrackets = lazyPage(
  () => import("@/pages/admin/AdminBrackets"),
);
export const AdminAnnouncements = lazyPage(
  () => import("@/pages/admin/AdminAnnouncements"),
);

// Role portals
export const CoachDashboard = lazyPage(
  () => import("@/pages/coach/CoachDashboard"),
);
export const RefereeDashboard = lazyPage(
  () => import("@/pages/referee/RefereeDashboard"),
);
export const RefereeMatchControlPage = lazyPage(
  () => import("@/pages/referee/RefereeMatchControlPage"),
);
export const PlayerDashboard = lazyPage(
  () => import("@/pages/player/PlayerDashboard"),
);
