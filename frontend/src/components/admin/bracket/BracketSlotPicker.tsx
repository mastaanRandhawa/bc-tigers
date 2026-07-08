import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { BracketNode, Match, MatchSlotOutcome, Team } from '@/types';
import { cn } from '@/lib/utils';

type SlotMode = 'team' | 'winner' | 'loser';

const MODE_OPTIONS = [
  { value: 'team', label: 'Specific team' },
  { value: 'winner', label: 'Winner of game…' },
  { value: 'loser', label: 'Loser of game…' },
];

function matchOptionLabel(m: Match): string {
  const home = m.home_team?.name ?? m.home_label ?? 'TBD';
  const away = m.away_team?.name ?? m.away_label ?? 'TBD';
  const prefix = m.round != null ? `Game ${m.round} — ` : '';
  return `${prefix}${home} vs ${away}`;
}

interface BracketSlotPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  node: BracketNode | null;
  slot: 'home' | 'away' | null;
  teams: Team[];
  divisionMatches: Match[];
  selectedTeamId?: string | null;
  pending?: boolean;
  onPlaceTeam: (nodeId: string, slot: 'home' | 'away', teamId: string) => Promise<void>;
  onPlaceSource: (
    nodeId: string,
    slot: 'home' | 'away',
    sourceMatchId: string,
    outcome: MatchSlotOutcome,
  ) => Promise<void>;
}

export function BracketSlotPicker({
  open,
  onOpenChange,
  node,
  slot,
  teams,
  divisionMatches,
  selectedTeamId,
  pending,
  onPlaceTeam,
  onPlaceSource,
}: BracketSlotPickerProps) {
  const [mode, setMode] = useState<SlotMode>(selectedTeamId ? 'team' : 'winner');
  const [teamId, setTeamId] = useState(selectedTeamId ?? '');
  const [sourceMatchId, setSourceMatchId] = useState('');

  const sourceOptions = divisionMatches
    .filter((m) => m.id !== node?.match_id)
    .map((m) => ({ value: m.id, label: matchOptionLabel(m) }));

  const teamOptions = teams.map((t) => ({ value: t.id, label: t.name }));

  const handleSubmit = async () => {
    if (!node || !slot) return;
    if (mode === 'team') {
      if (!teamId) return;
      await onPlaceTeam(node.id, slot, teamId);
    } else {
      if (!sourceMatchId) return;
      await onPlaceSource(
        node.id,
        slot,
        sourceMatchId,
        mode === 'winner' ? 'WINNER' : 'LOSER',
      );
    }
    onOpenChange(false);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setMode(selectedTeamId ? 'team' : 'winner');
          setTeamId(selectedTeamId ?? '');
          setSourceMatchId('');
        }
        onOpenChange(next);
      }}
    >
      <SheetContent side="right" className="max-w-md w-full">
        <SheetHeader>
          <SheetTitle>Configure slot</SheetTitle>
          <SheetDescription>
            Choose a team or link this slot to the winner/loser of another game.
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="space-y-4 pt-2">
          <div className="grid grid-cols-3 gap-2">
            {MODE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setMode(opt.value as SlotMode)}
                className={cn(
                  'rounded-lg border px-2 py-2 text-xs font-medium transition-colors',
                  mode === opt.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-muted/30 text-foreground hover:border-primary/40',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {mode === 'team' ? (
            <div className="space-y-1.5">
              <Label>Team</Label>
              <Select value={teamId} onValueChange={setTeamId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team…" />
                </SelectTrigger>
                <SelectContent>
                  {teamOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label>{mode === 'winner' ? 'Winner of game' : 'Loser of game'}</Label>
              <Select value={sourceMatchId} onValueChange={setSourceMatchId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select game…" />
                </SelectTrigger>
                <SelectContent>
                  {sourceOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button
            className="w-full"
            disabled={
              pending ||
              !node ||
              !slot ||
              (mode === 'team' ? !teamId : !sourceMatchId)
            }
            onClick={handleSubmit}
          >
            Save slot
          </Button>

          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
