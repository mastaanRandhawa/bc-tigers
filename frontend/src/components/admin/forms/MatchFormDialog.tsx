import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import FormDialog from '@/components/admin/FormDialog';
import { TextInputField, SelectField, FormError } from '@/components/admin/form-fields';
import { matchSchema, type MatchFormValues } from '@/lib/schemas/admin';
import { useCreateMatch, useUpdateMatch } from '@/hooks/useMatches';
import { useTournaments } from '@/hooks/useTournaments';
import { useDivisions } from '@/hooks/useDivisions';
import { useTeams } from '@/hooks/useTeams';
import { useVenues } from '@/hooks/useVenues';
import { fromDatetimeLocalValue, toDatetimeLocalValue } from '@/lib/date';
import { getApiErrorMessage } from '@/lib/errors';
import type { Match } from '@/types';

const STATUS_OPTIONS = [
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'LIVE', label: 'Live' },
  { value: 'HALFTIME', label: 'Halftime' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'DELAYED', label: 'Delayed' },
  { value: 'POSTPONED', label: 'Postponed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

interface MatchFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  match?: Match | null;
  defaultDivisionId?: string;
}

export default function MatchFormDialog({ open, onOpenChange, match, defaultDivisionId }: MatchFormDialogProps) {
  const { data: tournaments = [] } = useTournaments();
  const { data: divisions = [] } = useDivisions();
  const { data: venues = [] } = useVenues();
  const createMutation = useCreateMatch();
  const updateMutation = useUpdateMatch();
  const isEditing = !!match;

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
    [divisions, tournamentId],
  );

  const { data: teams = [] } = useTeams(divisionId ? { divisionId } : undefined);

  useEffect(() => {
    if (!open) return;
    if (match) {
      form.reset({
        tournament_id: match.tournament_id,
        division_id: match.division_id,
        home_team_id: match.home_team_id ?? '',
        away_team_id: match.away_team_id ?? '',
        venue_id: match.venue_id ?? '__none__',
        scheduled_start: toDatetimeLocalValue(match.scheduled_start),
        status: match.status,
        round: match.round != null ? String(match.round) : '',
      });
    } else {
      const prefilledDivision = defaultDivisionId ?? '';
      const prefilledTournament = defaultDivisionId
        ? (divisions.find((d) => d.id === defaultDivisionId)?.tournament_id ?? tournaments[0]?.id ?? '')
        : (tournaments[0]?.id ?? '');
      form.reset({
        tournament_id: prefilledTournament,
        division_id: prefilledDivision,
        home_team_id: '',
        away_team_id: '',
        venue_id: '__none__',
        scheduled_start: '',
        status: 'SCHEDULED',
        round: '',
      });
    }
  }, [open, match, form, tournaments, divisions, defaultDivisionId]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = {
        ...values,
        scheduled_start: fromDatetimeLocalValue(values.scheduled_start) ?? '',
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
      <TextInputField control={form.control} name="round" label="Game #" type="number" />
    </FormDialog>
  );
}
