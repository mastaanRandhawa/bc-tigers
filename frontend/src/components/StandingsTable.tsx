import { useCallback } from 'react';
import { useValueFlash } from '@/hooks/useValueFlash';
import { Link } from 'react-router-dom';
import type { Division, Standing } from '@/types';
import SearchField from '@/components/shared/SearchField';
import SearchEmpty from '@/components/shared/SearchEmpty';
import { useListSearch } from '@/hooks/useListSearch';
import { standingSearchText } from '@/lib/search-text';
import { getFormColor, cn } from '@/lib/utils';
import { getDivisionTeamPath } from '@/lib/division-routes';
import {
  getQualificationZone,
  qualificationRowClass,
  type QualificationRules,
} from '@/lib/standings-qualification';
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
  qualificationRules?: QualificationRules | null;
  /** Full pool size for zone math when displaying a partial table (e.g. overview preview). */
  qualificationPoolSize?: number;
}

export default function StandingsTable({
  standings,
  compact = false,
  division,
  searchable = true,
  qualificationRules = null,
  qualificationPoolSize,
}: StandingsTableProps) {
  const poolSize = qualificationPoolSize ?? standings.length;
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
      <div className="overflow-x-auto">
        <Table className="min-w-[640px]">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-8">#</TableHead>
              <TableHead>Team</TableHead>
              <TableHead className="text-center">P</TableHead>
              <TableHead className="text-center">W</TableHead>
              <TableHead className="text-center">D</TableHead>
              <TableHead className="text-center">L</TableHead>
              <TableHead className="text-center">GF</TableHead>
              <TableHead className="text-center">GA</TableHead>
              <TableHead className="text-center">GD</TableHead>
              <TableHead className="text-center">Pts</TableHead>
              {!compact && <TableHead className="text-center">Form</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((s, idx) => (
              <StandingRow
                key={s.id}
                standing={s}
                idx={idx}
                compact={compact}
                division={division}
                qualificationRules={qualificationRules}
                tableSize={poolSize}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
      )}
    </div>
  );
}

function StandingRow({
  standing: s,
  idx,
  compact,
  division,
  qualificationRules,
  tableSize,
}: {
  standing: Standing;
  idx: number;
  compact: boolean;
  division?: Division;
  qualificationRules?: QualificationRules | null;
  tableSize: number;
}) {
  const pointsFlash = useValueFlash(s.points);
  const qualificationZone = qualificationRules
    ? getQualificationZone(s.rank, tableSize, qualificationRules)
    : null;
  const useQualificationStyle = qualificationZone !== null;
  const hasQualificationRules = qualificationRules != null;

  return (
    <TableRow
      className={cn(
        pointsFlash && 'motion-safe:animate-score-flash',
        useQualificationStyle
          ? qualificationRowClass(qualificationZone)
          : hasQualificationRules
            ? undefined
            : cn(
                idx === 0 && 'bg-surface-muted',
                idx > 0 && idx < 3 && 'bg-surface-muted/50',
              ),
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
                        <span className="font-semibold text-foreground truncate">{s.team.name}</span>
                        {idx === 0 && <Badge variant="default" className="shrink-0 rounded-md">1st</Badge>}
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
                <TableCell className="text-center text-green-600 dark:text-green-400 font-semibold">{s.wins}</TableCell>
                <TableCell className="text-center text-muted-foreground font-medium">{s.draws}</TableCell>
                <TableCell className="text-center text-foreground/70 font-medium">{s.losses}</TableCell>
                <TableCell className="text-center">{s.goals_for}</TableCell>
                <TableCell className="text-center">{s.goals_against}</TableCell>
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
                            'w-5 h-5 rounded-md text-[9px] font-bold text-white flex items-center justify-center',
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
  );
}
