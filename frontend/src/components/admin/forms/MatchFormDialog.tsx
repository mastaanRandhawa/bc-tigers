import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import FormDialog from '@/components/admin/FormDialog';
import { TextInputField, SelectField, FormError } from '@/components/admin/form-fields';
import { matchSchema, type MatchFormValues } from '@/lib/schemas/admin';
import {
  useCreateMatch,
  useUpdateMatch,
  useMatch,
  useAssignMatchReferee,
  useRemoveMatchReferee,
} from '@/hooks/useMatches';
import { useTournaments } from '@/hooks/useTournaments';
import { useDivisions } from '@/hooks/useDivisions';
import { useTeams } from '@/hooks/useTeams';
import { useVenues } from '@/hooks/useVenues';
import { useReferees } from '@/hooks/useReferees';
import { fromDatetimeLocal, toDatetimeLocal } from '@/lib/datetime';
import { getApiErrorMessage } from '@/lib/errors';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Match } from '@/types';

const STATUS_OPTIONS = [
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'LIVE', label: 'Live' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'POSTPONED', label: 'Postponed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

interface MatchFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  match?: Match | null;
}

const REFEREE_ROLE_OPTIONS = [
  { value: 'MAIN', label: 'Main' },
  { value: 'ASSISTANT', label: 'Assistant' },
];

export default function MatchFormDialog({ open, onOpenChange, match }: MatchFormDialogProps) {
  const { data: tournaments = [] } = useTournaments();
  const { data: divisions = [] } = useDivisions();
  const { data: venues = [] } = useVenues();
  const { data: allReferees = [] } = useReferees();
  const createMutation = useCreateMatch();
  const updateMutation = useUpdateMatch();
  const assignReferee = useAssignMatchReferee();
  const removeReferee = useRemoveMatchReferee();
  const isEditing = !!match;
  const { data: matchDetail } = useMatch(isEditing && open ? match?.id : undefined);
  const [refereeId, setRefereeId] = useState('');
  const [refereeRole, setRefereeRole] = useState('MAIN');
  const [refereeError, setRefereeError] = useState('');

  const assignedReferees = matchDetail?.referees ?? [];

  const form = useForm<MatchFormValues>({
    resolver: zodResolver(matchSchema),
    defaultValues: {
      tournament_id: '',
      division_id: '',
      home_team_id: '',
      away_team_id: '',
      venue_id: '',
      scheduled_start: '',
      status: 'SCHEDULED',
      round: undefined,
    },
  });

  const tournamentId = form.watch('tournament_id');
  const divisionId = form.watch('division_id');

  const filteredDivisions = useMemo(
    () => divisions.filter((d) => !tournamentId || d.tournament_id === tournamentId),
    [divisions, tournamentId]
  );

  const { data: teams = [] } = useTeams(divisionId ? { divisionId } : undefined);

  useEffect(() => {
    if (!open) return;
    if (match) {
      form.reset({
        tournament_id: match.tournament_id,
        division_id: match.division_id,
        home_team_id: match.home_team_id,
        away_team_id: match.away_team_id,
        venue_id: match.venue_id ?? '__none__',
        scheduled_start: toDatetimeLocal(match.scheduled_start),
        status: match.status,
        round: match.round != null ? String(match.round) : '',
      });
    } else {
      form.reset({
        tournament_id: tournaments[0]?.id ?? '',
        division_id: '',
        home_team_id: '',
        away_team_id: '',
        venue_id: '__none__',
        scheduled_start: '',
        status: 'SCHEDULED',
        round: '',
      });
    }
  }, [open, match, form, tournaments]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = {
        ...values,
        scheduled_start: fromDatetimeLocal(values.scheduled_start),
        venue_id: values.venue_id && values.venue_id !== '__none__' ? values.venue_id : undefined,
        round: values.round ? Number(values.round) : undefined,
      };

      if (isEditing && match) {
        await updateMutation.mutateAsync({ id: match.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onOpenChange(false);
    } catch (err) {
      form.setError('root', { message: getApiErrorMessage(err) });
    }
  });

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Edit Match' : 'Schedule Match'}
      onSubmit={onSubmit}
      isSubmitting={createMutation.isPending || updateMutation.isPending}
    >
      <FormError message={form.formState.errors.root?.message} />
      <SelectField
        control={form.control}
        name="tournament_id"
        label="Tournament"
        options={tournaments.map((t) => ({ value: t.id, label: t.name }))}
      />
      <SelectField
        control={form.control}
        name="division_id"
        label="Division"
        options={filteredDivisions.map((d) => ({ value: d.id, label: d.name }))}
      />
      <SelectField
        control={form.control}
        name="home_team_id"
        label="Home Team"
        options={teams.map((t) => ({ value: t.id, label: t.name }))}
      />
      <SelectField
        control={form.control}
        name="away_team_id"
        label="Away Team"
        options={teams.map((t) => ({ value: t.id, label: t.name }))}
      />
      <SelectField
        control={form.control}
        name="venue_id"
        label="Venue"
        options={[
          { value: '__none__', label: 'None' },
          ...venues.map((v) => ({ value: v.id, label: v.name })),
        ]}
      />
      <TextInputField control={form.control} name="scheduled_start" label="Kickoff" type="datetime-local" />
      <SelectField control={form.control} name="status" label="Status" options={STATUS_OPTIONS} />
      <TextInputField control={form.control} name="round" label="Round" type="number" />

      {isEditing && match && (
        <div className="space-y-3 rounded-lg border border-border p-3">
          <Label className="text-sm font-medium">Referees</Label>
          {assignedReferees.length === 0 ? (
            <p className="text-xs text-muted-foreground">No referees assigned yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {assignedReferees.map((mr) => (
                <li
                  key={mr.id}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span>
                    {mr.referee?.first_name} {mr.referee?.last_name}{' '}
                    <span className="text-xs text-muted-foreground">({mr.role})</span>
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-destructive"
                    disabled={removeReferee.isPending}
                    onClick={async () => {
                      try {
                        await removeReferee.mutateAsync({
                          matchId: match.id,
                          matchRefereeId: mr.id,
                        });
                      } catch (err) {
                        setRefereeError(getApiErrorMessage(err));
                      }
                    }}
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1">
              <Label className="text-xs text-muted-foreground">Add referee</Label>
              <Select value={refereeId} onValueChange={setRefereeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select referee" />
                </SelectTrigger>
                <SelectContent>
                  {allReferees
                    .filter((r) => !assignedReferees.some((mr) => mr.referee_id === r.id))
                    .map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.first_name} {r.last_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-32 space-y-1">
              <Label className="text-xs text-muted-foreground">Role</Label>
              <Select value={refereeRole} onValueChange={setRefereeRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REFEREE_ROLE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              variant="secondary"
              disabled={!refereeId || assignReferee.isPending}
              onClick={async () => {
                setRefereeError('');
                try {
                  await assignReferee.mutateAsync({
                    matchId: match.id,
                    referee_id: refereeId,
                    role: refereeRole,
                  });
                  setRefereeId('');
                } catch (err) {
                  setRefereeError(getApiErrorMessage(err));
                }
              }}
            >
              Assign
            </Button>
          </div>
          {refereeError && <p className="text-xs text-red-600">{refereeError}</p>}
        </div>
      )}
    </FormDialog>
  );
}
