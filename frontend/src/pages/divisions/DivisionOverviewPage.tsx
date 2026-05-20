import { Link } from 'react-router-dom';
import QueryState from '@/components/shared/QueryState';
import MatchCard from '@/components/MatchCard';
import DivisionPageHeader from '@/components/divisions/DivisionPageHeader';
import { useDivisionRoute } from '@/context/DivisionContext';
import {
  useDivisionMatches,
  useDivisionStandingsResource,
  useDivisionTeams,
} from '@/hooks/useDivisionResources';
import { ChevronRight } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function DivisionOverviewPage() {
  const { division, basePath, tournamentSlug, divisionSlug } = useDivisionRoute();
  const tournament = division.tournament;
  const { data: teams = [] } = useDivisionTeams(tournamentSlug, divisionSlug);
  const { data: matches = [] } = useDivisionMatches(tournamentSlug, divisionSlug);
  const { data: standings = [] } = useDivisionStandingsResource(tournamentSlug, divisionSlug);

  const liveMatches = matches.filter((m) => m.status === 'LIVE');
  const upcoming = matches.filter((m) => m.status === 'SCHEDULED').slice(0, 3);

  return (
    <>
      <DivisionPageHeader title="Overview" subtitle="Division snapshot and recent activity" />

      {tournament && (
        <div className="mb-8 rounded-[2rem] border-2 border-gray-200 bg-gray-50 p-6">
          <h3 className="text-sm font-black uppercase tracking-wide text-gray-600 mb-2">Tournament</h3>
          <Link
            to={`/tournaments/${tournament.slug}`}
            className="division-link text-lg"
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
        <div className="division-stat-card">
          <p className="division-stat-value">{teams.length}</p>
          <p className="division-stat-label">Teams</p>
        </div>
        <div className="division-stat-card">
          <p className="division-stat-value">{matches.length}</p>
          <p className="division-stat-label">Matches</p>
        </div>
        <div className="division-stat-card">
          <p className="division-stat-value">{liveMatches.length}</p>
          <p className="division-stat-label">Live</p>
        </div>
        <div className="division-stat-card">
          <p className="division-stat-value">{standings[0]?.points ?? '—'}</p>
          <p className="division-stat-label">Leader Pts</p>
        </div>
      </div>

      {liveMatches.length > 0 && (
        <section className="mb-10 home-section">
          <h3 className="division-section-title mb-4">Live Now</h3>
          <div className="space-y-3">
            {liveMatches.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section className="home-section">
          <div className="flex items-center justify-between mb-4">
            <h3 className="division-section-title">Upcoming</h3>
            <Link to={`${basePath}/schedule`} className="division-link text-sm inline-flex items-center gap-1">
              Full schedule <ChevronRight className="w-4 h-4" />
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
    </>
  );
}
