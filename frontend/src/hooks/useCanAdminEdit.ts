import { useAuthStore } from '@/store/authStore';
import { isAdminRole } from '@/lib/auth-utils';

/**
 * Returns true when the current user is an admin who can perform inline edits.
 *
 * Gated on `isInitialized` so we never trust the persisted (localStorage) auth
 * snapshot until the token has been re-validated against the server. Without
 * this, a stale session (e.g. after a DB reseed that recreates the admin user
 * with a new id) would show admin controls whose requests then fail with 401.
 */
export function useCanAdminEdit(): boolean {
  const { isAuthenticated, isInitialized, user } = useAuthStore();
  return isInitialized && isAuthenticated && isAdminRole(user?.role);
}
