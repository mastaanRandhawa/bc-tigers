import { useParams, Link } from 'react-router-dom';
import PageLayout from '@/components/PageLayout';
import QueryState from '@/components/shared/QueryState';
import { GlassCard } from '@/components/ui/glass-card';
import { Badge } from '@/components/ui/badge';
import {
  MapPin,
  Clock,
  User,
  Calendar,
  Goal as GoalIcon,
  AlertTriangle,
  RefreshCw,
  ArrowLeftRight,
  ArrowLeft,
  ShieldAlert,
  Flag,
} from 'lucide-react';
import { formatDate, formatTime, cn, getMatchStatusBadgeVariant } from '@/lib/utils';
import { divisionMatchesPath } from '@/lib/division-routes';
import { useMatch } from '@/hooks/useMatches';
import type { MatchEventType } from '@/types';

// ── Helpers ────────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

/**
 * Team avatar — shows logo if available, otherwise 2-letter initials.
 * The ring and text colour are driven by the team's primary_color.
 */
function TeamCircle({
  logo,
  name,
  color,
}: {
  logo?: string | null;
  name: string;
  color: string;
}) {
  return (
    <div
      className="mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-full text-xl font-bold"
      style={{
        backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
        border: `2px solid color-mix(in srgb, ${color} 50%, transparent)`,
        color,
        boxShadow: `0 0 20px color-mix(in srgb, ${color} 20%, transparent)`,
      }}
    >
      {logo ? (
        <img src={logo} alt="" className="h-full w-full rounded-full object-cover" />
      ) : (
        <span className="select-none tracking-tight">{getInitials(name)}</span>
      )}
    </div>
  );
}

