import { useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { getCoachTeams } from '@/lib/coach-utils';
import type { Team } from '@/types';

export function useCoachTeams(): Team[] {
  const user = useAuthStore((s) => s.user);
  return useMemo(() => getCoachTeams(user), [user]);
}
