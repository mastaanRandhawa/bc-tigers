import { useParams } from 'react-router-dom';
import PageLayout from '@/components/PageLayout';
import QueryState from '@/components/shared/QueryState';
import { useTeam } from '@/hooks/useTeams';
import { usePlayers } from '@/hooks/usePlayers';
import { useMatches } from '@/hooks/useMatches';
import { useStandings } from '@/hooks/useStandings';
import { Shield, Users, Calendar, BarChart2 } from 'lucide-react';
import MatchCard from '@/components/MatchCard';

export default function TeamDetailPage() {
  const { teamSlug } = useParams();
  const { data: team, isLoading, isError, refetch } = useTeam(teamSlug);
  const { data: players = [] } = usePlayers(team ? { teamId: team.id } : undefined);
  const { data: allMatches = [] } = useMatches(
    team?.division_id ? { divisionId: team.division_id } : undefined
  );
  const { data: standings = [] } = useStandings(team?.division_id);

  const teamMatches = allMatches.filter(
    (m) => m.home_team_id === team?.id || m.away_team_id === team?.id
  );
  const standing = standings.find((s) => s.team_id === team?.id);

  return (
    <PageLayout>
      <QueryState
        isLoading={isLoading}
        isError={isError}
        isEmpty={!team}
        onRetry={() => refetch()}
        emptyMessage="Team not found."
      >
        {team && (
          <>
            <div className="h-48 relative overflow-hidden" style={{ backgroundColor: team.primary_color ?? '#0038FF' }}>
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:3rem_3rem]" />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {team.logo ? (
                  <img src={team.logo} alt={team.name} className="w-20 h-20 rounded-full object-cover border-4 border-white/30 mb-2" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mb-2">
                    <Shield className="w-10 h-10 text-white" />
                  </div>
                )}
                <h1 className="text-3xl font-black text-white uppercase tracking-tight" style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.3)' }}>{team.name}</h1>
                <p className="text-white/70 text-sm">{team.city}</p>
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                {standing && (
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: 'Played', value: standing.played },
                      { label: 'Won', value: standing.wins },
                      { label: 'Points', value: standing.points },
                      { label: 'GD', value: standing.goal_difference > 0 ? `+${standing.goal_difference}` : String(standing.goal_difference) },
                    ].map((s) => (
                      <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
                        <p className="text-2xl font-black text-[#0038FF]">{s.value}</p>
                        <p className="text-xs text-gray-400 font-medium mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>
                )}

                <section className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 p-5 border-b border-gray-50">
                    <Users className="w-4 h-4 text-[#0038FF]" />
                    <h2 className="font-black text-gray-900 uppercase">Roster</h2>
                  </div>
                  {players.length > 0 ? (
                    <div className="divide-y divide-gray-50">
                      {players.map((player) => (
                        <div key={player.id} className="flex items-center gap-4 px-5 py-3">
                          <div className="w-8 h-8 rounded-full bg-[#0038FF] flex items-center justify-center text-white text-xs font-black">
                            {player.jersey_number ?? '-'}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 text-sm">{player.first_name} {player.last_name}</p>
                            <p className="text-xs text-gray-400">{player.preferred_position} · {player.nationality}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="px-5 py-6 text-sm text-gray-400">No players on roster yet.</p>
                  )}
                </section>

                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="w-4 h-4 text-[#0038FF]" />
                    <h2 className="font-black text-gray-900 uppercase">Match History</h2>
                  </div>
                  {teamMatches.length > 0 ? (
                    <div className="space-y-3">
                      {teamMatches.map((m) => <MatchCard key={m.id} match={m} />)}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">No matches yet.</p>
                  )}
                </section>
              </div>

              <div className="space-y-5">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart2 className="w-4 h-4 text-[#0038FF]" />
                    <h3 className="font-black text-gray-900 uppercase">Team Info</h3>
                  </div>
                  <div className="space-y-3 text-sm">
                    {team.city && <InfoRow label="City" value={team.city} />}
                    {team.founded_year && <InfoRow label="Founded" value={String(team.founded_year)} />}
                    {standing && (
                      <>
                        <InfoRow label="Rank" value={`#${standing.rank}`} />
                        <InfoRow label="Goals For" value={String(standing.goals_for)} />
                        <InfoRow label="Goals Against" value={String(standing.goals_against)} />
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </QueryState>
    </PageLayout>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-400">{label}</span>
      <span className="font-semibold text-gray-800">{value}</span>
    </div>
  );
}
