import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useAddToRoster, useRemoveFromRoster } from '@/hooks/useRosters';
import { useDivisions } from '@/hooks/useDivisions';
import { useTeams } from '@/hooks/useTeams';
import { getApiErrorMessage } from '@/lib/errors';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import type { Player, TeamRoster } from '@/types';

interface PlayerTransferSheetProps {
  player: Player | null;
  sourceRoster?: TeamRoster | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function PlayerTransferSheet({
  player,
  sourceRoster,
  open,
  onOpenChange,
  onSuccess,
}: PlayerTransferSheetProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [targetDivisionId, setTargetDivisionId] = useState('');
  const [targetTeamId, setTargetTeamId] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const addMutation = useAddToRoster();
  const removeMutation = useRemoveFromRoster();
  const { data: divisions = [] } = useDivisions();
  const { data: teams = [] } = useTeams(targetDivisionId ? { divisionId: targetDivisionId } : undefined);

  const reset = () => {
    setStep(1);
    setTargetDivisionId('');
    setTargetTeamId('');
    setError('');
    setDone(false);
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const handleTransfer = async () => {
    if (!player || !targetTeamId) return;
    setError('');
    try {
      if (sourceRoster) {
        await removeMutation.mutateAsync({
          teamId: sourceRoster.team_id,
          rosterId: sourceRoster.id,
        });
      }
      await addMutation.mutateAsync({
        teamId: targetTeamId,
        data: {
          player_id: player.id,
          season: new Date().getFullYear().toString(),
        },
      });
      setDone(true);
      onSuccess?.();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Transfer failed'));
    }
  };

  const targetTeam = teams.find((t) => t.id === targetTeamId);
  const targetDivision = divisions.find((d) => d.id === targetDivisionId);

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Transfer Player</SheetTitle>
          <SheetDescription>
            {player
              ? `Move ${player.first_name} ${player.last_name} to a new team`
              : 'Transfer player to another team'}
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="space-y-6">
          {done ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <p className="text-base font-semibold text-foreground">Transfer Complete</p>
              <p className="text-sm text-muted-foreground">
                {player?.first_name} {player?.last_name} has been transferred to{' '}
                {targetTeam?.name}.
              </p>
              <Button variant="outline" onClick={handleClose} className="mt-2">
                Close
              </Button>
            </div>
          ) : (
            <>
              {/* Step indicator */}
              <div className="flex items-center gap-2">
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      s === step
                        ? 'bg-primary text-white'
                        : s < step
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {s}
                  </div>
                ))}
                <span className="text-xs text-muted-foreground ml-1">
                  {step === 1 ? 'Select Division' : step === 2 ? 'Select Team' : 'Confirm'}
                </span>
              </div>

              {step === 1 && (
                <div className="space-y-2">
                  <Label>Target Division</Label>
                  <Select value={targetDivisionId} onValueChange={setTargetDivisionId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a division…" />
                    </SelectTrigger>
                    <SelectContent>
                      {divisions.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                          {d.tournament && (
                            <span className="text-muted-foreground ml-1">
                              ({d.tournament.name})
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-2">
                  <Label>Target Team in {targetDivision?.name}</Label>
                  <Select value={targetTeamId} onValueChange={setTargetTeamId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a team…" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <p className="text-sm font-medium text-foreground mb-3">Transfer Summary</p>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="text-center">
                        <p className="font-semibold">{player?.first_name} {player?.last_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {sourceRoster ? 'Current team' : 'Unrostered'}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="text-center">
                        <p className="font-semibold">{targetTeam?.name}</p>
                        <p className="text-xs text-muted-foreground">{targetDivision?.name}</p>
                      </div>
                    </div>
                  </div>
                  {sourceRoster && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      The player will be removed from their current roster entry.
                    </p>
                  )}
                </div>
              )}

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </>
          )}
        </SheetBody>

        {!done && (
          <SheetFooter>
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}>
                Back
              </Button>
            )}
            {step < 3 ? (
              <Button
                onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
                disabled={(step === 1 && !targetDivisionId) || (step === 2 && !targetTeamId)}
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleTransfer}
                disabled={addMutation.isPending || removeMutation.isPending}
              >
                {addMutation.isPending || removeMutation.isPending ? 'Transferring…' : 'Confirm Transfer'}
              </Button>
            )}
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
