import {
  compareAsc,
  differenceInCalendarDays,
  format,
  formatISO,
  getYear,
  isFuture,
  isValid,
  parseISO,
} from 'date-fns';

export function toDate(value: string | Date): Date {
  if (value instanceof Date) return value;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : new Date(value);
}

/** e.g. Jul 3, 2026 */
export function formatDate(value: string | Date, pattern = 'MMM d, yyyy') {
  return format(toDate(value), pattern);
}

/** e.g. Jul 3, 2026 6:00 PM */
export function formatDateTime(value: string | Date, pattern = 'MMM d, yyyy h:mm a') {
  return format(toDate(value), pattern);
}

/** e.g. 6:00 PM */
export function formatTime(value: string | Date, pattern = 'h:mm a') {
  return format(toDate(value), pattern);
}

/** Group key for schedule lists — e.g. Friday, July 3, 2026 */
export function formatScheduleDay(value: string | Date) {
  return format(toDate(value), 'EEEE, MMMM d, yyyy');
}

/** Sort key for grouping matches by calendar day — e.g. 2026-07-03 */
export function scheduleDayKey(value: string | Date): string {
  return format(toDate(value), 'yyyy-MM-dd');
}

/** Compare two date values for sorting (ascending). */
export function compareDates(a: string | Date, b: string | Date): number {
  return compareAsc(toDate(a), toDate(b));
}

/** Whole calendar days until a future date; null if today or in the past. */
export function getDaysUntil(value: string | Date): number | null {
  if (!value) return null;
  const d = toDate(value);
  if (!isValid(d)) return null;
  const days = differenceInCalendarDays(d, new Date());
  return days > 0 ? days : null;
}

export function getCurrentYear(): number {
  return getYear(new Date());
}

export function nowISO(): string {
  return formatISO(new Date());
}

/** Value for `<input type="datetime-local">` */
export function toDatetimeLocalValue(iso?: string | null): string {
  if (!iso) return '';
  const d = toDate(iso);
  if (!isValid(d)) return '';
  return format(d, "yyyy-MM-dd'T'HH:mm");
}

/** Parse datetime-local string to ISO (browser local timezone). */
export function fromDatetimeLocalValue(local: string): string | null {
  if (!local) return null;
  const d = new Date(local);
  return isValid(d) ? d.toISOString() : null;
}

/** Parse datetime-local string to Date (browser local timezone). */
export function parseDatetimeLocalValue(local: string): Date | null {
  if (!local) return null;
  const d = new Date(local);
  return isValid(d) ? d : null;
}

/** Value for `<input type="date">` */
export function toDateInput(iso?: string | null): string {
  if (!iso) return '';
  const d = toDate(iso);
  if (!isValid(d)) return '';
  return format(d, 'yyyy-MM-dd');
}

/** Parse `<input type="date">` to ISO */
export function fromDateInput(value: string): string {
  if (!value) return '';
  const d = parseISO(`${value}T12:00:00`);
  return isValid(d) ? d.toISOString() : '';
}

export function isFutureDate(value: string | Date): boolean {
  return isFuture(toDate(value));
}
