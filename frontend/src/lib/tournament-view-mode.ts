import type { Tournament } from '@/types';

/** True when a completed tournament is locked for viewing until editing is re-enabled. */
export function isTournamentViewOnly(tournament?: Pick<Tournament, 'status' | 'admin_editing_enabled'> | null) {
  return tournament?.status === 'COMPLETED' && tournament.admin_editing_enabled === false;
}
