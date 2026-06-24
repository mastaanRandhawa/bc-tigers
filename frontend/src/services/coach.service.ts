import apiClient from '@/lib/api-client';
import type { Match, Player, Team, User } from '@/types';

export type CoachTeamResponse =
  | (Team & {
      assigned: true;
      coach_management_locked?: boolean;
      coach_lock_scheduled_at?: string | null;
      coach_lock_scheduled_pending?: boolean;
      coach_lock_manual?: boolean;
      coach_lock_scheduled_active?: boolean;
      can_edit?: boolean;
      max_players_per_team?: number;
      roster_count?: number;
    })
  | {
      assigned: false;
      coach_management_locked?: boolean;
      coach_lock_scheduled_at?: string | null;
      coach_lock_scheduled_pending?: boolean;
      coach_lock_manual?: boolean;
      coach_lock_scheduled_active?: boolean;
      can_edit: false;
      max_players_per_team?: number;
      roster_count?: number;
    };

export const coachService = {
  me: () =>
    apiClient.get<
      User & {
        coach_management_locked?: boolean;
        coach_lock_scheduled_at?: string | null;
        coach_lock_scheduled_pending?: boolean;
        coach_lock_manual?: boolean;
        coach_lock_scheduled_active?: boolean;
      }
    >('/coach/me'),

  getTeam: () => apiClient.get<CoachTeamResponse>('/coach/team'),

  updateTeam: (data: Partial<Team>) => apiClient.patch<Team>('/coach/team', data),

  getPlayers: () => apiClient.get<Player[]>('/coach/team/players'),

  createPlayer: (data: Partial<Player>) =>
    apiClient.post<Player>('/coach/team/players', data),

  updatePlayer: (playerId: string, data: Partial<Player>) =>
    apiClient.patch<Player>(`/coach/team/players/${playerId}`, data),

  deletePlayer: (playerId: string) =>
    apiClient.delete<Player>(`/coach/team/players/${playerId}`),

  getMatches: () => apiClient.get<Match[]>('/coach/team/matches'),
};
