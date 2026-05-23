import AdminLayout from '@/components/AdminLayout';
import AdminStatGrid from '@/components/admin/AdminStatGrid';
import { Link } from 'react-router-dom';
import QueryState from '@/components/shared/QueryState';
import { StaggerList, StaggerItem } from '@/components/motion';
import { useDivisions } from '@/hooks/useDivisions';
import { useTeams } from '@/hooks/useTeams';
import { useMatches } from '@/hooks/useMatches';
import { getDivisionPublicPath } from '@/lib/division-routes';
import { getDivisionTheme } from '@/lib/division-theme';
import { ExternalLink, Shield, Calendar, Zap, ArrowRight } from 'lucide-react';
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
        <StaggerList className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
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
              <StaggerItem key={division.id}>
                <div className="admin-card p-3.5 sm:p-4 transition-all duration-200 hover:shadow-md active:scale-[0.99] touch-manipulation h-full">
                  <div className="flex items-start justify-between gap-2 sm:gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div
                        className="h-10 w-10 sm:h-11 sm:w-11 shrink-0 rounded-xl ring-1 ring-border shadow-sm"
                        style={{ backgroundColor: theme.primary }}
                      />
                      <div className="min-w-0">
                        <h3 className="truncate text-sm sm:text-base font-semibold font-display text-foreground leading-snug">
                          {division.name}
                        </h3>
                        <p className="mt-0.5 truncate text-body-sm">{division.tournament?.name}</p>
                        <div className="mt-2 flex flex-wrap gap-2 sm:gap-3 text-caption">
                          <span className="inline-flex items-center gap-1 bg-secondary rounded-md px-1.5 py-0.5 font-medium">
                            <Shield className="h-3 w-3" aria-hidden /> {teamCount} teams
                          </span>
                          <span className="inline-flex items-center gap-1 bg-secondary rounded-md px-1.5 py-0.5 font-medium">
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
                        className="shrink-0 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors touch-manipulation"
                        aria-label="View on site"
                        style={{ color: theme.primary }}
                      >
                        <ExternalLink className="h-4 w-4" aria-hidden />
                      </a>
                    )}
                  </div>
                  <div className="mt-3 sm:mt-4 flex flex-wrap gap-x-1 gap-y-1.5 border-t border-border pt-3">
                    {division.tournament?.id && (
                      <Link
                        to={`/admin/tournaments/${division.tournament.id}`}
                        className={cn(
                          'inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-secondary text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary/80 touch-manipulation',
                        )}
                      >
                        Tournament
                        <ArrowRight className="h-3 w-3" aria-hidden />
                      </Link>
                    )}
                    {division.tournament?.id && (
                      <Link
                        to={`/admin/tournaments/${division.tournament.id}/divisions/${division.id}`}
                        className={cn(
                          'inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors touch-manipulation',
                        )}
                        style={{ backgroundColor: `color-mix(in srgb, ${theme.primary} 12%, transparent)`, color: theme.primary }}
                      >
                        Division Workspace
                        <ArrowRight className="h-3 w-3" aria-hidden />
                      </Link>
                    )}
                  </div>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerList>
      </QueryState>
    </AdminLayout>
  );
}
