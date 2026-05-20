import { useParams, Link } from 'react-router-dom';
import PageLayout from '@/components/PageLayout';
import QueryState from '@/components/shared/QueryState';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, User, Goal as GoalIcon, AlertTriangle, RefreshCw, ArrowLeftRight, ArrowLeft } from 'lucide-react';
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
        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
          <GoalIcon className="w-3 h-3 text-white" />
        </div>
      );
    case 'YELLOW_CARD':
      return <div className="w-4 h-5 rounded-sm bg-yellow-400 border border-yellow-500" />;
    case 'RED_CARD':
      return <div className="w-4 h-5 rounded-sm bg-red-500 border border-red-600" />;
    case 'SUBSTITUTION':
      return <RefreshCw className="w-4 h-4 text-green-500" />;
    case 'ASSIST':
      return <ArrowLeftRight className="w-4 h-4 text-blue-400" />;
    default:
      return <div className="w-4 h-4 rounded-full bg-gray-300" />;
  }
}

export default function MatchDetailPage({ embedded = false }: { embedded?: boolean }) {
  const { matchId } = useParams();
  const { data: match, isLoading, isError, refetch } = useMatch(matchId);
  const isLive = match?.status === 'LIVE';
  const events = match?.events ?? [];

  const refereeName = match?.referee
    ? `${match.referee.first_name} ${match.referee.last_name}`
    : undefined;

  const backPath =
    match?.division?.tournament?.slug && match?.division?.slug
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
          <div className="bg-primary py-12 px-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:3rem_3rem]" />
            <div className="max-w-4xl mx-auto relative z-10 text-center">
              {!embedded && (
                <Link to={backPath} className="inline-flex items-center gap-1 text-white/60 text-sm mb-4 hover:text-white">
                  <ArrowLeft className="w-4 h-4" /> Back to matches
                </Link>
              )}
                <div className="flex items-center justify-center gap-3 mb-6">
                  <Badge variant={isLive ? 'live' : 'secondary'} className="text-sm">
                    {isLive ? '● LIVE' : match.status}
                  </Badge>
                  <span className="text-white/60 text-sm">{formatDate(match.scheduled_start)}</span>
                </div>

                <div className="flex items-center justify-center gap-6 md:gap-16">
                  <div className="text-center flex-1">
                    {match.home_team?.logo && (
                      <img
                        src={match.home_team.logo}
                        alt=""
                        className="w-16 h-16 rounded-full mx-auto mb-3 border-4 border-white/30 object-cover"
                      />
                    )}
                    <p className="text-white font-black text-xl md:text-3xl">{match.home_team?.name ?? 'TBD'}</p>
                  </div>

                  <div className="text-center flex-shrink-0">
                    <div className={cn('text-5xl md:text-7xl font-black', isLive ? 'text-primary' : 'text-white')}>
                      {match.home_score} <span className="text-white/30">–</span> {match.away_score}
                    </div>
                    <p className="text-white/60 text-sm mt-1">{formatTime(match.scheduled_start)}</p>
                    {match.round !== undefined && (
                      <p className="text-white/40 text-xs">Round {match.round}</p>
                    )}
                  </div>

                  <div className="text-center flex-1">
                    {match.away_team?.logo && (
                      <img
                        src={match.away_team.logo}
                        alt=""
                        className="w-16 h-16 rounded-full mx-auto mb-3 border-4 border-white/30 object-cover"
                      />
                    )}
                    <p className="text-white font-black text-xl md:text-3xl">{match.away_team?.name ?? 'TBD'}</p>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-6 mt-6 text-white/60 text-sm">
                  {match.venue && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {match.venue.name}
                    </span>
                  )}
                  {refereeName && (
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {refereeName}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2">
                <h2 className="text-xl font-semibold text-foreground uppercase tracking-tight mb-5">Match Timeline</h2>
                {events.length > 0 ? (
                  <div className="space-y-3">
                    {events.map((event) => (
                      <div
                        key={event.id}
                        className="bg-white rounded-xl border border-border shadow-sm p-4 flex items-center gap-4"
                      >
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-xl font-black text-muted-foreground flex-shrink-0">
                          {event.minute}'
                        </div>
                        <div className="flex-shrink-0">
                          <EventIcon type={event.type} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-foreground text-sm">
                            {event.player
                              ? `${event.player.first_name} ${event.player.last_name}`
                              : event.team?.name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{event.type.replace(/_/g, ' ')}</p>
                        </div>
                        <div
                          className={cn(
                            'w-3 h-3 rounded-full flex-shrink-0',
                            event.team_id === match.home_team_id ? 'bg-primary' : 'bg-red-500'
                          )}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-border bg-card shadow-sm p-12 text-center">
                    <Clock className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-muted-foreground">No events recorded yet</p>
                  </div>
                )}

                <h2 className="text-xl font-semibold text-foreground uppercase tracking-tight mb-5 mt-8">Lineups</h2>
                <div className="rounded-lg border border-border bg-card shadow-sm p-8 text-center">
                  <AlertTriangle className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-muted-foreground">Lineups not available</p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-lg border border-border bg-card shadow-sm p-5">
                  <h3 className="font-semibold text-foreground uppercase mb-4">Match Info</h3>
                  <div className="space-y-3 text-sm">
                    <InfoRow label="Date" value={formatDate(match.scheduled_start)} />
                    <InfoRow label="Time" value={formatTime(match.scheduled_start)} />
                    <InfoRow label="Status" value={match.status} />
                    {match.round !== undefined && <InfoRow label="Round" value={String(match.round)} />}
                    {match.venue && <InfoRow label="Venue" value={match.venue.name} />}
                    {refereeName && <InfoRow label="Referee" value={refereeName} />}
                  </div>
                </div>
              </div>
            </div>
        </>
      )}
    </QueryState>
  );

  if (embedded) {
    return <div className="px-4 py-6">{content}</div>;
  }

  return <PageLayout>{content}</PageLayout>;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-gray-800">{value}</span>
    </div>
  );
}
