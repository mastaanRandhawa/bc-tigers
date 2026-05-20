import { Link } from 'react-router-dom';
import PageContent from '@/components/shared/PageContent';
import QueryState from '@/components/shared/QueryState';
import MatchCard from '@/components/MatchCard';
import { useDivisionRoute } from '@/context/DivisionContext';
import {
  useDivisionMatches,
  useDivisionStandingsResource,
  useDivisionTeams,
} from '@/hooks/useDivisionResources';
import { Calendar, ChevronRight, MapPin, Trophy, Users } from 'lucide-react';
import { formatDate } from '@/lib/utils';

const sections = [
  { label: 'Teams', path: 'teams', icon: Users, desc: 'Registered squads' },
  { label: 'Schedule', path: 'schedule', icon: Calendar, desc: 'Fixtures & kickoffs' },
  { label: 'Matches', path: 'matches', icon: Trophy, desc: 'Live & results' },
  { label: 'Standings', path: 'standings', icon: Trophy, desc: 'League table' },
  { label: 'Stats', path: 'stats', icon: Trophy, desc: 'Player leaders' },
  { label: 'Brackets', path: 'brackets', icon: Trophy, desc: 'Knockout stage' },
  { label: 'Venues', path: 'venues', icon: MapPin, desc: 'Match locations' },
];

export default function DivisionOverviewPage() {
  const { division, basePath, tournamentSlug, divisionSlug } = useDivisionRoute();
  const tournament = division.tournament;
  const { data: teams = [] } = useDivisionTeams(tournamentSlug, divisionSlug);
  const { data: matches = [] } = useDivisionMatches(tournamentSlug, divisionSlug);
  const { data: standings = [] } = useDivisionStandingsResource(tournamentSlug, divisionSlug);

  const liveMatches = matches.filter((m) => m.status === 'LIVE');
  const upcoming = matches.filter((m) => m.status === 'SCHEDULED').slice(0, 3);

  return (
    <PageContent>
      {tournament && (
        <div className="mb-8 rounded-[2rem] border-2 border-gray-200 bg-gray-50 p-6">
          <h2 className="text-lg font-black uppercase tracking-tight mb-2">Tournament</h2>
          <Link
            to={`/tournaments/${tournament.slug}`}
            className="text-primary font-bold hover:underline"
          >
            {tournament.name}
          </Link>
          <p className="text-sm text-gray-700 mt-2">
            {formatDate(tournament.start_date)} – {formatDate(tournament.end_date)} ·{' '}
            {tournament.location}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <div className="rounded-2xl border-2 border-gray-200 bg-white p-4 text-center">
          <p className="text-2xl font-black text-primary">{teams.length}</p>
          <p className="text-xs font-bold uppercase text-gray-600 mt-1">Teams</p>
        </div>
        <div className="rounded-2xl border-2 border-gray-200 bg-white p-4 text-center">
          <p className="text-2xl font-black text-primary">{matches.length}</p>
          <p className="text-xs font-bold uppercase text-gray-600 mt-1">Matches</p>
        </div>
        <div className="rounded-2xl border-2 border-gray-200 bg-white p-4 text-center">
          <p className="text-2xl font-black text-primary">{liveMatches.length}</p>
          <p className="text-xs font-bold uppercase text-gray-600 mt-1">Live</p>
        </div>
        <div className="rounded-2xl border-2 border-gray-200 bg-white p-4 text-center">
          <p className="text-2xl font-black text-primary">{standings[0]?.points ?? '—'}</p>
          <p className="text-xs font-bold uppercase text-gray-600 mt-1">Leader Pts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {sections.map(({ label, path, desc, icon: Icon }) => (
          <Link
            key={path}
            to={`${basePath}/${path}`}
            className="feature-card min-h-[120px] items-start text-left hover:shadow-lg transition-shadow"
          >
            <Icon className="w-5 h-5 text-primary mb-2" />
            <h3 className="font-black uppercase">{label}</h3>
            <p className="text-sm text-gray-700 mt-1">{desc}</p>
            <ChevronRight className="w-4 h-4 text-primary mt-auto ml-auto" />
          </Link>
        ))}
      </div>

      {liveMatches.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-black uppercase mb-4">Live Now</h2>
          <div className="space-y-3">
            {liveMatches.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black uppercase">Upcoming</h2>
            <Link to={`${basePath}/schedule`} className="text-sm text-primary font-bold">
              Full schedule <ChevronRight className="w-4 h-4 inline" />
            </Link>
          </div>
          <QueryState isEmpty={upcoming.length === 0} emptyMessage="No upcoming matches.">
            <div className="space-y-3">
              {upcoming.map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          </QueryState>
        </section>
      )}
    </PageContent>
  );
}
