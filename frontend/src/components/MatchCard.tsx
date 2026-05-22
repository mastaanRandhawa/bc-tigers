import { memo } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, User } from 'lucide-react';
import type { Match } from '@/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDate, formatTime, getMatchStatusBadgeVariant } from '@/lib/utils';
import { getMatchPath } from '@/lib/division-routes';

/**
 * compact  — slim inline row (team vs team, score, time) — for sidebar lists
 * flat     — full layout but no card chrome; use inside bordered section panels
 * card     — (default) standalone elevated card with border + shadow
 */
interface MatchCardProps {
  match: Match;
  compact?: boolean;
  flat?: boolean;
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

function TeamLogo({ logo, name, size = 'md' }: { logo?: string | null; name?: string; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'h-6 w-6' : 'h-7 w-7';
  const textSize = size === 'sm' ? 'text-[8px]' : 'text-[9px]';
  return logo ? (
    <img
      src={logo}
      alt=""
      loading="lazy"
      decoding="async"
      className={cn(dim, 'shrink-0 rounded-full border border-border object-cover')}
    />
  ) : (
    <div
      className={cn(
        dim,
        textSize,
        'shrink-0 rounded-full bg-secondary border border-border flex items-center justify-center font-bold text-muted-foreground tracking-tight select-none',
      )}
      aria-hidden
    >
      {name ? getInitials(name) : '?'}
    </div>
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
      <TeamLogo logo={logo} name={name} />
      <p className="truncate text-sm font-medium text-foreground leading-tight">{name}</p>
    </div>
  );
}

function MatchCard({ match, compact = false, flat = false }: MatchCardProps) {
  const isLive = match.status === 'LIVE';
  const isCompleted = match.status === 'COMPLETED';
  const showScore = isLive || isCompleted;

  /* ── Compact row variant (sidebar upcoming lists) ─────────────────── */
  if (compact) {
    return (
      <Link to={getMatchPath(match)} className="group block min-w-0">
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 rounded-lg px-1 py-2 transition-colors hover:bg-muted">
          <p className="truncate text-right text-sm font-medium text-foreground">
            {match.home_team?.name ?? 'TBD'}
          </p>
          <div className="shrink-0 min-w-[52px] px-1 text-center">
            {showScore ? (
              <span
                className={cn(
                  'whitespace-nowrap text-sm font-bold tabular-nums',
                  isLive ? 'text-primary' : 'text-foreground',
                )}
              >
                {match.home_score} – {match.away_score}
              </span>
            ) : (
              <span className="whitespace-nowrap text-xs font-medium text-muted-foreground">
                {formatTime(match.scheduled_start)}
              </span>
            )}
            {isLive && (
              <span className="mt-0.5 block text-[9px] font-semibold uppercase leading-none text-red-600">
                LIVE
              </span>
            )}
          </div>
          <p className="truncate text-left text-sm font-medium text-foreground">
            {match.away_team?.name ?? 'TBD'}
          </p>
        </div>
      </Link>
    );
  }

  /* ── Inner layout (shared between flat and card) ──────────────────── */
  const inner = (
    <div className={cn(flat ? 'py-3 first:pt-0 last:pb-0' : 'p-3.5 sm:p-4')}>
      <div className={cn('mb-2.5 flex items-center justify-between gap-2', flat && 'mb-2')}>
        <Badge variant={getMatchStatusBadgeVariant(match.status)}>
          {isLive ? '● LIVE' : match.status.replace(/_/g, ' ')}
        </Badge>
        <time className="text-xs text-muted-foreground/70" dateTime={match.scheduled_start}>
          {formatDate(match.scheduled_start)}
          {!showScore && (
            <span className="ml-1.5 font-medium text-muted-foreground">
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
                'text-xl font-bold tabular-nums tracking-tight font-display',
                isLive ? 'text-primary' : 'text-foreground',
              )}
            >
              {match.home_score}
              <span className="mx-1 font-light text-border">–</span>
              {match.away_score}
            </div>
          ) : (
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">vs</span>
          )}
        </div>

        <TeamLine
          name={match.away_team?.name ?? 'TBD'}
          logo={match.away_team?.logo}
          align="left"
        />
      </div>

      {(match.venue || match.round !== undefined || match.referee) && (
        <div className="mt-2.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-t border-border pt-2 text-xs text-muted-foreground">
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

  /* ── Flat variant — no card chrome, separated by dividers ─────────── */
  if (flat) {
    return (
      <Link to={getMatchPath(match)} className="group block transition-colors hover:bg-muted/60 rounded-lg -mx-0.5 px-0.5">
        {inner}
      </Link>
    );
  }

  /* ── Card variant — standalone elevated card ──────────────────────── */
  return (
    <Link to={getMatchPath(match)} className="group block">
      <article className="rounded-xl border border-border bg-card shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/30">
        {inner}
      </article>
    </Link>
  );
}

export default memo(MatchCard);
