import { Route } from 'react-router-dom';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { LazyPage } from '@/routes/LazyPage';
import {
  LoginPage,
  CoachRegisterPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  ProfilePage,
} from '@/routes/lazy-pages';

function L({ children }: { children: React.ReactNode }) {
  return <LazyPage>{children}</LazyPage>;
}

/** Authentication + profile routes */
export function authRoutes() {
  return (
    <>
      <Route path="/login" element={<L><LoginPage /></L>} />
      <Route path="/coach/register" element={<L><CoachRegisterPage /></L>} />
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
    </>
  );
}
