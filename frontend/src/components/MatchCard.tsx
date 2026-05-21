import { memo } from 'react';
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
  flat?: boolean;
  featured?: boolean;
}

function TeamLogo({ logo, size = 'md' }: { logo?: string | null; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'h-6 w-6' : 'h-8 w-8';
  return logo ? (
    <img
      src={logo}
      alt=""
      loading="lazy"
      decoding="async"
      className={cn(dim, 'shrink-0 rounded-full border-2 border-foreground object-cover')}
    />
  ) : (
    <div className={cn(dim, 'shrink-0 rounded-full border-2 border-foreground bg-bauhaus-muted')} />
  );
}

function TeamLine({ name, logo, align }: { name: string; logo?: string | null; align: 'left' | 'right' }) {
  return (
    <div
      className={cn(
        'flex min-w-0 items-center gap-2',
        align === 'right' ? 'flex-row-reverse text-right' : 'text-left',
      )}
    >
      <TeamLogo logo={logo} />
      <p className="truncate text-sm font-black uppercase tracking-tight text-foreground leading-tight">{name}</p>
    </div>
  );
}

function MatchCard({ match, compact = false, flat = false, featured = false }: MatchCardProps) {
  const isLive = match.status === 'LIVE';
  const isCompleted = match.status === 'COMPLETED';
  const showScore = isLive || isCompleted;

  if (featured) {
    return (
      <Link to={getMatchPath(match)} className="group block">
        <article
          className={cn(
            'match-card-broadcast overflow-hidden',
            isLive && 'ring-2 ring-bauhaus-red animate-live-pulse',
          )}
        >
          <div className="flex items-center justify-between border-b-2 border-foreground bg-bauhaus-muted/50 px-4 py-2">
            <Badge variant={getMatchStatusBadgeVariant(match.status)}>
              {isLive ? '● LIVE' : match.status.replace(/_/g, ' ')}
            </Badge>
            {match.division?.name && (
              <span className="text-[10px] font-black uppercase tracking-widest text-foreground/50">
                {match.division.name}
              </span>
            )}
          </div>
          <div className="p-5 sm:p-6">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
              <TeamLine name={match.home_team?.name ?? 'TBD'} logo={match.home_team?.logo} align="right" />
              <div className="text-center">
                {showScore ? (
                  <div className={cn('text-4xl font-black tabular-nums font-display', isLive && 'text-bauhaus-red')}>
                    {match.home_score}
                    <span className="mx-2 font-light text-foreground/25">–</span>
                    {match.away_score}
                  </div>
                ) : (
                  <span className="text-sm font-black uppercase tracking-widest text-foreground/50">
                    {formatTime(match.scheduled_start)}
                  </span>
                )}
              </div>
              <TeamLine name={match.away_team?.name ?? 'TBD'} logo={match.away_team?.logo} align="left" />
            </div>
            <time className="mt-3 block text-center text-xs font-semibold text-foreground/50" dateTime={match.scheduled_start}>
              {formatDate(match.scheduled_start)}
            </time>
          </div>
        </article>
      </Link>
    );
  }

  if (compact) {
    return (
      <Link to={getMatchPath(match)} className="group block min-w-0">
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 border-2 border-transparent px-1 py-2 transition-all hover:border-foreground hover:bg-bauhaus-muted/40">
          <p className="truncate text-right text-sm font-bold uppercase tracking-tight text-foreground">
            {match.home_team?.name ?? 'TBD'}
          </p>
          <div className="shrink-0 min-w-[52px] px-1 text-center">
            {showScore ? (
              <span
                className={cn(
                  'whitespace-nowrap text-sm font-black tabular-nums',
                  isLive ? 'text-bauhaus-red' : 'text-foreground',
                )}
              >
                {match.home_score} – {match.away_score}
              </span>
            ) : (
              <span className="whitespace-nowrap text-xs font-bold uppercase tracking-wide text-foreground/50">
                {formatTime(match.scheduled_start)}
              </span>
            )}
            {isLive && (
              <span className="mt-0.5 block text-[9px] font-black uppercase leading-none text-bauhaus-red">
                LIVE
              </span>
            )}
          </div>
          <p className="truncate text-left text-sm font-bold uppercase tracking-tight text-foreground">
            {match.away_team?.name ?? 'TBD'}
          </p>
        </div>
      </Link>
    );
  }

  const inner = (
    <div className={cn(flat ? 'py-3 first:pt-0 last:pb-0' : 'p-3.5 sm:p-4')}>
      <div className={cn('mb-2.5 flex items-center justify-between gap-2', flat && 'mb-2')}>
        <Badge variant={getMatchStatusBadgeVariant(match.status)}>
          {isLive ? '● LIVE' : match.status.replace(/_/g, ' ')}
        </Badge>
        <time className="text-xs font-semibold text-foreground/45" dateTime={match.scheduled_start}>
          {formatDate(match.scheduled_start)}
          {!showScore && (
            <span className="ml-1.5 font-black text-foreground/70">
              {formatTime(match.scheduled_start)}
            </span>
          )}
        </time>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <TeamLine
          name={match.home_team?.name ?? 'TBD'}
          logo={match.home_team?.logo}
          align="right"
        />

        <div className="flex min-w-[64px] shrink-0 flex-col items-center justify-center">
          {showScore ? (
            <div
              className={cn(
                'text-2xl font-black tabular-nums tracking-tight font-display',
                isLive ? 'text-bauhaus-red' : 'text-foreground',
              )}
            >
              {match.home_score}
              <span className="mx-1 font-light text-foreground/25">–</span>
              {match.away_score}
            </div>
          ) : (
            <span className="text-[11px] font-black uppercase tracking-widest text-foreground/40">vs</span>
          )}
        </div>

        <TeamLine
          name={match.away_team?.name ?? 'TBD'}
          logo={match.away_team?.logo}
          align="left"
        />
      </div>

      {(match.venue || match.round !== undefined || match.referee) && (
        <div className="mt-2.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-t-2 border-foreground/10 pt-2 text-xs font-semibold text-foreground/50">
          {match.venue && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3 shrink-0" aria-hidden />
              {match.venue.name}
            </span>
          )}
          {match.round !== undefined && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3 shrink-0" aria-hidden />
              Round {match.round}
            </span>
          )}
          {match.referee && (
            <span className="inline-flex items-center gap-1">
              <User className="h-3 w-3 shrink-0" aria-hidden />
              {match.referee.first_name} {match.referee.last_name}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (flat) {
    return (
      <Link
        to={getMatchPath(match)}
        className="group block transition-colors hover:bg-bauhaus-muted/40 -mx-0.5 border-2 border-transparent px-0.5 hover:border-foreground/20"
      >
        {inner}
      </Link>
    );
  }

  return (
    <Link to={getMatchPath(match)} className="group block">
      <article className="match-card-broadcast">{inner}</article>
    </Link>
  );
}

export default memo(MatchCard);
