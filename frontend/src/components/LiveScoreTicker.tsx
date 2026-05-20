import { useLiveMatches } from '@/hooks/useMatches';
import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { useReducedMotion } from 'motion/react';
import type { Match } from '@/types';
import { cn } from '@/lib/utils';

function MatchTickerItem({ match }: { match: Match }) {
  return (
    <Link
      to={`/matches/${match.id}`}
      className="inline-flex items-center gap-2 whitespace-nowrap hover:opacity-90 transition-opacity shrink-0 text-sm"
    >
      <span className="font-medium">{match.home_team?.name ?? 'Home'}</span>
      <span className="font-bold bg-white/20 px-2.5 py-0.5 rounded-full tabular-nums">
        {match.home_score} – {match.away_score}
      </span>
      <span className="font-medium">{match.away_team?.name ?? 'Away'}</span>
    </Link>
  );
}

export default function LiveScoreTicker() {
  const { data: liveMatches = [] } = useLiveMatches();
  const reducedMotion = useReducedMotion();

  if (liveMatches.length === 0) return null;

  const shouldMarquee = liveMatches.length > 1 && !reducedMotion;
  const tickerMatches = shouldMarquee ? [...liveMatches, ...liveMatches] : liveMatches;
  const tickerDuration = `${Math.max(liveMatches.length * 7, 14)}s`;

  return (
    <div
      className="bg-primary text-white py-2 overflow-hidden safe-x"
      role="region"
      aria-label="Live scores"
    >
      <div className="flex items-center gap-3 max-w-7xl mx-auto px-4 min-w-0">
        <div className="flex items-center gap-1.5 shrink-0 bg-primary-hover px-3 py-1 rounded-full">
          <Zap className="w-3.5 h-3.5" aria-hidden />
          <span className="text-xs font-bold uppercase tracking-wider">Live</span>
        </div>

        <div
          className={cn(
            'relative flex-1 min-w-0',
            shouldMarquee ? 'overflow-hidden' : 'overflow-x-auto no-scrollbar'
          )}
        >
          <div
            className={cn(
              'flex items-center gap-8 w-max py-0.5 pr-4',
              shouldMarquee && 'animate-live-ticker'
            )}
            style={shouldMarquee ? ({ '--ticker-duration': tickerDuration } as React.CSSProperties) : undefined}
          >
            {tickerMatches.map((match, index) => (
              <div key={`${match.id}-${index}`} className="flex items-center gap-8 shrink-0">
                {index > 0 && (
                  <span className="text-white/40 text-base leading-none select-none" aria-hidden>
                    •
                  </span>
                )}
                <MatchTickerItem match={match} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