function EventIcon({ type }: { type: MatchEventType }) {
  switch (type) {
    case 'GOAL':
    case 'OWN_GOAL':
    case 'PENALTY':
      return (
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
          <GoalIcon className="h-3 w-3 text-white" />
        </div>
      );
    case 'YELLOW_CARD':
      return <div className="h-5 w-4 rounded-sm border border-yellow-500 bg-yellow-400" />;
    case 'RED_CARD':
      return <div className="h-5 w-4 rounded-sm border border-red-600 bg-red-500" />;
    case 'SUBSTITUTION':
      return <RefreshCw className="h-4 w-4 text-green-500" />;
    case 'ASSIST':
      return <ArrowLeftRight className="h-4 w-4 text-blue-400" />;
    default:
      return <div className="h-4 w-4 rounded-full bg-muted-foreground/30" />;
  }
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/50 py-2.5 text-sm last:border-b-0">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
        {label}
      </span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function MatchDetailPage() {
  const { matchId, tournamentSlug, divisionSlug } = useParams();
  const nestedInDivision = !!(tournamentSlug && divisionSlug);
  const { data: match, isLoading, isError, refetch } = useMatch(matchId);

  const isLive = match?.status === 'LIVE';
  const isCompleted = match?.status === 'COMPLETED';
  const showScore = isLive || isCompleted;
  const events = match?.events ?? [];

  const refereeName = match?.referee
    ? `${match.referee.first_name} ${match.referee.last_name}`
    : undefined;

  const backPath = nestedInDivision
    ? divisionMatchesPath(tournamentSlug!, divisionSlug!)
    : match?.division?.tournament?.slug && match?.division?.slug
      ? divisionMatchesPath(match.division.tournament.slug, match.division.slug)
      : '/tournaments';

  // Team brand colours — fall back to brand orange (home) / indigo (away)
  const homeColor = match?.home_team?.primary_color ?? '#F48735';
  const awayColor = match?.away_team?.primary_color ?? '#6366F1';

  const content = (
    <QueryState
      isLoading={isLoading}
      isError={isError}
      isEmpty={!match}
      onRetry={() => refetch()}
      emptyMessage="Match not found."
    >
      {match && (
        <div
          className="relative bg-surface-muted"
          // expose team colours as CSS vars for timeline rows
          style={{
            '--home-color': homeColor,
            '--away-color': awayColor,
          } as React.CSSProperties}
        >
          {/* Subtle geometric grid background */}
          <div className="pointer-events-none absolute inset-0 bg-brand-grid opacity-60" aria-hidden />

          <div className="relative z-10">
            {/* ── Hero band ──────────────────────────────────────────────────── */}
            <div className="px-4 py-8 sm:py-10">
              <div className="page-container">
                {/* Back link */}
                <Link
                  to={backPath}
                  className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground group"
                >
                  <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                  Back to matches
                </Link>

                <GlassCard className="p-6 sm:p-8 border border-border/60">
                  {/* Status + date pill */}
                  <div className="mb-6 flex justify-center">
                    <div className="inline-flex items-center gap-2">
                      <Badge variant={getMatchStatusBadgeVariant(match.status)}>
                        {isLive ? '● LIVE' : match.status.replace(/_/g, ' ')}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(match.scheduled_start)}
                      </span>
                    </div>
                  </div>

                  {/* Teams + score */}
                  <div className="grid grid-cols-7 items-center gap-2 text-center">
                    {/* Home team */}
                    <div className="col-span-3 flex flex-col items-center gap-3">
                      <TeamCircle
                        logo={match.home_team?.logo}
                        name={match.home_team?.name ?? 'Home'}
                        color={homeColor}
                      />
                      <p className="font-display text-lg font-bold text-foreground sm:text-2xl">
                        {match.home_team?.name ?? 'TBD'}
                      </p>
                    </div>

                    {/* Score */}
                    <div className="col-span-1 flex flex-col items-center justify-center gap-1">
                      {showScore ? (
                        <p className="font-display text-4xl font-black tabular-nums tracking-tight text-foreground sm:text-5xl">
                          {match.home_score}
                          <span className="mx-2 font-light text-muted-foreground/40">—</span>
                          {match.away_score}
                        </p>
                      ) : (
                        <p className="font-display text-2xl font-bold text-muted-foreground/50">
                          vs
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {formatTime(match.scheduled_start)}
                        {match.round !== undefined && (
                          <span className="ml-2 font-medium">· Round {match.round}</span>
                        )}
                      </p>
                    </div>

                    {/* Away team */}
                    <div className="col-span-3 flex flex-col items-center gap-3">
                      <TeamCircle
                        logo={match.away_team?.logo}
                        name={match.away_team?.name ?? 'Away'}
                        color={awayColor}
                      />
                      <p className="font-display text-lg font-bold text-foreground sm:text-2xl">
                        {match.away_team?.name ?? 'TBD'}
                      </p>
                    </div>
                  </div>

                  {/* Venue + referee meta row */}
                  {(match.venue || refereeName) && (
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 border-t border-border/50 pt-4 text-xs text-muted-foreground">
                      {match.venue && (
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" aria-hidden />
                          {match.venue.name}
                        </span>
                      )}
                      {refereeName && (
                        <span className="inline-flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5" aria-hidden />
                          {refereeName}
                        </span>
                      )}
                    </div>
                  )}
                </GlassCard>
              </div>
            </div>

            {/* ── Body grid ──────────────────────────────────────────────────── */}
            <div className="page-container grid grid-cols-1 gap-6 pb-10 md:grid-cols-3 md:gap-8">
              {/* ── Left: Timeline + Lineups ──────────────────────────────── */}
              <div className="space-y-6 md:col-span-2">

                {/* Match timeline */}
                <div>
                  <h3 className="mb-3 px-1 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                    Match Timeline
                  </h3>
                  {events.length > 0 ? (
                    <div className="space-y-2">
                      {events.map((event) => {
                        const isHome = event.team_id === match.home_team_id;
                        const accentColor = isHome ? homeColor : awayColor;
                        return (
                          <div
                            key={event.id}
                            className="flex items-center gap-4 overflow-hidden rounded-xl border border-border/60 bg-card/50 p-4 backdrop-blur-sm transition-colors hover:bg-card/70"
                            style={{ borderLeftWidth: '4px', borderLeftColor: accentColor }}
                          >
                            {/* Minute badge */}
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold tabular-nums text-muted-foreground">
                              {event.minute}'
                            </div>

                            {/* Event type icon */}
                            <div className="shrink-0">
                              <EventIcon type={event.type} />
                            </div>

                            {/* Player / team + event label */}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-foreground">
                                {event.player
                                  ? `${event.player.first_name} ${event.player.last_name}`
                                  : event.team?.name}
                              </p>
                              <p className="mt-0.5 text-xs uppercase tracking-wider text-muted-foreground">
                                {event.type.replace(/_/g, ' ')}
                              </p>
                            </div>

                            {/* Team name label on the right */}
                            <span
                              className="hidden shrink-0 text-[11px] font-semibold sm:block"
                              style={{ color: accentColor }}
                            >
                              {isHome ? match.home_team?.name : match.away_team?.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <GlassCard className="border border-border/60 p-8 text-center">
                      <Clock className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" aria-hidden />
                      <p className="text-sm font-medium text-muted-foreground">No events recorded yet</p>
                    </GlassCard>
                  )}
                </div>

                {/* Lineups */}
                <div>
                  <h3 className="mb-3 px-1 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                    Lineups
                  </h3>
                  <GlassCard className="border border-border/60 p-8 text-center">
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-muted/60">
                      <ShieldAlert className="h-5 w-5 text-muted-foreground/60" aria-hidden />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">Lineups not available</p>
                    <p className="mt-1 text-xs text-muted-foreground/60">
                      Rosters have not been submitted for this match yet.
                    </p>
                  </GlassCard>
                </div>
              </div>

              {/* ── Right: Match info ──────────────────────────────────────── */}
              <div>
                <h3 className="mb-3 px-1 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                  Information
                </h3>
                <GlassCard className="border border-border/60 px-4 py-1">
                  <InfoRow
                    icon={Calendar}
                    label="Date"
                    value={formatDate(match.scheduled_start)}
                  />
                  <InfoRow
                    icon={Clock}
                    label="Time"
                    value={formatTime(match.scheduled_start)}
                  />
                  <InfoRow
                    icon={Flag}
                    label="Status"
                    value={
                      <Badge
                        variant={getMatchStatusBadgeVariant(match.status)}
                        className="rounded-md text-[11px]"
                      >
                        {match.status.replace(/_/g, ' ')}
                      </Badge>
                    }
                  />
                  {match.round !== undefined && (
                    <InfoRow icon={Flag} label="Round" value={String(match.round)} />
                  )}
                  {match.venue && (
                    <InfoRow icon={MapPin} label="Venue" value={match.venue.name} />
                  )}
                  {refereeName && (
                    <InfoRow icon={User} label="Referee" value={refereeName} />
                  )}
                </GlassCard>
              </div>
            </div>
          </div>
        </div>
      )}
    </QueryState>
  );

  if (nestedInDivision) {
    return content;
  }

  return <PageLayout>{content}</PageLayout>;
}
