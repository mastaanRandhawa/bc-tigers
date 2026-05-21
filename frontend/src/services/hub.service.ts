import apiClient from '@/lib/api-client';
import type { Tournament } from '@/types';

export interface HomeHubResponse {
  tournaments: (Tournament & { _count?: { divisions: number } })[];
}

export const hubService = {
  getHome: () => apiClient.get<HomeHubResponse>('/hub/home'),
};
