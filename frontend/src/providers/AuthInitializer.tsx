import { useEffect, type ReactNode } from 'react';
import { useAuthStore } from '@/store/authStore';

interface AuthInitializerProps {
  children: ReactNode;
}

/**
 * Kicks off auth initialization on mount without blocking public route rendering.
 * Protected routes (ProtectedRoute) handle their own "not yet initialized" state
 * by returning null. Public routes render immediately for guests.
 */
export function AuthInitializer({ children }: AuthInitializerProps) {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return <>{children}</>;
}
