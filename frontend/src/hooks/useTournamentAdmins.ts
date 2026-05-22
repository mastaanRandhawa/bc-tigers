import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tournamentAdminsService } from '@/services/tournament-admins.service';

const keys = {
  byTournament: (id: string) => ['tournament-admins', id] as const,
};

export function useTournamentAdmins(tournamentId?: string) {
  return useQuery({
    queryKey: keys.byTournament(tournamentId ?? ''),
    queryFn: async () => (await tournamentAdminsService.getByTournament(tournamentId!)).data,
    enabled: !!tournamentId,
  });
}

export function useAssignTournamentAdmin(tournamentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { user_id: string; role?: string }) =>
      tournamentAdminsService.assign(tournamentId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.byTournament(tournamentId) }),
  });
}

export function useRevokeTournamentAdmin(tournamentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tournamentAdminId: string) =>
      tournamentAdminsService.revoke(tournamentId, tournamentAdminId),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.byTournament(tournamentId) }),
  });
}
