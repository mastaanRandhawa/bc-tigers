import AdminLayout from '@/components/AdminLayout';
import { Link } from 'react-router-dom';
import QueryState from '@/components/shared/QueryState';
import { useDivisions } from '@/hooks/useDivisions';
import { useTeams } from '@/hooks/useTeams';
import { useMatches } from '@/hooks/useMatches';
import { getDivisionPublicPath } from '@/lib/division-routes';
import { getDivisionTheme } from '@/lib/division-theme';
import { ExternalLink, Shield, Calendar } from 'lucide-react';

export default function AdminDashboard() {
  const { data: divisions = [], isLoading, isError, refetch } = useDivisions();
  const { data: teams = [] } = useTeams();
  const { data: matches = [] } = useMatches();

  const liveMatches = matches.filter((m) => m.status === 'LIVE');

  return (
    <AdminLayout title="Dashboard">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="rounded-lg border border-border bg-card shadow-sm p-5">
          <p className="text-2xl font-semibold text-foreground">{divisions.length}</p>
          <p className="text-sm text-muted-foreground font-medium">Divisions</p>
        </div>
        <div className="rounded-lg border border-border bg-card shadow-sm p-5">
          <p className="text-2xl font-semibold text-foreground">{teams.length}</p>
          <p className="text-sm text-muted-foreground font-medium">Teams</p>
        </div>
        <div className="rounded-lg border border-border bg-card shadow-sm p-5">
          <p className="text-2xl font-semibold text-foreground">{liveMatches.length}</p>
          <p className="text-sm text-muted-foreground font-medium">Live matches</p>
        </div>
      </div>

      <QueryState isLoading={isLoading} isError={isError} onRetry={() => refetch()}>
        <h2 className="text-lg font-semibold text-foreground mb-4">Divisions</h2>
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
              <div
                key={division.id}
                className="rounded-[2rem] border-2 border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-lg shrink-0"
                      style={{ backgroundColor: theme.primary }}
                    />
                    <div className="min-w-0">
                      <h3 className="font-black uppercase truncate" style={{ color: theme.primary }}>
                        {division.name}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {division.tournament?.name}
                      </p>
                      <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Shield className="w-3 h-3" /> {teamCount}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {matchCount}
                        </span>
                      </div>
                    </div>
                  </div>
                  {publicPath && (
                    <a
                      href={publicPath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 border border-border hover:bg-muted"
                      style={{ color: theme.primary }}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View
                    </a>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-gray-100">
                  <Link
                    to="/admin/teams"
                    className="text-xs font-semibold text-muted-foreground hover:text-foreground"
                  >
                    Manage teams
                  </Link>
                  <Link
                    to="/admin/matches"
                    className="text-xs font-semibold text-muted-foreground hover:text-foreground"
                  >
                    Manage matches
                  </Link>
                  <Link
                    to="/admin/divisions"
                    className="text-xs font-semibold text-muted-foreground hover:text-foreground"
                  >
                    Edit division
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </QueryState>
    </AdminLayout>
  );
}
