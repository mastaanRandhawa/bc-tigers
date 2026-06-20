import apiClient from '@/lib/api-client';
import type { Announcement, Division, Match, Tournament } from '@/types';

export interface HomeHubResponse {
  tournaments: Tournament[];
  liveMatches: Match[];
  recentMatches: Match[];
  upcomingMatches: Match[];
  announcements?: Announcement[];
}

export const hubService = {
  getHome: () => apiClient.get<HomeHubResponse>('/hub/home'),
  getLiveMatches: (divisionId?: string) =>
    apiClient.get<Match[]>('/hub/live-matches', {
      params: divisionId ? { divisionId } : undefined,
    }),
  resolveDivision: (divisionSlug: string) =>
    apiClient.get<Division | Division[]>('/hub/resolve-division/' + divisionSlug),

  search: (q: string) =>
    apiClient.get<{
      tournaments: Array<{ id: string; name: string; slug: string; location?: string }>;
      divisions: Array<{
        id: string;
        name: string;
        slug: string;
        tournament_slug: string;
        tournament_name: string;
      }>;
      teams: Array<{
        id: string;
        name: string;
        slug: string;
        city?: string;
        division_slug: string;
        tournament_slug: string;
      }>;
    }>('/hub/search', { params: { q } }),
};
