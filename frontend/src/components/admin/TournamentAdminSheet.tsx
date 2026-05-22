import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/admin/inline/ConfirmDialog';
import {
  useTournamentAdmins,
  useAssignTournamentAdmin,
  useRevokeTournamentAdmin,
} from '@/hooks/useTournamentAdmins';
import { useUsers } from '@/hooks/useUsers';
import { getApiErrorMessage } from '@/lib/errors';
import { UserPlus, Trash2 } from 'lucide-react';
import QueryState from '@/components/shared/QueryState';

const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'VIEWER', label: 'Viewer' },
];

interface TournamentAdminSheetProps {
  tournamentId: string;
  tournamentName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TournamentAdminSheet({
  tournamentId,
  tournamentName,
  open,
  onOpenChange,
}: TournamentAdminSheetProps) {
  const { data: admins = [], isLoading, isError, refetch } = useTournamentAdmins(
    open ? tournamentId : undefined,
  );
  const { data: users = [] } = useUsers();
  const assignMutation = useAssignTournamentAdmin(tournamentId);
  const revokeMutation = useRevokeTournamentAdmin(tournamentId);

  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('ADMIN');
  const [assignError, setAssignError] = useState('');
  const [revokeId, setRevokeId] = useState<string | null>(null);

  const assignedUserIds = new Set(admins.map((a) => a.user_id));
  const availableUsers = users.filter((u) => !assignedUserIds.has(u.id));

  const handleAssign = async () => {
    if (!selectedUserId) return;
    setAssignError('');
    try {
      await assignMutation.mutateAsync({ user_id: selectedUserId, role: selectedRole });
      setSelectedUserId('');
    } catch (err) {
      setAssignError(getApiErrorMessage(err, 'Failed to assign admin'));
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Tournament Admins</SheetTitle>
            <SheetDescription>
              {tournamentName
                ? `Manage admin access for ${tournamentName}`
                : 'Manage tournament-scoped admin access'}
            </SheetDescription>
          </SheetHeader>

          <SheetBody className="space-y-5">
            <QueryState isLoading={isLoading} isError={isError} onRetry={() => refetch()}>
              {admins.length === 0 ? (
                <p className="text-sm text-muted-foreground">No admins assigned yet.</p>
              ) : (
                <ul className="divide-y divide-border rounded-lg border border-border">
                  {admins.map((admin) => (
                    <li key={admin.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {admin.user?.first_name} {admin.user?.last_name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{admin.user?.email}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="secondary" className="text-xs">
                          {admin.role}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                          onClick={() => setRevokeId(admin.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </QueryState>

            <div className="space-y-3 rounded-lg border border-border p-3">
              <p className="text-sm font-medium text-foreground">Grant Access</p>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user…" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.first_name} {u.last_name} ({u.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {assignError && (
                <p className="text-xs text-destructive">{assignError}</p>
              )}
              <Button
                size="sm"
                className="w-full gap-1.5"
                disabled={!selectedUserId || assignMutation.isPending}
                onClick={handleAssign}
              >
                <UserPlus className="h-3.5 w-3.5" />
                {assignMutation.isPending ? 'Assigning…' : 'Grant Access'}
              </Button>
            </div>
          </SheetBody>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!revokeId}
        onOpenChange={(o) => !o && setRevokeId(null)}
        title="Revoke admin access?"
        description="This admin will no longer have access to manage this tournament."
        confirmLabel="Revoke"
        onConfirm={async () => {
          if (!revokeId) return;
          await revokeMutation.mutateAsync(revokeId);
          setRevokeId(null);
        }}
      />
    </>
  );
}
