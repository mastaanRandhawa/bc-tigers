import AdminLayout from '@/components/AdminLayout';
import AdminTable from '@/components/AdminTable';
import QueryState from '@/components/shared/QueryState';
import TournamentFormDialog from '@/components/admin/forms/TournamentFormDialog';
import { useFormDialog } from '@/hooks/useFormDialog';
import { useTournaments, useDeleteTournament } from '@/hooks/useTournaments';
import type { Tournament } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { getApiErrorMessage } from '@/lib/errors';
import { useNavigate } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { ConfirmDialog } from '@/components/admin/inline/ConfirmDialog';
import { useState } from 'react';

export default function AdminTournaments() {
  const navigate = useNavigate();
  const { data: tournaments = [], isLoading, isError, refetch } = useTournaments();
  const deleteMutation = useDeleteTournament();
  const formDialog = useFormDialog<Tournament>();
  const [deleteTarget, setDeleteTarget] = useState<Tournament | null>(null);

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
    {
      key: 'workspace',
      label: 'Workspace',
      render: (t: Tournament) => (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/admin/tournaments/${t.id}`);
          }}
          className="gap-1.5"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Open
        </Button>
      ),
    },
  ];

  return (
    <AdminLayout title="Tournaments">
      <QueryState isLoading={isLoading} isError={isError} onRetry={() => refetch()}>
        <AdminTable
          title="All Tournaments"
          data={tournaments}
          columns={columns}
          onAdd={formDialog.openCreate}
          onEdit={formDialog.openEdit}
          onDelete={(t) => setDeleteTarget(t)}
          searchKeys={['name', 'location']}
        />
      </QueryState>

      <TournamentFormDialog
        open={formDialog.open}
        onOpenChange={(open) => (open ? formDialog.setOpen(true) : formDialog.close())}
        tournament={formDialog.editing}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.name}"?`}
        description="This will permanently delete the tournament and all associated data."
        confirmLabel="Delete"
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteMutation.mutateAsync(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </AdminLayout>
  );
}
