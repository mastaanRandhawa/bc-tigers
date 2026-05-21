import Section from '@/components/shared/Section';
import SectionHeader from '@/components/shared/SectionHeader';
import StandingsTable from '@/components/StandingsTable';
import StatCard from '@/components/shared/StatCard';
import { useTeamRoute } from '@/context/TeamContext';
import { useDivisionStandingsResource } from '@/hooks/useDivisionResources';
import { useDivisionRoute } from '@/context/DivisionContext';

export default function TeamStandingsPage() {
  const { team, tournamentSlug, divisionSlug, theme } = useTeamRoute();
  const { division } = useDivisionRoute();
  const { data: standings = [] } = useDivisionStandingsResource(tournamentSlug, divisionSlug);
  const standing = standings.find((s) => s.team_id === team.id);
  const rank = standings.findIndex((s) => s.team_id === team.id) + 1;

  return (
    <div className="space-y-5">
      {standing && (
        <>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
            <StatCard value={rank || '—'} label="Position" accent theme={theme} />
            <StatCard value={standing.points} label="Points" theme={theme} />
            <StatCard value={`${standing.goals_for}:${standing.goals_against}`} label="Goals" theme={theme} />
            <StatCard
              value={
                standing.goal_difference > 0
                  ? `+${standing.goal_difference}`
                  : standing.goal_difference
              }
              label="Goal diff"
              theme={theme}
            />
          </div>
          <Section>
            <SectionHeader title="Division table" />
            <StandingsTable standings={standings} division={division} highlightTeamId={team.id} />
          </Section>
        </>
      )}
      {!standing && (
        <p className="text-sm text-zinc-500">Standing not available for this team yet.</p>
      )}
    </div>
  );
}
