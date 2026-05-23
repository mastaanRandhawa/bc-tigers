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

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('bc_token');
      localStorage.removeItem('bc-auth');

      // Don't redirect when the 401 came from the auth-initialization endpoint.
      // authStore.initialize() already handles that case in its catch block, and
      // public pages (division teams, standings, etc.) should remain accessible
      // to guests even when they have a stale/expired token.
      const requestUrl: string = error.config?.url ?? '';
      const isAuthInit = requestUrl.endsWith('/auth/me') && error.config?.method === 'get';

      if (!isAuthInit && !window.location.pathname.endsWith('/login')) {
        const loginPath = toAppPath('/login');
        window.location.href = loginPath;
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
