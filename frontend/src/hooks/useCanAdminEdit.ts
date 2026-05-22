import { useAuthStore } from '@/store/authStore';
import { isAdminRole } from '@/lib/auth-utils';

/** Returns true when the current user is an admin who can perform inline edits. */
export function useCanAdminEdit(): boolean {
  const { isAuthenticated, user } = useAuthStore();
  return isAuthenticated && isAdminRole(user?.role);
}
