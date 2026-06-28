import apiClient from '@/lib/api-client';
import type { CoachTeamRequest, Match, Player, Team, User } from '@/types';

export type CoachTeamSummary = {
  id: string;
  name: string;
  slug: string;
  management_locked: boolean;
  division: {
    id: string;
    name: string;
    slug: string;
    tournament?: { id: string; name: string };
  };
};

export type CoachTeamResponse =
  | (Team & {
      assigned: true;
      teams: CoachTeamSummary[];
      team_ids: string[];
      selected_team_id?: string;
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
      teams: CoachTeamSummary[];
      team_ids: string[];
      coach_management_locked?: boolean;
      coach_lock_scheduled_at?: string | null;
      coach_lock_scheduled_pending?: boolean;
      coach_lock_manual?: boolean;
      coach_lock_scheduled_active?: boolean;
      can_edit: false;
      max_players_per_team?: number;
      roster_count?: number;
    };

const teamParams = (teamId?: string) =>
  teamId ? { params: { team_id: teamId } } : {};

export const coachService = {
  me: () =>
    apiClient.get<
      User & {
        team_ids?: string[];
        coach_management_locked?: boolean;
        coach_lock_scheduled_at?: string | null;
        coach_lock_scheduled_pending?: boolean;
        coach_lock_manual?: boolean;
        coach_lock_scheduled_active?: boolean;
      }
    >('/coach/me'),

  listTeams: () => apiClient.get<CoachTeamSummary[]>('/coach/teams'),

  listTeamRequests: () => apiClient.get<CoachTeamRequest[]>('/coach/team-requests'),

  createTeamRequest: (teamId: string) =>
    apiClient.post<CoachTeamRequest>('/coach/team-requests', { team_id: teamId }),

  getTeam: (teamId?: string) =>
    apiClient.get<CoachTeamResponse>('/coach/team', teamParams(teamId)),

  updateTeam: (data: Partial<Team>, teamId?: string) =>
    apiClient.patch<Team>('/coach/team', data, teamParams(teamId)),

  getPlayers: (teamId?: string) =>
    apiClient.get<Player[]>('/coach/team/players', teamParams(teamId)),

  createPlayer: (data: Partial<Player>, teamId?: string) =>
    apiClient.post<Player>('/coach/team/players', data, teamParams(teamId)),

  updatePlayer: (playerId: string, data: Partial<Player>, teamId?: string) =>
    apiClient.patch<Player>(
      `/coach/team/players/${playerId}`,
      data,
      teamParams(teamId),
    ),

  deletePlayer: (playerId: string, teamId?: string) =>
    apiClient.delete<Player>(`/coach/team/players/${playerId}`, teamParams(teamId)),

  getMatches: (teamId?: string) =>
    apiClient.get<Match[]>('/coach/team/matches', teamParams(teamId)),
};
