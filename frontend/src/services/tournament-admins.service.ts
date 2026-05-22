import apiClient from '@/lib/api-client';
import type { TournamentAdmin } from '@/types';

export const tournamentAdminsService = {
  getByTournament: (tournamentId: string) =>
    apiClient.get<TournamentAdmin[]>(`/tournaments/${tournamentId}/admins`),

  assign: (tournamentId: string, data: { user_id: string; role?: string }) =>
    apiClient.post<TournamentAdmin>(`/tournaments/${tournamentId}/admins`, data),

  revoke: (tournamentId: string, tournamentAdminId: string) =>
    apiClient.delete(`/tournaments/${tournamentId}/admins/${tournamentAdminId}`),
};
