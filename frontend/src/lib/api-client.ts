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
 * Returns true when the user is currently on a page that is publicly accessible
 * without authentication. A 401 on a public page should never force-redirect to
 * login — the SiteHeader's isInitialized guard prevents auth-gated components
 * from firing in the first place, but this is a belt-and-suspenders fallback.
 */
function isPublicPage(): boolean {
  const path = window.location.pathname;
  return (
    path === '/' ||
    path === '/live' ||
    path.startsWith('/live/') ||
    path === '/tournaments' ||
    path.startsWith('/tournaments/') ||
    path.startsWith('/login') ||
    path.startsWith('/register') ||
    path.startsWith('/forgot-password') ||
    path.startsWith('/reset-password')
  );
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
      if (!isPublicPage() && !window.location.pathname.endsWith('/login')) {
        const loginPath = toAppPath('/login');
        window.location.href = loginPath;
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
