import { useMemo, useState } from 'react';
import PageLayout from '@/components/PageLayout';
import PageHeader from '@/components/shared/PageHeader';
import PageContent from '@/components/shared/PageContent';
import QueryState from '@/components/shared/QueryState';
import DivisionDirectoryCard from '@/components/shared/DivisionDirectoryCard';
import { Link } from 'react-router-dom';
import { useTeams } from '@/hooks/useTeams';
import { useDivisions } from '@/hooks/useDivisions';
import { getDivisionTeamPath } from '@/lib/division-routes';
import { Input } from '@/components/ui/input';
import { Search, Shield } from 'lucide-react';

export default function TeamsPage() {
  const [search, setSearch] = useState('');
  const { data: teams = [], isLoading, isError, refetch } = useTeams();
  const { data: divisions = [] } = useDivisions();

  const filtered = teams.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.city ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  const byDivision = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const team of filtered) {
      const key = team.division_id;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(team);
    }
    return map;
  }, [filtered]);

  return (
    <PageLayout>
      <PageHeader title="Teams" subtitle="Browse teams by division" icon={Shield} />

      <PageContent innerClassName="max-w-7xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          {divisions.map((division) => (
            <DivisionDirectoryCard key={division.id} division={division} />
          ))}
        </div>

        <div className="relative max-w-md mb-8">
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
          emptyMessage="No teams registered yet."
        >
          <div className="space-y-10">
            {divisions.map((division) => {
              const divisionTeams = byDivision.get(division.id) ?? [];
              if (divisionTeams.length === 0) return null;
              return (
                <section key={division.id} className="home-section">
                  <h2 className="text-lg font-black uppercase mb-4">{division.name}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {divisionTeams.map((team) => {
                      const teamHref = getDivisionTeamPath(division, team.slug);
                      return (
                        <Link
                          key={team.id}
                          to={teamHref ?? `/teams/${team.slug}`}
                          className="group rounded-2xl border border-gray-200 bg-white p-4 hover:shadow-md"
                        >
                          <h3 className="font-bold group-hover:text-primary">{team.name}</h3>
                          <p className="text-xs text-gray-600">{team.city}</p>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </QueryState>
      </PageContent>
    </PageLayout>
  );
}
