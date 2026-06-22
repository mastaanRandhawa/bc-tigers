import apiClient from '@/lib/api-client';
import type { User, UserRole } from '@/types';

export const usersService = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    role?: UserRole;
    approved?: boolean;
  }) => apiClient.get<User[]>('/users', { params }),

  create: (data: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    phone?: string;
    role?: UserRole;
  }) => apiClient.post<User>('/users', data),

  update: (id: string, data: Partial<User> & { role?: UserRole }) =>
    apiClient.patch<User>(`/users/${id}`, data),

  approve: (id: string) => apiClient.patch<User>(`/users/${id}/approve`),

  resetPassword: (id: string, password: string) =>
    apiClient.post<User>(`/users/${id}/reset-password`, { password }),

  delete: (id: string) => apiClient.delete<User>(`/users/${id}`),
};
