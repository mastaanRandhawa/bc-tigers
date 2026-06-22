import apiClient from '@/lib/api-client';
import type { BracketSnapshot } from '@/lib/bracket-utils';
import type { BracketNode } from '@/types';

export const bracketsService = {
  getByDivisionId: (divisionId: string) =>
    apiClient.get<BracketNode[]>(`/brackets/division/${divisionId}`),

  generate: (divisionId: string) =>
    apiClient.post<BracketNode[]>(`/brackets/${divisionId}/generate`),

  randomize: (divisionId: string) =>
    apiClient.post<BracketNode[]>(`/brackets/${divisionId}/randomize`),

  advance: (nodeId: string, winner_id: string) =>
    apiClient.patch<BracketNode>(`/brackets/nodes/${nodeId}/advance`, { winner_id }),

  placeTeam: (nodeId: string, team_id: string, slot: 'home' | 'away') =>
    apiClient.patch<BracketNode>(`/brackets/nodes/${nodeId}/place`, { team_id, slot }),

  updateNode: (nodeId: string, data: { home_team_id?: string | null; away_team_id?: string | null }) =>
    apiClient.patch<BracketNode>(`/brackets/nodes/${nodeId}`, data),

  restore: (divisionId: string, snapshot: BracketSnapshot) =>
    apiClient.post<BracketNode[]>(`/brackets/${divisionId}/restore`, { snapshot }),

  setLock: (divisionId: string, locked: boolean) =>
    apiClient.patch<{ id: string; bracket_locked: boolean }>(`/brackets/${divisionId}/lock`, { locked }),

  finalize: (divisionId: string) =>
    apiClient.patch<{ id: string; bracket_finalized: boolean }>(`/brackets/${divisionId}/finalize`),

  unfinalize: (divisionId: string) =>
    apiClient.patch<{ id: string; bracket_finalized: boolean }>(`/brackets/${divisionId}/unfinalize`),

  swapMatches: (nodeIdA: string, nodeIdB: string) =>
    apiClient.patch<BracketNode[]>('/brackets/nodes/swap', {
      node_id_a: nodeIdA,
      node_id_b: nodeIdB,
    }),

  assignTeams: (divisionId: string, teamIds: string[]) =>
    apiClient.post<BracketNode[]>(`/brackets/${divisionId}/assign-teams`, { team_ids: teamIds }),

  validate: (divisionId: string) =>
    apiClient.get<{
      valid: boolean;
      errors: string[];
      warnings: string[];
      excluded: Array<{ teamId: string; teamName: string; reason: string }>;
      eligibleCount: number;
      eligibleTeams: Array<{ id: string; name: string }>;
    }>(`/brackets/validate/${divisionId}`),
};
