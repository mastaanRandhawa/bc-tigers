import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import FormDialog from '@/components/admin/FormDialog';
import { TextInputField, FormError } from '@/components/admin/form-fields';
import { refereeSchema, type RefereeFormValues } from '@/lib/schemas/admin';
import { useCreateReferee, useUpdateReferee } from '@/hooks/useReferees';
import { getApiErrorMessage } from '@/lib/errors';
import type { Referee } from '@/types';

interface RefereeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  referee?: Referee | null;
}

export default function RefereeFormDialog({ open, onOpenChange, referee }: RefereeFormDialogProps) {
  const createMutation = useCreateReferee();
  const updateMutation = useUpdateReferee();
  const isEditing = !!referee;

  const form = useForm<RefereeFormValues>({
    resolver: zodResolver(refereeSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      certification: '',
    },
  });

  useEffect(() => {
    if (!open) return;
    if (referee) {
      form.reset({
        first_name: referee.first_name,
        last_name: referee.last_name,
        email: referee.email ?? '',
        phone: referee.phone ?? '',
        certification: referee.certification ?? '',
      });
    } else {
      form.reset({ first_name: '', last_name: '', email: '', phone: '', certification: '' });
    }
  }, [open, referee, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = {
        ...values,
        email: values.email || undefined,
      };
      if (isEditing && referee) {
        await updateMutation.mutateAsync({ id: referee.id, data: payload });
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
      title={isEditing ? 'Edit Referee' : 'Add Referee'}
      onSubmit={onSubmit}
      isSubmitting={createMutation.isPending || updateMutation.isPending}
    >
      <FormError message={form.formState.errors.root?.message} />
      <div className="grid grid-cols-2 gap-3">
        <TextInputField control={form.control} name="first_name" label="First Name" />
        <TextInputField control={form.control} name="last_name" label="Last Name" />
      </div>
      <TextInputField control={form.control} name="email" label="Email" type="email" />
      <TextInputField control={form.control} name="phone" label="Phone" />
      <TextInputField control={form.control} name="certification" label="Certification" />
    </FormDialog>
  );
}
