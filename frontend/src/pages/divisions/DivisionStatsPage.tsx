import { Link } from 'react-router-dom';
import PageContent from '@/components/shared/PageContent';
import StatsLeaderboard from '@/components/shared/StatsLeaderboard';
import { useDivisionRoute } from '@/context/DivisionContext';
import { useDivisionTopScorers } from '@/hooks/useDivisionResources';
import { TrendingUp, Award, AlertTriangle, ChevronRight } from 'lucide-react';

export default function DivisionStatsPage() {
  const { basePath, tournamentSlug, divisionSlug } = useDivisionRoute();
  const { data: topScorers = [] } = useDivisionTopScorers(tournamentSlug, divisionSlug, 5);

  const cats = [
    { label: 'Top Scorers', href: `${basePath}/stats/top-scorers`, icon: TrendingUp },
    { label: 'Top Assists', href: `${basePath}/stats/top-assists`, icon: Award },
    { label: 'Discipline', href: `${basePath}/stats/discipline`, icon: AlertTriangle },
  ];

  return (
    <PageContent>
      <h2 className="text-xl font-black uppercase mb-6">Statistics</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {cats.map((cat) => (
          <Link
            key={cat.href}
            to={cat.href}
            className="feature-card min-h-[100px] items-start text-left hover:shadow-lg"
          >
            <cat.icon className="w-5 h-5 text-primary mb-2" />
            <span className="font-black uppercase">{cat.label}</span>
            <ChevronRight className="w-4 h-4 text-primary ml-auto" />
          </Link>
        ))}
      </div>
      <h3 className="font-black uppercase mb-4">Top Scorers Preview</h3>
      <StatsLeaderboard stats={topScorers} statField="goals" statLabel="Goals" />
    </PageContent>
  );
}
