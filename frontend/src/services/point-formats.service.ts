import apiClient from '@/lib/api-client';
import type { PointFormat } from '@/types';

export const pointFormatsService = {
  getAll: () => apiClient.get<PointFormat[]>('/point-formats'),

  getOne: (id: string) => apiClient.get<PointFormat>(`/point-formats/${id}`),

  create: (data: Partial<PointFormat>) => apiClient.post<PointFormat>('/point-formats', data),

  update: (id: string, data: Partial<PointFormat>) =>
    apiClient.patch<PointFormat>(`/point-formats/${id}`, data),

  delete: (id: string) => apiClient.delete<PointFormat>(`/point-formats/${id}`),
};
