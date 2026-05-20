import { useState } from 'react';
import PageLayout from '@/components/PageLayout';
import PageHeader from '@/components/shared/PageHeader';
import QueryState from '@/components/shared/QueryState';
import { Link } from 'react-router-dom';
import { usePlayers } from '@/hooks/usePlayers';
import { useTopScorers } from '@/hooks/useStats';
import { Search, User } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function PlayersPage() {
  const [search, setSearch] = useState('');
  const { data: players = [], isLoading, isError, refetch } = usePlayers();
  const { data: topScorers = [] } = useTopScorers();

  const filtered = players.filter((p) =>
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(search.toLowerCase())
  );

  const getStats = (playerId: string) => topScorers.find((s) => s.player_id === playerId);

  return (
    <PageLayout>
      <PageHeader title="Players" subtitle="Player profiles and statistics" icon={User} />

      <section className="py-8 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="relative max-w-md mb-8">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search players..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <QueryState
            isLoading={isLoading}
            isError={isError}
            isEmpty={filtered.length === 0}
            onRetry={() => refetch()}
            emptyMessage="No players found."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtered.map((player) => {
                const stats = getStats(player.id);
                return (
                  <Link key={player.id} to={`/players/${player.slug}`} className="group">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all overflow-hidden">
                      <div className="h-28 bg-[#0038FF] relative overflow-hidden flex items-center justify-center">
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:2rem_2rem]" />
                        {player.profile_image ? (
                          <img
                            src={player.profile_image}
                            alt=""
                            className="w-20 h-20 rounded-full object-cover border-4 border-white/30 relative z-10"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center relative z-10">
                            <User className="w-10 h-10 text-white" />
                          </div>
                        )}
                        <div className="absolute top-2 left-2 bg-[#CCFF00] text-black text-xs font-black px-2 py-0.5 rounded-lg">
                          #{player.jersey_number ?? '?'}
                        </div>
                      </div>
                      <div className="p-4 text-center">
                        <h3 className="font-black text-gray-900 group-hover:text-[#0038FF] transition-colors">
                          {player.first_name} {player.last_name}
                        </h3>
                        <div className="flex justify-center gap-3 mt-1 text-xs text-gray-400">
                          <span>{player.preferred_position}</span>
                          <span>·</span>
                          <span>{player.nationality}</span>
                        </div>
                        {stats && (
                          <div className="flex justify-center gap-4 mt-3 text-xs font-semibold">
                            <span className="text-[#0038FF]">{stats.goals}G</span>
                            <span className="text-gray-400">{stats.assists}A</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </QueryState>
        </div>
      </section>
    </PageLayout>
  );
}
