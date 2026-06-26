import type { Division } from '@/types';

/** Kids / schedule-only divisions hide scores, standings, brackets, and stats. */
export function isScheduleOnlyDivision(division?: Pick<Division, 'schedule_only'> | null) {
  return division?.schedule_only === true;
}
