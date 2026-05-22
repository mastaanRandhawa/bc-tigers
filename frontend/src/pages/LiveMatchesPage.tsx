import PageLayout from '@/components/PageLayout';
import MatchCard from '@/components/MatchCard';
import QueryState from '@/components/shared/QueryState';
import { useLiveMatches } from '@/hooks/useMatches';
import { Radio } from 'lucide-react';

export default function LiveMatchesPage() {
  const { data: matches = [], isLoading, isError, refetch } = useLiveMatches();

  return (
    <PageLayout>
      <div className="page-container py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
            <Radio className="h-5 w-5 text-primary animate-pulse" aria-hidden />
          </div>
          <div>
            <h1 className="text-page-title">Live Matches</h1>
            <p className="text-body-sm mt-0.5">
              {matches.length > 0
                ? `${matches.length} match${matches.length !== 1 ? 'es' : ''} currently in progress`
                : 'No matches in progress right now'}
            </p>
          </div>
        </div>

        <QueryState isLoading={isLoading} isError={isError} onRetry={() => refetch()}>
          {matches.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-10 text-center">
              <Radio className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm font-medium text-muted-foreground">No live matches right now</p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Check back later or browse upcoming fixtures in the Tournaments section.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {matches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          )}
        </QueryState>
      </div>
    </PageLayout>
  );
}
