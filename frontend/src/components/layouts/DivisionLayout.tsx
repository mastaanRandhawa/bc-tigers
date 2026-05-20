import { Link, Outlet, useParams } from 'react-router-dom';
import {
  Flag,
  Users,
  UserCircle,
  Calendar,
  Swords,
  Trophy,
  TrendingUp,
  GitBranch,
  MapPin,
  LayoutDashboard,
} from 'lucide-react';
import AppShell from '@/components/layouts/AppShell';
import SubNav from '@/components/layouts/SubNav';
import QueryState from '@/components/shared/QueryState';
import PageLoader from '@/components/shared/PageLoader';
import { DivisionProvider } from '@/context/DivisionContext';
import { useDivision } from '@/hooks/useDivisions';
import { divisionBasePath } from '@/lib/division-routes';
import { Badge } from '@/components/ui/badge';

export default function DivisionLayout() {
  const { tournamentSlug = '', divisionSlug = '' } = useParams();
  const { data: division, isLoading, isError, refetch } = useDivision(
    tournamentSlug,
    divisionSlug,
  );

  if (isLoading) {
    return (
      <AppShell>
        <PageLoader />
      </AppShell>
    );
  }

  const basePath = divisionBasePath(tournamentSlug, divisionSlug);
  const tournament = division?.tournament;

  const subNavItems = [
    { label: 'Overview', href: basePath, icon: LayoutDashboard, end: true },
    { label: 'Teams', href: `${basePath}/teams`, icon: Users },
    { label: 'Players', href: `${basePath}/players`, icon: UserCircle },
    { label: 'Schedule', href: `${basePath}/schedule`, icon: Calendar },
    { label: 'Matches', href: `${basePath}/matches`, icon: Swords },
    { label: 'Standings', href: `${basePath}/standings`, icon: Trophy },
    { label: 'Stats', href: `${basePath}/stats`, icon: TrendingUp },
    { label: 'Brackets', href: `${basePath}/brackets`, icon: GitBranch },
    { label: 'Venues', href: `${basePath}/venues`, icon: MapPin },
  ];

  return (
    <QueryState
      isError={isError}
      isEmpty={!division}
      onRetry={() => refetch()}
      emptyMessage="Division not found."
    >
      {division && (
        <DivisionProvider
          value={{ division, tournamentSlug, divisionSlug, basePath }}
        >
          <AppShell
            subNav={
              <>
                <div className="bg-primary text-white border-b border-white/10">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 safe-x">
                    <div className="flex items-center gap-2 text-white/70 text-sm mb-3 flex-wrap">
                      <Link to="/tournaments" className="hover:text-white">
                        Tournaments
                      </Link>
                      <span>/</span>
                      {tournament && (
                        <>
                          <Link
                            to={`/tournaments/${tournament.slug}`}
                            className="hover:text-white"
                          >
                            {tournament.name}
                          </Link>
                          <span>/</span>
                        </>
                      )}
                      <span className="text-white">{division.name}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="bg-white p-2.5 rounded-xl shrink-0">
                        <Flag className="w-8 h-8 text-primary" />
                      </div>
                      <div>
                        <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                          {division.name}
                        </h1>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {division.age_group && (
                            <Badge variant="accent">{division.age_group}</Badge>
                          )}
                          <Badge variant="accent">{division.gender}</Badge>
                          <Badge variant="accent">{division.format}</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <SubNav items={subNavItems} label="Division" />
              </>
            }
          >
            <Outlet />
          </AppShell>
        </DivisionProvider>
      )}
    </QueryState>
  );
}
