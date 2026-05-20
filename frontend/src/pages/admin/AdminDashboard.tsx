import AdminLayout from '@/components/AdminLayout';
import { Link } from 'react-router-dom';
import QueryState from '@/components/shared/QueryState';
import { useDivisions } from '@/hooks/useDivisions';
import { useTeams } from '@/hooks/useTeams';
import { useMatches } from '@/hooks/useMatches';
import { getDivisionPublicPath } from '@/lib/division-routes';
import { getDivisionTheme } from '@/lib/division-theme';
import { ExternalLink, Shield, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminDashboard() {
  const { data: divisions = [], isLoading, isError, refetch } = useDivisions();
  const { data: teams = [] } = useTeams();
  const { data: matches = [] } = useMatches();

  const liveMatches = matches.filter((m) => m.status === 'LIVE');

  return (
    <AdminLayout title="Dashboard" description="Overview of divisions, teams, and live activity">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="ds-stat-card">
          <p className="ds-stat-value">{divisions.length}</p>
          <p className="ds-stat-label">Divisions</p>
        </div>
        <div className="ds-stat-card">
          <p className="ds-stat-value">{teams.length}</p>
          <p className="ds-stat-label">Teams</p>
        </div>
        <div className="ds-stat-card">
          <p className="ds-stat-value">{liveMatches.length}</p>
          <p className="ds-stat-label">Live matches</p>
        </div>
      </div>

      <QueryState isLoading={isLoading} isError={isError} onRetry={() => refetch()}>
        <h2 className="text-subsection mb-4">Divisions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div key={division.id} className="admin-card p-4 hover:shadow-md transition-all duration-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-lg shrink-0 ring-2 ring-white shadow-sm"
                      style={{ backgroundColor: theme.primary }}
                    />
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold truncate font-display text-foreground">
                        {division.name}
                      </h3>
                      <p className="text-body-sm truncate mt-0.5">{division.tournament?.name}</p>
                      <div className="flex gap-3 mt-2 text-caption">
                        <span className="inline-flex items-center gap-1">
                          <Shield className="w-3 h-3" /> {teamCount} teams
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {matchCount} matches
                        </span>
                      </div>
                    </div>
                  </div>
                  {publicPath && (
                    <a
                      href={publicPath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="nav-pill-dark border border-border bg-white shrink-0 text-xs"
                      style={{ color: theme.primary }}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View
                    </a>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-4 pt-4 border-t border-border">
                  {[
                    { to: '/admin/teams', label: 'Manage teams' },
                    { to: '/admin/matches', label: 'Manage matches' },
                    { to: '/admin/divisions', label: 'Edit division' },
                  ].map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={cn('text-xs font-medium text-muted-foreground hover:text-primary transition-colors')}
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
