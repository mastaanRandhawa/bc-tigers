import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export {
  compareDates,
  formatDate,
  formatDateTime,
  formatScheduleDay,
  formatTime,
  fromDateInput,
  fromDatetimeLocalValue,
  getCurrentYear,
  getDaysUntil,
  isFutureDate,
  nowISO,
  parseDatetimeLocalValue,
  scheduleDayKey,
  toDateInput,
  toDatetimeLocalValue,
} from '@/lib/date';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .trim();
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Display name for a match side: the registered team's name, otherwise the
 * placeholder label ("Winner of Match 11", "Pool A 1st"), otherwise "TBD".
 */
export function matchSideName(
  team?: { name: string } | null,
  label?: string | null,
): string {
  return team?.name ?? label ?? 'TBD';
}

/** Venue and field label for schedules, e.g. "Main Park · Field 1". */
export function matchVenueLabel(match: {
  venue?: { name: string } | null;
  field?: { name: string } | null;
}): string | null {
  if (!match.venue && !match.field) return null;
  if (match.venue && match.field) return `${match.venue.name} · ${match.field.name}`;
  return match.venue?.name ?? match.field?.name ?? null;
}

export type MatchStatusBadgeVariant =
  | 'live'
  | 'success'
  | 'completed'
  | 'scheduled'
  | 'warning'
  | 'cancelled'
  | 'default';

export function getMatchStatusBadgeVariant(status: string): MatchStatusBadgeVariant {
  switch (status) {
    case 'LIVE':
      return 'live';
    case 'COMPLETED':
      return 'completed';
    case 'SCHEDULED':
      return 'scheduled';
    case 'POSTPONED':
      return 'warning';
    case 'CANCELLED':
      return 'cancelled';
    default:
      return 'default';
  }
}

export function getFormColor(result: 'W' | 'D' | 'L'): string {
  const map = { W: 'bg-green-500', D: 'bg-yellow-400', L: 'bg-red-500' };
  return map[result];
}
