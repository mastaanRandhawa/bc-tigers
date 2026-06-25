import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import PageLayout from '@/components/PageLayout';
import QueryState from '@/components/shared/QueryState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MapPin,
  Clock,
  User,
  Calendar,
  Goal as GoalIcon,
  RefreshCw,
  ArrowLeftRight,
  ArrowLeft,
  Flag,
  ClipboardEdit,
  PlusSquare,
  Pencil,
  Trash2,
} from 'lucide-react';
import MatchRosters from '@/components/matches/MatchRosters';
import { StaggerItem } from '@/components/motion/StaggerList';
import { AnimatedNumber } from '@/components/motion/AnimatedNumber';
import { ScoreFlash } from '@/components/motion/ScoreFlash';
import { useScoreFlash } from '@/hooks/useScoreFlash';
import { formatDate, formatTime, cn, getInitials, getMatchStatusBadgeVariant } from '@/lib/utils';
import { divisionMatchesPath } from '@/lib/division-routes';
import { useMatch, useDeleteMatchEvent } from '@/hooks/useMatches';
import { useMatchGoalEditAccess, coachCanEditEvent } from '@/hooks/useMatchGoalEditAccess';
import { useRosterVisibility } from '@/hooks/useRosterVisibility';
import { AdminContextBar } from '@/components/admin/inline/AdminContextBar';
import { AdminActionButton } from '@/components/admin/inline/AdminActionButton';
import { ConfirmDialog } from '@/components/admin/inline/ConfirmDialog';
import MatchScoreFormDialog from '@/components/admin/forms/MatchScoreFormDialog';
import MatchEventFormDialog from '@/components/admin/forms/MatchEventFormDialog';
import MatchScoreStepper from '@/components/matches/MatchScoreStepper';
import type { MatchEvent, MatchEventType } from '@/types';

// ── Layout primitives ─────────────────────────────────────────────────────────

function SectionCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border/40 bg-card shadow-sm',
        className,
      )}
    >
      {children}
    </div>
  );
}

function SectionHeading({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3 px-0.5">
      <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {title}
      </h3>
      {action}
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

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
      className="mx-auto flex h-14 w-14 items-center justify-center overflow-hidden rounded-full text-lg font-bold sm:h-16 sm:w-16 sm:text-xl"
      style={{
        backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
        border: `1.5px solid color-mix(in srgb, ${color} 35%, transparent)`,
        color,
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
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
          <GoalIcon className="h-4 w-4 text-primary" />
        </div>
      );
    case 'YELLOW_CARD':
      return <div className="h-6 w-4 rounded-sm bg-yellow-400 ring-1 ring-yellow-500/50" />;
    case 'RED_CARD':
      return <div className="h-6 w-4 rounded-sm bg-red-500 ring-1 ring-red-600/50" />;
    case 'SUBSTITUTION':
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10">
          <RefreshCw className="h-4 w-4 text-emerald-600" />
        </div>
      );
    case 'ASSIST':
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10">
          <ArrowLeftRight className="h-4 w-4 text-blue-500" />
        </div>
      );
    default:
      return <div className="h-8 w-8 rounded-full bg-muted" />;
  }
}

function formatEventMinute(event: MatchEvent) {
  return event.extra_time ? `${event.minute}+${event.extra_time}'` : `${event.minute}'`;
}

