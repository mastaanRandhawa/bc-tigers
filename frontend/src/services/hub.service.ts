import apiClient from '@/lib/api-client';
import type { Match, Tournament } from '@/types';

export interface HomeHubResponse {
  tournaments: Tournament[];
  liveMatches: Match[];
  recentMatches: Match[];
  upcomingMatches: Match[];
}

export const hubService = {
  getHome: () => apiClient.get<HomeHubResponse>('/hub/home'),
};
