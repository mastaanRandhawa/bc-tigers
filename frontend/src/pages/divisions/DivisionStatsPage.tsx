import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import QueryState from '@/components/shared/QueryState';
import StatsLeaderboard from '@/components/shared/StatsLeaderboard';
import DivisionPageHeader from '@/components/divisions/DivisionPageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDivisionRoute } from '@/context/DivisionContext';
import {
  useDivisionTopScorers,
  useDivisionTopAssists,
  useDivisionDiscipline,
} from '@/hooks/useDivisionResources';
import { useDivisionPlayerHref } from '@/hooks/useDivisionPlayerHref';

const TABS = ['scorers', 'assists', 'discipline'] as const;
type StatsTab = (typeof TABS)[number];

function isStatsTab(value: string | null): value is StatsTab {
  return TABS.includes(value as StatsTab);
}

export default function DivisionStatsPage() {
  const { tournamentSlug, divisionSlug } = useDivisionRoute();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [tab, setTab] = useState<StatsTab>(isStatsTab(tabParam) ? tabParam : 'scorers');
  const getPlayerHref = useDivisionPlayerHref();

  const scorers = useDivisionTopScorers(tournamentSlug, divisionSlug);
  const assists = useDivisionTopAssists(tournamentSlug, divisionSlug);
  const discipline = useDivisionDiscipline(tournamentSlug, divisionSlug);

  useEffect(() => {
    if (isStatsTab(tabParam) && tabParam !== tab) {
      setTab(tabParam);
    }
  }, [tabParam, tab]);

  const onTabChange = (value: string) => {
    const next = isStatsTab(value) ? value : 'scorers';
    setTab(next);
    const params = new URLSearchParams(searchParams);
    if (next === 'scorers') {
      params.delete('tab');
    } else {
      params.set('tab', next);
    }
    setSearchParams(params, { replace: true });
  };

  return (
    <>
      <DivisionPageHeader title="Statistics" subtitle="Player leaders and discipline" />
      <Tabs value={tab} onValueChange={onTabChange} className="w-full">
        <TabsList className="mb-4 w-full justify-start sm:w-auto">
          <TabsTrigger value="scorers">Top Scorers</TabsTrigger>
          <TabsTrigger value="assists">Top Assists</TabsTrigger>
          <TabsTrigger value="discipline">Discipline</TabsTrigger>
        </TabsList>

        <TabsContent value="scorers">
          <QueryState
            isLoading={scorers.isLoading}
            isError={scorers.isError}
            onRetry={() => scorers.refetch()}
          >
            <StatsLeaderboard
              stats={scorers.data ?? []}
              statField="goals"
              statLabel="Goals"
              getPlayerHref={getPlayerHref}
            />
          </QueryState>
        </TabsContent>

        <TabsContent value="assists">
          <QueryState
            isLoading={assists.isLoading}
            isError={assists.isError}
            onRetry={() => assists.refetch()}
          >
            <StatsLeaderboard
              stats={assists.data ?? []}
              statField="assists"
              statLabel="Assists"
              getPlayerHref={getPlayerHref}
            />
          </QueryState>
        </TabsContent>

        <TabsContent value="discipline">
          <QueryState
            isLoading={discipline.isLoading}
            isError={discipline.isError}
            onRetry={() => discipline.refetch()}
          >
            <StatsLeaderboard
              stats={discipline.data ?? []}
              statField="yellow_cards"
              statLabel="YC"
              getPlayerHref={getPlayerHref}
            />
          </QueryState>
        </TabsContent>
      </Tabs>
    </>
  );
}
