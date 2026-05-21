import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { LazyPage } from "@/routes/LazyPage";
import {
  HomePage,
  TournamentsPage,
  TournamentLayout,
  TournamentOverviewPage,
  TournamentDivisionsPage,
  TournamentMediaPage,
  TournamentNewsPage,
  TournamentSponsorsPage,
  TournamentRulesPage,
  DivisionLayout,
  DivisionOverviewPage,
  DivisionTeamsPage,
  TeamLayout,
  TeamOverviewPage,
  TeamRosterPage,
  TeamMatchesPage,
  TeamStandingsPage,
  TeamStatsPage,
  TeamCoachesPage,
  DivisionPlayerDetailPage,
  DivisionPlayersListRedirect,
  DivisionPlayerLegacyRedirect,
  DivisionSchedulePage,
  DivisionMatchesPage,
  DivisionMatchDetailPage,
  GlobalMatchDetailPage,
  DivisionStandingsPage,
  DivisionStatsPage,
  DivisionTopScorersPage,
  DivisionTopAssistsPage,
  DivisionDisciplinePage,
  DivisionBracketPage,
  DivisionRulesPage,
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
  AdminSchedules,
  AdminStandings,
  AdminBrackets,
  AdminVenues,
  AdminReferees,
  AdminMedia,
  AdminUsers,
  AdminSettings,
  AdminAnalytics,
  RefereeDashboard,
  PlayerDashboard,
} from "@/routes/lazy-pages";

function L({ children }: { children: React.ReactNode }) {
  return <LazyPage>{children}</LazyPage>;
}

function ManagementRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute adminOnly>
      <L>{children}</L>
    </ProtectedRoute>
  );
}

const managementPages = [
  { path: "dashboard", element: <AdminDashboard /> },
  { path: "tournaments", element: <AdminTournaments /> },
  { path: "divisions", element: <AdminDivisions /> },
  { path: "teams", element: <AdminTeams /> },
  { path: "players", element: <AdminPlayers /> },
  { path: "matches", element: <AdminMatches /> },
  { path: "schedules", element: <AdminSchedules /> },
  { path: "standings", element: <AdminStandings /> },
  { path: "brackets", element: <AdminBrackets /> },
  { path: "venues", element: <AdminVenues /> },
  { path: "referees", element: <AdminReferees /> },
  { path: "media", element: <AdminMedia /> },
  { path: "analytics", element: <AdminAnalytics /> },
  { path: "users", element: <AdminUsers /> },
  { path: "settings", element: <AdminSettings /> },
] as const;

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

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
              <TournamentOverviewPage />
            </L>
          }
        />
        <Route
          path="divisions"
          element={
            <L>
              <TournamentDivisionsPage />
            </L>
          }
        />
        <Route path="matches" element={<Navigate to="divisions" replace />} />
        <Route path="standings" element={<Navigate to="divisions" replace />} />
        <Route path="venues" element={<Navigate to="divisions" replace />} />
        <Route
          path="media"
          element={
            <L>
              <TournamentMediaPage />
            </L>
          }
        />
        <Route
          path="news"
          element={
            <L>
              <TournamentNewsPage />
            </L>
          }
        />
        <Route
          path="sponsors"
          element={
            <L>
              <TournamentSponsorsPage />
            </L>
          }
        />
        <Route
          path="rules"
          element={
            <L>
              <TournamentRulesPage />
            </L>
          }
        />
      </Route>

      <Route
        path="/tournaments/:tournamentSlug/divisions/:divisionSlug"
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
              <TeamLayout />
            </L>
          }
        >
          <Route
            index
            element={
              <L>
                <TeamOverviewPage />
              </L>
            }
          />
          <Route
            path="roster"
            element={
              <L>
                <TeamRosterPage />
              </L>
            }
          />
          <Route
            path="matches"
            element={
              <L>
                <TeamMatchesPage />
              </L>
            }
          />
          <Route
            path="standings"
            element={
              <L>
                <TeamStandingsPage />
              </L>
            }
          />
          <Route
            path="stats"
            element={
              <L>
                <TeamStatsPage />
              </L>
            }
          />
          <Route
            path="coaches"
            element={
              <L>
                <TeamCoachesPage />
              </L>
            }
          />
          <Route
            path="players/:playerId"
            element={
              <L>
                <DivisionPlayerDetailPage />
              </L>
            }
          />
        </Route>
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
        <Route
          path="schedule"
          element={
            <L>
              <DivisionSchedulePage />
            </L>
          }
        />
        <Route
          path="matches"
          element={
            <L>
              <DivisionMatchesPage />
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
          path="stats/top-scorers"
          element={
            <L>
              <DivisionTopScorersPage />
            </L>
          }
        />
        <Route
          path="stats/top-assists"
          element={
            <L>
              <DivisionTopAssistsPage />
            </L>
          }
        />
        <Route
          path="stats/discipline"
          element={
            <L>
              <DivisionDisciplinePage />
            </L>
          }
        />
        <Route
          path="brackets"
          element={
            <L>
              <DivisionBracketPage />
            </L>
          }
        />
        <Route
          path="rules"
          element={
            <L>
              <DivisionRulesPage />
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

      <Route
        path="/matches/:matchId"
        element={
          <L>
            <GlobalMatchDetailPage />
          </L>
        }
      />

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

      <Route path="/portal/*" element={<Navigate to="/tournaments" replace />} />
      <Route path="/coach" element={<Navigate to="/tournaments" replace />} />

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

      <Route path="/management" element={<Navigate to="/management/dashboard" replace />} />
      {managementPages.map(({ path, element }) => (
        <Route
          key={path}
          path={`/management/${path}`}
          element={<ManagementRoute>{element}</ManagementRoute>}
        />
      ))}

      <Route path="/admin" element={<Navigate to="/management/dashboard" replace />} />
      {managementPages.map(({ path }) => (
        <Route
          key={`admin-${path}`}
          path={`/admin/${path}`}
          element={<Navigate to={`/management/${path}`} replace />}
        />
      ))}
      <Route path="/admin/*" element={<Navigate to="/management/dashboard" replace />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
