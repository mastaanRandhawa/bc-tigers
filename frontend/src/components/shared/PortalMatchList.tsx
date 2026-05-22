import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import Section from '@/components/shared/Section';
import SectionHeader from '@/components/shared/SectionHeader';
import SearchField from '@/components/shared/SearchField';
import SearchEmpty from '@/components/shared/SearchEmpty';
import QueryState from '@/components/shared/QueryState';
import { formatDate, formatTime } from '@/lib/utils';
import { getMatchPath } from '@/lib/division-routes';
import type { Match } from '@/types';

interface PortalMatchListProps {
  title: string;
  matches: Match[];
  search: string;
  onSearchChange: (v: string) => void;
  filteredMatches: Match[];
  debouncedSearch: string;
  hasQuery: boolean;
  isLoading?: boolean;
  emptyMessage?: string;
  href?: string;
  linkLabel?: string;
  searchThreshold?: number;
  /** Optional right-side content per row (e.g. badge, score) */
  rowRight?: (match: Match) => ReactNode;
  /** Optional sub-text per row (defaults to date · time) */
  rowSub?: (match: Match) => ReactNode;
}

/**
 * Shared match list panel for portal dashboards.
 * Handles search field threshold, QueryState, and consistent row layout.
 */
export default function PortalMatchList({
  title,
  matches,
  search,
  onSearchChange,
  filteredMatches,
  debouncedSearch,
  hasQuery,
  isLoading,
  emptyMessage = 'No matches found',
  href,
  linkLabel = 'All Matches',
  searchThreshold = 3,
  rowRight,
  rowSub,
}: PortalMatchListProps) {
  return (
    <Section className="p-0 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
        <SectionHeader
          title={title}
          href={href}
          linkLabel={linkLabel}
          className="mb-0"
        />
      </div>

      {matches.length > searchThreshold && (
        <div className="border-b border-border px-4 py-2">
          <SearchField
            value={search}
            onChange={onSearchChange}
            placeholder="Search matches…"
            className="max-w-full"
          />
        </div>
      )}

      <QueryState
        isLoading={isLoading}
        isEmpty={matches.length === 0}
        emptyMessage={emptyMessage}
      >
        {hasQuery && filteredMatches.length === 0 ? (
          <SearchEmpty query={debouncedSearch} entityLabel="matches" />
        ) : (
          <div className="divide-y divide-border">
            {filteredMatches.map((m) => (
              <Link
                key={m.id}
                to={getMatchPath(m)}
                className="flex items-start gap-3 px-4 py-3 hover:bg-muted transition-colors"
              >
                <div className="flex-1 min-w-0 text-sm">
                  <p className="font-semibold text-foreground truncate">
                    {m.home_team?.name ?? 'TBD'} vs {m.away_team?.name ?? 'TBD'}
                  </p>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    {rowSub ? rowSub(m) : `${formatDate(m.scheduled_start)} · ${formatTime(m.scheduled_start)}`}
                  </p>
                </div>
                {rowRight && <div className="shrink-0">{rowRight(m)}</div>}
              </Link>
            ))}
          </div>
        )}
      </QueryState>
    </Section>
  );
}
