import { Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { TournamentStatus } from '@/types';

const TOURNAMENT_CARD_BG = `${import.meta.env.BASE_URL}images/tournament-card-bg.png`;

function statusBadgeVariant(status: TournamentStatus) {
  if (status === 'ACTIVE') return 'success' as const;
  if (status === 'UPCOMING') return 'scheduled' as const;
  return 'default' as const;
}

interface TournamentCardMediaProps {
  logo?: string | null;
  status?: TournamentStatus;
  statusLabel?: string;
  showStatusBadge?: boolean;
  className?: string;
}

export default function TournamentCardMedia({
  logo,
  status,
  statusLabel,
  showStatusBadge = false,
  className,
}: TournamentCardMediaProps) {
  return (
    <div
      className={cn(
        'relative flex h-28 items-center justify-center overflow-hidden border-b border-border md:h-32',
        className,
      )}
    >
      <img
        src={TOURNAMENT_CARD_BG}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/30 to-black/15"
        aria-hidden
      />

      {logo ? (
        <img
          src={logo}
          alt=""
          className="relative z-10 h-14 w-14 rounded-xl border border-white/20 bg-white/95 object-contain p-1.5 shadow-md md:h-16 md:w-16"
        />
      ) : (
        <div className="relative z-10 rounded-xl border border-white/20 bg-white/95 p-2.5 shadow-md">
          <Trophy className="h-7 w-7 text-primary" aria-hidden />
        </div>
      )}

      {showStatusBadge && status && (
        <Badge
          variant={statusBadgeVariant(status)}
          className="absolute right-2.5 top-2.5 z-10 rounded-md shadow-sm"
        >
          {statusLabel ?? status}
        </Badge>
      )}
    </div>
  );
}

export { TOURNAMENT_CARD_BG };
