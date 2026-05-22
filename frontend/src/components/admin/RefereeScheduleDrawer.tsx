import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
} from '@/components/ui/sheet';
import { useMatches } from '@/hooks/useMatches';
import QueryState from '@/components/shared/QueryState';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatTime, getMatchStatusBadgeVariant } from '@/lib/utils';
import type { Referee } from '@/types';

interface RefereeScheduleDrawerProps {
  referee: Referee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RefereeScheduleDrawer({
  referee,
  open,
  onOpenChange,
}: RefereeScheduleDrawerProps) {
  const { data: allMatches = [], isLoading, isError, refetch } = useMatches(
    open ? {} : undefined,
  );

  const refMatches = allMatches.filter((m) =>
    m.referees?.some((mr) => mr.referee_id === referee?.id),
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>
            {referee
              ? `${referee.first_name} ${referee.last_name} — Schedule`
              : 'Referee Schedule'}
          </SheetTitle>
          <SheetDescription>All matches assigned to this referee</SheetDescription>
        </SheetHeader>

        <SheetBody>
          <QueryState
            isLoading={isLoading}
            isError={isError}
            onRetry={() => refetch()}
            isEmpty={refMatches.length === 0}
            emptyMessage="No matches assigned to this referee."
          >
            <ul className="divide-y divide-border">
              {refMatches.map((m) => (
                <li key={m.id} className="py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {m.home_team?.name ?? 'TBD'} vs {m.away_team?.name ?? 'TBD'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(m.scheduled_start)} · {formatTime(m.scheduled_start)}
                      </p>
                      {m.venue && (
                        <p className="text-xs text-muted-foreground">{m.venue.name}</p>
                      )}
                      {m.division && (
                        <p className="text-xs text-muted-foreground">{m.division.name}</p>
                      )}
                    </div>
                    <Badge variant={getMatchStatusBadgeVariant(m.status)} className="shrink-0">
                      {m.status}
                    </Badge>
                  </div>
                  {m.status !== 'SCHEDULED' && (
                    <p className="mt-1 text-xs font-semibold text-foreground">
                      {m.home_score} – {m.away_score}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </QueryState>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
