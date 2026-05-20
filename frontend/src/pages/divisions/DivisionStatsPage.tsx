import { Link } from 'react-router-dom';
import StatsLeaderboard from '@/components/shared/StatsLeaderboard';
import Section from '@/components/shared/Section';
import SectionHeader from '@/components/shared/SectionHeader';
import DivisionPageHeader from '@/components/divisions/DivisionPageHeader';
import { useDivisionRoute } from '@/context/DivisionContext';
import { useDivisionTopScorers } from '@/hooks/useDivisionResources';
import { useDivisionPlayerHref } from '@/hooks/useDivisionPlayerHref';
import { TrendingUp, Award, AlertTriangle, ChevronRight } from 'lucide-react';

export default function DivisionStatsPage() {
  const { basePath, tournamentSlug, divisionSlug } = useDivisionRoute();
  const { data: topScorers = [] } = useDivisionTopScorers(tournamentSlug, divisionSlug, 5);
  const getPlayerHref = useDivisionPlayerHref();

  const cats = [
    { label: 'Top Scorers', href: `${basePath}/stats/top-scorers`, icon: TrendingUp },
    { label: 'Top Assists', href: `${basePath}/stats/top-assists`, icon: Award },
    { label: 'Discipline', href: `${basePath}/stats/discipline`, icon: AlertTriangle },
  ];

  return (
    <>
      <DivisionPageHeader title="Statistics" subtitle="Player leaders and discipline" />
      <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
        {cats.map((cat) => (
          <Link
            key={cat.href}
            to={cat.href}
            className="feature-card flex-row items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2">
              <cat.icon className="h-5 w-5 shrink-0" style={{ color: 'var(--division-primary)' }} />
              <span className="font-semibold text-foreground">{cat.label}</span>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-zinc-300" style={{ color: 'var(--division-primary)' }} />
          </Link>
        ))}
      </div>
      <Section>
        <SectionHeader title="Top scorers preview" />
        <StatsLeaderboard
          stats={topScorers}
          statField="goals"
          statLabel="Goals"
          getPlayerHref={getPlayerHref}
        />
      </Section>
    </>
  );
}
