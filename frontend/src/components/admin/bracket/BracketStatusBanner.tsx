import type { ReactNode } from 'react';
import { Lock, ShieldCheck } from 'lucide-react';
import { m } from 'motion/react';

interface BracketStatusBannerProps {
  resultsFrozen: boolean;
  structureLocked: boolean;
  adminBracketLocked: boolean;
  unassignedCount: number;
}

export function BracketStatusBanner({
  resultsFrozen,
  structureLocked,
  adminBracketLocked,
  unassignedCount,
}: BracketStatusBannerProps) {
  return (
    <div className="space-y-3">
      {(structureLocked || resultsFrozen) && (
        <m.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 rounded-lg border border-amber-500/25 bg-amber-500/8 px-4 py-3"
        >
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
          <p className="text-sm leading-relaxed text-amber-900 dark:text-amber-100">
            {resultsFrozen
              ? 'Bracket finalized. Results are frozen. Unfinalize to edit again.'
              : adminBracketLocked
              ? 'Structure locked. Unlock to edit team placement. Match results can still be entered.'
              : 'Structure locked.'}
          </p>
        </m.div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <StatusStat
          label="Unassigned teams"
          value={String(unassignedCount)}
          hint={unassignedCount === 0 ? 'All teams placed' : 'Place in first round'}
          icon={<ShieldCheck className="h-4 w-4 text-emerald-600" />}
        />
        <StatusStat
          label="Tournament status"
          value={resultsFrozen ? 'Finalized' : structureLocked ? 'Locked' : 'In progress'}
          hint={resultsFrozen ? 'Champion confirmed' : 'Drag teams or pick winners'}
        />
      </div>
    </div>
  );
}

function StatusStat({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border/80 bg-card px-4 py-3 shadow-[var(--shadow-xs)]">
      <div className="mb-1 flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
        {icon}
      </div>
      <p className="font-display text-xl font-semibold tracking-tight text-foreground">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
