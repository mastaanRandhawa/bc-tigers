import { Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { LazyPage } from '@/routes/LazyPage';
import {
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
  AdminCoaches,
  AdminBrackets,
  AdminAnnouncements,
} from '@/routes/lazy-pages';

function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute superAdminOnly>{children}</ProtectedRoute>;
}

function L({ children }: { children: React.ReactNode }) {
  return <LazyPage>{children}</LazyPage>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute adminOnly>{children}</ProtectedRoute>;
}

/** Admin CRUD routes — all behind adminOnly ProtectedRoute */
export function adminRoutes() {
  return (
    <>
      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/admin/dashboard" element={<AdminRoute><L><AdminDashboard /></L></AdminRoute>} />
      <Route path="/admin/tournaments" element={<AdminRoute><L><AdminTournaments /></L></AdminRoute>} />
      <Route path="/admin/divisions" element={<AdminRoute><L><AdminDivisions /></L></AdminRoute>} />
      <Route path="/admin/teams" element={<AdminRoute><L><AdminTeams /></L></AdminRoute>} />
      <Route path="/admin/players" element={<AdminRoute><L><AdminPlayers /></L></AdminRoute>} />
      <Route path="/admin/coaches" element={<AdminRoute><L><AdminCoaches /></L></AdminRoute>} />
      <Route path="/admin/matches" element={<AdminRoute><L><AdminMatches /></L></AdminRoute>} />
      <Route path="/admin/brackets" element={<AdminRoute><L><AdminBrackets /></L></AdminRoute>} />
      <Route path="/admin/venues" element={<AdminRoute><L><AdminVenues /></L></AdminRoute>} />
      <Route path="/admin/referees" element={<AdminRoute><L><AdminReferees /></L></AdminRoute>} />
      <Route path="/admin/media" element={<AdminRoute><L><AdminMedia /></L></AdminRoute>} />
      <Route path="/admin/users" element={<SuperAdminRoute><L><AdminUsers /></L></SuperAdminRoute>} />
      <Route path="/admin/announcements" element={<AdminRoute><L><AdminAnnouncements /></L></AdminRoute>} />
      <Route path="/admin/settings" element={<AdminRoute><L><AdminSettings /></L></AdminRoute>} />
    </>
  );
}
