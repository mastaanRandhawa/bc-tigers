import AdminLayout from '@/components/AdminLayout';
import AdminTable from '@/components/AdminTable';
import QueryState from '@/components/shared/QueryState';
import VenueFormDialog from '@/components/admin/forms/VenueFormDialog';
import { useFormDialog } from '@/hooks/useFormDialog';
import { useVenues, useDeleteVenue } from '@/hooks/useVenues';
import type { Venue } from '@/types';
import { MapPin } from 'lucide-react';
import { getApiErrorMessage } from '@/lib/errors';

const columns = [
  {
    key: 'name',
    label: 'Venue',
    render: (v: Venue) => (
      <div className="flex items-center gap-3">
        {v.photos?.[0] ? (
          <img src={v.photos[0]} alt="" className="w-10 h-10 rounded-xl object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-muted-foreground" />
          </div>
        )}
        <div>
          <p className="font-bold text-foreground">{v.name}</p>
          <p className="text-xs text-muted-foreground">{v.slug}</p>
        </div>
      </div>
    ),
  },
  { key: 'city', label: 'City' },
  { key: 'address', label: 'Address' },
  {
    key: 'parking_info',
    label: 'Parking',
    render: (v: Venue) => (
      <span className="text-xs text-muted-foreground line-clamp-1">{v.parking_info ?? '—'}</span>
    ),
  },
];

export default function AdminVenues() {
  const { data: venues = [], isLoading, isError, refetch } = useVenues();
  const deleteMutation = useDeleteVenue();
  const formDialog = useFormDialog<Venue>();

  const handleDelete = async (v: Venue) => {
    if (!confirm(`Delete "${v.name}"?`)) return;
    try {
      await deleteMutation.mutateAsync(v.id);
    } catch (err) {
      alert(getApiErrorMessage(err, 'Failed to delete venue'));
    }
  };

  return (
    <AdminLayout title="Venues">
      <QueryState isLoading={isLoading} isError={isError} onRetry={() => refetch()}>
        <AdminTable
          title="All Venues"
          data={venues}
          columns={columns}
          onAdd={formDialog.openCreate}
          onEdit={formDialog.openEdit}
          onDelete={handleDelete}
          searchKeys={['name', 'city', 'address']}
        />
      </QueryState>

      <VenueFormDialog
        open={formDialog.open}
        onOpenChange={(open) => (open ? formDialog.setOpen(true) : formDialog.close())}
        venue={formDialog.editing}
      />
    </AdminLayout>
  );
}
