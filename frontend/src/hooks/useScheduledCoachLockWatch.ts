import { useEffect } from 'react';

const POLL_MS = 15_000;

/** Poll interval for React Query while a coach lock schedule is still pending. */
export function scheduledCoachLockPollInterval(
  pending: boolean | undefined,
): number | false {
  return pending ? POLL_MS : false;
}

/** Refetch (and trigger server-side lock activation) when the scheduled time arrives. */
export function useScheduledCoachLockRefetch(
  scheduledAt: string | null | undefined,
  pending: boolean | undefined,
  refetch: () => void,
) {
  useEffect(() => {
    if (!pending || !scheduledAt) return;

    const runRefetch = () => {
      void refetch();
    };

    const ms = new Date(scheduledAt).getTime() - Date.now();
    if (ms <= 0) {
      runRefetch();
      return;
    }

    const timeoutId = window.setTimeout(runRefetch, ms + 250);
    return () => window.clearTimeout(timeoutId);
  }, [scheduledAt, pending, refetch]);
}
