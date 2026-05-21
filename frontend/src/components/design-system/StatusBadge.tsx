import { Badge } from '@/components/ui/badge';
import type { TournamentStatus } from '@/types';

const statusVariant: Record<
  TournamentStatus,
  'success' | 'scheduled' | 'default' | 'cancelled'
> = {
  ACTIVE: 'success',
  UPCOMING: 'scheduled',
  COMPLETED: 'default',
  CANCELLED: 'cancelled',
};

const statusLabel: Record<TournamentStatus, string> = {
  ACTIVE: 'Live',
  UPCOMING: 'Upcoming',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

interface StatusBadgeProps {
  status: TournamentStatus;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge variant={statusVariant[status]} className={className}>
      {statusLabel[status]}
    </Badge>
  );
}
