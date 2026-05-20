import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', options ?? { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export function formatDateTime(date: string | Date): string {
  return `${formatDate(date)} • ${formatTime(date)}`;
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

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    LIVE: 'bg-red-500',
    SCHEDULED: 'bg-blue-500',
    COMPLETED: 'bg-green-600',
    POSTPONED: 'bg-yellow-500',
    CANCELLED: 'bg-gray-500',
    UPCOMING: 'bg-blue-500',
    ACTIVE: 'bg-green-500',
  };
  return map[status] ?? 'bg-gray-400';
}

export function getFormColor(result: 'W' | 'D' | 'L'): string {
  const map = { W: 'bg-green-500', D: 'bg-yellow-400', L: 'bg-red-500' };
  return map[result];
}
