import apiClient from '@/lib/api-client';
import type { Division, Match, Tournament } from '@/types';

export interface HubAnnouncement {
  id: string;
  title: string;
  message: string;
  type: string;
  created_at: string;
  tournament_id?: string | null;
}

export interface HubMediaItem {
  id: string;
  type: string;
  url: string;
  title?: string | null;
  description?: string | null;
  tournament_id?: string | null;
}

export interface HomeHubResponse {
  tournaments: Tournament[];
  liveMatches: Match[];
  recentMatches: Match[];
  upcomingMatches: Match[];
  announcements?: HubAnnouncement[];
  featuredMedia?: HubMediaItem[];
}

export const hubService = {
  getHome: () => apiClient.get<HomeHubResponse>('/hub/home'),
  getLiveMatches: (divisionId?: string) =>
    apiClient.get<Match[]>('/hub/live-matches', {
      params: divisionId ? { divisionId } : undefined,
    }),
  resolveDivision: (divisionSlug: string) =>
    apiClient.get<Division | Division[]>('/hub/resolve-division/' + divisionSlug),
};
