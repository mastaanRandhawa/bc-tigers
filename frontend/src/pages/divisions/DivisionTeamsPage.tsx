import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageContent from '@/components/shared/PageContent';
import QueryState from '@/components/shared/QueryState';
import { useDivisionRoute } from '@/context/DivisionContext';
import { useDivisionTeams } from '@/hooks/useDivisionResources';
import { divisionTeamPath } from '@/lib/division-routes';
import { Search, Shield } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function DivisionTeamsPage() {
  const { tournamentSlug, divisionSlug } = useDivisionRoute();
  const [search, setSearch] = useState('');
  const { data: teams = [], isLoading, isError, refetch } = useDivisionTeams(
    tournamentSlug,
    divisionSlug,
  );

  const filtered = teams.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.city ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <PageContent>
      <h2 className="text-xl font-black uppercase mb-6">Teams</h2>
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search teams..."
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
        emptyMessage="No teams in this division."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((team) => (
            <Link
              key={team.id}
              to={divisionTeamPath(tournamentSlug, divisionSlug, team.slug)}
              className="group rounded-[2rem] border-2 border-gray-200 bg-white hover:shadow-lg transition-all overflow-hidden"
            >
              <div
                className="h-24 flex items-center justify-center"
                style={{ backgroundColor: team.primary_color ?? '#F48735' }}
              >
                {team.logo ? (
                  <img
                    src={team.logo}
                    alt={team.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-white/30"
                  />
                ) : (
                  <Shield className="w-10 h-10 text-white" />
                )}
              </div>
              <div className="p-4 text-center">
                <h3 className="font-bold text-foreground group-hover:text-primary">{team.name}</h3>
                <p className="text-xs text-gray-600 mt-1">{team.city}</p>
              </div>
            </Link>
          ))}
        </div>
      </QueryState>
    </PageContent>
  );
}
