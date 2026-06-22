import { m } from 'motion/react';
import { Crown, Sparkles, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Team } from '@/types';

interface ChampionCardProps {
  champion?: Team | null;
  finalized: boolean;
}

export function ChampionCard({ champion, finalized }: ChampionCardProps) {
  const hasChampion = !!champion;

  return (
    <m.aside
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'flex w-[248px] flex-col overflow-hidden rounded-lg border shadow-[var(--shadow-md)]',
        hasChampion
          ? 'border-amber-500/30 bg-gradient-to-b from-amber-500/10 to-card'
          : 'border-border/80 bg-card',
        finalized && hasChampion && 'ring-2 ring-amber-500/20',
      )}
      aria-label="Tournament champion"
    >
      <div className="flex items-center justify-center gap-2 border-b border-border/60 bg-muted/30 px-4 py-3">
        <Trophy className="h-4 w-4 text-amber-500" aria-hidden />
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Champion</p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 text-center">
        {hasChampion ? (
          <>
            {finalized && (
              <m.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
                className="mb-3"
              >
                <Sparkles className="h-5 w-5 text-amber-500" aria-hidden />
              </m.div>
            )}
            {champion.logo ? (
              <img
                src={champion.logo}
                alt=""
                className="mb-3 h-16 w-16 rounded-lg object-cover ring-2 ring-amber-500/30 shadow-[var(--shadow-md)]"
              />
            ) : (
              <div
                className="mb-3 flex h-16 w-16 items-center justify-center rounded-lg text-lg font-bold text-white shadow-[var(--shadow-md)]"
                style={{ backgroundColor: champion.primary_color ?? '#f59e0b' }}
              >
                {champion.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <p className="font-display text-lg font-semibold tracking-tight text-foreground">{champion.name}</p>
            {champion.city && <p className="mt-1 text-xs text-muted-foreground">{champion.city}</p>}
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
              <Crown className="h-3 w-3" aria-hidden />
              Tournament winner
            </div>
          </>
        ) : (
          <>
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30">
              <Crown className="h-6 w-6 text-muted-foreground/40" aria-hidden />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Awaiting final</p>
            <p className="mt-1 text-xs text-muted-foreground/80">Champion appears when the final is decided</p>
          </>
        )}
      </div>
    </m.aside>
  );
}
