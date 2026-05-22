import apiClient from '@/lib/api-client';
import type { Field } from '@/types';

export const fieldsService = {
  getByVenue: (venueId: string) =>
    apiClient.get<Field[]>(`/venues/${venueId}/fields`),

  create: (venueId: string, data: { name: string; surface?: string; capacity?: number }) =>
    apiClient.post<Field>(`/venues/${venueId}/fields`, data),

  update: (id: string, data: { name?: string; surface?: string; capacity?: number }) =>
    apiClient.patch<Field>(`/fields/${id}`, data),

  delete: (id: string) => apiClient.delete<Field>(`/fields/${id}`),
};
