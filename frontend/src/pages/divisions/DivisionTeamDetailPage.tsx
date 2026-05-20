import { Link, useParams } from 'react-router-dom';
import PageContent from '@/components/shared/PageContent';
import QueryState from '@/components/shared/QueryState';
import MatchCard from '@/components/MatchCard';
import { useDivisionRoute } from '@/context/DivisionContext';
import {
  useDivisionTeam,
  useDivisionMatches,
  useDivisionStandingsResource,
} from '@/hooks/useDivisionResources';
import { Shield, Users, Calendar } from 'lucide-react';

export default function DivisionTeamDetailPage() {
  const { teamSlug = '' } = useParams();
  const { tournamentSlug, divisionSlug, basePath } = useDivisionRoute();
  const { data: team, isLoading, isError, refetch } = useDivisionTeam(
    tournamentSlug,
    divisionSlug,
    teamSlug,
  );
  const { data: allMatches = [] } = useDivisionMatches(tournamentSlug, divisionSlug);
  const { data: standings = [] } = useDivisionStandingsResource(tournamentSlug, divisionSlug);

  const teamMatches = allMatches.filter(
    (m) => m.home_team_id === team?.id || m.away_team_id === team?.id,
  );
  const standing = standings.find((s) => s.team_id === team?.id);
  const roster = team?.rosters?.map((r) => r.player).filter(Boolean) ?? [];

  return (
    <PageContent>
      <QueryState
        isLoading={isLoading}
        isError={isError}
        isEmpty={!team}
        onRetry={() => refetch()}
        emptyMessage="Team not found in this division."
      >
        {team && (
          <>
            <div
              className="rounded-[2rem] overflow-hidden mb-8"
              style={{ backgroundColor: team.primary_color ?? '#F48735' }}
            >
              <div className="py-10 px-6 text-center text-white">
                {team.logo ? (
                  <img
                    src={team.logo}
                    alt={team.name}
                    className="w-20 h-20 rounded-full mx-auto border-4 border-white/30 mb-3"
                  />
                ) : (
                  <Shield className="w-16 h-16 mx-auto mb-3" />
                )}
                <h1 className="text-3xl font-black uppercase">{team.name}</h1>
                <p className="text-white/80">{team.city}</p>
              </div>
            </div>

            {standing && (
              <div className="grid grid-cols-4 gap-3 mb-8">
                {[
                  { label: 'Played', value: standing.played },
                  { label: 'Won', value: standing.wins },
                  { label: 'Points', value: standing.points },
                  { label: 'GD', value: standing.goal_difference },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-2xl border-2 border-gray-200 bg-white p-4 text-center"
                  >
                    <p className="text-2xl font-black text-primary">{s.value}</p>
                    <p className="text-xs text-gray-600 font-bold uppercase">{s.label}</p>
                  </div>
                ))}
              </div>
            )}

            <section className="mb-8 home-section">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-4 h-4 text-primary" />
                <h2 className="font-black uppercase">Roster</h2>
              </div>
              {roster.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {roster.map((player) =>
                    player ? (
                      <Link
                        key={player.id}
                        to={`${basePath}/players/${player.slug}`}
                        className="flex items-center gap-4 py-3 hover:text-primary"
                      >
                        <span className="w-8 h-8 rounded-full bg-primary-muted text-primary font-bold flex items-center justify-center text-sm">
                          {player.jersey_number ?? '-'}
                        </span>
                        <span className="font-semibold">
                          {player.first_name} {player.last_name}
                        </span>
                      </Link>
                    ) : null,
                  )}
                </div>
              ) : (
                <p className="text-gray-600 text-sm">No players on roster.</p>
              )}
            </section>

            <section className="home-section">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-4 h-4 text-primary" />
                <h2 className="font-black uppercase">Matches</h2>
              </div>
              <div className="space-y-3">
                {teamMatches.map((m) => (
                  <MatchCard key={m.id} match={m} />
                ))}
              </div>
            </section>
          </>
        )}
      </QueryState>
    </PageContent>
  );
}
