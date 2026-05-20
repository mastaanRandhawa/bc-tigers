import { Link } from 'react-router-dom';
import type { Standing } from '@/types';
import { getFormColor } from '@/lib/utils';
import { cn } from '@/lib/utils';
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
}

export default function StandingsTable({ standings, compact = false }: StandingsTableProps) {
  return (
    <Card className="overflow-hidden -mx-4 sm:mx-0">
      <div className="overflow-x-auto px-4 sm:px-0">
        <Table className="min-w-[640px]">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-8">#</TableHead>
              <TableHead>Team</TableHead>
              <TableHead className="text-center">P</TableHead>
              <TableHead className="text-center">W</TableHead>
              <TableHead className="text-center">D</TableHead>
              <TableHead className="text-center">L</TableHead>
              {!compact && (
                <>
                  <TableHead className="text-center">GF</TableHead>
                  <TableHead className="text-center">GA</TableHead>
                </>
              )}
              <TableHead className="text-center">GD</TableHead>
              <TableHead className="text-center">Pts</TableHead>
              {!compact && <TableHead className="text-center">Form</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {standings.map((s, idx) => (
              <TableRow
                key={s.id}
                className={cn(
                  idx === 0 && 'bg-primary-muted/60',
                  idx > 0 && idx < 3 && 'bg-primary-muted/30'
                )}
              >
                <TableCell className="text-muted-foreground font-medium">{s.rank}</TableCell>
                <TableCell>
                  {s.team ? (
                    <Link
                      to={`/teams/${s.team.slug}`}
                      className="flex items-center gap-2 hover:text-primary transition-colors min-w-0"
                    >
                      {s.team.logo && (
                        <img src={s.team.logo} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                      )}
                      <span className="font-semibold text-foreground truncate">{s.team.name}</span>
                      {idx === 0 && <Badge variant="default" className="shrink-0">Leader</Badge>}
                    </Link>
                  ) : (
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
                <TableCell className="text-center font-bold text-primary text-base">{s.points}</TableCell>
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
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
