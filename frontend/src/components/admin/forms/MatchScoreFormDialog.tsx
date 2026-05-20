import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import FormDialog from '@/components/admin/FormDialog';
import { TextInputField, SelectField, FormError } from '@/components/admin/form-fields';
import { matchScoreSchema, type MatchScoreFormValues } from '@/lib/schemas/admin';
import { useUpdateMatchScore, useUpdateMatch } from '@/hooks/useMatches';
import { getApiErrorMessage } from '@/lib/errors';
import type { Match } from '@/types';

const STATUS_OPTIONS = [
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'LIVE', label: 'Live' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'POSTPONED', label: 'Postponed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

interface MatchScoreFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  match: Match | null;
}

export default function MatchScoreFormDialog({ open, onOpenChange, match }: MatchScoreFormDialogProps) {
  const scoreMutation = useUpdateMatchScore();
  const updateMutation = useUpdateMatch();

  const form = useForm<MatchScoreFormValues>({
    resolver: zodResolver(matchScoreSchema),
    defaultValues: { home_score: '0', away_score: '0', status: 'LIVE' },
  });

  useEffect(() => {
    if (!open || !match) return;
    form.reset({
      home_score: String(match.home_score),
      away_score: String(match.away_score),
      status: match.status,
    });
  }, [open, match, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!match) return;
    try {
      await scoreMutation.mutateAsync({
        id: match.id,
        home: Number(values.home_score),
        away: Number(values.away_score),
      });
      if (values.status && values.status !== match.status) {
        await updateMutation.mutateAsync({ id: match.id, data: { status: values.status } });
      }
      onOpenChange(false);
    } catch (err) {
      form.setError('root', { message: getApiErrorMessage(err) });
    }
  });

  if (!match) return null;

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Update Live Score"
      description={`${match.home_team?.name ?? 'Home'} vs ${match.away_team?.name ?? 'Away'}`}
      onSubmit={onSubmit}
      isSubmitting={scoreMutation.isPending || updateMutation.isPending}
      submitLabel="Update Score"
    >
      <FormError message={form.formState.errors.root?.message} />
      <div className="grid grid-cols-2 gap-3">
        <TextInputField control={form.control} name="home_score" label={match.home_team?.name ?? 'Home'} type="number" />
        <TextInputField control={form.control} name="away_score" label={match.away_team?.name ?? 'Away'} type="number" />
      </div>
      <SelectField control={form.control} name="status" label="Match Status" options={STATUS_OPTIONS} />
    </FormDialog>
  );
}