function sortEvents(events: MatchEvent[]) {
  return [...events].sort((a, b) => {
    if (a.minute !== b.minute) return a.minute - b.minute;
    return (a.extra_time ?? 0) - (b.extra_time ?? 0);
  });
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
    <div className="flex items-center justify-between gap-4 border-b border-border/30 py-3 text-sm last:border-b-0">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
        {label}
      </span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function MatchDetailPage() {
  const { matchId, tournamentSlug, divisionSlug } = useParams();
  const nestedInDivision = !!(tournamentSlug && divisionSlug);
  const { data: match, isLoading, isError, refetch } = useMatch(matchId);

  const {
    canEditGoals,
    canEditAllEvents,
    canEditScore,
    coachTeamId,
    isCoach,
    isAdmin,
  } = useMatchGoalEditAccess(match);
  const { rostersAvailableAt } = useRosterVisibility();
  const deleteMutation = useDeleteMatchEvent();

  const [scoreOpen, setScoreOpen] = useState(false);
  const [eventDialog, setEventDialog] = useState<{ open: boolean; event: MatchEvent | null }>({
    open: false,
    event: null,
  });
  const [deleteTarget, setDeleteTarget] = useState<MatchEvent | null>(null);

  const isLive = match?.status === 'LIVE';
  const isCompleted = match?.status === 'COMPLETED';
  const showScore = isLive || isCompleted;
  const showScoreStepper = canEditScore && (isLive || isCompleted);

  const sortedEvents = useMemo(
    () => sortEvents(match?.events ?? []),
    [match?.events],
  );

  const officialsLabel = match?.officials?.length
    ? match.officials.map((o) => o.name).join(', ')
    : undefined;

  const backPath = nestedInDivision
    ? divisionMatchesPath(tournamentSlug!, divisionSlug!)
    : match?.division?.tournament?.slug && match?.division?.slug
      ? divisionMatchesPath(match.division.tournament.slug, match.division.slug)
      : '/tournaments';

  const homeColor = match?.home_team?.primary_color ?? '#F48735';
  const awayColor = match?.away_team?.primary_color ?? '#6366F1';
  const scoreFlash = useScoreFlash(match?.home_score ?? 0, match?.away_score ?? 0);

  const homeRosterCount = match?.home_team?.players?.length ?? 0;
  const awayRosterCount = match?.away_team?.players?.length ?? 0;
  const showLineups =
    homeRosterCount > 0 ||
    awayRosterCount > 0 ||
    isAdmin ||
    (isCoach && !!coachTeamId);

  const openAddEvent = () => setEventDialog({ open: true, event: null });
  const openEditEvent = (event: MatchEvent) => setEventDialog({ open: true, event });

  const content = (
    <QueryState
      isLoading={isLoading}
      isError={isError}
      isEmpty={!match}
      onRetry={() => refetch()}
      emptyMessage="Match not found."
      variant="skeleton-detail"
      loadingMessage="Loading match…"
    >
      {match && (
        <div
          className="relative min-h-full bg-muted/20"
          style={{ '--home-color': homeColor, '--away-color': awayColor } as React.CSSProperties}
        >
          {canEditGoals && isCoach && !canEditAllEvents && (
            <div className="page-container pt-4">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs">
                <span className="font-medium text-primary">Record goals for your team</span>
                <Button type="button" size="sm" variant="outline" className="h-7 gap-1.5" onClick={openAddEvent}>
                  <PlusSquare className="h-3.5 w-3.5" />
                  Add goal
                </Button>
              </div>
            </div>
          )}

          {canEditAllEvents && (
            <div className="page-container pt-4">
              <AdminContextBar
                label="Editing match"
                advancedHref="/admin/matches"
                advancedLabel="All matches"
                actions={
                  <>
                    <AdminActionButton size="xs" onClick={() => setScoreOpen(true)}>
                      <ClipboardEdit className="h-3 w-3" />
                      Update score
                    </AdminActionButton>
                    <AdminActionButton size="xs" variant="ghost" onClick={openAddEvent}>
                      <PlusSquare className="h-3 w-3" />
                      Add event
                    </AdminActionButton>
                  </>
                }
              />
            </div>
          )}

          <div className="relative">
            {/* Hero */}
            <div className="px-4 pb-6 pt-6 sm:pb-8 sm:pt-8">
              <div className="page-container">
                <Link
                  to={backPath}
                  className="group mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                  Back to matches
                </Link>

                <SectionCard className="overflow-hidden p-6 sm:p-8">
                  <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
                    <Badge variant={getMatchStatusBadgeVariant(match.status)}>
                      {isLive ? 'Live' : match.status.replace(/_/g, ' ')}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(match.scheduled_start)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 text-center sm:gap-6">
                    <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
                      <TeamCircle
                        logo={match.home_team?.logo}
                        name={match.home_team?.name ?? 'Home'}
                        color={homeColor}
                      />
                      <p className="w-full truncate font-display text-sm font-bold text-foreground sm:text-lg">
                        {match.home_team?.name ?? 'TBD'}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-col items-center justify-center gap-1 px-1 sm:px-3">
                      {showScore ? (
                        <ScoreFlash
                          active={scoreFlash}
                          className="whitespace-nowrap rounded-lg px-2 font-display text-3xl font-black tabular-nums tracking-tight text-foreground sm:text-5xl"
                        >
                          <AnimatedNumber value={match.home_score} />
                          <span className="mx-1.5 font-light text-muted-foreground/35">—</span>
                          <AnimatedNumber value={match.away_score} />
                        </ScoreFlash>
                      ) : (
                        <p className="font-display text-2xl font-bold text-muted-foreground/40">vs</p>
                      )}
                      <p className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatTime(match.scheduled_start)}
                        {match.round !== undefined && (
                          <span className="ml-1.5 font-medium">· Round {match.round}</span>
                        )}
                      </p>
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
                      <TeamCircle
                        logo={match.away_team?.logo}
                        name={match.away_team?.name ?? 'Away'}
                        color={awayColor}
                      />
                      <p className="w-full truncate font-display text-sm font-bold text-foreground sm:text-lg">
                        {match.away_team?.name ?? 'TBD'}
                      </p>
                    </div>
                  </div>

                  {(match.venue || officialsLabel) && (
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-border/30 pt-5 text-xs text-muted-foreground">
                      {match.venue && (
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" aria-hidden />
                          {match.venue.name}
                        </span>
                      )}
                      {officialsLabel && (
                        <span className="inline-flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5" aria-hidden />
                          {officialsLabel}
                        </span>
                      )}
                    </div>
                  )}

                  {showScoreStepper && (
                    <div className="mt-6">
                      <MatchScoreStepper
                        matchId={match.id}
                        homeScore={match.home_score}
                        awayScore={match.away_score}
                        homeLabel={match.home_team?.name ?? 'Home'}
                        awayLabel={match.away_team?.name ?? 'Away'}
                      />
                    </div>
                  )}
                </SectionCard>
              </div>
            </div>

            {/* Body */}
            <div className="page-container grid grid-cols-1 gap-8 pb-12 lg:grid-cols-3 lg:gap-10">
              <div className="space-y-8 lg:col-span-2">
                {/* Timeline */}
                <section>
                  <SectionHeading
                    title="Match Timeline"
                    action={
                      canEditGoals ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1.5 px-2 text-xs"
                          onClick={openAddEvent}
                        >
                          <PlusSquare className="h-3.5 w-3.5" />
                          {isCoach && !canEditAllEvents ? 'Add goal' : 'Add event'}
                        </Button>
                      ) : undefined
                    }
                  />

                  {sortedEvents.length > 0 ? (
                    <div className="space-y-2">
                      {sortedEvents.map((event) => {
                        const isHome = event.team_id === match.home_team_id;
                        const accentColor = isHome ? homeColor : awayColor;
                        const playerName = event.player
                          ? `${event.player.first_name} ${event.player.last_name}`
                          : event.team?.name;

                        return (
                          <StaggerItem key={event.id}>
                            <div
                              className="group flex items-center gap-3 rounded-xl border border-border/40 bg-card p-3 transition-colors hover:border-border/60 sm:gap-4 sm:p-4"
                              style={{ borderLeftWidth: 3, borderLeftColor: accentColor }}
                            >
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-xs font-bold tabular-nums text-muted-foreground">
                                {formatEventMinute(event)}
                              </div>

                              <div className="shrink-0">
                                <EventIcon type={event.type} />
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-foreground">
                                  {playerName}
                                </p>
                                <p className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                                  {event.type.replace(/_/g, ' ')}
                                </p>
                              </div>

                              <span
                                className="hidden max-w-[7rem] truncate text-[11px] font-semibold sm:block"
                                style={{ color: accentColor }}
                              >
                                {isHome ? match.home_team?.name : match.away_team?.name}
                              </span>

                              {coachCanEditEvent(event, canEditAllEvents, coachTeamId) && (
                                <div className="flex shrink-0 items-center gap-0.5 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    aria-label={`Edit ${event.type} event`}
                                    onClick={() => openEditEvent(event)}
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    aria-label={`Delete ${event.type} event`}
                                    onClick={() => setDeleteTarget(event)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </StaggerItem>
                        );
                      })}
                    </div>
                  ) : (
                    <SectionCard className="flex flex-col items-center px-6 py-12 text-center">
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted/60">
                        <Clock className="h-6 w-6 text-muted-foreground/50" aria-hidden />
                      </div>
                      <p className="text-sm font-medium text-foreground">No events yet</p>
                      <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                        Goals, cards, and substitutions will appear here as they are recorded.
                      </p>
                      {canEditGoals && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-4 gap-1.5"
                          onClick={openAddEvent}
                        >
                          <PlusSquare className="h-3.5 w-3.5" />
                          {isCoach && !canEditAllEvents ? 'Record first goal' : 'Record first event'}
                        </Button>
                      )}
                    </SectionCard>
                  )}
                </section>

                {/* Lineups */}
                <section>
                  <SectionHeading title="Lineups" />
                  {showLineups ? (
                    <MatchRosters homeTeam={match.home_team} awayTeam={match.away_team} />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {rostersAvailableAt
                        ? `Lineups will be published on ${formatDate(rostersAvailableAt)} at ${formatTime(rostersAvailableAt)}.`
                        : 'Lineups will be published after registration closes.'}
                    </p>
                  )}
                </section>
              </div>

              {/* Sidebar */}
              <aside>
                <SectionHeading title="Information" />
                <SectionCard className="px-4 py-1 sm:px-5">
                  <InfoRow icon={Calendar} label="Date" value={formatDate(match.scheduled_start)} />
                  <InfoRow icon={Clock} label="Time" value={formatTime(match.scheduled_start)} />
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
                  {officialsLabel && (
                    <InfoRow icon={User} label="Officials" value={officialsLabel} />
                  )}
                </SectionCard>
              </aside>
            </div>
          </div>

          {(canEditGoals || canEditAllEvents) && (
            <>
              {canEditAllEvents && (
                <MatchScoreFormDialog open={scoreOpen} onOpenChange={setScoreOpen} match={match} />
              )}
              <MatchEventFormDialog
                open={eventDialog.open}
                onOpenChange={(open) => setEventDialog((s) => ({ ...s, open }))}
                match={match}
                event={eventDialog.event}
                goalOnly={!canEditAllEvents}
                lockedTeamId={coachTeamId ?? undefined}
              />
              <ConfirmDialog
                open={!!deleteTarget}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                title={canEditAllEvents ? 'Delete event?' : 'Delete goal?'}
                description={
                  deleteTarget
                    ? `Remove this ${deleteTarget.type.replace(/_/g, ' ').toLowerCase()} from the match timeline. The score will be recalculated from remaining goal events.`
                    : undefined
                }
                confirmLabel={canEditAllEvents ? 'Delete event' : 'Delete goal'}
                onConfirm={async () => {
                  if (!deleteTarget) return;
                  await deleteMutation.mutateAsync({
                    matchId: match.id,
                    eventId: deleteTarget.id,
                  });
                  setDeleteTarget(null);
                }}
              />
            </>
          )}
        </div>
      )}
    </QueryState>
  );

  if (nestedInDivision) {
    return content;
  }

  return <PageLayout>{content}</PageLayout>;
}
