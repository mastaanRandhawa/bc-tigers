import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { teamsService } from '@/services/teams.service';
import { rostersService } from '@/services/rosters.service';
import type { Team } from '@/types';

export function useUpdateTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Team> }) =>
      teamsService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] });
      qc.invalidateQueries({ queryKey: ['divisions'] });
    },
  });
}

export function useAddRosterPlayer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      teamId,
      playerId,
    }: {
      teamId: string;
      playerId: string;
      tournamentSlug: string;
      divisionSlug: string;
      teamSlug: string;
    }) => rostersService.add(teamId, { player_id: playerId, active: true }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({
        queryKey: queryKeys.divisions.resources.team(
          vars.tournamentSlug,
          vars.divisionSlug,
          vars.teamSlug,
        ),
      });
    },
  });
}

export function useRemoveRosterPlayer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      teamId,
      rosterId,
    }: {
      teamId: string;
      rosterId: string;
      tournamentSlug: string;
      divisionSlug: string;
      teamSlug: string;
    }) => rostersService.remove(teamId, rosterId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({
        queryKey: queryKeys.divisions.resources.team(
          vars.tournamentSlug,
          vars.divisionSlug,
          vars.teamSlug,
        ),
      });
    },
  });
}

export function useUpdateRosterPlayer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      teamId,
      rosterId,
      data,
    }: {
      teamId: string;
      rosterId: string;
      data: { active?: boolean; season?: string };
      tournamentSlug: string;
      divisionSlug: string;
      teamSlug: string;
    }) => rostersService.update(teamId, rosterId, data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({
        queryKey: queryKeys.divisions.resources.team(
          vars.tournamentSlug,
          vars.divisionSlug,
          vars.teamSlug,
        ),
      });
    },
  });
}
