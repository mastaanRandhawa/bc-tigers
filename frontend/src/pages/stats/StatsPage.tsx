import PageLayout from '@/components/PageLayout';
import PageHeader from '@/components/shared/PageHeader';
import QueryState from '@/components/shared/QueryState';
import { Link } from 'react-router-dom';
import { useTopScorers } from '@/hooks/useStats';
import { TrendingUp, Award, AlertTriangle, ChevronRight, BarChart3 } from 'lucide-react';

export default function StatsPage() {
  const { data: topScorers = [], isLoading, isError, refetch } = useTopScorers({ limit: 5 });

  return (
    <PageLayout>
      <PageHeader title="Statistics" subtitle="Player and team performance data" icon={BarChart3} />

      <section className="py-10 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {[
              { label: 'Top Scorers', href: '/stats/top-scorers', icon: TrendingUp, color: 'bg-[#0038FF]' },
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

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-black text-gray-900 uppercase">Top Scorers Preview</h2>
              <Link to="/stats/top-scorers" className="text-sm text-[#0038FF] font-semibold hover:underline">
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
                        i === 0 ? 'bg-[#CCFF00] text-black' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm">
                        {stat.player?.first_name} {stat.player?.last_name}
                      </p>
                      <p className="text-xs text-gray-400">{stat.team?.name}</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-black text-[#0038FF]">
                        {stat.goals} <span className="text-gray-400 font-normal text-xs">goals</span>
                      </span>
                      <span className="text-gray-400">{stat.assists} assists</span>
                    </div>
                  </div>
                ))}
              </div>
            </QueryState>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
