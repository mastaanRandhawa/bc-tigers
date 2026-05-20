import { Link } from 'react-router-dom';
import QueryState from '@/components/shared/QueryState';
import MatchCard from '@/components/MatchCard';
import StatCard from '@/components/shared/StatCard';
import SectionHeader from '@/components/shared/SectionHeader';
import StandingsTable from '@/components/StandingsTable';
import DivisionPageHeader from '@/components/divisions/DivisionPageHeader';
import { useDivisionRoute } from '@/context/DivisionContext';
import {
  useDivisionMatches,
  useDivisionStandingsResource,
  useDivisionTeams,
} from '@/hooks/useDivisionResources';
import { Calendar, MapPin, Swords, Trophy, Users, Zap } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function DivisionOverviewPage() {
  const { division, basePath, tournamentSlug, divisionSlug } = useDivisionRoute();
  const tournament = division.tournament;
  const { data: teams = [] } = useDivisionTeams(tournamentSlug, divisionSlug);
  const { data: matches = [] } = useDivisionMatches(tournamentSlug, divisionSlug);
  const { data: standings = [] } = useDivisionStandingsResource(tournamentSlug, divisionSlug);

  const liveMatches = matches.filter((m) => m.status === 'LIVE');
  const upcoming = matches.filter((m) => m.status === 'SCHEDULED').slice(0, 4);
  const recent = matches
    .filter((m) => m.status === 'COMPLETED')
    .slice(0, 4);

  return (
    <div className="space-y-6">
      <DivisionPageHeader
        title="Overview"
        subtitle="Division snapshot, live action, and standings"
      />

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard value={teams.length} label="Teams" icon={Users} />
        <StatCard value={matches.length} label="Matches" icon={Swords} />
        <StatCard
          value={liveMatches.length}
          label="Live now"
          icon={Zap}
          accent={liveMatches.length > 0}
        />
        <StatCard
          value={standings[0]?.points ?? '—'}
          label="Leader pts"
          icon={Trophy}
          trend={standings[0]?.team?.name}
        />
      </div>

      {/* Live matches */}
      {liveMatches.length > 0 && (
        <section className="home-section">
          <SectionHeader title="Live matches" subtitle="Scores updating in real time" />
          <div className="space-y-2">
            {liveMatches.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Upcoming */}
        <section className="home-section">
          <SectionHeader
            title="Upcoming"
            href={`${basePath}/schedule`}
            linkLabel="Full schedule"
          />
          <QueryState isEmpty={upcoming.length === 0} emptyMessage="No upcoming matches.">
            <div className="space-y-2">
              {upcoming.map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          </QueryState>
        </section>

        {/* Recent results */}
        <section className="home-section">
          <SectionHeader
            title="Recent results"
            href={`${basePath}/matches`}
            linkLabel="All matches"
          />
          <QueryState isEmpty={recent.length === 0} emptyMessage="No completed matches yet.">
            <div className="space-y-2">
              {recent.map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          </QueryState>
        </section>
      </div>

      {/* Standings snapshot */}
      {standings.length > 0 && (
        <section className="home-section">
          <SectionHeader
            title="Standings"
            href={`${basePath}/standings`}
            linkLabel="Full table"
          />
          <StandingsTable standings={standings.slice(0, 6)} compact division={division} />
        </section>
      )}

      {/* Tournament info */}
      {tournament && (
        <section className="ds-section">
          <SectionHeader title="Tournament info" />
          <Link
            to={`/tournaments/${tournament.slug}`}
            className="text-lg font-semibold text-foreground hover:text-primary transition-colors"
          >
            {tournament.name}
          </Link>
          <div className="flex flex-wrap gap-4 mt-3 text-sm text-zinc-500">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-zinc-400" />
              {formatDate(tournament.start_date)} – {formatDate(tournament.end_date)}
            </span>
            {tournament.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-zinc-400" />
                {tournament.location}
              </span>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
