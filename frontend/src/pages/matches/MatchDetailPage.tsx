import { useParams, Link } from 'react-router-dom';
import PageLayout from '@/components/PageLayout';
import QueryState from '@/components/shared/QueryState';
import Section from '@/components/shared/Section';
import SectionHeader from '@/components/shared/SectionHeader';
import { Badge } from '@/components/ui/badge';
import {
  MapPin,
  Clock,
  User,
  Goal as GoalIcon,
  AlertTriangle,
  RefreshCw,
  ArrowLeftRight,
  ArrowLeft,
} from 'lucide-react';
import { formatDate, formatTime, cn } from '@/lib/utils';
import { divisionMatchesPath } from '@/lib/division-routes';
import { useMatch } from '@/hooks/useMatches';
import type { MatchEventType } from '@/types';

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
      return <div className="h-4 w-4 rounded-full bg-zinc-300" />;
  }
}

export default function MatchDetailPage() {
  const { matchId, tournamentSlug, divisionSlug } = useParams();
  const nestedInDivision = !!(tournamentSlug && divisionSlug);
  const { data: match, isLoading, isError, refetch } = useMatch(matchId);
  const isLive = match?.status === 'LIVE';
  const events = match?.events ?? [];

  const refereeName = match?.referee
    ? `${match.referee.first_name} ${match.referee.last_name}`
    : undefined;

  const backPath = nestedInDivision
    ? divisionMatchesPath(tournamentSlug!, divisionSlug!)
    : match?.division?.tournament?.slug && match?.division?.slug
      ? divisionMatchesPath(match.division.tournament.slug, match.division.slug)
      : '/tournaments';

  const content = (
    <QueryState
      isLoading={isLoading}
      isError={isError}
      isEmpty={!match}
      onRetry={() => refetch()}
      emptyMessage="Match not found."
    >
      {match && (
        <>
          <div className="relative overflow-hidden bg-primary px-4 py-10 md:py-12">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:3rem_3rem]" />
            <div className="page-container relative z-10 text-center">
              <Link
                to={backPath}
                className="mb-4 inline-flex items-center gap-1 text-sm text-white/60 transition-colors hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" /> Back to matches
              </Link>
              <div className="mb-6 flex items-center justify-center gap-3">
                <Badge variant={isLive ? 'live' : 'secondary'} className="text-sm">
                  {isLive ? '● LIVE' : match.status}
                </Badge>
                <span className="text-sm text-white/60">{formatDate(match.scheduled_start)}</span>
              </div>

              <div className="flex items-center justify-center gap-6 md:gap-16">
                <div className="flex-1 text-center">
                  {match.home_team?.logo && (
                    <img
                      src={match.home_team.logo}
                      alt=""
                      className="mx-auto mb-3 h-16 w-16 rounded-full border-4 border-white/30 object-cover"
                    />
                  )}
                  <p className="font-display text-xl font-bold text-white md:text-3xl">
                    {match.home_team?.name ?? 'TBD'}
                  </p>
                </div>

                <div className="shrink-0 text-center">
                  <div
                    className={cn(
                      'font-display text-5xl font-bold md:text-7xl',
                      isLive ? 'text-primary' : 'text-white',
                    )}
                  >
                    {match.home_score} <span className="text-white/30">–</span> {match.away_score}
                  </div>
                  <p className="mt-1 text-sm text-white/60">{formatTime(match.scheduled_start)}</p>
                  {match.round !== undefined && (
                    <p className="text-xs text-white/40">Round {match.round}</p>
                  )}
                </div>

                <div className="flex-1 text-center">
                  {match.away_team?.logo && (
                    <img
                      src={match.away_team.logo}
                      alt=""
                      className="mx-auto mb-3 h-16 w-16 rounded-full border-4 border-white/30 object-cover"
                    />
                  )}
                  <p className="font-display text-xl font-bold text-white md:text-3xl">
                    {match.away_team?.name ?? 'TBD'}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-white/60">
                {match.venue && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {match.venue.name}
                  </span>
                )}
                {refereeName && (
                  <span className="inline-flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {refereeName}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="page-container grid grid-cols-1 gap-8 py-8 md:grid-cols-3 md:py-10">
            <div className="md:col-span-2 space-y-6">
              <Section>
                <SectionHeader title="Match timeline" />
                {events.length > 0 ? (
                  <div className="space-y-3">
                    {events.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm"
                      >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted font-display text-xl font-bold text-muted-foreground">
                          {event.minute}'
                        </div>
                        <div className="shrink-0">
                          <EventIcon type={event.type} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground">
                            {event.player
                              ? `${event.player.first_name} ${event.player.last_name}`
                              : event.team?.name}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {event.type.replace(/_/g, ' ')}
                          </p>
                        </div>
                        <div
                          className={cn(
                            'h-3 w-3 shrink-0 rounded-full',
                            event.team_id === match.home_team_id ? 'bg-primary' : 'bg-red-500',
                          )}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center">
                    <Clock className="mx-auto mb-3 h-12 w-12 text-zinc-200" />
                    <p className="text-muted-foreground">No events recorded yet</p>
                  </div>
                )}
              </Section>

              <Section>
                <SectionHeader title="Lineups" />
                <div className="py-8 text-center">
                  <AlertTriangle className="mx-auto mb-3 h-12 w-12 text-zinc-200" />
                  <p className="text-muted-foreground">Lineups not available</p>
                </div>
              </Section>
            </div>

            <Section className="h-fit">
              <SectionHeader title="Match info" />
              <div className="space-y-3 text-sm">
                <InfoRow label="Date" value={formatDate(match.scheduled_start)} />
                <InfoRow label="Time" value={formatTime(match.scheduled_start)} />
                <InfoRow label="Status" value={match.status} />
                {match.round !== undefined && <InfoRow label="Round" value={String(match.round)} />}
                {match.venue && <InfoRow label="Venue" value={match.venue.name} />}
                {refereeName && <InfoRow label="Referee" value={refereeName} />}
              </div>
            </Section>
          </div>
        </>
      )}
    </QueryState>
  );

  if (nestedInDivision) {
    return content;
  }

  return <PageLayout>{content}</PageLayout>;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}
