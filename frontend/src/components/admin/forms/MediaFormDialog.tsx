import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import FormDialog from '@/components/admin/FormDialog';
import { TextInputField, TextareaField, SelectField, FormError } from '@/components/admin/form-fields';
import { mediaSchema, type MediaFormValues } from '@/lib/schemas/admin';
import { useUploadMedia } from '@/hooks/useMedia';
import { useTournaments } from '@/hooks/useTournaments';
import { getApiErrorMessage } from '@/lib/errors';

const TYPE_OPTIONS = [
  { value: 'PHOTO', label: 'Photo' },
  { value: 'VIDEO', label: 'Video' },
  { value: 'DOCUMENT', label: 'Document' },
];

interface MediaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function MediaFormDialog({ open, onOpenChange }: MediaFormDialogProps) {
  const { data: tournaments = [] } = useTournaments();
  const uploadMutation = useUploadMedia();

  const form = useForm<MediaFormValues>({
    resolver: zodResolver(mediaSchema),
    defaultValues: {
      url: '',
      type: 'PHOTO',
      title: '',
      description: '',
      tournament_id: '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        url: '',
        type: 'PHOTO',
        title: '',
        description: '',
        tournament_id: tournaments[0]?.id ?? '',
      });
    }
  }, [open, form, tournaments]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await uploadMutation.mutateAsync({
        url: values.url,
        type: values.type,
        title: values.title,
        description: values.description,
        tournament_id: values.tournament_id || undefined,
      });
      onOpenChange(false);
    } catch (err) {
      form.setError('root', { message: getApiErrorMessage(err) });
    }
  });

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add Media"
      description="Paste a public URL to an image or video hosted elsewhere."
      onSubmit={onSubmit}
      isSubmitting={uploadMutation.isPending}
      submitLabel="Add Media"
    >
      <FormError message={form.formState.errors.root?.message} />
      <TextInputField control={form.control} name="url" label="Media URL" placeholder="https://..." />
      <SelectField control={form.control} name="type" label="Type" options={TYPE_OPTIONS} />
      <TextInputField control={form.control} name="title" label="Title" />
      <TextareaField control={form.control} name="description" label="Description" />
      <SelectField
        control={form.control}
        name="tournament_id"
        label="Tournament"
        options={[{ value: '', label: 'None' }, ...tournaments.map((t) => ({ value: t.id, label: t.name }))]}
      />
    </FormDialog>
  );
}
