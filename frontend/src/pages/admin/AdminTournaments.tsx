import AdminLayout from '@/components/AdminLayout';
import AdminTable from '@/components/AdminTable';
import QueryState from '@/components/shared/QueryState';
import TournamentFormDialog from '@/components/admin/forms/TournamentFormDialog';
import { useFormDialog } from '@/hooks/useFormDialog';
import { useTournaments, useDeleteTournament } from '@/hooks/useTournaments';
import type { Tournament } from '@/types';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { getApiErrorMessage } from '@/lib/errors';

const columns = [
  {
    key: 'name',
    label: 'Tournament',
    render: (t: Tournament) => (
      <div>
        <p className="font-semibold text-foreground">{t.name}</p>
        <p className="text-xs text-muted-foreground">{t.slug}</p>
      </div>
    ),
  },
  {
    key: 'status',
    label: 'Status',
    render: (t: Tournament) => (
      <Badge variant={t.status === 'ACTIVE' ? 'live' : t.status === 'COMPLETED' ? 'success' : 'default'}>
        {t.status}
      </Badge>
    ),
  },
  { key: 'location', label: 'Location' },
  {
    key: 'start_date',
    label: 'Dates',
    render: (t: Tournament) => (
      <span className="text-xs text-muted-foreground">
        {formatDate(t.start_date)} – {formatDate(t.end_date)}
      </span>
    ),
  },
  {
    key: 'tournament_type',
    label: 'Type',
    render: (t: Tournament) => (
      <span className="text-xs">{t.tournament_type.replace(/_/g, ' ')}</span>
    ),
  },
];

export default function AdminTournaments() {
  const { data: tournaments = [], isLoading, isError, refetch } = useTournaments();
  const deleteMutation = useDeleteTournament();
  const formDialog = useFormDialog<Tournament>();

  const handleDelete = async (t: Tournament) => {
    if (!confirm(`Delete "${t.name}"?`)) return;
    try {
      await deleteMutation.mutateAsync(t.id);
    } catch (err) {
      alert(getApiErrorMessage(err, 'Failed to delete tournament'));
    }
  };

  return (
    <AdminLayout title="Tournaments">
      <QueryState isLoading={isLoading} isError={isError} onRetry={() => refetch()}>
        <AdminTable
          title="All Tournaments"
          data={tournaments}
          columns={columns}
          onAdd={formDialog.openCreate}
          onEdit={formDialog.openEdit}
          onDelete={handleDelete}
          searchKeys={['name', 'location']}
        />
      </QueryState>

      <TournamentFormDialog
        open={formDialog.open}
        onOpenChange={(open) => (open ? formDialog.setOpen(true) : formDialog.close())}
        tournament={formDialog.editing}
      />
    </AdminLayout>
  );
}
