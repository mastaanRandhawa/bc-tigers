import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { isAdminRole, getRoleDashboardPath } from '@/lib/auth-utils';
import type { UserRole } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  superAdminOnly?: boolean;
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({
  children,
  adminOnly = false,
  superAdminOnly = false,
  allowedRoles,
}: ProtectedRouteProps) {
  const { isAuthenticated, user, isInitialized } = useAuthStore();

  if (!isInitialized) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: window.location.pathname }} />;
  }

  if (superAdminOnly && user?.role !== 'ADMIN') {
    return <Navigate to={getRoleDashboardPath(user?.role)} replace />;
  }

  if (adminOnly && !isAdminRole(user?.role)) {
    return <Navigate to={getRoleDashboardPath(user?.role)} replace />;
  }

  if (allowedRoles?.length && user?.role && !allowedRoles.includes(user.role)) {
    return <Navigate to={getRoleDashboardPath(user.role)} replace />;
  }

  return <>{children}</>;
}
