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
}

function MatchTickerItem({ match, compact }: { match: Match; compact?: boolean }) {
  return (
    <Link
      to={getMatchPath(match)}
      className={cn(
        'inline-flex items-center gap-2 whitespace-nowrap hover:opacity-90 transition-opacity shrink-0',
        compact ? 'text-xs' : 'text-sm',
      )}
    >
      <span className="font-medium max-w-[7rem] sm:max-w-none truncate">
        {match.home_team?.name ?? 'Home'}
      </span>
      <span className="font-bold bg-white/20 px-2 py-0.5 rounded-full tabular-nums shrink-0">
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
}: LiveScoreTickerProps) {
  const { data: liveMatches = [] } = useLiveMatches({ divisionId });
  const reducedMotion = useReducedMotion();

  if (liveMatches.length === 0 && !alwaysShow) return null;

  const shouldMarquee = liveMatches.length > 1 && !reducedMotion;
  const tickerMatches = shouldMarquee ? [...liveMatches, ...liveMatches] : liveMatches;
  const tickerDuration = `${Math.max(liveMatches.length * 7, 14)}s`;

  return (
    <div
      className={cn(
        'text-white overflow-hidden min-w-0',
        embedded ? 'py-0.5' : 'bg-primary py-2 safe-x',
        className,
      )}
      role="region"
      aria-label="Live scores"
    >
      <div className={cn('flex items-center gap-2 sm:gap-3 min-w-0', !embedded && 'max-w-7xl mx-auto px-4')}>
        <div className="flex items-center gap-1.5 shrink-0 bg-white/15 px-2.5 py-1 rounded-full">
          <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5" aria-hidden />
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Live</span>
        </div>

        {liveMatches.length === 0 ? (
          <p className="text-xs sm:text-sm text-white/70 truncate">No live matches right now</p>
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
                    <span className="text-white/40 text-base leading-none select-none" aria-hidden>
                      •
                    </span>
                  )}
                  <MatchTickerItem match={match} compact={embedded} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
