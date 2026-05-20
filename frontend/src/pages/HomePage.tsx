import { Link } from 'react-router-dom';
import PageLayout from '@/components/PageLayout';
import Footer from '@/components/Footer';
import { TournamentHubHeader } from '@/components/ui/hero';
import LiveScoreTicker from '@/components/LiveScoreTicker';
import MatchCard from '@/components/MatchCard';
import StandingsTable from '@/components/StandingsTable';
import QueryState from '@/components/shared/QueryState';
import { Badge } from '@/components/ui/badge';
import { useTournaments } from '@/hooks/useTournaments';
import { useMatches } from '@/hooks/useMatches';
import { useDivisions } from '@/hooks/useDivisions';
import { useStandings } from '@/hooks/useStandings';
import { Calendar, ChevronRight, Trophy, ArrowUpRight } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { getDivisionStandingsPath } from '@/lib/division-routes';
import type { Division } from '@/types';

function SectionLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="text-sm text-primary font-bold flex items-center gap-1 hover:underline shrink-0 whitespace-nowrap ml-auto uppercase tracking-wide"
    >
      {children} <ChevronRight className="w-4 h-4" />
    </Link>
  );
}

function FeatureArrow() {
  return (
    <svg
      viewBox="0 0 100 100"
      className="w-full h-full text-black stroke-current overflow-visible"
      fill="none"
      strokeWidth="5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20,80 Q 40,20 80,40" />
      <path d="M60,20 L80,40 L50,60" />
    </svg>
  );
}

function AllDivisionsStandings() {
  const { data: divisions = [] } = useDivisions();

  if (divisions.length === 0) return null;

  return (
    <section className="py-10 md:py-14">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 mb-6 min-w-0">
        <div className="min-w-0">
          <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight">League Standings</h2>
          <p className="text-xs md:text-sm text-gray-700 font-semibold mt-1">By division</p>
        </div>
        <SectionLink to="/standings">All Standings</SectionLink>
      </div>
      <div className="space-y-8">
        {divisions.map((division) => (
          <DivisionStandingsSnippet key={division.id} division={division} />
        ))}
      </div>
    </section>
  );
}

function DivisionStandingsSnippet({ division }: { division: Division }) {
  const { data: standings = [] } = useStandings(division.id);
  const path = getDivisionStandingsPath(division);

  return (
    <div className="home-section">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-black uppercase">{division.name}</h3>
        {path && (
          <Link to={path} className="text-sm text-primary font-bold hover:underline">
            Full table
          </Link>
        )}
      </div>
      <StandingsTable standings={standings} compact />
    </div>
  );
}

