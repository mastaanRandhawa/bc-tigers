import apiClient from '@/lib/api-client';
import type { User, UserRole } from '@/types';

export const usersService = {
  getAll: (params?: { page?: number; limit?: number }) =>
    apiClient.get<User[]>('/users', { params }),

  create: (data: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    phone?: string;
  }) => apiClient.post<User>('/users', data),

  update: (id: string, data: Partial<User> & { role?: UserRole }) =>
    apiClient.patch<User>(`/users/${id}`, data),

  delete: (id: string) => apiClient.delete<User>(`/users/${id}`),
};
