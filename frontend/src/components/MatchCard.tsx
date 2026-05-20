import { Link } from 'react-router-dom';
import { MapPin, Clock, User } from 'lucide-react';
import type { Match } from '@/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDate, formatTime, getMatchStatusBadgeVariant } from '@/lib/utils';
import { getMatchPath } from '@/lib/division-routes';

interface MatchCardProps {
  match: Match;
  compact?: boolean;
}

export default function MatchCard({ match, compact = false }: MatchCardProps) {
  const isLive = match.status === 'LIVE';
  const isCompleted = match.status === 'COMPLETED';
  const showScore = isLive || isCompleted;

  if (compact) {
    return (
      <Link to={getMatchPath(match)} className="block group min-w-0">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 py-2 rounded-lg hover:bg-zinc-50 transition-all duration-200 min-w-0">
          <p className="text-sm font-medium text-foreground truncate text-right min-w-0">
            {match.home_team?.name ?? 'TBD'}
          </p>
          <div className="shrink-0 text-center px-1">
            {showScore ? (
              <span
                className={cn(
                  'text-sm font-bold tabular-nums whitespace-nowrap',
                  isLive ? 'text-primary' : 'text-foreground',
                )}
              >
                {match.home_score} – {match.away_score}
              </span>
            ) : (
              <span className="text-xs font-medium text-zinc-500 whitespace-nowrap">
                {formatTime(match.scheduled_start)}
              </span>
            )}
            {isLive && (
              <span className="text-[9px] text-red-600 font-semibold uppercase block leading-none mt-0.5">
                Live
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-foreground truncate text-left min-w-0">
            {match.away_team?.name ?? 'TBD'}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link to={getMatchPath(match)} className="block group">
      <div className="rounded-xl border border-border bg-white shadow-sm p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-px">
        <div className="flex items-center justify-between mb-3">
          <Badge variant={getMatchStatusBadgeVariant(match.status)}>
            {isLive ? '● LIVE' : match.status}
          </Badge>
          <span className="text-xs text-zinc-500">{formatDate(match.scheduled_start)}</span>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="text-right min-w-0">
            {match.home_team?.logo && (
              <img
                src={match.home_team.logo}
                alt=""
                className="w-8 h-8 rounded-full object-cover ml-auto mb-1.5 border border-border"
              />
            )}
            <p className="font-medium text-foreground text-sm truncate">
              {match.home_team?.name ?? 'TBD'}
            </p>
          </div>

          <div className="flex flex-col items-center min-w-[72px] shrink-0">
            {showScore ? (
              <div
                className={cn(
                  'text-xl font-bold tabular-nums tracking-tight',
                  isLive ? 'text-primary' : 'text-foreground',
                )}
              >
                {match.home_score}
                <span className="text-zinc-300 mx-1 font-normal">–</span>
                {match.away_score}
              </div>
            ) : (
              <div className="text-center">
                <p className="text-xs font-medium text-zinc-400 uppercase">vs</p>
                <p className="text-sm font-semibold text-foreground mt-0.5">
                  {formatTime(match.scheduled_start)}
                </p>
              </div>
            )}
          </div>

          <div className="text-left min-w-0">
            {match.away_team?.logo && (
              <img
                src={match.away_team.logo}
                alt=""
                className="w-8 h-8 rounded-full object-cover mr-auto mb-1.5 border border-border"
              />
            )}
            <p className="font-medium text-foreground text-sm truncate">
              {match.away_team?.name ?? 'TBD'}
            </p>
          </div>
        </div>

        {(match.venue || match.round !== undefined || match.referee) && (
          <div className="mt-3 pt-3 border-t border-border flex flex-wrap items-center justify-center gap-3 text-xs text-zinc-500">
            {match.venue && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {match.venue.name}
              </span>
            )}
            {match.round !== undefined && (
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3 h-3" /> Round {match.round}
              </span>
            )}
            {match.referee && (
              <span className="inline-flex items-center gap-1">
                <User className="w-3 h-3" /> {match.referee.first_name} {match.referee.last_name}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
