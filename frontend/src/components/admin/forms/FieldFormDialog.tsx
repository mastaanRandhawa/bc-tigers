import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import FormDialog from '@/components/admin/FormDialog';
import { TextInputField, FormError } from '@/components/admin/form-fields';
import { useCreateField, useUpdateField } from '@/hooks/useFields';
import { getApiErrorMessage } from '@/lib/errors';
import type { Field } from '@/types';

const fieldSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  surface: z.string().optional(),
  capacity: z.string().optional(),
});

type FieldFormValues = z.infer<typeof fieldSchema>;

interface FieldFormDialogProps {
  venueId: string;
  field?: Field | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function FieldFormDialog({
  venueId,
  field,
  open,
  onOpenChange,
  onSuccess,
}: FieldFormDialogProps) {
  const isEditing = !!field;
  const createMutation = useCreateField(venueId);
  const updateMutation = useUpdateField(venueId);

  const form = useForm<FieldFormValues>({
    resolver: zodResolver(fieldSchema),
    defaultValues: { name: '', surface: '', capacity: '' },
  });

  useEffect(() => {
    if (!open) return;
    if (field) {
      form.reset({
        name: field.name,
        surface: field.surface ?? '',
        capacity: field.capacity != null ? String(field.capacity) : '',
      });
    } else {
      form.reset({ name: '', surface: '', capacity: '' });
    }
  }, [open, field, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = {
        name: values.name,
        surface: values.surface || undefined,
        capacity: values.capacity ? parseInt(values.capacity) : undefined,
      };
      if (isEditing && field) {
        await updateMutation.mutateAsync({ id: field.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      form.setError('root', { message: getApiErrorMessage(err) });
    }
  });

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Edit Field' : 'Add Field'}
      onSubmit={onSubmit}
      isSubmitting={createMutation.isPending || updateMutation.isPending}
      submitLabel={isEditing ? 'Update' : 'Add Field'}
    >
      <FormError message={form.formState.errors.root?.message} />
      <TextInputField control={form.control} name="name" label="Field Name" placeholder="Main Pitch" />
      <TextInputField control={form.control} name="surface" label="Surface" placeholder="Grass, Turf, Indoor…" />
      <TextInputField control={form.control} name="capacity" label="Capacity" type="number" />
    </FormDialog>
  );
}
