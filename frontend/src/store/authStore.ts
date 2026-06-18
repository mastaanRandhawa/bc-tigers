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
        const token = localStorage.getItem('bc_token') ?? get().token;
        if (!token) {
          set({ isInitialized: true, isAuthenticated: false, user: null, token: null });
          return;
        }

        try {
          const user = await fetchCurrentUser();
          set({ user, token, isAuthenticated: true, isInitialized: true });
        } catch {
          localStorage.removeItem('bc_token');
          set({ user: null, token: null, isAuthenticated: false, isInitialized: true });
        }
      },

      refreshUser: async () => {
        if (!get().token) return;
        const user = await fetchCurrentUser();
        set({ user, isAuthenticated: true });
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const res = await authService.login(email, password);
          const { access_token } = res.data;
          localStorage.setItem('bc_token', access_token);
          set({ token: access_token });
          const user = await fetchCurrentUser();
          set({ user, isAuthenticated: true, isInitialized: true, isLoading: false });
          return user;
        } catch (err: unknown) {
          const message =
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
            'Login failed';
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
