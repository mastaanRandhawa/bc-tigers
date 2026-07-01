import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import FormDialog from '@/components/admin/FormDialog';
import { TextInputField, SelectField, FormError } from '@/components/admin/form-fields';
import { matchSchema, type MatchFormValues } from '@/lib/schemas/admin';
import { useCreateMatch, useUpdateMatch, useMatches } from '@/hooks/useMatches';
import { useTournaments } from '@/hooks/useTournaments';
import { useDivisions } from '@/hooks/useDivisions';
import { useTeams } from '@/hooks/useTeams';
import { useVenues } from '@/hooks/useVenues';
import { useFields } from '@/hooks/useFields';
import { FieldFormDialog } from '@/components/admin/forms/FieldFormDialog';
import { fromDatetimeLocalValue, toDatetimeLocalValue } from '@/lib/date';
import { getApiErrorMessage } from '@/lib/errors';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import type { Match, MatchSlotOutcome } from '@/types';

const STATUS_OPTIONS = [
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'LIVE', label: 'Live' },
  { value: 'HALFTIME', label: 'Halftime' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'DELAYED', label: 'Delayed' },
  { value: 'POSTPONED', label: 'Postponed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const SLOT_MODE_OPTIONS = [
  { value: 'team', label: 'Specific team' },
  { value: 'winner', label: 'Winner of game…' },
  { value: 'loser', label: 'Loser of game…' },
];

