import PageLayout from '@/components/PageLayout';
import PageHeader from '@/components/shared/PageHeader';
import PageContent from '@/components/shared/PageContent';
import QueryState from '@/components/shared/QueryState';
import DivisionDirectoryCard from '@/components/shared/DivisionDirectoryCard';
import { Link } from 'react-router-dom';
import { useTopScorers } from '@/hooks/useStats';
import { useDivisions } from '@/hooks/useDivisions';
import { divisionStatsPath } from '@/lib/division-routes';
import { TrendingUp, Award, AlertTriangle, ChevronRight, BarChart3 } from 'lucide-react';

export default function StatsPage() {
  const { data: divisions = [] } = useDivisions();
  const { data: topScorers = [], isLoading, isError, refetch } = useTopScorers({ limit: 5 });

  return (
    <PageLayout>
      <PageHeader title="Statistics" subtitle="Browse stats by division or view global leaders" icon={BarChart3} />

      <PageContent innerClassName="max-w-7xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
            {divisions.map((division) => {
              const slug = division.tournament?.slug;
              if (!slug) return null;
              return (
                <Link
                  key={division.id}
                  to={divisionStatsPath(slug, division.slug)}
                  className="block"
                >
                  <DivisionDirectoryCard division={division} description="Division statistics" />
                </Link>
              );
            })}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {[
              { label: 'Top Scorers', href: '/stats/top-scorers', icon: TrendingUp, color: 'bg-primary' },
              { label: 'Top Assists', href: '/stats/top-assists', icon: Award, color: 'bg-green-600' },
              { label: 'Discipline', href: '/stats/discipline', icon: AlertTriangle, color: 'bg-red-600' },
            ].map((cat) => (
              <Link key={cat.label} to={cat.href} className="group">
                <div
                  className={`${cat.color} rounded-2xl p-8 text-white flex flex-col items-center text-center hover:scale-105 transition-transform shadow-md`}
                >
                  <cat.icon className="w-12 h-12 mb-3" />
                  <h3 className="text-xl font-black uppercase">{cat.label}</h3>
                  <ChevronRight className="w-5 h-5 mt-2 opacity-60" />
                </div>
              </Link>
            ))}
          </div>

          <div className="rounded-lg border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-semibold text-foreground uppercase">Top Scorers Preview</h2>
              <Link to="/stats/top-scorers" className="text-sm text-primary font-semibold hover:underline">
                View All →
              </Link>
            </div>
            <QueryState
              isLoading={isLoading}
              isError={isError}
              isEmpty={topScorers.length === 0}
              onRetry={() => refetch()}
              emptyMessage="No stats available yet."
            >
              <div className="divide-y divide-gray-50">
                {topScorers.map((stat, i) => (
                  <div key={stat.id} className="flex items-center gap-4 px-5 py-3">
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-black ${
                        i === 0 ? 'bg-primary-muted text-black' : 'bg-gray-100 text-muted-foreground'
                      }`}
                    >
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground text-sm">
                        {stat.player?.first_name} {stat.player?.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">{stat.team?.name}</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-black text-primary">
                        {stat.goals} <span className="text-muted-foreground font-normal text-xs">goals</span>
                      </span>
                      <span className="text-muted-foreground">{stat.assists} assists</span>
                    </div>
                  </div>
                ))}
              </div>
            </QueryState>
          </div>
        </PageContent>
    </PageLayout>
  );
}
