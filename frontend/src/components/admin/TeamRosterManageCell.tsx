import { Button } from '@/components/ui/button';
import { useTeamPlayers } from '@/hooks/useTeamPlayers';
import { Users } from 'lucide-react';
import type { Team } from '@/types';

interface TeamRosterManageCellProps {
  team: Team;
  onManage: (team: Team) => void;
  /** When true, show the live roster size from the players query (sheet open). */
  rosterOpen?: boolean;
}

export function teamPlayerCount(team: Team): number {
  if (typeof team.roster_count === 'number') return team.roster_count;
  return 0;
}

export default function TeamRosterManageCell({
  team,
  onManage,
  rosterOpen = false,
}: TeamRosterManageCellProps) {
  const { data: players } = useTeamPlayers(rosterOpen ? team.id : undefined);
  const count =
    rosterOpen && players ? players.length : teamPlayerCount(team);

  return (
    <div className="flex flex-col items-start gap-1">
      <span className="text-xs tabular-nums text-muted-foreground">
        {count} {count === 1 ? 'player' : 'players'}
      </span>
      <Button variant="outline" size="sm" onClick={() => onManage(team)}>
        <Users className="h-3.5 w-3.5 mr-1" aria-hidden />
        Manage
      </Button>
    </div>
  );
}
