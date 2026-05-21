import { Link } from 'react-router-dom';
import QueryState from '@/components/shared/QueryState';
import MatchCard from '@/components/MatchCard';
import DivisionQuickStats from '@/components/divisions/DivisionQuickStats';
import SectionBlock from '@/components/design-system/SectionBlock';
import StandingsTable from '@/components/StandingsTable';
import DivisionPageHeader from '@/components/divisions/DivisionPageHeader';
import MetaChip from '@/components/design-system/MetaChip';
import { useDivisionRoute } from '@/context/DivisionContext';
import {
  useDivisionMatches,
  useDivisionStandingsResource,
  useDivisionTeams,
} from '@/hooks/useDivisionResources';
import { Calendar, MapPin } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function DivisionOverviewPage() {
  const { division, basePath, tournamentSlug, divisionSlug, theme } = useDivisionRoute();
  const tournament = division.tournament;
  const { data: teams = [] } = useDivisionTeams(tournamentSlug, divisionSlug);
  const { data: matches = [] } = useDivisionMatches(tournamentSlug, divisionSlug);
  const { data: standings = [] } = useDivisionStandingsResource(tournamentSlug, divisionSlug);

  const liveMatches = matches.filter((m) => m.status === 'LIVE');
  const upcoming = matches.filter((m) => m.status === 'SCHEDULED').slice(0, 4);
  const recent = matches.filter((m) => m.status === 'COMPLETED').slice(0, 4);

  return (
    <div className="space-y-4">
      <DivisionPageHeader
        title="Overview"
        subtitle="Division snapshot, live action, and standings"
      />

      <DivisionQuickStats
        theme={theme}
        stats={[
          { value: teams.length, label: 'Teams' },
          { value: matches.length, label: 'Matches' },
          {
            value: liveMatches.length,
            label: 'Live now',
            accent: liveMatches.length > 0,
          },
          {
            value: standings[0]?.points ?? '—',
            label: 'Leader pts',
            sublabel: standings[0]?.team?.name,
          },
        ]}
      />

      {liveMatches.length > 0 && (
        <SectionBlock title="Live matches" subtitle="Scores updating in real time" variant="card">
          <MatchCard match={liveMatches[0]} featured />
          {liveMatches.length > 1 && (
            <div className="mt-3 divide-y divide-border border-t border-border pt-3">
              {liveMatches.slice(1).map((m) => (
                <MatchCard key={m.id} match={m} flat />
              ))}
            </div>
          )}
        </SectionBlock>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionBlock
          title="Upcoming"
          subtitle="Chronological schedule"
          href={`${basePath}/schedule`}
          linkLabel="Full schedule"
          variant="card"
        >
          <QueryState isEmpty={upcoming.length === 0} emptyMessage="No upcoming matches.">
            <div className="divide-y divide-border">
              {upcoming.map((m) => (
                <MatchCard key={m.id} match={m} flat />
              ))}
            </div>
          </QueryState>
        </SectionBlock>

        <SectionBlock
          title="Recent results"
          subtitle="Filter by status on Matches"
          href={`${basePath}/matches`}
          linkLabel="All matches"
          variant="card"
        >
          <QueryState isEmpty={recent.length === 0} emptyMessage="No completed matches yet.">
            <div className="divide-y divide-border">
              {recent.map((m) => (
                <MatchCard key={m.id} match={m} flat />
              ))}
            </div>
          </QueryState>
        </SectionBlock>
      </div>

      {standings.length > 0 && (
        <SectionBlock
          title="Standings"
          href={`${basePath}/standings`}
          linkLabel="Full table"
          variant="card"
        >
          <StandingsTable standings={standings.slice(0, 6)} compact division={division} />
        </SectionBlock>
      )}

      {tournament && (
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <Link
              to={`/tournaments/${tournament.slug}`}
              className="text-sm font-semibold transition-colors hover:underline"
              style={{ color: theme.primary }}
            >
              {tournament.name}
            </Link>
            <div className="mt-2 flex flex-wrap gap-2">
              <MetaChip
                icon={Calendar}
                value={`${formatDate(tournament.start_date)} – ${formatDate(tournament.end_date)}`}
              />
              {tournament.location && <MetaChip icon={MapPin} value={tournament.location} />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
