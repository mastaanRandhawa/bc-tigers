import apiClient from '@/lib/api-client';
import type { AuthResponse, User } from '@/types';

export const authService = {
  login: (email: string, password: string) =>
    apiClient.post<AuthResponse>('/auth/login', { email, password }),

  me: () => apiClient.get<User>('/auth/me'),

  updateProfile: (data: Partial<Pick<User, 'first_name' | 'last_name' | 'phone' | 'profile_image'>>) =>
    apiClient.patch<User>('/auth/me', data),

  forgotPassword: (email: string) =>
    apiClient.post<{ message: string }>('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    apiClient.post<{ message: string }>('/auth/reset-password', { token, password }),

  registerCoach: (data: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    phone?: string;
    team_ids: string[];
  }) => apiClient.post<{ message: string }>('/auth/register-coach', data),
};
