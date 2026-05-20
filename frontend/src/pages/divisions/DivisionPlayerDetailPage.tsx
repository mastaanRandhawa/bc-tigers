import { useParams } from 'react-router-dom';
import PageContent from '@/components/shared/PageContent';
import QueryState from '@/components/shared/QueryState';
import MatchCard from '@/components/MatchCard';
import { useDivisionRoute } from '@/context/DivisionContext';
import { useDivisionPlayers } from '@/hooks/useDivisionResources';
import { User } from 'lucide-react';

export default function DivisionPlayerDetailPage() {
  const { playerSlug = '' } = useParams();
  const { tournamentSlug, divisionSlug } = useDivisionRoute();
  const { data: players = [], isLoading, isError, refetch } = useDivisionPlayers(
    tournamentSlug,
    divisionSlug,
  );

  const player = players.find((p) => p.slug === playerSlug);
  const stats = player?.player_stats?.[0];
  const team = player?.rosters?.[0]?.team;

  return (
    <PageContent innerClassName="max-w-3xl">
      <QueryState
        isLoading={isLoading}
        isError={isError}
        isEmpty={!player}
        onRetry={() => refetch()}
        emptyMessage="Player not found in this division."
      >
        {player && (
          <>
            <div className="rounded-[2rem] bg-primary text-white p-8 text-center mb-8">
              {player.profile_image ? (
                <img
                  src={player.profile_image}
                  alt=""
                  className="w-24 h-24 rounded-full mx-auto border-4 border-white/30 mb-4"
                />
              ) : (
                <User className="w-20 h-20 mx-auto mb-4" />
              )}
              <h1 className="text-3xl font-black">
                {player.first_name} {player.last_name}
              </h1>
              <p className="text-white/80 mt-1">
                #{player.jersey_number ?? '—'} · {player.preferred_position}
              </p>
              {team && <p className="text-white/70 text-sm mt-2">{team.name}</p>}
            </div>
            {stats && (
              <div className="grid grid-cols-4 gap-3 mb-8">
                {[
                  { label: 'Goals', value: stats.goals },
                  { label: 'Assists', value: stats.assists },
                  { label: 'Yellow', value: stats.yellow_cards },
                  { label: 'Red', value: stats.red_cards },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-2xl border-2 border-gray-200 bg-white p-4 text-center"
                  >
                    <p className="text-2xl font-black text-primary">{s.value}</p>
                    <p className="text-xs font-bold uppercase text-gray-600">{s.label}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </QueryState>
    </PageContent>
  );
}
