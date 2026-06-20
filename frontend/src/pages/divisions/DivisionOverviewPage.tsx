import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Plus } from 'lucide-react';
import MatchCard from '@/components/MatchCard';
import DivisionQuickStats from '@/components/divisions/DivisionQuickStats';
import SectionHeader from '@/components/shared/SectionHeader';
import Section from '@/components/shared/Section';
import StandingsTable from '@/components/StandingsTable';
import DivisionPageHeader from '@/components/divisions/DivisionPageHeader';
import QueryState from '@/components/shared/QueryState';
import { useDivisionRoute } from '@/context/DivisionContext';
import {
  useDivisionMatches,
  useDivisionStandingsResource,
  useDivisionTeams,
} from '@/hooks/useDivisionResources';
import { divisionTeamPath } from '@/lib/division-routes';
import { StaggerItem } from '@/components/motion/StaggerList';
import { RevealOnScroll } from '@/components/motion/RevealOnScroll';
import { useCanAdminEdit } from '@/hooks/useCanAdminEdit';
import { AdminActionButton } from '@/components/admin/inline/AdminActionButton';
import MatchFormDialog from '@/components/admin/forms/MatchFormDialog';

function getCountdownDays(dateStr?: string): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return diff > 0 ? Math.ceil(diff / 86_400_000) : null;
}

export default function DivisionOverviewPage() {
  const { division, basePath, tournamentSlug, divisionSlug, theme } = useDivisionRoute();
  const teamsQuery = useDivisionTeams(tournamentSlug, divisionSlug);
  const matchesQuery = useDivisionMatches(tournamentSlug, divisionSlug);
  const standingsQuery = useDivisionStandingsResource(tournamentSlug, divisionSlug);
  const { data: teams = [] } = teamsQuery;
  const { data: matches = [] } = matchesQuery;
  const { data: standings = [] } = standingsQuery;
  const isLoading =
    teamsQuery.isLoading || matchesQuery.isLoading || standingsQuery.isLoading;
  const isError =
    teamsQuery.isError || matchesQuery.isError || standingsQuery.isError;
  const canEdit = useCanAdminEdit();
  const [addMatchOpen, setAddMatchOpen] = useState(false);

  const liveMatches = matches.filter((m) => m.status === 'LIVE');
  const upcomingMatches = matches
    .filter((m) => m.status === 'SCHEDULED')
    .sort((a, b) => new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime());

  const showLive = liveMatches.length > 0;
  const displayMatches = showLive ? liveMatches : upcomingMatches.slice(0, 3);
  const hasNoMatches = matches.length === 0;
  const isUpcoming = division.tournament?.status === 'UPCOMING' || hasNoMatches;

  const countdownDays = isUpcoming
    ? getCountdownDays(upcomingMatches[0]?.scheduled_start ?? division.tournament?.start_date)
    : null;

  const firstMatchDate = upcomingMatches[0]?.scheduled_start
    ? new Date(upcomingMatches[0].scheduled_start).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : null;

  const accentColor = theme?.primary;

  return (
    <div className="space-y-5">
      <DivisionPageHeader
        title="Overview"
        subtitle="Division snapshot, live action, and standings"
      />

      <QueryState isLoading={isLoading} isError={isError} variant="skeleton-detail">
      {/* Metric cards — uniform style across all 4 */}
      <DivisionQuickStats
        stats={[
          { value: teams.length, label: 'Teams' },
          { value: matches.length > 0 ? matches.length : '—', label: 'Matches' },
          {
            value: liveMatches.length > 0 ? liveMatches.length : (countdownDays != null ? `${countdownDays}d` : '—'),
            label: liveMatches.length > 0 ? 'Live Now' : (countdownDays != null ? 'Until Kickoff' : 'Live Now'),
            liveIndicator: liveMatches.length > 0,
          },
          {
            value: standings[0]?.points ?? '—',
            label: 'Leader Pts',
            sublabel: standings[0]?.team?.name,
          },
        ]}
      />

      {/* Matches section — show teams roster when no matches exist */}
      {isUpcoming && hasNoMatches ? (
        <Section>
          <SectionHeader
            title="Competing Teams"
            subtitle="Teams registered for this division"
            href={`${basePath}/teams`}
            linkLabel="All teams"
          />
          {teams.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No teams registered yet.
            </p>
          ) : (
            <RevealOnScroll>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {teams.map((team) => {
                const color = team.primary_color ?? accentColor ?? '#F48735';
                return (
                  <StaggerItem key={team.id}>
                  <Link
                    to={divisionTeamPath(tournamentSlug, divisionSlug, team.slug)}
                    className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-center shadow-sm transition-all duration-[var(--motion-normal)] hover:shadow-[var(--shadow-hover)] hover:-translate-y-0.5 hover:border-primary/30 gpu-layer"
                  >
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/20"
                      style={{ backgroundColor: color }}
                    >
                      {team.logo ? (
                        <img
                          src={team.logo}
                          alt=""
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        <Shield className="h-6 w-6 text-white/90" aria-hidden />
                      )}
                    </div>
                    <span className="text-xs font-semibold text-foreground transition-colors group-hover:text-primary line-clamp-2">
                      {team.name}
                    </span>
                  </Link>
                  </StaggerItem>
                );
              })}
            </div>
            </RevealOnScroll>
          )}
        </Section>
      ) : (
        <Section>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <SectionHeader
                title={showLive ? 'Live Matches' : 'Upcoming'}
                subtitle={showLive ? 'Scores updating in real time' : 'Next fixtures in this division'}
                href={`${basePath}/matches`}
                linkLabel="All matches"
              />
            </div>
            {canEdit && (
              <AdminActionButton size="xs" onClick={() => setAddMatchOpen(true)}>
                <Plus className="h-3 w-3" />
                Add match
              </AdminActionButton>
            )}
          </div>
          {displayMatches.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No matches scheduled yet.
            </p>
          ) : (
            <div className="mx-auto w-full max-w-3xl overflow-hidden rounded-md border border-border/60 bg-card">
              {displayMatches.map((m, index) => (
                <MatchCard key={m.id} match={m} flat divider={index > 0} />
              ))}
            </div>
          )}
        </Section>
      )}

      {/* Standings — show placeholder when empty */}
      <Section>
        <SectionHeader
          title="Standings"
          href={standings.length > 0 ? `${basePath}/standings` : undefined}
          linkLabel="Full table"
        />
        {standings.length > 0 ? (
          <StandingsTable standings={standings.slice(0, 6)} compact division={division} />
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground rounded-xl border border-border bg-card">
            {teams.length === 0
              ? 'No teams registered yet.'
              : 'Standings will appear after matches are played.'}
          </p>
        )}
      </Section>
      </QueryState>
      {canEdit && (
        <MatchFormDialog
          open={addMatchOpen}
          onOpenChange={setAddMatchOpen}
          defaultDivisionId={division.id}
        />
      )}
    </div>
  );
}
