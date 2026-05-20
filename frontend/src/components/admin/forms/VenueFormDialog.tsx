import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import FormDialog from '@/components/admin/FormDialog';
import { TextInputField, TextareaField, FormError } from '@/components/admin/form-fields';
import { venueSchema, type VenueFormValues } from '@/lib/schemas/admin';
import { useCreateVenue, useUpdateVenue } from '@/hooks/useVenues';
import { slugify } from '@/lib/utils';
import { getApiErrorMessage } from '@/lib/errors';
import type { Venue } from '@/types';

interface VenueFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  venue?: Venue | null;
}

export default function VenueFormDialog({ open, onOpenChange, venue }: VenueFormDialogProps) {
  const createMutation = useCreateVenue();
  const updateMutation = useUpdateVenue();
  const isEditing = !!venue;

  const form = useForm<VenueFormValues>({
    resolver: zodResolver(venueSchema),
    defaultValues: { name: '', slug: '', address: '', city: '', parking_info: '' },
  });

  useEffect(() => {
    if (!open) return;
    if (venue) {
      form.reset({
        name: venue.name,
        slug: venue.slug,
        address: venue.address,
        city: venue.city,
        parking_info: venue.parking_info ?? '',
      });
    } else {
      form.reset({ name: '', slug: '', address: '', city: '', parking_info: '' });
    }
  }, [open, venue, form]);

  const name = form.watch('name');
  useEffect(() => {
    if (!isEditing && name) form.setValue('slug', slugify(name));
  }, [name, isEditing, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (isEditing && venue) {
        await updateMutation.mutateAsync({ id: venue.id, data: values });
      } else {
        await createMutation.mutateAsync(values);
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
      title={isEditing ? 'Edit Venue' : 'Add Venue'}
      onSubmit={onSubmit}
      isSubmitting={createMutation.isPending || updateMutation.isPending}
    >
      <FormError message={form.formState.errors.root?.message} />
      <TextInputField control={form.control} name="name" label="Name" />
      <TextInputField control={form.control} name="slug" label="Slug" />
      <TextInputField control={form.control} name="address" label="Address" />
      <TextInputField control={form.control} name="city" label="City" />
      <TextareaField control={form.control} name="parking_info" label="Parking Info" />
    </FormDialog>
  );
}
