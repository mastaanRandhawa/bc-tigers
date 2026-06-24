import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import FormDialog from '@/components/admin/FormDialog';
import { TextInputField, SelectField, FormError } from '@/components/admin/form-fields';
import { useAddMatchEvent, useUpdateMatchEvent } from '@/hooks/useMatches';
import { getApiErrorMessage } from '@/lib/errors';
import type { Match, MatchEvent, MatchEventType } from '@/types';

const eventSchema = z.object({
  type: z.enum(['GOAL', 'OWN_GOAL', 'YELLOW_CARD', 'RED_CARD', 'SUBSTITUTION', 'PENALTY', 'ASSIST']),
  minute: z.string().min(1),
  team_id: z.string().min(1),
  player_id: z.string().optional(),
});

type EventFormValues = z.infer<typeof eventSchema>;

const EVENT_TYPES: { value: MatchEventType; label: string }[] = [
  { value: 'GOAL', label: 'Goal' },
  { value: 'OWN_GOAL', label: 'Own Goal' },
  { value: 'YELLOW_CARD', label: 'Yellow Card' },
  { value: 'RED_CARD', label: 'Red Card' },
  { value: 'SUBSTITUTION', label: 'Substitution' },
  { value: 'PENALTY', label: 'Penalty' },
  { value: 'ASSIST', label: 'Assist' },
];

interface MatchEventFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  match: Match | null;
  event?: MatchEvent | null;
  /** Restrict to goal events only (coach portal). */
  goalOnly?: boolean;
  /** Lock team selection to a specific team id. */
  lockedTeamId?: string;
}

export default function MatchEventFormDialog({
  open,
  onOpenChange,
  match,
  event,
  goalOnly = false,
  lockedTeamId,
}: MatchEventFormDialogProps) {
  const isEdit = !!event;
  const addMutation = useAddMatchEvent();
  const updateMutation = useUpdateMatchEvent();
  const isSubmitting = addMutation.isPending || updateMutation.isPending;

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: { type: 'GOAL', minute: '0', team_id: '', player_id: '__none__' },
  });

  const teamId = form.watch('team_id');
  const homePlayers = match?.home_team?.players?.filter((p) => p.active !== false) ?? [];
  const awayPlayers = match?.away_team?.players?.filter((p) => p.active !== false) ?? [];
  const players =
    teamId === match?.home_team_id
      ? homePlayers
      : teamId === match?.away_team_id
        ? awayPlayers
        : [];

  useEffect(() => {
    if (!open || !match) return;
    const defaultTeamId = lockedTeamId ?? match.home_team_id;
    if (event) {
      form.reset({
        type: goalOnly ? 'GOAL' : event.type,
        minute: String(event.minute),
        team_id: lockedTeamId ?? event.team_id,
        player_id: event.player_id ?? '__none__',
      });
    } else {
      form.reset({
        type: 'GOAL',
        minute: '0',
        team_id: defaultTeamId,
        player_id: '__none__',
      });
    }
  }, [open, match, event, form, goalOnly, lockedTeamId]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!match) return;
    const playerId =
      values.player_id && values.player_id !== '__none__' ? values.player_id : undefined;

    try {
      const eventType = goalOnly ? 'GOAL' : values.type;
      if (isEdit && event) {
        await updateMutation.mutateAsync({
          matchId: match.id,
          eventId: event.id,
          data: {
            type: eventType,
            minute: Number(values.minute),
            team_id: lockedTeamId ?? values.team_id,
            player_id: playerId ?? null,
          },
        });
      } else {
        await addMutation.mutateAsync({
          matchId: match.id,
          data: {
            type: eventType,
            minute: Number(values.minute),
            team_id: lockedTeamId ?? values.team_id,
            player_id: playerId,
          },
        });
      }
      onOpenChange(false);
    } catch (err) {
      form.setError('root', { message: getApiErrorMessage(err) });
    }
  });

  if (!match) return null;

  const teamOptions = [
    { value: match.home_team_id, label: match.home_team?.name ?? 'Home' },
    { value: match.away_team_id, label: match.away_team?.name ?? 'Away' },
  ];

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? (goalOnly ? 'Edit Goal' : 'Edit Match Event') : goalOnly ? 'Record Goal' : 'Record Match Event'}
      description={`${match.home_team?.name} vs ${match.away_team?.name}`}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      submitLabel={isEdit ? 'Save Changes' : goalOnly ? 'Add Goal' : 'Add Event'}
    >
      <FormError message={form.formState.errors.root?.message} />
      {!goalOnly && (
        <SelectField control={form.control} name="type" label="Event Type" options={EVENT_TYPES} />
      )}
      <TextInputField control={form.control} name="minute" label="Minute" type="number" />
      {!lockedTeamId && (
        <SelectField control={form.control} name="team_id" label="Team" options={teamOptions} />
      )}
      <SelectField
        control={form.control}
        name="player_id"
        label="Player (optional)"
        options={[
          { value: '__none__', label: '—' },
          ...players.map((p) => ({
            value: p!.id,
            label: `${p!.first_name} ${p!.last_name}`,
          })),
        ]}
      />
    </FormDialog>
  );
}
