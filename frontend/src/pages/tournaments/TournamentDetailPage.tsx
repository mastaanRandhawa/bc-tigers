import { useParams, Link } from 'react-router-dom';
import PageLayout from '@/components/PageLayout';
import QueryState from '@/components/shared/QueryState';
import MatchCard from '@/components/MatchCard';
import StandingsTable from '@/components/StandingsTable';
import { useTournament } from '@/hooks/useTournaments';
import { useMatches } from '@/hooks/useMatches';
import { useTopScorers } from '@/hooks/useStats';
import { useStandings } from '@/hooks/useStandings';
import { Trophy, Calendar, MapPin, Flag, Users, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  getDivisionStandingsPath,
  getDivisionSchedulePath,
  divisionStatsPath,
} from '@/lib/division-routes';
import { formatDate } from '@/lib/utils';

export default function TournamentDetailPage() {
  const { tournamentSlug } = useParams();
  const { data: tournament, isLoading, isError, refetch } = useTournament(tournamentSlug);
  const { data: matches = [] } = useMatches(tournament ? { tournamentId: tournament.id } : undefined);
  const { data: topScorers = [] } = useTopScorers(
    tournament ? { tournamentId: tournament.id, limit: 5 } : undefined
  );
  const firstDivision = tournament?.divisions?.[0];
  const { data: standings = [] } = useStandings(firstDivision?.id);

  const featured = matches.filter((m) => m.status === 'LIVE' || m.status === 'COMPLETED').slice(0, 2);
  const upcoming = matches.filter((m) => m.status === 'SCHEDULED').slice(0, 2);
  const divisions = tournament?.divisions ?? [];
  const primaryDivision = divisions[0];
  const standingsPath = primaryDivision
    ? getDivisionStandingsPath({ ...primaryDivision, tournament })
    : null;
  const schedulePath = primaryDivision
    ? getDivisionSchedulePath({ ...primaryDivision, tournament })
    : null;
  const statsPath =
    tournament && primaryDivision
      ? `${divisionStatsPath(tournament.slug, primaryDivision.slug)}/top-scorers`
      : null;

  return (
    <PageLayout>
      <QueryState
        isLoading={isLoading}
        isError={isError}
        isEmpty={!tournament}
        onRetry={() => refetch()}
        emptyMessage="Tournament not found."
      >
        {tournament && (
          <>
            <div className="bg-hero-gradient border-b border-border py-8 sm:py-10 px-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-brand-grid pointer-events-none opacity-50" />
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/40" />
              <div className="max-w-6xl mx-auto relative z-10">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-5">
                  <div className="bg-primary-muted p-3 rounded-xl flex-shrink-0 border border-primary/15">
                    <Trophy className="w-10 h-10 text-primary" />
                  </div>
                  <div className="flex-1">
                    <Badge variant={tournament.status === 'ACTIVE' ? 'success' : 'default'} className="mb-2">
                      {tournament.status}
                    </Badge>
                    <h1 className="text-page-title m-0">
                      {tournament.name}
                    </h1>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-zinc-500 text-sm">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(tournament.start_date)} – {formatDate(tournament.end_date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {tournament.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Flag className="w-4 h-4" />
                        {tournament.tournament_type.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-8">
                {tournament.description && (
                  <section className="rounded-lg border border-border bg-card shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-foreground uppercase mb-3">About This Tournament</h2>
                    <p className="text-muted-foreground text-sm leading-relaxed">{tournament.description}</p>
                  </section>
                )}

                <section>
                  <h2 className="text-section mb-4">Divisions</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {divisions.map((div) => (
                      <a
                        key={div.id}
                        href={`/tournaments/${tournament.slug}/divisions/${div.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group rounded-xl border border-border bg-white shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-px p-4 flex items-center gap-3"
                      >
                        <div className="p-2 rounded-lg flex-shrink-0 bg-primary-muted border border-primary/10">
                          <Flag className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                            {div.name}
                          </h3>
                          <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                            {div.age_group && <span>{div.age_group}</span>}
                            <span>{div.gender}</span>
                            <span className="flex items-center gap-0.5">
                              <Users className="w-3 h-3" /> {div.max_teams} max
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-primary transition-colors shrink-0" />
                      </a>
                    ))}
                  </div>
                </section>

                <section>
                  <h2 className="text-section mb-4">Featured matches</h2>
                  <div className="space-y-3">
                    {featured.length > 0 ? (
                      featured.map((m) => <MatchCard key={m.id} match={m} />)
                    ) : (
                      <p className="text-muted-foreground text-sm">No featured matches yet.</p>
                    )}
                  </div>
                </section>

                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-section">Standings</h2>
                    <Link to={standingsPath ?? `/tournaments/${tournament.slug}`} className="text-sm text-primary font-semibold hover:underline flex items-center gap-1">
                      Full Standings <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                  <StandingsTable standings={standings} compact division={firstDivision} />
                </section>
              </div>

              <div className="space-y-6">
                <div className="rounded-lg border border-border bg-card shadow-sm p-5">
                  <h3 className="font-semibold text-foreground uppercase mb-4">Upcoming Fixtures</h3>
                  <div className="space-y-2">
                    {upcoming.map((m) => (
                      <MatchCard key={m.id} match={m} compact />
                    ))}
                  </div>
                  <Link to={schedulePath ?? `/tournaments/${tournament.slug}`} className="block text-center text-sm text-primary font-semibold mt-4 hover:underline">
                    Full Schedule →
                  </Link>
                </div>

                <div className="rounded-lg border border-border bg-card shadow-sm p-5">
                  <h3 className="font-semibold text-foreground uppercase mb-4">Top Scorers</h3>
                  <div className="space-y-3">
                    {topScorers.map((stat, i) => (
                      <div key={stat.id} className="flex items-center gap-3">
                        <span className="text-sm font-medium text-zinc-400 w-5 text-center tabular-nums">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-foreground truncate">
                            {stat.player?.first_name} {stat.player?.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{stat.team?.name}</p>
                        </div>
                        <span className="text-primary font-semibold text-sm tabular-nums">{stat.goals}G</span>
                      </div>
                    ))}
                  </div>
                  <Link to={statsPath ?? `/tournaments/${tournament.slug}`} className="block text-center text-sm text-primary font-semibold mt-4 hover:underline">
                    All Stats →
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </QueryState>
    </PageLayout>
  );
}
