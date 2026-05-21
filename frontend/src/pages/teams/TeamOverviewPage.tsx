import StatCard from '@/components/shared/StatCard';
import SectionBlock from '@/components/design-system/SectionBlock';
import CoachTeamBanner from '@/components/teams/CoachTeamBanner';
import CoachTeamEditPanel from '@/components/teams/CoachTeamEditPanel';
import { useTeamRoute } from '@/context/TeamContext';
import { useDivisionStandingsResource } from '@/hooks/useDivisionResources';
import { teamRosterPath, teamMatchesPath } from '@/lib/team-routes';
import { Link } from 'react-router-dom';

export default function TeamOverviewPage() {
  const { team, tournamentSlug, divisionSlug, teamSlug, theme } = useTeamRoute();
  const { data: standings = [] } = useDivisionStandingsResource(tournamentSlug, divisionSlug);
  const standing = standings.find((s) => s.team_id === team.id);
  const rosterCount = team.rosters?.length ?? 0;

  return (
    <div className="space-y-4">
      <CoachTeamBanner teamId={team.id} />
      <CoachTeamEditPanel />

      {standing && (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
          <StatCard value={standing.played} label="Played" theme={theme} />
          <StatCard value={standing.wins} label="Wins" theme={theme} />
          <StatCard value={standing.points} label="Points" accent theme={theme} />
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
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SectionBlock
          title="Roster"
          href={teamRosterPath(tournamentSlug, divisionSlug, teamSlug)}
          linkLabel={`${rosterCount} players`}
          variant="card"
        >
          <p className="text-body m-0">
            View the full squad, jersey numbers, and player profiles.
          </p>
        </SectionBlock>
        <SectionBlock
          title="Matches"
          href={teamMatchesPath(tournamentSlug, divisionSlug, teamSlug)}
          linkLabel="View all"
          variant="card"
        >
          <p className="text-body m-0">
            Fixtures and results for this team in the division.
          </p>
        </SectionBlock>
      </div>

      {team.founded_year && (
        <p className="text-meta m-0">
          Founded {team.founded_year}
          {team.city && (
            <>
              {' '}
              · <Link to={teamMatchesPath(tournamentSlug, divisionSlug, teamSlug)}>{team.city}</Link>
            </>
          )}
        </p>
      )}
    </div>
  );
}
