import { useState, useEffect } from 'react';
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
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGenerateSchedule } from '@/hooks/useDivisions';
import { useVenues } from '@/hooks/useVenues';
import { useFields } from '@/hooks/useFields';
import { getApiErrorMessage } from '@/lib/errors';
import { AlertTriangle, Calendar } from 'lucide-react';
import type { Division } from '@/types';

interface ScheduleGeneratorSheetProps {
  division: Division | null;
  existingMatchCount?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (created: number) => void;
}

export function ScheduleGeneratorSheet({
  division,
  existingMatchCount = 0,
  open,
  onOpenChange,
  onSuccess,
}: ScheduleGeneratorSheetProps) {
  const [startDate, setStartDate] = useState('');
  const [intervalMinutes, setIntervalMinutes] = useState('90');
  const [venueId, setVenueId] = useState('');
  const [fieldId, setFieldId] = useState('');
  const [force, setForce] = useState(false);
  const [error, setError] = useState('');

  const generateMutation = useGenerateSchedule();
  const { data: venues = [] } = useVenues();
  const { data: fields = [] } = useFields(venueId || undefined);

  useEffect(() => {
    if (open) {
      setStartDate('');
      setIntervalMinutes('90');
      setVenueId('');
      setFieldId('');
      setForce(false);
      setError('');
    }
  }, [open]);

  useEffect(() => {
    setFieldId('');
  }, [venueId]);

  const handleGenerate = async () => {
    if (!division) return;
    setError('');
    try {
      const res = await generateMutation.mutateAsync({
        id: division.id,
        body: {
          startDate: startDate || undefined,
          matchIntervalMinutes: parseInt(intervalMinutes) || 90,
          venueId: venueId || undefined,
          fieldId: fieldId || undefined,
        },
        force,
      });
      onSuccess?.(res.data.created);
      onOpenChange(false);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to generate schedule'));
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Generate Schedule</SheetTitle>
          <SheetDescription>
            {division?.name} — auto-generate a round-robin match schedule
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="space-y-5">
          {existingMatchCount > 0 && (
            <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-950/30">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <p className="text-sm text-amber-800 dark:text-amber-300">
                This division already has {existingMatchCount} match
                {existingMatchCount !== 1 ? 'es' : ''}. Enable Force Regenerate to replace them.
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="sched-start-date">Start Date (optional)</Label>
            <input
              id="sched-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
            <p className="text-xs text-muted-foreground">
              Defaults to the tournament start date.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sched-interval">Match Interval (minutes)</Label>
            <input
              id="sched-interval"
              type="number"
              min="30"
              max="480"
              value={intervalMinutes}
              onChange={(e) => setIntervalMinutes(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Venue (optional)</Label>
            <Select value={venueId} onValueChange={setVenueId}>
              <SelectTrigger>
                <SelectValue placeholder="No venue assigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">No venue</SelectItem>
                {venues.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {venueId && venueId !== '__none__' && fields.length > 0 && (
            <div className="space-y-1.5">
              <Label>Field (optional)</Label>
              <Select value={fieldId} onValueChange={setFieldId}>
                <SelectTrigger>
                  <SelectValue placeholder="Any field" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Any field</SelectItem>
                  {fields.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                      {f.surface ? ` — ${f.surface}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {existingMatchCount > 0 && (
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Force Regenerate</p>
                <p className="text-xs text-muted-foreground">
                  Delete existing matches and recreate
                </p>
              </div>
              <Switch checked={force} onCheckedChange={setForce} />
            </div>
          )}

          {error && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
        </SheetBody>

        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={
              generateMutation.isPending ||
              (existingMatchCount > 0 && !force)
            }
          >
            <Calendar className="mr-1.5 h-4 w-4" aria-hidden />
            {generateMutation.isPending ? 'Generating…' : 'Generate Schedule'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
