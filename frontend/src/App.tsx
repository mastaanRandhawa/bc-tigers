import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { LazyPage } from "@/routes/LazyPage";
import BlockedGlobalRoute from "@/components/routes/BlockedGlobalRoute";
import GlobalMatchRedirect from "@/components/routes/GlobalMatchRedirect";
import DivisionInnerScheduleRedirect from "@/components/routes/DivisionInnerScheduleRedirect";
import DivisionStatsSubRedirect from "@/components/routes/DivisionStatsSubRedirect";
import DivisionBracketAliasRedirect from "@/components/routes/DivisionBracketAliasRedirect";
import {
  HomePage,
  TournamentsPage,
  TournamentLayout,
  TournamentDetailPage,
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
  DivisionSlugRedirect,
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
  AdminVenues,
  AdminReferees,
  AdminMedia,
  AdminUsers,
  AdminSettings,
  CoachDashboard,
  RefereeDashboard,
  PlayerDashboard,
} from "@/routes/lazy-pages";

function L({ children }: { children: React.ReactNode }) {
  return <LazyPage>{children}</LazyPage>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

      <Route path="/teams" element={<BlockedGlobalRoute />} />
      <Route path="/teams/*" element={<BlockedGlobalRoute />} />
      <Route path="/divisions" element={<BlockedGlobalRoute />} />
      <Route path="/divisions/*" element={<BlockedGlobalRoute />} />
      <Route path="/players" element={<BlockedGlobalRoute />} />
      <Route path="/players/*" element={<BlockedGlobalRoute />} />

      <Route
        path="/matches/:matchId"
        element={
          <L>
            <GlobalMatchRedirect />
          </L>
        }
      />

      <Route
        path="/tournaments"
        element={
          <L>
            <TournamentsPage />
          </L>
        }
      />

      <Route
        path="/tournaments/:tournamentSlug"
        element={
          <L>
            <TournamentLayout />
          </L>
        }
      >
        <Route
          index
          element={
            <L>
              <TournamentDetailPage />
            </L>
          }
        />
        <Route
          path="divisions/:divisionSlug"
          element={
            <L>
              <DivisionLayout />
            </L>
          }
        >
          <Route
            index
            element={
              <L>
                <DivisionOverviewPage />
              </L>
            }
          />
          <Route
            path="teams"
            element={
              <L>
                <DivisionTeamsPage />
              </L>
            }
          />
          <Route
            path="teams/:teamSlug"
            element={
              <L>
                <DivisionTeamDetailPage />
              </L>
            }
          />
          <Route
            path="teams/:teamSlug/players/:playerId"
            element={
              <L>
                <DivisionPlayerDetailPage />
              </L>
            }
          />
          <Route
            path="players"
            element={
              <L>
                <DivisionPlayersListRedirect />
              </L>
            }
          />
          <Route
            path="players/:playerId"
            element={
              <L>
                <DivisionPlayerLegacyRedirect />
              </L>
            }
          />
          <Route path="schedule" element={<DivisionInnerScheduleRedirect />} />
          <Route
            path="matches"
            element={
              <L>
                <DivisionMatchesAndSchedulePage />
              </L>
            }
          />
          <Route
            path="matches/:matchId"
            element={
              <L>
                <DivisionMatchDetailPage />
              </L>
            }
          />
          <Route
            path="standings"
            element={
              <L>
                <DivisionStandingsPage />
              </L>
            }
          />
          <Route
            path="stats"
            element={
              <L>
                <DivisionStatsPage />
              </L>
            }
          />
          <Route
            path="stats/:statsSection"
            element={<DivisionStatsSubRedirect />}
          />
          <Route path="bracket" element={<DivisionBracketAliasRedirect />} />
          <Route
            path="brackets"
            element={
              <L>
                <DivisionBracketPage />
              </L>
            }
          />
          <Route
            path="venues"
            element={
              <L>
                <DivisionVenuesPage />
              </L>
            }
          />
          <Route
            path="venues/:venueSlug"
            element={
              <L>
                <DivisionVenueDetailPage />
              </L>
            }
          />
        </Route>
      </Route>

      <Route
        path="/schedule/:divisionSlug"
        element={
          <L>
            <DivisionSlugRedirect />
          </L>
        }
      />
      <Route
        path="/standings/:divisionSlug"
        element={
          <L>
            <DivisionSlugRedirect />
          </L>
        }
      />
      <Route
        path="/brackets/:divisionSlug"
        element={
          <L>
            <DivisionSlugRedirect />
          </L>
        }
      />

      <Route
        path="/login"
        element={
          <L>
            <LoginPage />
          </L>
        }
      />
      <Route
        path="/register"
        element={
          <L>
            <RegisterPage />
          </L>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <L>
            <ForgotPasswordPage />
          </L>
        }
      />
      <Route
        path="/reset-password"
        element={
          <L>
            <ResetPasswordPage />
          </L>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <L>
              <ProfilePage />
            </L>
          </ProtectedRoute>
        }
      />

      <Route
        path="/coach"
        element={
          <ProtectedRoute allowedRoles={["COACH", "ADMIN", "TOURNAMENT_ADMIN"]}>
            <L>
              <CoachDashboard />
            </L>
          </ProtectedRoute>
        }
      />
      <Route
        path="/referee"
        element={
          <ProtectedRoute
            allowedRoles={["REFEREE", "ADMIN", "TOURNAMENT_ADMIN"]}
          >
            <L>
              <RefereeDashboard />
            </L>
          </ProtectedRoute>
        }
      />
      <Route
        path="/player"
        element={
          <ProtectedRoute
            allowedRoles={["PLAYER", "ADMIN", "TOURNAMENT_ADMIN"]}
          >
            <L>
              <PlayerDashboard />
            </L>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={<Navigate to="/admin/dashboard" replace />}
      />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute adminOnly>
            <L>
              <AdminDashboard />
            </L>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/tournaments"
        element={
          <ProtectedRoute adminOnly>
            <L>
              <AdminTournaments />
            </L>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/divisions"
        element={
          <ProtectedRoute adminOnly>
            <L>
              <AdminDivisions />
            </L>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/teams"
        element={
          <ProtectedRoute adminOnly>
            <L>
              <AdminTeams />
            </L>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/players"
        element={
          <ProtectedRoute adminOnly>
            <L>
              <AdminPlayers />
            </L>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/matches"
        element={
          <ProtectedRoute adminOnly>
            <L>
              <AdminMatches />
            </L>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/venues"
        element={
          <ProtectedRoute adminOnly>
            <L>
              <AdminVenues />
            </L>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/referees"
        element={
          <ProtectedRoute adminOnly>
            <L>
              <AdminReferees />
            </L>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/media"
        element={
          <ProtectedRoute adminOnly>
            <L>
              <AdminMedia />
            </L>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute adminOnly>
            <L>
              <AdminUsers />
            </L>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute adminOnly>
            <L>
              <AdminSettings />
            </L>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
