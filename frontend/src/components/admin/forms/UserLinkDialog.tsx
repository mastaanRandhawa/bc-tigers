import { useState } from 'react';
import FormDialog from '@/components/admin/FormDialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLinkUserEntity } from '@/hooks/useUsers';
import { usePlayers } from '@/hooks/usePlayers';
import { useCoaches } from '@/hooks/useCoaches';
import { useReferees } from '@/hooks/useReferees';
import { getApiErrorMessage } from '@/lib/errors';
import type { User } from '@/types';

interface UserLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
}

export default function UserLinkDialog({ open, onOpenChange, user }: UserLinkDialogProps) {
  const linkMutation = useLinkUserEntity();
  const { data: players = [] } = usePlayers();
  const { data: coaches = [] } = useCoaches();
  const { data: referees = [] } = useReferees();
  const [entityType, setEntityType] = useState<'player' | 'coach' | 'referee'>('player');
  const [entityId, setEntityId] = useState('');
  const [error, setError] = useState('');

  const options =
    entityType === 'player'
      ? players.map((p) => ({ id: p.id, label: `${p.first_name} ${p.last_name}` }))
      : entityType === 'coach'
        ? coaches.map((c) => ({ id: c.id, label: `${c.first_name} ${c.last_name}` }))
        : referees.map((r) => ({ id: r.id, label: `${r.first_name} ${r.last_name}` }));

  const handleSubmit = async () => {
    if (!user || !entityId) return;
    setError('');
    try {
      await linkMutation.mutateAsync({
        id: user.id,
        data: { entity_type: entityType, entity_id: entityId },
      });
      onOpenChange(false);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  if (!user) return null;

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Link User to Profile"
      description={`${user.first_name} ${user.last_name} (${user.email})`}
      onSubmit={handleSubmit}
      isSubmitting={linkMutation.isPending}
      submitLabel="Link"
    >
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label>Entity type</Label>
          <Select
            value={entityType}
            onValueChange={(v) => {
              setEntityType(v as typeof entityType);
              setEntityId('');
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="player">Player</SelectItem>
              <SelectItem value="coach">Coach</SelectItem>
              <SelectItem value="referee">Referee</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Profile</Label>
          <Select value={entityId} onValueChange={setEntityId}>
            <SelectTrigger>
              <SelectValue placeholder="Select…" />
            </SelectTrigger>
            <SelectContent>
              {options.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </FormDialog>
  );
}
