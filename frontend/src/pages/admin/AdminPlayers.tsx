import AdminLayout from '@/components/AdminLayout';
import AdminTable from '@/components/AdminTable';
import QueryState from '@/components/shared/QueryState';
import PlayerFormDialog from '@/components/admin/forms/PlayerFormDialog';
import { useFormDialog } from '@/hooks/useFormDialog';
import { usePlayers, useDeletePlayer } from '@/hooks/usePlayers';
import type { Player } from '@/types';
import { getApiErrorMessage } from '@/lib/errors';

const columns = [
  {
    key: 'name',
    label: 'Player',
    render: (p: Player) => (
      <div>
        <p className="font-bold text-foreground">
          {p.first_name} {p.last_name}
        </p>
        <p className="font-mono text-xs text-muted-foreground">{p.id.slice(0, 8)}…</p>
      </div>
    ),
  },
  {
    key: 'jersey_number',
    label: '#',
    render: (p: Player) => (
      <span className="w-7 h-7 bg-primary text-white text-xs font-black rounded-full flex items-center justify-center">
        {p.jersey_number ?? '?'}
      </span>
    ),
  },
  { key: 'preferred_position', label: 'Position' },
  { key: 'nationality', label: 'Nationality' },
];

export default function AdminPlayers() {
  const { data: players = [], isLoading, isError, refetch } = usePlayers();
  const deleteMutation = useDeletePlayer();
  const formDialog = useFormDialog<Player>();

  const handleDelete = async (p: Player) => {
    if (!confirm(`Delete "${p.first_name} ${p.last_name}"?`)) return;
    try {
      await deleteMutation.mutateAsync(p.id);
    } catch (err) {
      alert(getApiErrorMessage(err, 'Failed to delete player'));
    }
  };

  return (
    <AdminLayout title="Players">
      <QueryState isLoading={isLoading} isError={isError} onRetry={() => refetch()}>
        <AdminTable
          title="All Players"
          data={players}
          columns={columns}
          onAdd={formDialog.openCreate}
          onEdit={formDialog.openEdit}
          onDelete={handleDelete}
          searchKeys={['first_name', 'last_name', 'nationality']}
        />
      </QueryState>

      <PlayerFormDialog
        open={formDialog.open}
        onOpenChange={(open) => (open ? formDialog.setOpen(true) : formDialog.close())}
        player={formDialog.editing}
      />
    </AdminLayout>
  );
}
