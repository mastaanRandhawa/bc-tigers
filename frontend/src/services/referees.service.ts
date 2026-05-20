import apiClient from '@/lib/api-client';
import type { Referee } from '@/types';

export const refereesService = {
  getAll: () => apiClient.get<Referee[]>('/referees'),

  getOne: (id: string) => apiClient.get<Referee>(`/referees/${id}`),

  create: (data: Partial<Referee>) => apiClient.post<Referee>('/referees', data),

  update: (id: string, data: Partial<Referee>) =>
    apiClient.patch<Referee>(`/referees/${id}`, data),

  delete: (id: string) => apiClient.delete<Referee>(`/referees/${id}`),
};
