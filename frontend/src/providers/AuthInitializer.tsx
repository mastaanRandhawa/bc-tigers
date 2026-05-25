import { useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { setLogoutCallback } from '@/lib/api-client';

interface AuthInitializerProps {
  children: ReactNode;
}

/**
 * Kicks off auth initialization on mount without blocking public route rendering.
 * Protected routes (ProtectedRoute) handle their own "not yet initialized" state
 * by returning null. Public routes render immediately for guests.
 *
 * Also registers a logout callback with the Axios interceptor so that 401
 * responses on protected pages trigger a React Router navigation to /login
 * instead of a hard window.location.href redirect (which would go through
 * GitHub Pages' 404.html fallback and appear as a 404 in the network log).
 */
export function AuthInitializer({ children }: AuthInitializerProps) {
  const initialize = useAuthStore((s) => s.initialize);
  const navigate = useNavigate();

  useEffect(() => {
    setLogoutCallback(() => {
      useAuthStore.getState().logout();
      navigate('/login', { replace: true });
    });

    initialize();
  }, [initialize, navigate]);

  return <>{children}</>;
}
