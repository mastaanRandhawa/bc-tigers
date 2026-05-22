import { useState } from 'react';
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
import { useTournaments } from '@/hooks/useTournaments';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getApiErrorMessage } from '@/lib/errors';

interface AnnouncementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AnnouncementDialog({ open, onOpenChange }: AnnouncementDialogProps) {
  const createMutation = useCreateNotification();
  const { data: tournaments = [] } = useTournaments();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [tournamentId, setTournamentId] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await createMutation.mutateAsync({
        title,
        message,
        type: 'ANNOUNCEMENT',
        tournament_id: tournamentId || undefined,
      });
      setTitle('');
      setMessage('');
      setTournamentId('');
      onOpenChange(false);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to publish'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Publish Announcement</DialogTitle>
          <DialogDescription>
            Broadcast announcements appear on the home page for all visitors.
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
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Publishing…' : 'Publish'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
