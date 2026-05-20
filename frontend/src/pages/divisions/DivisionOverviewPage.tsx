import { Link } from 'react-router-dom';
import QueryState from '@/components/shared/QueryState';
import MatchCard from '@/components/MatchCard';
import DivisionQuickStats from '@/components/divisions/DivisionQuickStats';
import SectionHeader from '@/components/shared/SectionHeader';
import Section from '@/components/shared/Section';
import StandingsTable from '@/components/StandingsTable';
import DivisionPageHeader from '@/components/divisions/DivisionPageHeader';
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
    <div className="space-y-5">
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

      {/* Live — full prominence */}
      {liveMatches.length > 0 && (
        <Section>
          <SectionHeader title="Live matches" subtitle="Scores updating in real time" />
          <div className="divide-y divide-border">
            {liveMatches.map((m) => (
              <MatchCard key={m.id} match={m} flat />
            ))}
          </div>
        </Section>
      )}

      {/* Upcoming + Recent results side-by-side on lg */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section>
          <SectionHeader
            title="Upcoming"
            href={`${basePath}/schedule`}
            linkLabel="Full schedule"
          />
          <QueryState isEmpty={upcoming.length === 0} emptyMessage="No upcoming matches.">
            <div className="divide-y divide-border">
              {upcoming.map((m) => (
                <MatchCard key={m.id} match={m} flat />
              ))}
            </div>
          </QueryState>
        </Section>

        <Section>
          <SectionHeader
            title="Recent results"
            href={`${basePath}/matches`}
            linkLabel="All matches"
          />
          <QueryState isEmpty={recent.length === 0} emptyMessage="No completed matches yet.">
            <div className="divide-y divide-border">
              {recent.map((m) => (
                <MatchCard key={m.id} match={m} flat />
              ))}
            </div>
          </QueryState>
        </Section>
      </div>

      {/* Standings snapshot */}
      {standings.length > 0 && (
        <Section>
          <SectionHeader
            title="Standings"
            href={`${basePath}/standings`}
            linkLabel="Full table"
          />
          <StandingsTable standings={standings.slice(0, 6)} compact division={division} />
        </Section>
      )}

      {/* Tournament info — minimal */}
      {tournament && (
        <div className="flex flex-col gap-1 rounded-xl bg-white px-4 py-3 ring-1 ring-border/60 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <Link
              to={`/tournaments/${tournament.slug}`}
              className="text-sm font-semibold text-foreground transition-colors hover:underline"
              style={{ color: theme.primary }}
            >
              {tournament.name}
            </Link>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-zinc-500">
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-zinc-400" aria-hidden />
                {formatDate(tournament.start_date)} – {formatDate(tournament.end_date)}
              </span>
              {tournament.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-zinc-400" aria-hidden />
                  {tournament.location}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
