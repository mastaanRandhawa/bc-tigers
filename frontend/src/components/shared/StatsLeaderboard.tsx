import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import type { PlayerStat } from '@/types';
import { Card } from '@/components/ui/card';
import SearchField from '@/components/shared/SearchField';
import SearchEmpty from '@/components/shared/SearchEmpty';
import { useListSearch } from '@/hooks/useListSearch';
import { playerStatSearchText } from '@/lib/search-text';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

type StatField = 'goals' | 'assists' | 'yellow_cards' | 'red_cards';

interface StatsLeaderboardProps {
  stats: PlayerStat[];
  statField: StatField;
  statLabel: string;
  getPlayerHref?: (stat: PlayerStat) => string | null;
  searchable?: boolean;
  searchPlaceholder?: string;
}

export default function StatsLeaderboard({
  stats,
  statField,
  statLabel,
  getPlayerHref,
  searchable = true,
  searchPlaceholder = 'Search players or teams…',
}: StatsLeaderboardProps) {
  const getText = useCallback((s: PlayerStat) => playerStatSearchText(s), []);
  const { search, setSearch, filtered, debouncedSearch, hasQuery } = useListSearch(
    stats,
    getText,
  );

  const sorted = [...filtered].sort((a, b) => (b[statField] ?? 0) - (a[statField] ?? 0));

  return (
    <div className="space-y-4">
      {searchable && stats.length > 0 && (
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder={searchPlaceholder}
          className="max-w-md"
        />
      )}
      <Card className="overflow-hidden">
        {sorted.length === 0 ? (
          hasQuery ? (
            <SearchEmpty query={debouncedSearch} entityLabel="players" />
          ) : (
            <p className="py-8 text-center text-sm text-zinc-500">No stats recorded yet.</p>
          )
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>#</TableHead>
                <TableHead>Player</TableHead>
                <TableHead className="text-center">MP</TableHead>
                <TableHead className="text-center">{statLabel}</TableHead>
                {statField !== 'goals' && statField !== 'assists' && (
                  <>
                    <TableHead className="text-center">YC</TableHead>
                    <TableHead className="text-center">RC</TableHead>
                  </>
                )}
                {statField === 'goals' && <TableHead className="text-center">Assists</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((stat, i) => {
                const href = getPlayerHref?.(stat) ?? null;
                const name = stat.player
                  ? `${stat.player.first_name} ${stat.player.last_name}`
                  : '—';

                return (
                  <TableRow key={stat.id}>
                    <TableCell>
                      <span
                        className={cn(
                          'flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold',
                          i === 0 ? 'bg-primary-muted text-primary' : 'text-muted-foreground',
                        )}
                      >
                        {i + 1}
                      </span>
                    </TableCell>
                    <TableCell>
                      {stat.player && href ? (
                        <Link to={href} className="transition-colors hover:text-primary">
                          <p className="font-semibold text-foreground">{name}</p>
                          <p className="text-xs text-zinc-500">{stat.team?.name}</p>
                        </Link>
                      ) : stat.player ? (
                        <div>
                          <p className="font-semibold text-foreground">{name}</p>
                          <p className="text-xs text-zinc-500">{stat.team?.name}</p>
                        </div>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className="text-center">{stat.matches_played}</TableCell>
                    <TableCell className="text-center text-lg font-bold text-primary tabular-nums">
                      {stat[statField]}
                    </TableCell>
                    {statField === 'goals' && (
                      <TableCell className="text-center text-zinc-500">{stat.assists}</TableCell>
                    )}
                    {statField !== 'goals' && statField !== 'assists' && (
                      <>
                        <TableCell className="text-center text-amber-600">
                          {stat.yellow_cards}
                        </TableCell>
                        <TableCell className="text-center text-red-600">{stat.red_cards}</TableCell>
                      </>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
