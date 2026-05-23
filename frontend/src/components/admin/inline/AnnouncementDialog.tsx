import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateNotification } from '@/hooks/useCreateNotification';
import { useUpdateAnnouncement } from '@/hooks/useAnnouncements';
import { useTournaments } from '@/hooks/useTournaments';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getApiErrorMessage } from '@/lib/errors';
import type { Notification } from '@/types';

interface AnnouncementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pass an existing announcement to enter edit mode */
  announcement?: Notification | null;
}

export function AnnouncementDialog({ open, onOpenChange, announcement }: AnnouncementDialogProps) {
  const isEditing = !!announcement;
  const createMutation = useCreateNotification();
  const updateMutation = useUpdateAnnouncement();
  const { data: tournaments = [] } = useTournaments();

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [tournamentId, setTournamentId] = useState('');
  const [error, setError] = useState('');

  // Populate fields when switching to edit mode
  useEffect(() => {
    if (open) {
      setTitle(announcement?.title ?? '');
      setMessage(announcement?.message ?? '');
      setTournamentId(announcement?.tournament_id ?? '');
      setError('');
    }
  }, [open, announcement]);

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isEditing && announcement) {
        await updateMutation.mutateAsync({
          id: announcement.id,
          data: {
            title,
            message,
            tournament_id: tournamentId || null,
          },
        });
      } else {
        await createMutation.mutateAsync({
          title,
          message,
          type: 'ANNOUNCEMENT',
          tournament_id: tournamentId || undefined,
        });
      }
      onOpenChange(false);
    } catch (err) {
      setError(getApiErrorMessage(err, isEditing ? 'Failed to update' : 'Failed to publish'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Announcement' : 'Publish Announcement'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the title, message, or tournament association.'
              : 'Broadcast announcements appear on the home page for all visitors.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="space-y-1.5">
            <Label htmlFor="ann-title">Title</Label>
            <Input
              id="ann-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Season kickoff announcement…"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ann-msg">Message</Label>
            <Textarea
              id="ann-msg"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={4}
              placeholder="Write the full announcement text here…"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Tournament (optional)</Label>
            <Select
              value={tournamentId || '__none__'}
              onValueChange={(v) => setTournamentId(v === '__none__' ? '' : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None — show globally</SelectItem>
                {tournaments.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? isEditing
                  ? 'Saving…'
                  : 'Publishing…'
                : isEditing
                  ? 'Save changes'
                  : 'Publish'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
