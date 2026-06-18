import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { isAdminRole } from '@/lib/auth-utils';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export default function ProtectedRoute({
  children,
  adminOnly = false,
}: ProtectedRouteProps) {
  const { isAuthenticated, user, isInitialized } = useAuthStore();

  if (!isInitialized) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: window.location.pathname }} />;
  }

  if (adminOnly && !isAdminRole(user?.role)) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
