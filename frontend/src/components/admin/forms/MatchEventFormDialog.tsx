import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import FormDialog from '@/components/admin/FormDialog';
import { TextInputField, SelectField, FormError } from '@/components/admin/form-fields';
import { useAddMatchEvent } from '@/hooks/useMatches';
import { getApiErrorMessage } from '@/lib/errors';
import type { Match, MatchEventType } from '@/types';

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
}

export default function MatchEventFormDialog({ open, onOpenChange, match }: MatchEventFormDialogProps) {
  const addMutation = useAddMatchEvent();

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: { type: 'GOAL', minute: '0', team_id: '', player_id: '' },
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
    form.reset({
      type: 'GOAL',
      minute: '0',
      team_id: match.home_team_id,
      player_id: '',
    });
  }, [open, match, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!match) return;
    try {
      await addMutation.mutateAsync({
        matchId: match.id,
        data: {
          type: values.type,
          minute: Number(values.minute),
          team_id: values.team_id,
          player_id: values.player_id || undefined,
        },
      });
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
      title="Record Match Event"
      description={`${match.home_team?.name} vs ${match.away_team?.name}`}
      onSubmit={onSubmit}
      isSubmitting={addMutation.isPending}
      submitLabel="Add Event"
    >
      <FormError message={form.formState.errors.root?.message} />
      <SelectField control={form.control} name="type" label="Event Type" options={EVENT_TYPES} />
      <TextInputField control={form.control} name="minute" label="Minute" type="number" />
      <SelectField control={form.control} name="team_id" label="Team" options={teamOptions} />
      <SelectField
        control={form.control}
        name="player_id"
        label="Player (optional)"
        options={[
          { value: '', label: '—' },
          ...players.map((p) => ({
            value: p!.id,
            label: `${p!.first_name} ${p!.last_name}`,
          })),
        ]}
      />
    </FormDialog>
  );
}
