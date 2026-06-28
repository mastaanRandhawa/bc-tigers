import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useTeams } from '@/hooks/useTeams';
import {
  useDivisionGroups,
  useCreateGroup,
  useDeleteGroup,
  useAssignTeamsToGroups,
} from '@/hooks/useGroups';
import { getApiErrorMessage } from '@/lib/errors';
import type { Division } from '@/types';

interface GroupManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  division: Division | null;
}

export default function GroupManagerDialog({
  open,
  onOpenChange,
  division,
}: GroupManagerDialogProps) {
  const divisionId = division?.id ?? '';
  const { data: groups = [] } = useDivisionGroups(divisionId, open);
  const { data: teams = [] } = useTeams({ divisionId });
  const createGroup = useCreateGroup(divisionId);
  const deleteGroup = useDeleteGroup(divisionId);
  const assignTeams = useAssignTeamsToGroups(divisionId);

  const [newGroupName, setNewGroupName] = useState('');
  // team_id -> group_id ("" = unassigned), edited locally then saved in bulk.
  const [assignments, setAssignments] = useState<Record<string, string>>({});

  const divisionTeams = useMemo(
    () => teams.filter((t) => t.division_id === divisionId),
    [teams, divisionId],
  );

  useEffect(() => {
    if (!open) return;
    const initial: Record<string, string> = {};
    for (const t of divisionTeams) initial[t.id] = t.group_id ?? '';
    setAssignments(initial);
  }, [open, divisionTeams]);

  const handleCreate = async () => {
    const name = newGroupName.trim();
    if (!name) return;
    try {
      await createGroup.mutateAsync({ name });
      setNewGroupName('');
      toast.success(`Group "${name}" created.`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to create group'));
    }
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      await deleteGroup.mutateAsync(id);
      toast.success(`Group "${name}" removed.`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to delete group'));
    }
  };

  const handleSaveAssignments = async () => {
    const payload = divisionTeams.map((t) => ({
      team_id: t.id,
      group_id: assignments[t.id] ? assignments[t.id] : null,
    }));
    try {
      await assignTeams.mutateAsync(payload);
      toast.success('Team assignments saved.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to save assignments'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage groups — {division?.name}</DialogTitle>
          <DialogDescription>
            Create pools and assign each team to one. Standings are recalculated
            per group automatically.
          </DialogDescription>
        </DialogHeader>

        {!division?.groups_enabled && (
          <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
            Groups are currently disabled for this division. Enable “groups
            (pools)” in the division settings for them to show on the public site.
          </p>
        )}

        <div className="space-y-4 py-2">
          <div>
            <h4 className="mb-2 text-sm font-semibold">Groups</h4>
            <div className="flex flex-wrap gap-2">
              {groups.length === 0 && (
                <p className="text-sm text-muted-foreground">No groups yet.</p>
              )}
              {groups.map((g) => (
                <span
                  key={g.id}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted px-2.5 py-1 text-xs font-medium"
                >
                  {g.name}
                  <button
                    type="button"
                    onClick={() => handleDelete(g.id, g.name)}
                    className="text-red-600 hover:text-red-700"
                    aria-label={`Delete ${g.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <Input
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="New group name (e.g. Pool A)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void handleCreate();
                  }
                }}
              />
              <Button
                type="button"
                onClick={handleCreate}
                disabled={createGroup.isPending || !newGroupName.trim()}
              >
                <Plus className="mr-1 h-4 w-4" />
                Add
              </Button>
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold">Team assignments</h4>
            {divisionTeams.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No teams in this division yet.
              </p>
            ) : (
              <div className="space-y-2">
                {divisionTeams.map((t) => (
                  <div key={t.id} className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-sm">{t.name}</span>
                    <select
                      value={assignments[t.id] ?? ''}
                      onChange={(e) =>
                        setAssignments((prev) => ({ ...prev, [t.id]: e.target.value }))
                      }
                      className="h-9 w-40 rounded-md border border-border bg-card px-2 text-sm"
                    >
                      <option value="">— Unassigned —</option>
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button
              type="button"
              onClick={handleSaveAssignments}
              disabled={assignTeams.isPending || divisionTeams.length === 0}
            >
              {assignTeams.isPending ? 'Saving…' : 'Save assignments'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
