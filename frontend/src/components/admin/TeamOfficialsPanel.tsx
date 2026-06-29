import { useState } from 'react';
import {
  useTeamOfficials,
  useCreateTeamOfficial,
  useUpdateTeamOfficial,
  useDeleteTeamOfficial,
  MAX_OFFICIALS_PER_TEAM,
} from '@/hooks/useTeamOfficials';
import QueryState from '@/components/shared/QueryState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/admin/inline/ConfirmDialog';
import { getApiErrorMessage } from '@/lib/errors';
import { UserPlus, Briefcase, Check, X } from 'lucide-react';
import type { Team, TeamOfficial } from '@/types';

interface TeamOfficialsPanelProps {
  team: Team;
}

/** Common role suggestions — free-form, not enforced. */
const ROLE_SUGGESTIONS = ['Manager', 'Head Coach', 'Assistant Coach', 'Physio'];

export default function TeamOfficialsPanel({ team }: TeamOfficialsPanelProps) {
  const { data: officials = [], isLoading } = useTeamOfficials(team.id);
  const createMutation = useCreateTeamOfficial();
  const updateMutation = useUpdateTeamOfficial();
  const deleteMutation = useDeleteTeamOfficial();

  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ name: '', role: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({ name: '', role: '' });
  const [deleteTarget, setDeleteTarget] = useState<TeamOfficial | null>(null);
  const [error, setError] = useState('');

  const atCap = officials.length >= MAX_OFFICIALS_PER_TEAM;

  const resetAdd = () => {
    setAdding(false);
    setDraft({ name: '', role: '' });
  };

  const handleAdd = async () => {
    if (!draft.name.trim() || !draft.role.trim()) {
      setError('Name and role are required.');
      return;
    }
    try {
      await createMutation.mutateAsync({ teamId: team.id, data: draft });
      resetAdd();
      setError('');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to add official'));
    }
  };

  const startEdit = (official: TeamOfficial) => {
    setEditingId(official.id);
    setEditDraft({ name: official.name, role: official.role });
  };

  const handleEditSave = async () => {
    if (!editingId) return;
    try {
      await updateMutation.mutateAsync({
        teamId: team.id,
        officialId: editingId,
        data: editDraft,
      });
      setEditingId(null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to update official'));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync({ teamId: team.id, officialId: deleteTarget.id });
      setDeleteTarget(null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to remove official'));
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="m-0 text-sm font-semibold text-foreground">Team Officials — {team.name}</h3>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Briefcase className="h-3.5 w-3.5" aria-hidden />
          {officials.length} / {MAX_OFFICIALS_PER_TEAM}
        </span>
      </div>

      {error && (
        <p className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <QueryState isLoading={isLoading} isEmpty={officials.length === 0 && !adding} emptyMessage="No team officials added yet">
        <ul className="divide-y divide-border">
          {officials.map((official) => (
            <li key={official.id} className="flex items-center justify-between gap-2 py-2 text-sm">
              {editingId === official.id ? (
                <div className="flex flex-1 flex-wrap items-center gap-2">
                  <Input
                    value={editDraft.role}
                    onChange={(e) => setEditDraft((d) => ({ ...d, role: e.target.value }))}
                    placeholder="Role"
                    className="h-8 w-36"
                    list="official-role-suggestions"
                  />
                  <Input
                    value={editDraft.name}
                    onChange={(e) => setEditDraft((d) => ({ ...d, name: e.target.value }))}
                    placeholder="Name"
                    className="h-8 flex-1 min-w-[8rem]"
                  />
                  <Button size="sm" className="h-8 px-2" onClick={handleEditSave} disabled={updateMutation.isPending}>
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => setEditingId(null)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <>
                  <span className="min-w-0 text-foreground">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {official.role}
                    </span>
                    <span className="ml-2">{official.name}</span>
                  </span>
                  <div className="flex shrink-0 gap-1.5">
                    <Button variant="outline" size="sm" onClick={() => startEdit(official)}>
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600" onClick={() => setDeleteTarget(official)}>
                      Remove
                    </Button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </QueryState>

      {adding && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Input
            value={draft.role}
            onChange={(e) => setDraft((d) => ({ ...d, role: e.target.value }))}
            placeholder="Role (e.g. Manager)"
            className="h-8 w-40"
            list="official-role-suggestions"
          />
          <Input
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            placeholder="Full name"
            className="h-8 flex-1 min-w-[8rem]"
          />
          <Button size="sm" className="h-8" onClick={handleAdd} disabled={createMutation.isPending}>
            Save
          </Button>
          <Button size="sm" variant="outline" className="h-8" onClick={resetAdd}>
            Cancel
          </Button>
        </div>
      )}

      <datalist id="official-role-suggestions">
        {ROLE_SUGGESTIONS.map((r) => (
          <option key={r} value={r} />
        ))}
      </datalist>

      {!adding && (
        <div className="mt-3">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => {
              setError('');
              setAdding(true);
            }}
            disabled={atCap}
          >
            <UserPlus className="h-3.5 w-3.5" />
            Add official
          </Button>
          {atCap && (
            <p className="mt-2 text-xs text-amber-700">
              Maximum of {MAX_OFFICIALS_PER_TEAM} officials reached. Remove one to add another.
            </p>
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Remove official?"
        description={deleteTarget ? `Remove ${deleteTarget.name} (${deleteTarget.role}) from ${team.name}?` : ''}
        confirmLabel="Remove"
        onConfirm={handleDelete}
      />
    </div>
  );
}
