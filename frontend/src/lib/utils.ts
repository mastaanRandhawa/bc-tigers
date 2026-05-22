import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export { formatDate, formatDateTime, formatScheduleDay, formatTime } from '@/lib/date';

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

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    LIVE: 'bg-red-600 text-white',
    SCHEDULED: 'bg-primary text-white',
    COMPLETED: 'bg-green-700 text-white',
    POSTPONED: 'bg-amber-600 text-white',
    CANCELLED: 'bg-gray-600 text-white',
    UPCOMING: 'bg-primary text-white',
    ACTIVE: 'bg-green-700 text-white',
  };
  return map[status] ?? 'bg-gray-600 text-white';
}

export function getFormColor(result: 'W' | 'D' | 'L'): string {
  const map = { W: 'bg-green-500', D: 'bg-yellow-400', L: 'bg-red-500' };
  return map[result];
}
