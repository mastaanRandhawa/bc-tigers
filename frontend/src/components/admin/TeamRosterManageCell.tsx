import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';
import type { Team } from '@/types';

interface TeamRosterManageCellProps {
  team: Team;
  onManage: (team: Team) => void;
}

export function teamPlayerCount(team: Team): number {
  return team.roster_count ?? team.players?.length ?? 0;
}

export default function TeamRosterManageCell({ team, onManage }: TeamRosterManageCellProps) {
  const count = teamPlayerCount(team);

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
