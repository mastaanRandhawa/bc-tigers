import { useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import PrefetchLink from '@/components/shared/PrefetchLink';
import PageLayout from '@/components/PageLayout';
import Footer from '@/components/Footer';
import { TournamentHubHeader } from '@/components/ui/hero';
import SectionHeader from '@/components/shared/SectionHeader';
import QueryState from '@/components/shared/QueryState';
import { Badge } from '@/components/ui/badge';
import { useHomeHub } from '@/hooks/useHomeHub';
import { formatDate } from '@/lib/date';
import { pickFeaturedTournament, tournamentOverviewPath } from '@/lib/featured-tournament';
import { getCoachTeamPath } from '@/lib/coach-utils';
import { useCoachTeams } from '@/hooks/useCoachTeams';
import { Trophy, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export default function HomePage() {
  const { data, isLoading, isError, refetch } = useHomeHub();
  const { isAuthenticated, user } = useAuthStore();
  const coachTeams = useCoachTeams();

  const tournaments = data?.tournaments ?? [];
  const featuredTournament = useMemo(
    () => pickFeaturedTournament(tournaments),
    [tournaments],
  );

  return (
    <PageLayout heroTheme showFooter={false}>
      <TournamentHubHeader tournament={featuredTournament} />

      <section className="w-full bg-zinc-50">
        <div className="page-container py-8 md:py-10">
          {!isAuthenticated && (
            <div className="mb-8 flex flex-col items-center gap-3 rounded-2xl border border-primary/20 bg-white px-6 py-5 text-center shadow-sm">
              <p className="text-sm text-zinc-600 m-0 max-w-md">
                Sign in to manage your teams or browse upcoming tournaments.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Link
                  to="/register"
                  className="inline-flex h-10 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover"
                >
                  Create account
                </Link>
                <Link
                  to="/login"
                  className="inline-flex h-10 items-center rounded-lg border border-border px-5 text-sm font-semibold text-foreground hover:bg-zinc-50"
                >
                  Sign in
                </Link>
              </div>
            </div>
          )}

          {isAuthenticated && user?.role === 'COACH' && coachTeams.length > 0 && (
            <div className="mb-8 rounded-2xl border border-border bg-white px-5 py-4 shadow-sm">
              <p className="text-sm font-medium text-foreground m-0 mb-3">Your teams</p>
              <div className="flex flex-wrap gap-2">
                {coachTeams.map((team) => {
                  const path = getCoachTeamPath(team);
                  if (!path) return null;
                  return (
                    <Link
                      key={team.id}
                      to={path}
                      className="inline-flex h-9 items-center rounded-lg border border-border px-4 text-sm font-semibold text-foreground hover:border-primary/40 hover:text-primary"
                    >
                      {team.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          <QueryState
            isLoading={isLoading}
            isError={isError}
            onRetry={() => refetch()}
            variant="skeleton-cards"
          >
            <section>
              <SectionHeader title="Tournaments" href="/tournaments" linkLabel="View all" />
              {tournaments.length === 0 ? (
                <p className="text-sm text-zinc-500 py-8 text-center">No tournaments published yet.</p>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {tournaments.map((t) => (
                    <PrefetchLink
                      key={t.id}
                      to={tournamentOverviewPath(t)}
                      tournamentSlug={t.slug}
                      className="group overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-shadow hover:shadow-md"
                    >
                      <div className="relative flex h-28 items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                        {t.logo ? (
                          <img src={t.logo} alt="" className="h-16 w-16 object-contain" />
                        ) : (
                          <div className="rounded-2xl border border-border bg-white p-3 shadow-sm">
                            <Trophy className="h-8 w-8 text-primary" aria-hidden />
                          </div>
                        )}
                        <Badge
                          variant={
                            t.status === 'ACTIVE'
                              ? 'success'
                              : t.status === 'UPCOMING'
                                ? 'scheduled'
                                : 'default'
                          }
                          className="absolute right-3 top-3 rounded-md"
                        >
                          {t.status}
                        </Badge>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-foreground transition-colors group-hover:text-primary line-clamp-2">
                          {t.name}
                        </h3>
                        <p className="mt-1 text-sm text-zinc-500">{t.location}</p>
                        <p className="mt-2 text-xs text-zinc-400">
                          {formatDate(t.start_date)} – {formatDate(t.end_date)}
                        </p>
                        {t._count?.divisions != null && (
                          <p className="mt-2 text-xs font-medium text-primary">
                            {t._count.divisions} divisions
                          </p>
                        )}
                      </div>
                    </PrefetchLink>
                  ))}
                </div>
              )}
              {tournaments.length > 0 && (
                <div className="mt-6 text-center">
                  <Link
                    to="/tournaments"
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover"
                  >
                    Browse all tournaments <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </section>
          </QueryState>
        </div>

        <Footer className="mt-4 md:mt-8" />
      </section>
    </PageLayout>
  );
}