/** Short label for a source-match option, e.g. "Game 5 — Tigers vs Lions". */
function matchOptionLabel(m: Match): string {
  const home = m.home_team?.name ?? m.home_label ?? 'TBD';
  const away = m.away_team?.name ?? m.away_label ?? 'TBD';
  const prefix = m.round != null ? `Game ${m.round} — ` : '';
  return `${prefix}${home} vs ${away}`;
}

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
  const [addFieldOpen, setAddFieldOpen] = useState(false);
  const prevVenueRef = useRef<string | undefined | null>(null);

  const form = useForm<MatchFormValues>({
    resolver: zodResolver(matchSchema),
    defaultValues: {
      tournament_id: '',
      division_id: '',
      home_mode: 'team',
      home_team_id: '',
      home_source_match_id: '',
      away_mode: 'team',
      away_team_id: '',
      away_source_match_id: '',
      venue_id: '',
      field_id: '',
      scheduled_start: '',
      status: 'SCHEDULED',
      round: undefined,
    },
  });

  const tournamentId = form.watch('tournament_id');
  const divisionId = form.watch('division_id');
  const venueId = form.watch('venue_id');
  const homeMode = form.watch('home_mode');
  const awayMode = form.watch('away_mode');

  const selectedVenueId = venueId && venueId !== '__none__' ? venueId : undefined;
  const { data: fields = [] } = useFields(selectedVenueId);

  const filteredDivisions = useMemo(
    () => divisions.filter((d) => !tournamentId || d.tournament_id === tournamentId),
    [divisions, tournamentId],
  );

  const { data: teams = [] } = useTeams(divisionId ? { divisionId } : undefined);

  // Other games in the same division are eligible as Winner/Loser sources.
  const { data: divisionMatches = [] } = useMatches(divisionId ? { divisionId, limit: 200 } : undefined);
  const sourceOptions = useMemo(
    () =>
      divisionMatches
        .filter((m) => m.id !== match?.id)
        .map((m) => ({ value: m.id, label: matchOptionLabel(m) })),
    [divisionMatches, match?.id],
  );

  useEffect(() => {
    if (!open) return;
    if (match) {
      form.reset({
        tournament_id: match.tournament_id,
        division_id: match.division_id,
        home_mode: match.home_source_match_id
          ? match.home_source_outcome === 'LOSER' ? 'loser' : 'winner'
          : 'team',
        home_team_id: match.home_team_id ?? '',
        home_source_match_id: match.home_source_match_id ?? '',
        away_mode: match.away_source_match_id
          ? match.away_source_outcome === 'LOSER' ? 'loser' : 'winner'
          : 'team',
        away_team_id: match.away_team_id ?? '',
        away_source_match_id: match.away_source_match_id ?? '',
        venue_id: match.venue_id ?? '__none__',
        field_id: match.field_id ?? '__none__',
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
        home_mode: 'team',
        home_team_id: '',
        home_source_match_id: '',
        away_mode: 'team',
        away_team_id: '',
        away_source_match_id: '',
        venue_id: '__none__',
        field_id: '__none__',
        scheduled_start: '',
        status: 'SCHEDULED',
        round: '',
      });
    }
  }, [open, match, form, tournaments, divisions, defaultDivisionId]);

  // Clear field when the admin picks a different venue (not on initial form load).
  useEffect(() => {
    if (!open) {
      prevVenueRef.current = null;
      return;
    }
    if (prevVenueRef.current === null) {
      prevVenueRef.current = venueId;
      return;
    }
    if (prevVenueRef.current !== venueId) {
      form.setValue('field_id', '__none__');
      prevVenueRef.current = venueId;
    }
  }, [venueId, open, form]);

  // Changing division invalidates previously selected teams (different roster pool).
  useEffect(() => {
    if (!open || isEditing) return;
    form.setValue('home_team_id', '');
    form.setValue('away_team_id', '');
    form.setValue('home_source_match_id', '');
    form.setValue('away_source_match_id', '');
  }, [divisionId, open, isEditing, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      // Each side resolves to EITHER a team or a Winner/Loser source — clear the
      // unused half so switching modes doesn't leave stale references.
      const homeIsSource = values.home_mode !== 'team';
      const awayIsSource = values.away_mode !== 'team';
      const payload = {
        tournament_id: values.tournament_id,
        division_id: values.division_id,
        home_team_id: homeIsSource ? null : values.home_team_id,
        home_source_match_id: homeIsSource ? values.home_source_match_id : null,
        home_source_outcome: homeIsSource
          ? (values.home_mode.toUpperCase() as MatchSlotOutcome)
          : null,
        away_team_id: awayIsSource ? null : values.away_team_id,
        away_source_match_id: awayIsSource ? values.away_source_match_id : null,
        away_source_outcome: awayIsSource
          ? (values.away_mode.toUpperCase() as MatchSlotOutcome)
          : null,
        scheduled_start: fromDatetimeLocalValue(values.scheduled_start) ?? '',
        venue_id:
          values.venue_id && values.venue_id !== '__none__' ? values.venue_id : null,
        field_id:
          values.field_id && values.field_id !== '__none__' ? values.field_id : null,
        status: values.status,
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
    <>
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
        name="home_mode"
        label="Home side"
        options={SLOT_MODE_OPTIONS}
      />
      {homeMode === 'team' ? (
        <SelectField
          control={form.control}
          name="home_team_id"
          label="Home Team"
          options={teams.map((t) => ({ value: t.id, label: t.name }))}
        />
      ) : (
        <SelectField
          control={form.control}
          name="home_source_match_id"
          label={homeMode === 'loser' ? 'Loser of game' : 'Winner of game'}
          options={sourceOptions}
        />
      )}
      <SelectField
        control={form.control}
        name="away_mode"
        label="Away side"
        options={SLOT_MODE_OPTIONS}
      />
      {awayMode === 'team' ? (
        <SelectField
          control={form.control}
          name="away_team_id"
          label="Away Team"
          options={teams.map((t) => ({ value: t.id, label: t.name }))}
        />
      ) : (
        <SelectField
          control={form.control}
          name="away_source_match_id"
          label={awayMode === 'loser' ? 'Loser of game' : 'Winner of game'}
          options={sourceOptions}
        />
      )}
      <SelectField
        control={form.control}
        name="venue_id"
        label="Venue"
        options={[
          { value: '__none__', label: 'None' },
          ...venues.map((v) => ({ value: v.id, label: v.name })),
        ]}
      />
      {selectedVenueId && (
        <div className="space-y-1.5">
          <div className="flex items-end justify-between gap-2">
            <SelectField
              control={form.control}
              name="field_id"
              label="Field"
              className="flex-1"
              options={[
                { value: '__none__', label: 'None' },
                ...fields.map((f) => ({
                  value: f.id,
                  label: f.surface ? `${f.name} — ${f.surface}` : f.name,
                })),
              ]}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mb-0.5 shrink-0"
              onClick={() => setAddFieldOpen(true)}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add field
            </Button>
          </div>
          {fields.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No fields for this venue yet. Add one to assign a pitch or court.
            </p>
          )}
        </div>
      )}
      <TextInputField control={form.control} name="scheduled_start" label="Kickoff" type="datetime-local" />
      <SelectField control={form.control} name="status" label="Status" options={STATUS_OPTIONS} />
      <TextInputField control={form.control} name="round" label="Game #" type="number" />
    </FormDialog>

    {selectedVenueId && (
      <FieldFormDialog
        venueId={selectedVenueId}
        open={addFieldOpen}
        onOpenChange={setAddFieldOpen}
        onSuccess={(field) => {
          if (field) form.setValue('field_id', field.id);
        }}
      />
    )}
  </>
  );
}
