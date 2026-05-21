import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import type { Division, Standing } from '@/types';
import SearchField from '@/components/shared/SearchField';
import SearchEmpty from '@/components/shared/SearchEmpty';
import { useListSearch } from '@/hooks/useListSearch';
import { standingSearchText } from '@/lib/search-text';
import { getFormColor, cn } from '@/lib/utils';
import { getDivisionTeamPath } from '@/lib/division-routes';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface StandingsTableProps {
  standings: Standing[];
  compact?: boolean;
  division?: Division;
  searchable?: boolean;
  highlightTeamId?: string;
}

export default function StandingsTable({
  standings,
  compact = false,
  division,
  searchable = true,
  highlightTeamId,
}: StandingsTableProps) {
  const getText = useCallback((s: Standing) => standingSearchText(s), []);
  const { search, setSearch, filtered, debouncedSearch, hasQuery } = useListSearch(
    standings,
    getText,
  );
  const rows = searchable ? filtered : standings;

  return (
    <div className="space-y-3">
      {searchable && standings.length > 0 && (
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Search teams…"
          className="max-w-md"
        />
      )}
      {hasQuery && rows.length === 0 ? (
        <SearchEmpty query={debouncedSearch} entityLabel="teams" />
      ) : (
    <Card className="overflow-hidden mx-0">
      <div className="overflow-x-auto scroll-fade-x">
        <Table className="min-w-[640px]">
          <TableHeader className="sticky top-0 z-10 border-b-2 border-foreground bg-bauhaus-muted">
            <TableRow className="hover:bg-transparent border-b-2 border-foreground">
              <TableHead className="w-8 text-[10px] font-black uppercase tracking-widest">#</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest">Team</TableHead>
              <TableHead className="text-center text-[10px] font-black uppercase tracking-widest">P</TableHead>
              <TableHead className="text-center text-[10px] font-black uppercase tracking-widest">W</TableHead>
              <TableHead className="text-center text-[10px] font-black uppercase tracking-widest">D</TableHead>
              <TableHead className="text-center text-[10px] font-black uppercase tracking-widest">L</TableHead>
              {!compact && (
                <>
                  <TableHead className="text-center text-[10px] font-black uppercase tracking-widest">GF</TableHead>
                  <TableHead className="text-center text-[10px] font-black uppercase tracking-widest">GA</TableHead>
                </>
              )}
              <TableHead className="text-center text-[10px] font-black uppercase tracking-widest">GD</TableHead>
              <TableHead className="text-center text-[10px] font-black uppercase tracking-widest">Pts</TableHead>
              {!compact && <TableHead className="text-center text-[10px] font-black uppercase tracking-widest">Form</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((s, idx) => (
              <TableRow
                key={s.id}
                className={cn(
                  'transition-colors border-b border-foreground/10',
                  idx % 2 === 1 && 'bg-bauhaus-muted/40',
                  s.team_id === highlightTeamId && 'bg-primary-muted ring-2 ring-inset ring-primary',
                  s.team_id !== highlightTeamId && idx === 0 && 'bg-bauhaus-yellow/15',
                  s.team_id !== highlightTeamId && idx === 1 && 'bg-bauhaus-muted/60',
                  s.team_id !== highlightTeamId && idx === 2 && 'bg-bauhaus-muted/30',
                )}
              >
                <TableCell className="text-muted-foreground font-medium">{s.rank}</TableCell>
                <TableCell>
                  {s.team ? (() => {
                    const div = s.team.division ?? division;
                    const teamPath = div ? getDivisionTeamPath(div, s.team.slug) : null;
                    const content = (
                      <>
                        {s.team.logo && (
                          <img src={s.team.logo} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                        )}
                        <span className="font-black uppercase tracking-tight text-foreground truncate text-sm">{s.team.name}</span>
                        {idx === 0 && <Badge variant="accent" className="shrink-0">1st</Badge>}
                      </>
                    );
                    return teamPath ? (
                      <Link
                        to={teamPath}
                        className="flex items-center gap-2 hover:text-primary transition-colors min-w-0"
                      >
                        {content}
                      </Link>
                    ) : (
                      <div className="flex items-center gap-2 min-w-0">{content}</div>
                    );
                  })() : (
                    <span className="text-muted-foreground">Unknown</span>
                  )}
                </TableCell>
                <TableCell className="text-center">{s.played}</TableCell>
                <TableCell className="text-center text-green-700 font-semibold">{s.wins}</TableCell>
                <TableCell className="text-center text-amber-600 font-semibold">{s.draws}</TableCell>
                <TableCell className="text-center text-red-600 font-semibold">{s.losses}</TableCell>
                {!compact && (
                  <>
                    <TableCell className="text-center">{s.goals_for}</TableCell>
                    <TableCell className="text-center">{s.goals_against}</TableCell>
                  </>
                )}
                <TableCell
                  className={cn(
                    'text-center font-semibold',
                    s.goal_difference > 0 ? 'text-green-600' : s.goal_difference < 0 ? 'text-red-600' : 'text-muted-foreground'
                  )}
                >
                  {s.goal_difference > 0 ? '+' : ''}
                  {s.goal_difference}
                </TableCell>
                <TableCell className="text-center text-base font-bold text-foreground tabular-nums">{s.points}</TableCell>
                {!compact && (
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      {s.form?.map((f, i) => (
                        <span
                          key={i}
                          className={cn(
                            'w-5 h-5 border-2 border-foreground text-[9px] font-black text-white flex items-center justify-center',
                            getFormColor(f)
                          )}
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
      )}
    </div>
  );
}
