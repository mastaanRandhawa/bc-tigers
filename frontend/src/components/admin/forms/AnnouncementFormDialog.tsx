import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import FormDialog from '@/components/admin/FormDialog';
import { FormError } from '@/components/admin/form-fields';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateAnnouncement, useUpdateAnnouncement } from '@/hooks/useAnnouncements';
import { useTournaments } from '@/hooks/useTournaments';
import { getApiErrorMessage } from '@/lib/errors';
import type { Announcement } from '@/types';

interface AnnouncementFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  announcement?: Announcement | null;
}

interface FormValues {
  title: string;
  message: string;
  type: string;
  tournament_id: string;
}

const TYPES = ['ANNOUNCEMENT', 'INFO', 'WARNING', 'SUCCESS'] as const;

export default function AnnouncementFormDialog({
  open,
  onOpenChange,
  announcement,
}: AnnouncementFormDialogProps) {
  const createMutation = useCreateAnnouncement();
  const updateMutation = useUpdateAnnouncement();
  const { data: tournaments = [] } = useTournaments();
  const isEditing = !!announcement;

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting }, setError, clearErrors } = useForm<FormValues>({
    defaultValues: { title: '', message: '', type: 'ANNOUNCEMENT', tournament_id: '__none__' },
  });

  const tournamentId = watch('tournament_id');
  const type = watch('type');

  useEffect(() => {
    if (!open) return;
    if (announcement) {
      reset({
        title: announcement.title,
        message: announcement.message,
        type: announcement.type ?? 'ANNOUNCEMENT',
        tournament_id: announcement.tournament_id ?? '__none__',
      });
    } else {
      reset({ title: '', message: '', type: 'ANNOUNCEMENT', tournament_id: '__none__' });
    }
  }, [open, announcement, reset]);

  const onSubmit = handleSubmit(async (values) => {
    clearErrors('root' as never);
    const payload = {
      title: values.title,
      message: values.message,
      type: values.type,
      tournament_id: values.tournament_id === '__none__' ? undefined : values.tournament_id,
    };
    try {
      if (isEditing && announcement) {
        await updateMutation.mutateAsync({
          id: announcement.id,
          data: {
            ...payload,
            tournament_id: values.tournament_id === '__none__' ? null : values.tournament_id,
          },
        });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onOpenChange(false);
    } catch (err) {
      setError('root' as never, { message: getApiErrorMessage(err) } as never);
    }
  });

  const rootError = (errors as Record<string, { message?: string }>)['root']?.message;

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Edit Announcement' : 'New Announcement'}
      description="Broadcast announcements appear on the home page for all visitors."
      onSubmit={onSubmit}
      isSubmitting={isSubmitting || createMutation.isPending || updateMutation.isPending}
      submitLabel={isEditing ? 'Save changes' : 'Publish'}
    >
      <FormError message={rootError} />

      <div className="space-y-1.5">
        <Label htmlFor="ann-title">Title</Label>
        <Input id="ann-title" {...register('title', { required: true })} />
        {errors.title && <p className="text-xs text-destructive">Title is required.</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="ann-message">Message</Label>
        <Textarea id="ann-message" rows={4} {...register('message', { required: true })} />
        {errors.message && <p className="text-xs text-destructive">Message is required.</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Type</Label>
        <Select value={type} onValueChange={(v) => setValue('type', v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t.charAt(0) + t.slice(1).toLowerCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Tournament (optional)</Label>
        <Select value={tournamentId} onValueChange={(v) => setValue('tournament_id', v)}>
          <SelectTrigger>
            <SelectValue placeholder="None" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">None</SelectItem>
            {tournaments.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </FormDialog>
  );
}
