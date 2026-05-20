import apiClient from '@/lib/api-client';
import type { Standing } from '@/types';

export const standingsService = {
  getByDivision: (divisionId: string) =>
    apiClient.get<Standing[]>(`/standings/${divisionId}`),

  recalculate: (divisionId: string) =>
    apiClient.post<Standing[]>(`/standings/${divisionId}/recalculate`),
};
