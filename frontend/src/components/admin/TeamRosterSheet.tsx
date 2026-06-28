import TeamRosterPanel from '@/components/admin/TeamRosterPanel';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { Team } from '@/types';

interface TeamRosterSheetProps {
  team: Team | null;
  onOpenChange: (open: boolean) => void;
}

export default function TeamRosterSheet({ team, onOpenChange }: TeamRosterSheetProps) {
  return (
    <Sheet open={!!team} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-md gap-0 p-0">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle className="truncate">Roster — {team?.name ?? ''}</SheetTitle>
        </SheetHeader>
        <SheetBody className="px-5 py-4">
          {team && <TeamRosterPanel team={team} />}
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
