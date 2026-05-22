import { Routes, Route, Navigate } from 'react-router-dom';
import { tournamentRoutes } from '@/routes/tournament.routes';
import { authRoutes } from '@/routes/auth.routes';
import { adminRoutes } from '@/routes/admin.routes';
import { portalRoutes } from '@/routes/portal.routes';
import { redirectRoutes } from '@/routes/redirect.routes';
import { HomePage } from '@/routes/lazy-pages';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      {redirectRoutes()}
      {tournamentRoutes()}
      {authRoutes()}
      {portalRoutes()}
      {adminRoutes()}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
