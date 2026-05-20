import { Link } from 'react-router-dom';
import PageLayout from '@/components/PageLayout';
import { HeroComponent } from '@/components/ui/hero';
import LiveScoreTicker from '@/components/LiveScoreTicker';
import MatchCard from '@/components/MatchCard';
import StandingsTable from '@/components/StandingsTable';
import QueryState from '@/components/shared/QueryState';
import { useTournaments } from '@/hooks/useTournaments';
import { useMatches } from '@/hooks/useMatches';
import { useDivisions } from '@/hooks/useDivisions';
import { useStandings } from '@/hooks/useStandings';
import { Calendar, ChevronRight, Trophy } from 'lucide-react';
import { formatDate } from '@/lib/utils';

function FirstDivisionStandings() {
  const { data: divisions = [] } = useDivisions();
  const firstDivision = divisions[0];
  const { data: standings = [] } = useStandings(firstDivision?.id);

  if (!firstDivision) return null;

  return (
    <section className="py-12 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 mb-6 min-w-0">
          <div className="min-w-0">
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">League Standings</h2>
            <p className="text-sm text-gray-500 mt-1">{firstDivision.name}</p>
          </div>
          <Link
            to={`/standings/${firstDivision.slug}`}
            className="text-sm text-[#0038FF] font-semibold flex items-center gap-1 hover:underline shrink-0 whitespace-nowrap ml-auto"
          >
            Full Standings <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <StandingsTable standings={standings} compact />
      </div>
    </section>
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

  return (
    <PageLayout>
      <LiveScoreTicker />
      <HeroComponent />

      <section className="bg-[#001A99] py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-[#CCFF00]" />
            <span className="text-white font-bold">Active Tournaments:</span>
            <div className="flex gap-2 flex-wrap">
              {activeTournaments.length > 0 ? (
                activeTournaments.map((t) => (
                  <Link
                    key={t.id}
                    to={`/tournaments/${t.slug}`}
                    className="bg-[#CCFF00] text-black text-xs font-black px-3 py-1 rounded-full hover:bg-yellow-300 transition-colors"
                  >
                    {t.name}
                  </Link>
                ))
              ) : (
                <span className="text-white/60 text-sm">No active tournaments</span>
              )}
            </div>
          </div>
          <Link
            to="/tournaments"
            className="text-white/70 text-sm flex items-center gap-1 hover:text-white transition-colors"
          >
            All Tournaments <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 mb-5 min-w-0">
              <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Recent Results</h2>
              <Link to="/matches" className="text-sm text-[#0038FF] font-semibold flex items-center gap-1 hover:underline shrink-0 whitespace-nowrap ml-auto">
                All Matches <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <QueryState isEmpty={liveAndRecent.length === 0} emptyMessage="No recent matches.">
              <div className="space-y-3">
                {liveAndRecent.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            </QueryState>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 mb-5 min-w-0">
              <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Upcoming</h2>
              <Link to="/schedule" className="text-sm text-[#0038FF] font-semibold flex items-center gap-1 hover:underline shrink-0 whitespace-nowrap ml-auto">
                Full Schedule <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50 overflow-hidden min-w-0">
              {upcoming.length > 0 ? (
                upcoming.map((match) => (
                  <div key={match.id} className="px-4 py-3 min-w-0">
                    <div className="flex items-center gap-1.5 mb-2 text-xs text-gray-500">
                      <Calendar className="w-3 h-3 shrink-0" />
                      <span>{formatDate(match.scheduled_start)}</span>
                    </div>
                    <MatchCard match={match} compact />
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-400 text-sm">No upcoming matches</div>
              )}
            </div>
          </div>
        </div>
      </section>

      <FirstDivisionStandings />

      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 mb-6 min-w-0">
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Tournaments</h2>
            <Link to="/tournaments" className="text-sm text-[#0038FF] font-semibold flex items-center gap-1 hover:underline shrink-0 whitespace-nowrap ml-auto">
              All Tournaments <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <QueryState isEmpty={tournaments.length === 0} emptyMessage="No tournaments yet.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tournaments.slice(0, 4).map((t) => (
                <Link key={t.id} to={`/tournaments/${t.slug}`} className="group">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all overflow-hidden">
                    <div className="h-36 bg-[#0038FF] relative overflow-hidden">
                      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:2rem_2rem]" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-[#CCFF00] p-3 rounded-2xl">
                          <Trophy className="w-10 h-10 text-black" />
                        </div>
                      </div>
                      <div
                        className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-bold ${
                          t.status === 'ACTIVE' ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'
                        }`}
                      >
                        {t.status}
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-black text-gray-900 text-lg group-hover:text-[#0038FF] transition-colors">
                        {t.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">{t.location}</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                        <span>
                          {formatDate(t.start_date)} – {formatDate(t.end_date)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-3 line-clamp-2">{t.description}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </QueryState>
        </div>
      </section>
    </PageLayout>
  );
}
