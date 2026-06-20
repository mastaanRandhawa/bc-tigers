import axios from 'axios';
import { apiBaseUrl, toAppPath } from '@/lib/env';

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('bc_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/**
 * Returns the app-relative pathname by stripping the Vite BASE_URL prefix.
 * On GitHub Pages, BASE_URL is '/bc-tigers/' so a raw pathname of
 * '/bc-tigers/tournaments/foo' becomes '/tournaments/foo'.
 * On localhost (BASE_URL = '/') the pathname is returned unchanged.
 */
function appRelativePath(): string {
  const base = import.meta.env.BASE_URL; // '/' in dev, '/bc-tigers/' on GH Pages
  const prefix = base === '/' ? '' : base.replace(/\/$/, ''); // '' or '/bc-tigers'
  const full = window.location.pathname;
  return prefix && full.startsWith(prefix) ? full.slice(prefix.length) || '/' : full;
}

/**
 * Returns true when the user is currently on a page that is publicly accessible
 * without authentication. A 401 on a public page should never force-redirect to
 * login — the SiteHeader's isInitialized guard prevents auth-gated components
 * from firing in the first place, but this is a belt-and-suspenders fallback.
 *
 * Uses appRelativePath() so the check is correct regardless of the Vite base
 * path (e.g. '/bc-tigers/' on GitHub Pages vs '/' in local dev).
 */
function isPublicPage(): boolean {
  const path = appRelativePath();
  return (
    path === '/' ||
    path === '/live' ||
    path.startsWith('/live/') ||
    path === '/tournaments' ||
    path.startsWith('/tournaments/') ||
    path.startsWith('/login') ||
    path.startsWith('/forgot-password') ||
    path.startsWith('/reset-password')
  );
}

/**
 * Logout callback injected by AuthInitializer once React has mounted.
 * Calling it clears auth state and navigates to /login via React Router
 * (client-side, no hard reload, no GitHub Pages 404 status in the network log).
 * Falls back to a hard redirect before React is ready.
 */
let _logoutCallback: (() => void) | null = null;

export function setLogoutCallback(fn: () => void): void {
  _logoutCallback = fn;
}

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('bc_token');
      localStorage.removeItem('bc-auth');

      // Only redirect to login when the user is on a page that actually requires
      // authentication. On public pages (tournaments, division teams, etc.) a 401
      // should never push guests to the login screen.
      const path = appRelativePath();
      if (!isPublicPage() && !path.startsWith('/login')) {
        if (_logoutCallback) {
          _logoutCallback();
        } else {
          // Fallback: React hasn't mounted yet, hard-redirect is the only option.
          window.location.href = toAppPath('/login');
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
