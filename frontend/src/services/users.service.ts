import apiClient from '@/lib/api-client';
import type { User, UserRole } from '@/types';

export const usersService = {
  getAll: (params?: { page?: number; limit?: number }) =>
    apiClient.get<User[]>('/users', { params }),

  getOne: (id: string) => apiClient.get<User>(`/users/${id}`),

  update: (id: string, data: Partial<User> & { role?: UserRole }) =>
    apiClient.patch<User>(`/users/${id}`, data),

  delete: (id: string) => apiClient.delete<User>(`/users/${id}`),
};
