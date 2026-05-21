import AdminLayout from '@/components/AdminLayout';
import AdminStatGrid from '@/components/admin/AdminStatGrid';
import { Link } from 'react-router-dom';
import QueryState from '@/components/shared/QueryState';
import { useDivisions } from '@/hooks/useDivisions';
import { useTeams } from '@/hooks/useTeams';
import { useMatches } from '@/hooks/useMatches';
import { getDivisionPublicPath } from '@/lib/division-routes';
import { managementRoutes } from '@/lib/management-routes';
import { getDivisionTheme } from '@/lib/division-theme';
import { ExternalLink, Shield, Calendar, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminDashboard() {
  const { data: divisions = [], isLoading, isError, refetch } = useDivisions();
  const { data: teams = [] } = useTeams();
  const { data: matches = [] } = useMatches();

  const liveMatches = matches.filter((m) => m.status === 'LIVE');

  return (
    <AdminLayout title="Dashboard" description="Overview of divisions, teams, and live activity">
      <AdminStatGrid
        className="mb-6"
        items={[
          { value: divisions.length, label: 'Divisions' },
          { value: teams.length, label: 'Teams' },
          { value: liveMatches.length, label: 'Live matches', icon: Zap, accent: liveMatches.length > 0 },
        ]}
      />

      <QueryState isLoading={isLoading} isError={isError} onRetry={() => refetch()}>
        <h2 className="text-subsection mb-4">Divisions</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {divisions.map((division) => {
            const theme = getDivisionTheme(division);
            const tournamentSlug = division.tournament?.slug;
            const publicPath =
              tournamentSlug && division.slug
                ? getDivisionPublicPath(tournamentSlug, division.slug)
                : null;
            const teamCount = teams.filter((t) => t.division_id === division.id).length;
            const matchCount = matches.filter((m) => m.division_id === division.id).length;

            return (
              <div key={division.id} className="admin-card p-4 transition-all duration-200 hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div
                      className="h-10 w-10 shrink-0 rounded-lg ring-1 ring-border"
                      style={{ backgroundColor: theme.primary }}
                    />
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-semibold font-display text-foreground">
                        {division.name}
                      </h3>
                      <p className="mt-0.5 truncate text-body-sm">{division.tournament?.name}</p>
                      <div className="mt-2 flex gap-3 text-caption">
                        <span className="inline-flex items-center gap-1">
                          <Shield className="h-3 w-3" aria-hidden /> {teamCount} teams
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" aria-hidden /> {matchCount} matches
                        </span>
                      </div>
                    </div>
                  </div>
                  {publicPath && (
                    <a
                      href={publicPath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="nav-pill-dark shrink-0 border border-border bg-white text-xs"
                      style={{ color: theme.primary }}
                    >
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                      View
                    </a>
                  )}
                </div>
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-border pt-4">
                  {[
                    { to: managementRoutes.teams, label: 'Manage teams' },
                    { to: managementRoutes.matches, label: 'Manage matches' },
                    { to: managementRoutes.divisions, label: 'Edit division' },
                  ].map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={cn(
                        'text-xs font-medium text-zinc-500 transition-colors hover:text-primary',
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </QueryState>
    </AdminLayout>
  );
}
