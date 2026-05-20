import { useState } from 'react';
import PageLayout from '@/components/PageLayout';
import PageHeader from '@/components/shared/PageHeader';
import QueryState from '@/components/shared/QueryState';
import { Link } from 'react-router-dom';
import { useTeams } from '@/hooks/useTeams';
import { Search, Shield } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function TeamsPage() {
  const [search, setSearch] = useState('');
  const { data: teams = [], isLoading, isError, refetch } = useTeams();

  const filtered = teams.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.city ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageLayout>
      <PageHeader title="Teams" subtitle="All registered teams across all divisions" icon={Shield} />

      <section className="py-8 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="relative max-w-md mb-8">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtered.map((team) => (
                <Link key={team.id} to={`/teams/${team.slug}`} className="group">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all overflow-hidden">
                    <div
                      className="h-24 flex items-center justify-center"
                      style={{ backgroundColor: team.primary_color ?? '#0038FF' }}
                    >
                      {team.logo ? (
                        <img
                          src={team.logo}
                          alt={team.name}
                          className="w-16 h-16 rounded-full object-cover border-2 border-white/30"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                          <Shield className="w-8 h-8 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="p-4 text-center">
                      <h3 className="font-black text-gray-900 group-hover:text-[#0038FF] transition-colors">
                        {team.name}
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">{team.city}</p>
                      {team.division && (
                        <span className="inline-block mt-2 text-[10px] font-bold bg-[#CCFF00] text-black px-2 py-0.5 rounded-full">
                          {team.division.name}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </QueryState>
        </div>
      </section>
    </PageLayout>
  );
}
