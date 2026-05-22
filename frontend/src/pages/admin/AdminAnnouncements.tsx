import { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateNotification } from '@/hooks/useCreateNotification';
import { useTournaments } from '@/hooks/useTournaments';
import { useUsers } from '@/hooks/useUsers';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getApiErrorMessage } from '@/lib/errors';
import { Megaphone } from 'lucide-react';

export default function AdminAnnouncements() {
  const createMutation = useCreateNotification();
  const { data: tournaments = [] } = useTournaments();
  const { data: users = [] } = useUsers();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [tournamentId, setTournamentId] = useState('');
  const [userId, setUserId] = useState('__broadcast__');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess('');
    try {
      await createMutation.mutateAsync({
        title,
        message,
        type: 'ANNOUNCEMENT',
        tournament_id: tournamentId || undefined,
        user_id: userId === '__broadcast__' ? undefined : userId,
      });
      setTitle('');
      setMessage('');
      setSuccess('Announcement published.');
    } catch (err) {
      alert(getApiErrorMessage(err, 'Failed to publish'));
    }
  };

  return (
    <AdminLayout title="Announcements">
      <div className="max-w-xl admin-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Megaphone className="h-5 w-5 text-primary" aria-hidden />
          <h2 className="text-subsection m-0">Publish announcement</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Broadcast announcements appear on the home page. Targeted notifications go to one user.
        </p>
        {success && <p className="text-sm text-green-600 mb-4">{success}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Message</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} required rows={4} />
          </div>
          <div className="space-y-1.5">
            <Label>Tournament (optional)</Label>
            <Select value={tournamentId || '__none__'} onValueChange={(v) => setTournamentId(v === '__none__' ? '' : v)}>
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
          <div className="space-y-1.5">
            <Label>Audience</Label>
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__broadcast__">Everyone (home page)</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.first_name} {u.last_name} ({u.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Publishing…' : 'Publish'}
          </Button>
        </form>
      </div>
    </AdminLayout>
  );
}
