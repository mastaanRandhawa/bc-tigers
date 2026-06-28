import { memo } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock } from 'lucide-react';
import type { Match } from '@/types';
import { Badge } from '@/components/ui/badge';
import { AnimatedNumber } from '@/components/motion/AnimatedNumber';
import { ScoreFlash } from '@/components/motion/ScoreFlash';
import { useScoreFlash } from '@/hooks/useScoreFlash';
import { cn, getInitials, matchSideName } from '@/lib/utils';
import { formatDate, formatTime, getMatchStatusBadgeVariant } from '@/lib/utils';
import { getMatchPath } from '@/lib/division-routes';
import { isScheduleOnlyDivision } from '@/lib/division-display';

interface MatchCardProps {
  match: Match;
  compact?: boolean;
  /** List row inside a shared container — no outer card border */
  flat?: boolean;
  /** Show a top divider (for stacked lists) */
  divider?: boolean;
  /** Override schedule-only score hiding (defaults to match.division.schedule_only) */
  scheduleOnly?: boolean;
}

function TeamLogo({ logo, name, size = 'md' }: { logo?: string | null; name?: string; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'h-7 w-7' : 'h-8 w-8';
  const textSize = size === 'sm' ? 'text-[9px]' : 'text-[10px]';
  return logo ? (
    <img
      src={logo}
      alt=""
      loading="lazy"
      decoding="async"
      className={cn(dim, 'shrink-0 rounded-sm object-cover')}
    />
  ) : (
    <div
      className={cn(
        dim,
        textSize,
        'shrink-0 rounded-sm bg-muted/80 flex items-center justify-center font-bold text-muted-foreground tracking-tight select-none',
      )}
      aria-hidden
    >
      {name ? getInitials(name) : '?'}
    </div>
  );
}

function TeamLine({
  name,
  logo,
  align,
}: {
  name: string;
  logo?: string | null;
  align: 'left' | 'right';
}) {
  return (
    <div
      className={cn(
        'flex min-w-0 items-center gap-2',
        align === 'right' ? 'flex-row-reverse text-right' : 'text-left',
      )}
    >
      <TeamLogo logo={logo} name={name} />
      <p className="truncate text-sm font-semibold text-foreground leading-tight">
        {name}
      </p>
    </div>
  );
}

function ScoreDisplay({
  home,
  away,
  isLive,
}: {
  home: number;
  away: number;
  isLive: boolean;
}) {
  const flash = useScoreFlash(home, away);
  return (
    <ScoreFlash
      active={flash}
      className={cn(
        'inline-flex items-baseline gap-1 font-display text-lg font-bold tabular-nums sm:text-xl',
        isLive ? 'text-primary' : 'text-foreground',
      )}
    >
      <AnimatedNumber value={home} />
      <span className="font-normal text-muted-foreground/40">–</span>
      <AnimatedNumber value={away} />
    </ScoreFlash>
  );
}

function MatchMeta({ match }: { match: Match }) {
  if (!match.venue && match.round === undefined) return null;

  return (
    <p className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
      {match.venue && (
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3 w-3 shrink-0 opacity-60" aria-hidden />
          {match.field ? `${match.venue.name} · ${match.field.name}` : match.venue.name}
        </span>
      )}
      {match.round !== undefined && (
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3 shrink-0 opacity-60" aria-hidden />
          Game #{match.round}
        </span>
      )}
    </p>
  );
}

function MatchCard({
  match,
  compact = false,
  flat = false,
  divider = false,
  scheduleOnly: scheduleOnlyProp,
}: MatchCardProps) {
  const isLive = match.status === 'LIVE';
  const isCompleted = match.status === 'COMPLETED';
  const scheduleOnly = scheduleOnlyProp ?? isScheduleOnlyDivision(match.division);
  const showScore = !scheduleOnly && (isLive || isCompleted);

  if (compact) {
    return (
      <Link to={getMatchPath(match)} className="group block min-w-0">
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 rounded-sm px-1 py-2 transition-colors hover:bg-muted/50">
          <p className="truncate text-right text-sm font-medium text-foreground">
            {matchSideName(match.home_team, match.home_label)}
          </p>
          <div className="shrink-0 min-w-[52px] px-1 text-center">
            {showScore ? (
              <ScoreDisplay home={match.home_score} away={match.away_score} isLive={isLive} />
            ) : (
              <span className="whitespace-nowrap text-xs font-medium text-muted-foreground tabular-nums">
                {formatTime(match.scheduled_start)}
              </span>
            )}
          </div>
          <p className="truncate text-left text-sm font-medium text-foreground">
            {matchSideName(match.away_team, match.away_label)}
          </p>
        </div>
      </Link>
    );
  }

  const inner = (
    <div className={cn('px-4 py-3.5 sm:px-5 sm:py-4', divider && 'border-t border-border/50')}>
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <Badge
          variant={getMatchStatusBadgeVariant(match.status)}
          className="rounded-sm uppercase tracking-wider"
        >
          {isLive ? 'Live' : match.status.replace(/_/g, ' ')}
        </Badge>
        <time
          className="text-[11px] font-medium text-muted-foreground tabular-nums"
          dateTime={match.scheduled_start}
        >
          {formatDate(match.scheduled_start)}
          {!showScore && (
            <span className="ml-1.5">{formatTime(match.scheduled_start)}</span>
          )}
        </time>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-4">
        <TeamLine name={matchSideName(match.home_team, match.home_label)} logo={match.home_team?.logo} align="right" />
        <div className="flex min-w-[72px] shrink-0 flex-col items-center justify-center">
          {showScore ? (
            <ScoreDisplay home={match.home_score} away={match.away_score} isLive={isLive} />
          ) : (
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/40">
              vs
            </span>
          )}
        </div>
        <TeamLine name={matchSideName(match.away_team, match.away_label)} logo={match.away_team?.logo} align="left" />
      </div>

      <MatchMeta match={match} />
    </div>
  );

  if (flat) {
    return (
      <Link
        to={getMatchPath(match)}
        className="group block transition-colors hover:bg-muted/30"
      >
        {inner}
      </Link>
    );
  }

  return (
    <Link to={getMatchPath(match)} className="group block">
      <article className="rounded-md bg-card transition-colors hover:bg-muted/20">
        {inner}
      </article>
    </Link>
  );
}

export default memo(MatchCard);
