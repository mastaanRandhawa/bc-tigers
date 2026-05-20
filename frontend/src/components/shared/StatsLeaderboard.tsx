import { Link } from 'react-router-dom';
import type { PlayerStat } from '@/types';
import { Card } from '@/components/ui/card';
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
}

export default function StatsLeaderboard({ stats, statField, statLabel }: StatsLeaderboardProps) {
  const sorted = [...stats].sort((a, b) => (b[statField] ?? 0) - (a[statField] ?? 0));

  return (
    <Card className="overflow-hidden">
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
          {sorted.map((stat, i) => (
            <TableRow key={stat.id}>
              <TableCell>
                <span
                  className={cn(
                    'w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold',
                    i === 0 ? 'bg-primary-muted text-primary' : 'text-muted-foreground'
                  )}
                >
                  {i + 1}
                </span>
              </TableCell>
              <TableCell>
                {stat.player ? (
                  <Link to={`/players/${stat.player.slug}`} className="hover:text-primary transition-colors">
                    <p className="font-semibold text-foreground">
                      {stat.player.first_name} {stat.player.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">{stat.team?.name}</p>
                  </Link>
                ) : (
                  '—'
                )}
              </TableCell>
              <TableCell className="text-center">{stat.matches_played}</TableCell>
              <TableCell className="text-center font-bold text-primary text-lg">{stat[statField]}</TableCell>
              {statField === 'goals' && (
                <TableCell className="text-center text-muted-foreground">{stat.assists}</TableCell>
              )}
              {statField !== 'goals' && statField !== 'assists' && (
                <>
                  <TableCell className="text-center text-amber-600">{stat.yellow_cards}</TableCell>
                  <TableCell className="text-center text-red-600">{stat.red_cards}</TableCell>
                </>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