export default function HomePage() {
  const { data: tournaments = [] } = useTournaments();
  const { data: allMatches = [] } = useMatches();

  const activeTournaments = tournaments.filter((t) => t.status === 'ACTIVE');
  const liveAndRecent = allMatches
    .filter((m) => m.status === 'LIVE' || m.status === 'COMPLETED')
    .slice(0, 3);
  const upcoming = allMatches.filter((m) => m.status === 'SCHEDULED').slice(0, 2);
  const nextMatch = upcoming[0];
  const latestResult = liveAndRecent[0];

  return (
    <PageLayout heroTheme showFooter={false}>
      <LiveScoreTicker />
      <TournamentHubHeader />

      <section className="sheet-top px-4 py-10 md:px-10 md:py-16 mt-auto w-full">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-8">
          <div className="feature-card min-h-[240px] md:h-64 relative">
            <h3 className="text-xl md:text-2xl uppercase leading-tight mb-2 font-black text-foreground">
              VIEW FULL
              <br />
              SCHEDULE
            </h3>
            <p className="text-xs md:text-sm text-gray-700 font-semibold mb-auto">
              every match, venue, and kickoff time
            </p>
            <div className="relative w-full flex justify-center mt-6">
              {nextMatch ? (
                <>
                  <div className="flex items-center bg-primary rounded-2xl p-2 pr-16 text-white shadow-lg relative z-10 w-full max-w-[220px]">
                    <div className="w-8 h-8 bg-white/20 rounded-full mr-3 flex-shrink-0 flex items-center justify-center">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div className="text-left min-w-0">
                      <p className="text-[10px] font-bold leading-none truncate text-white">
                        {nextMatch.home_team?.name ?? 'TBD'} vs {nextMatch.away_team?.name ?? 'TBD'}
                      </p>
                      <p className="text-[10px] text-white/90 leading-none mt-1">
                        {formatDate(nextMatch.scheduled_start)}
                      </p>
                    </div>
                  </div>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary-muted text-primary font-black text-[10px] px-3 py-2 rounded-xl z-20 shadow-md">
                    NEXT
                  </div>
                </>
              ) : (
                <Link
                  to="/schedule"
                  className="flex items-center bg-primary rounded-2xl px-4 py-3 text-white shadow-lg font-bold text-sm"
                >
                  Open Schedule
                </Link>
              )}
            </div>
            <div className="hidden md:block absolute -right-12 bottom-8 w-16 h-16 z-30">
              <FeatureArrow />
            </div>
          </div>

          <div className="feature-card min-h-[240px] md:h-64 relative">
            <h3 className="text-xl md:text-2xl uppercase leading-tight mb-2 font-black text-foreground">
              LIVE &amp;
              <br />
              RESULTS
            </h3>
            <p className="text-xs md:text-sm text-gray-700 font-semibold mb-auto">
              scores update as matches are played
            </p>
            <div className="relative w-full flex justify-center mt-6">
              {latestResult ? (
                <div className="flex items-center bg-primary rounded-full p-1.5 text-white shadow-lg">
                  <div className="bg-white/20 text-white font-bold text-sm px-4 py-2 rounded-full mr-2">
                    {latestResult.home_score} – {latestResult.away_score}
                  </div>
                  <div className="font-bold text-xs px-2 truncate max-w-[100px]">
                    {latestResult.status === 'LIVE' ? 'LIVE' : 'FT'}
                  </div>
                </div>
              ) : (
                <Link
                  to="/matches"
                  className="flex items-center bg-primary rounded-full px-4 py-2.5 text-white shadow-lg font-bold text-sm"
                >
                  All Matches
                </Link>
              )}
              <div className="absolute -bottom-6 right-1/3 bg-primary-muted rounded-full p-2.5 shadow-lg rotate-12 z-20">
                <ArrowUpRight className="w-4 h-4 text-primary" strokeWidth={3} />
              </div>
            </div>
            <div className="hidden md:block absolute -right-12 bottom-8 w-16 h-16 z-30">
              <FeatureArrow />
            </div>
          </div>

          <Link to="/standings" className="feature-card min-h-[240px] md:h-64 hover:shadow-lg transition-shadow">
            <h3 className="text-xl md:text-2xl uppercase leading-tight mb-2 font-black text-foreground">
              CHECK
              <br />
              STANDINGS
            </h3>
            <p className="text-xs md:text-sm text-gray-700 font-semibold mb-auto">
              points, wins, and goal difference
            </p>
            <div className="flex flex-col items-center bg-primary-muted rounded-[2rem] px-6 py-4 text-primary shadow-lg mt-6 relative w-full max-w-[200px]">
              <p className="text-[9px] font-bold uppercase tracking-wider mb-1">Tournament Hub</p>
              <p className="text-xl font-black">Standings</p>
              <div className="absolute -bottom-2 left-8 w-5 h-5 bg-primary-muted rotate-45" />
            </div>
          </Link>
        </div>

        {activeTournaments.length > 0 && (
          <div className="max-w-6xl mx-auto mt-10 pt-8 border-t-2 border-gray-200 flex flex-wrap items-center gap-3">
            <Trophy className="w-5 h-5 text-primary shrink-0" />
            <span className="text-sm font-black uppercase tracking-wide text-foreground">Active:</span>
            <div className="flex gap-2 flex-wrap">
              {activeTournaments.map((t) => (
                <Link
                  key={t.id}
                  to={`/tournaments/${t.slug}`}
                  className="bg-white border-2 border-gray-200 text-xs font-bold px-3 py-1.5 rounded-full hover:border-primary hover:text-primary transition-colors text-foreground"
                >
                  {t.name}
                </Link>
              ))}
            </div>
            <SectionLink to="/tournaments">All Tournaments</SectionLink>
          </div>
        )}

        <div className="max-w-6xl mx-auto mt-12 md:mt-16 pt-10 border-t-2 border-gray-200 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 home-section">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 mb-5 min-w-0">
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight">Recent Results</h2>
              <SectionLink to="/matches">All Matches</SectionLink>
            </div>
            <QueryState isEmpty={liveAndRecent.length === 0} emptyMessage="No recent matches.">
              <div className="space-y-3">
                {liveAndRecent.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            </QueryState>
          </div>

          <div className="min-w-0 home-section">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 mb-5 min-w-0">
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-foreground">Upcoming</h2>
              <SectionLink to="/schedule">Full Schedule</SectionLink>
            </div>
            <div className="rounded-2xl border-2 border-gray-200 bg-white overflow-hidden min-w-0">
              {upcoming.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {upcoming.map((match) => (
                    <div key={match.id} className="px-4 py-3 min-w-0">
                      <div className="flex items-center gap-1.5 mb-2 text-xs text-gray-700 font-semibold">
                        <Calendar className="w-3 h-3 shrink-0" />
                        <span>{formatDate(match.scheduled_start)}</span>
                      </div>
                      <MatchCard match={match} compact />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="p-8 text-center text-sm text-gray-700 font-medium">No upcoming matches</p>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-12 pt-10 border-t-2 border-gray-200">
          <AllDivisionsStandings />
        </div>

        <div className="max-w-6xl mx-auto py-10 md:py-14 mt-12 pt-10 border-t-2 border-gray-200">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 mb-6 min-w-0">
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight">Tournaments</h2>
            <SectionLink to="/tournaments">All Tournaments</SectionLink>
          </div>
          <QueryState isEmpty={tournaments.length === 0} emptyMessage="No tournaments yet." variant="skeleton-cards">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tournaments.slice(0, 4).map((t) => (
                <Link key={t.id} to={`/tournaments/${t.slug}`} className="group">
                  <div className="rounded-[2rem] border-2 border-gray-200 bg-white overflow-hidden h-full hover:shadow-lg transition-shadow">
                    <div className="h-32 bg-primary-muted relative flex items-center justify-center border-b-2 border-gray-200">
                      <div className="bg-white p-3 rounded-2xl shadow-sm">
                        <Trophy className="w-8 h-8 text-primary" />
                      </div>
                      <Badge
                        variant={t.status === 'ACTIVE' ? 'success' : 'default'}
                        className="absolute top-3 right-3"
                      >
                        {t.status}
                      </Badge>
                    </div>
                    <div className="p-5">
                      <h3 className="font-black uppercase text-foreground text-lg group-hover:text-primary transition-colors">
                        {t.name}
                      </h3>
                      <p className="text-sm text-gray-700 font-medium mt-1">{t.location}</p>
                      <p className="text-xs text-gray-600 font-semibold mt-3">
                        {formatDate(t.start_date)} – {formatDate(t.end_date)}
                      </p>
                      <p className="text-sm text-gray-700 mt-3 line-clamp-2">{t.description}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </QueryState>
        </div>

        <Footer />
      </section>
    </PageLayout>
  );
}
