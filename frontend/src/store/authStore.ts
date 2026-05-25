import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';
import { authService } from '@/services/auth.service';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<User>;
  register: (data: object) => Promise<User>;
  logout: () => void;
  clearError: () => void;
  refreshUser: () => Promise<void>;
}

async function fetchCurrentUser(): Promise<User> {
  const res = await authService.me();
  return res.data;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,
      error: null,

      initialize: async () => {
        // Prevent double-invocation from React StrictMode or concurrent renders.
        if (get().isInitialized || get().isLoading) return;

        const token = localStorage.getItem('bc_token') ?? get().token;
        if (!token) {
          set({ isInitialized: true, isAuthenticated: false, user: null, token: null });
          return;
        }

        set({ isLoading: true });
        try {
          const user = await fetchCurrentUser();
          set({ user, token, isAuthenticated: true, isInitialized: true, isLoading: false });
        } catch {
          // Token is invalid or expired. Clear it so the user is treated as a
          // guest and ProtectedRoute handles the /login redirect client-side.
          localStorage.removeItem('bc_token');
          set({ user: null, token: null, isAuthenticated: false, isInitialized: true, isLoading: false });
        }
      },

      refreshUser: async () => {
        if (!get().token) return;
        try {
          const user = await fetchCurrentUser();
          set({ user, isAuthenticated: true });
        } catch {
          // Session expired mid-session. Clear auth state so ProtectedRoute
          // redirects to /login via React Router instead of a hard reload.
          localStorage.removeItem('bc_token');
          set({ user: null, token: null, isAuthenticated: false });
        }
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const res = await authService.login(email, password);
          const { access_token } = res.data;
          localStorage.setItem('bc_token', access_token);
          set({ token: access_token });
          const user = await fetchCurrentUser();
          set({ user, isAuthenticated: true, isLoading: false });
          return user;
        } catch (err: unknown) {
          const message =
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
            'Login failed';
          set({ error: message, isLoading: false });
          throw err;
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const res = await authService.register(data as Parameters<typeof authService.register>[0]);
          const { access_token } = res.data;
          localStorage.setItem('bc_token', access_token);
          set({ token: access_token });
          const user = await fetchCurrentUser();
          set({ user, isAuthenticated: true, isLoading: false });
          return user;
        } catch (err: unknown) {
          const message =
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
            'Registration failed';
          set({ error: message, isLoading: false });
          throw err;
        }
      },

      logout: () => {
        localStorage.removeItem('bc_token');
        set({ user: null, token: null, isAuthenticated: false, error: null });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'bc-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
