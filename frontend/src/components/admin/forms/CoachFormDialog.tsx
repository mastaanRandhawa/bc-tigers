import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import FormDialog from '@/components/admin/FormDialog';
import { TextInputField, FormError } from '@/components/admin/form-fields';
import { useCreateCoach, useUpdateCoach } from '@/hooks/useCoaches';
import { getApiErrorMessage } from '@/lib/errors';
import type { Coach } from '@/types';

const coachSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
});

type CoachFormValues = z.infer<typeof coachSchema>;

interface CoachFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coach?: Coach | null;
}

export default function CoachFormDialog({ open, onOpenChange, coach }: CoachFormDialogProps) {
  const createMutation = useCreateCoach();
  const updateMutation = useUpdateCoach();
  const isEditing = !!coach;

  const form = useForm<CoachFormValues>({
    resolver: zodResolver(coachSchema),
    defaultValues: { first_name: '', last_name: '', email: '', phone: '' },
  });

  useEffect(() => {
    if (!open) return;
    if (coach) {
      form.reset({
        first_name: coach.first_name,
        last_name: coach.last_name,
        email: coach.email ?? '',
        phone: coach.phone ?? '',
      });
    } else {
      form.reset({ first_name: '', last_name: '', email: '', phone: '' });
    }
  }, [open, coach, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = {
        ...values,
        email: values.email || undefined,
        phone: values.phone || undefined,
      };
      if (isEditing && coach) {
        await updateMutation.mutateAsync({ id: coach.id, data: payload });
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
      title={isEditing ? 'Edit Coach' : 'Create Coach'}
      onSubmit={onSubmit}
      isSubmitting={createMutation.isPending || updateMutation.isPending}
    >
      <FormError message={form.formState.errors.root?.message} />
      <div className="grid grid-cols-2 gap-3">
        <TextInputField control={form.control} name="first_name" label="First Name" />
        <TextInputField control={form.control} name="last_name" label="Last Name" />
      </div>
      <TextInputField control={form.control} name="email" label="Email" />
      <TextInputField control={form.control} name="phone" label="Phone" />
    </FormDialog>
  );
}
