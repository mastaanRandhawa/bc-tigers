import apiClient from '@/lib/api-client';
import type { BracketNode } from '@/types';

export const bracketsService = {
  getByDivision: (divisionSlug: string) =>
    apiClient.get<BracketNode[]>(`/brackets/${divisionSlug}`),

  generate: (divisionId: string) =>
    apiClient.post<BracketNode[]>(`/brackets/${divisionId}/generate`),

  advance: (nodeId: string, winner_id: string) =>
    apiClient.patch<BracketNode>(`/brackets/nodes/${nodeId}/advance`, { winner_id }),
};
