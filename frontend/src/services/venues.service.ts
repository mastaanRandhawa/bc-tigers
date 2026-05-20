import apiClient from '@/lib/api-client';
import type { Venue } from '@/types';

export const venuesService = {
  getAll: () => apiClient.get<Venue[]>('/venues'),

  getOne: (slug: string) => apiClient.get<Venue>(`/venues/${slug}`),

  create: (data: Partial<Venue>) => apiClient.post<Venue>('/venues', data),

  update: (id: string, data: Partial<Venue>) =>
    apiClient.patch<Venue>(`/venues/${id}`, data),

  delete: (id: string) => apiClient.delete<Venue>(`/venues/${id}`),
};
