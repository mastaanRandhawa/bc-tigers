import { Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { LazyPage } from '@/routes/LazyPage';
import {
  AdminDashboard,
  AdminTournaments,
  AdminTournamentWorkspace,
  AdminDivisionWorkspace,
  AdminDivisions,
  AdminTeams,
  AdminMatches,
  AdminVenues,
  AdminPointFormats,
  AdminUsers,
  AdminBrackets,
  AdminAnnouncements,
  AdminActivityLog,
} from '@/routes/lazy-pages';

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
      <Route path="/admin/tournaments/:id" element={<AdminRoute><L><AdminTournamentWorkspace /></L></AdminRoute>} />
      <Route path="/admin/tournaments/:id/divisions/:divisionId" element={<AdminRoute><L><AdminDivisionWorkspace /></L></AdminRoute>} />
      <Route path="/admin/divisions" element={<AdminRoute><L><AdminDivisions /></L></AdminRoute>} />
      <Route path="/admin/teams" element={<AdminRoute><L><AdminTeams /></L></AdminRoute>} />
      <Route path="/admin/matches" element={<AdminRoute><L><AdminMatches /></L></AdminRoute>} />
      <Route path="/admin/brackets" element={<AdminRoute><L><AdminBrackets /></L></AdminRoute>} />
      <Route path="/admin/venues" element={<AdminRoute><L><AdminVenues /></L></AdminRoute>} />
      <Route path="/admin/point-formats" element={<AdminRoute><L><AdminPointFormats /></L></AdminRoute>} />
      <Route path="/admin/users" element={<AdminRoute><L><AdminUsers /></L></AdminRoute>} />
      <Route path="/admin/announcements" element={<AdminRoute><L><AdminAnnouncements /></L></AdminRoute>} />
      <Route path="/admin/activity" element={<AdminRoute><L><AdminActivityLog /></L></AdminRoute>} />
    </>
  );
}
