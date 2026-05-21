import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import FormDialog from '@/components/admin/FormDialog';
import { SelectField, FormError } from '@/components/admin/form-fields';
import { useReferees } from '@/hooks/useReferees';
import { useAssignMatchReferee } from '@/hooks/useMatchReferees';
import { getApiErrorMessage } from '@/lib/errors';
import type { Match } from '@/types';

const schema = z.object({
  referee_id: z.string().min(1, 'Select a referee'),
  role: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface MatchRefereesFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  match: Match | null;
}

export default function MatchRefereesFormDialog({
  open,
  onOpenChange,
  match,
}: MatchRefereesFormDialogProps) {
  const { data: referees = [] } = useReferees();
  const assignMutation = useAssignMatchReferee();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { referee_id: '', role: 'Center' },
  });

  useEffect(() => {
    if (open) form.reset({ referee_id: '', role: 'Center' });
  }, [open, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!match) return;
    try {
      await assignMutation.mutateAsync({
        matchId: match.id,
        refereeId: values.referee_id,
        role: values.role,
      });
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
      title="Assign referee"
      description={`${match.home_team?.name ?? 'TBD'} vs ${match.away_team?.name ?? 'TBD'}`}
      onSubmit={onSubmit}
      isSubmitting={assignMutation.isPending}
      submitLabel="Assign"
    >
      <FormError message={form.formState.errors.root?.message} />
      <SelectField
        control={form.control}
        name="referee_id"
        label="Referee"
        options={referees.map((r) => ({
          value: r.id,
          label: `${r.first_name} ${r.last_name}`,
        }))}
      />
      <SelectField
        control={form.control}
        name="role"
        label="Role"
        options={[
          { value: 'Center', label: 'Center' },
          { value: 'Assistant', label: 'Assistant' },
          { value: 'Fourth Official', label: 'Fourth Official' },
        ]}
      />
    </FormDialog>
  );
}
