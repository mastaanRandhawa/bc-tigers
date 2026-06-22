import { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { tournamentRoutes } from '@/routes/tournament.routes';
import { authRoutes } from '@/routes/auth.routes';
import { adminRoutes } from '@/routes/admin.routes';
import { redirectRoutes } from '@/routes/redirect.routes';
import { coachRoutes } from '@/routes/coach.routes';
import { HomePage, LiveMatchesPage, NotFoundPage } from '@/routes/lazy-pages';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route
        path="/live"
        element={
          <Suspense fallback={null}>
            <LiveMatchesPage />
          </Suspense>
        }
      />
      {redirectRoutes()}
      {tournamentRoutes()}
      {authRoutes()}
      {coachRoutes()}
      {adminRoutes()}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
