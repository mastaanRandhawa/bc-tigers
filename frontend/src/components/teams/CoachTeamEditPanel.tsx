import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import Section from '@/components/shared/Section';
import SectionHeader from '@/components/shared/SectionHeader';
import { useTeamRoute } from '@/context/TeamContext';
import { useAuthStore } from '@/store/authStore';
import { canManageTeam } from '@/lib/coach-utils';
import { useUpdateTeam } from '@/hooks/useTeamManagement';
import { getApiErrorMessage } from '@/lib/errors';
import { Save } from 'lucide-react';

export default function CoachTeamEditPanel() {
  const { team, tournamentSlug, divisionSlug, teamSlug } = useTeamRoute();
  const user = useAuthStore((s) => s.user);
  const canEdit = canManageTeam(user, team.id);
  const updateMutation = useUpdateTeam();

  const [form, setForm] = useState({
    name: team.name,
    city: team.city ?? '',
    primary_color: team.primary_color ?? '',
    secondary_color: team.secondary_color ?? '',
    logo: team.logo ?? '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  if (!canEdit) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      await updateMutation.mutateAsync({
        id: team.id,
        data: {
          name: form.name,
          city: form.city || undefined,
          primary_color: form.primary_color || undefined,
          secondary_color: form.secondary_color || undefined,
          logo: form.logo || undefined,
        },
      });
      setMessage('Team updated.');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to update team'));
    }
  };

  return (
    <Section>
      <SectionHeader title="Edit team" />
      {message && <p className="text-sm text-green-700 mb-3">{message}</p>}
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      <form onSubmit={handleSave} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="team-name">Team name</Label>
          <Input
            id="team-name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="team-city">City</Label>
          <Input
            id="team-city"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="team-logo">Logo URL</Label>
          <Input
            id="team-logo"
            value={form.logo}
            onChange={(e) => setForm({ ...form, logo: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="team-primary">Primary color</Label>
          <Input
            id="team-primary"
            type="color"
            value={form.primary_color || '#F48735'}
            onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="team-secondary">Secondary color</Label>
          <Input
            id="team-secondary"
            type="color"
            value={form.secondary_color || '#1a1a1a'}
            onChange={(e) => setForm({ ...form, secondary_color: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={updateMutation.isPending}>
            <Save className="h-4 w-4" />
            {updateMutation.isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </form>
      <p className="mt-2 text-xs text-zinc-500">
        Editing {teamSlug} in {divisionSlug} ({tournamentSlug})
      </p>
    </Section>
  );
}
