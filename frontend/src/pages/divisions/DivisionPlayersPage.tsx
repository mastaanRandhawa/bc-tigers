import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageContent from '@/components/shared/PageContent';
import QueryState from '@/components/shared/QueryState';
import { useDivisionRoute } from '@/context/DivisionContext';
import { useDivisionPlayers, useDivisionTopScorers } from '@/hooks/useDivisionResources';
import { Search, User } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function DivisionPlayersPage() {
  const { tournamentSlug, divisionSlug, basePath } = useDivisionRoute();
  const [search, setSearch] = useState('');
  const { data: players = [], isLoading, isError, refetch } = useDivisionPlayers(
    tournamentSlug,
    divisionSlug,
  );
  const { data: topScorers = [] } = useDivisionTopScorers(tournamentSlug, divisionSlug);

  const filtered = players.filter((p) =>
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(search.toLowerCase()),
  );
  const getStats = (playerId: string) => topScorers.find((s) => s.player_id === playerId);

  return (
    <PageContent>
      <h2 className="text-xl font-black uppercase mb-6">Players</h2>
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
        emptyMessage="No players in this division."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((player) => {
            const stats = getStats(player.id);
            return (
              <Link
                key={player.id}
                to={`${basePath}/players/${player.slug}`}
                className="group rounded-[2rem] border-2 border-gray-200 bg-white hover:shadow-lg overflow-hidden"
              >
                <div className="h-24 bg-primary flex items-center justify-center">
                  {player.profile_image ? (
                    <img
                      src={player.profile_image}
                      alt=""
                      className="w-16 h-16 rounded-full border-4 border-white/30"
                    />
                  ) : (
                    <User className="w-10 h-10 text-white" />
                  )}
                </div>
                <div className="p-4 text-center">
                  <h3 className="font-bold group-hover:text-primary">
                    {player.first_name} {player.last_name}
                  </h3>
                  <p className="text-xs text-gray-600 mt-1">{player.preferred_position}</p>
                  {stats && (
                    <p className="text-xs font-bold text-primary mt-2">
                      {stats.goals}G · {stats.assists}A
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </QueryState>
    </PageContent>
  );
}
