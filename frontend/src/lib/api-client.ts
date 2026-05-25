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
    const status: number | undefined = error.response?.status;
    const requestUrl: string = error.config?.url ?? '';

    // Skip the hard redirect for /auth/me 401s.
    // authStore.initialize() and refreshUser() both call this endpoint and
    // handle 401 themselves by updating the store, letting ProtectedRoute do a
    // clean client-side redirect instead of a full-page reload that triggers a
    // server 404 on the /login document.
    if (status === 401 && !requestUrl.includes('/auth/me')) {
      localStorage.removeItem('bc_token');
      localStorage.removeItem('bc-auth');
      const loginPath = toAppPath('/login');
      if (!window.location.pathname.endsWith('/login')) {
        window.location.href = loginPath;
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
