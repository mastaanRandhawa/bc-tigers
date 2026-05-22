import { useLiveMatches } from '@/hooks/useMatches';
import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { useReducedMotion } from 'motion/react';
import type { Match } from '@/types';
import { cn } from '@/lib/utils';
import { getMatchPath } from '@/lib/division-routes';

interface LiveScoreTickerProps {
  embedded?: boolean;
  alwaysShow?: boolean;
  divisionId?: string;
  className?: string;
  variant?: 'dark' | 'light';
}

function MatchTickerItem({
  match,
  compact,
  light,
}: {
  match: Match;
  compact?: boolean;
  light?: boolean;
}) {
  return (
    <Link
      to={getMatchPath(match)}
      className={cn(
        'inline-flex items-center gap-2 whitespace-nowrap hover:opacity-80 transition-opacity shrink-0',
        compact ? 'text-xs' : 'text-sm',
        light ? 'text-foreground' : 'text-white',
      )}
    >
      <span className="font-medium max-w-[7rem] sm:max-w-none truncate">
        {match.home_team?.name ?? 'Home'}
      </span>
      <span
        className={cn(
          'shrink-0 rounded px-1.5 py-0.5 font-mono text-[11px] font-bold tabular-nums',
          light
            ? 'border border-border/70 bg-secondary text-foreground'
            : 'border border-white/15 bg-white/10 text-white',
        )}
      >
        {match.home_score} – {match.away_score}
      </span>
      <span className="font-medium max-w-[7rem] sm:max-w-none truncate">
        {match.away_team?.name ?? 'Away'}
      </span>
    </Link>
  );
}

export default function LiveScoreTicker({
  embedded = false,
  alwaysShow = false,
  divisionId,
  className,
  variant = 'dark',
}: LiveScoreTickerProps) {
  const { data: liveMatches = [] } = useLiveMatches({ divisionId });
  const reducedMotion = useReducedMotion();
  const light = variant === 'light';

  if (liveMatches.length === 0 && !alwaysShow) return null;

  const shouldMarquee = liveMatches.length > 1 && !reducedMotion;
  const tickerMatches = shouldMarquee ? [...liveMatches, ...liveMatches] : liveMatches;
  const tickerDuration = `${Math.max(liveMatches.length * 7, 14)}s`;

  return (
    <div
      className={cn(
        'overflow-hidden min-w-0',
        light ? 'text-foreground' : 'text-white',
        embedded ? 'py-0.5' : light ? 'bg-zinc-100 py-2 safe-x' : 'bg-primary py-2 safe-x',
        className,
      )}
      role="region"
      aria-label="Live scores"
    >
      <div className={cn('flex items-center gap-2 sm:gap-3 min-w-0', !embedded && 'max-w-7xl mx-auto px-4')}>
        <div
          className={cn(
            'flex items-center gap-1.5 shrink-0 px-2.5 py-1 rounded-md',
            light ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-white/15 text-white',
          )}
        >
          <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5" aria-hidden />
          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Live</span>
        </div>

        {liveMatches.length === 0 ? (
          <p className={cn('text-xs sm:text-sm truncate', light ? 'text-muted-foreground' : 'text-white/70')}>
            No live matches right now
          </p>
        ) : (
          <div
            className={cn(
              'relative flex-1 min-w-0',
              shouldMarquee ? 'overflow-hidden' : 'overflow-x-auto no-scrollbar',
            )}
          >
            <div
              className={cn(
                'flex items-center gap-6 sm:gap-8 w-max py-0.5 pr-4',
                shouldMarquee && 'animate-live-ticker',
              )}
              style={
                shouldMarquee ? ({ '--ticker-duration': tickerDuration } as React.CSSProperties) : undefined
              }
            >
              {tickerMatches.map((match, index) => (
                <div key={`${match.id}-${index}`} className="flex items-center gap-6 sm:gap-8 shrink-0">
                  {index > 0 && (
                    <span
                      className={cn(
                        'text-base leading-none select-none',
                        light ? 'text-zinc-300' : 'text-white/40',
                      )}
                      aria-hidden
                    >
                      •
                    </span>
                  )}
                  <MatchTickerItem match={match} compact={embedded} light={light} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
