import { useParams } from 'react-router-dom';
import PageLayout from '@/components/PageLayout';
import QueryState from '@/components/shared/QueryState';
import { usePlayer } from '@/hooks/usePlayers';
import { useTopScorers } from '@/hooks/useStats';
import { User } from 'lucide-react';

export default function PlayerDetailPage() {
  const { playerSlug } = useParams();
  const { data: player, isLoading, isError, refetch } = usePlayer(playerSlug);
  const { data: topScorers = [] } = useTopScorers(
    player?.team?.division_id ? { divisionId: player.team.division_id } : undefined
  );
  const stats = topScorers.find((s) => s.player_id === player?.id);

  return (
    <PageLayout>
      <QueryState
        isLoading={isLoading}
        isError={isError}
        isEmpty={!player}
        onRetry={() => refetch()}
        emptyMessage="Player not found."
      >
        {player && (
          <>
            <div className="bg-primary py-16 px-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:3rem_3rem]" />
              <div className="max-w-4xl mx-auto relative z-10 flex flex-col md:flex-row items-center md:items-end gap-6">
                {player.profile_image ? (
                  <img src={player.profile_image} alt="" className="w-32 h-32 rounded-full object-cover border-4 border-white/30" />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-white/20 flex items-center justify-center">
                    <User className="w-16 h-16 text-white" />
                  </div>
                )}
                <div>
                  <div className="bg-white text-black text-lg font-black px-3 py-1 rounded-xl inline-block mb-2">
                    #{player.jersey_number ?? '?'}
                  </div>
                  <h1 className="text-4xl md:text-6xl text-display text-white">
                    {player.first_name} {player.last_name}
                  </h1>
                  <div className="flex items-center gap-4 mt-2 text-white/70 text-sm">
                    <span>{player.preferred_position}</span>
                    <span>·</span>
                    <span>{player.nationality}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-10">
              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                  {[
                    { label: 'Goals', value: stats.goals },
                    { label: 'Assists', value: stats.assists },
                    { label: 'Matches', value: stats.matches_played },
                    { label: 'Yellow Cards', value: stats.yellow_cards },
                    { label: 'Red Cards', value: stats.red_cards },
                  ].map((s) => (
                    <div key={s.label} className="rounded-lg border border-border bg-card shadow-sm p-5 text-center">
                      <p className="text-3xl font-black text-primary">{s.value}</p>
                      <p className="text-xs text-muted-foreground font-medium mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="rounded-lg border border-border bg-card shadow-sm p-6">
                <h2 className="font-semibold text-foreground uppercase mb-4">Player Info</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  {player.nationality && <InfoItem label="Nationality" value={player.nationality} />}
                  {player.preferred_position && <InfoItem label="Position" value={player.preferred_position} />}
                  {player.jersey_number !== undefined && <InfoItem label="Jersey #" value={String(player.jersey_number)} />}
                  {player.dob && <InfoItem label="Date of Birth" value={player.dob} />}
                </div>
              </div>
            </div>
          </>
        )}
      </QueryState>
    </PageLayout>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted rounded-xl p-3">
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
      <p className="font-bold text-foreground mt-0.5">{value}</p>
    </div>
  );
}
