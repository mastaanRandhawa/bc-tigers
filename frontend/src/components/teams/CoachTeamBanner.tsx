import { ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { canManageTeam } from '@/lib/coach-utils';

interface CoachTeamBannerProps {
  teamId: string;
}

export default function CoachTeamBanner({ teamId }: CoachTeamBannerProps) {
  const user = useAuthStore((s) => s.user);
  if (!canManageTeam(user, teamId)) return null;

  return (
    <div className="flex items-center gap-2 rounded-xl border border-primary/25 bg-primary-muted/40 px-4 py-3 text-sm text-foreground">
      <ShieldCheck className="h-4 w-4 shrink-0 text-primary" aria-hidden />
      <span>
        You manage this team — use the edit controls below to update team info and roster.
      </span>
    </div>
  );
}
