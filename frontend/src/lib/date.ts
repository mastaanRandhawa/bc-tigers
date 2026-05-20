import { format, isValid, parseISO } from 'date-fns';

function toDate(value: string | Date): Date {
  if (value instanceof Date) return value;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : new Date(value);
}

/** e.g. Jul 3, 2026 */
export function formatDate(value: string | Date, pattern = 'MMM d, yyyy') {
  return format(toDate(value), pattern);
}

/** e.g. 6:00 PM */
export function formatTime(value: string | Date, pattern = 'h:mm a') {
  return format(toDate(value), pattern);
}

/** e.g. Jul 3, 2026 • 6:00 PM */
export function formatDateTime(value: string | Date) {
  return format(toDate(value), 'MMM d, yyyy • h:mm a');
}

/** Group key for schedule lists — e.g. Friday, July 3, 2026 */
export function formatScheduleDay(value: string | Date) {
  return format(toDate(value), 'EEEE, MMMM d, yyyy');
}
