import { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import AdminTable from '@/components/AdminTable';
import QueryState from '@/components/shared/QueryState';
import VenueFormDialog from '@/components/admin/forms/VenueFormDialog';
import { FieldFormDialog } from '@/components/admin/forms/FieldFormDialog';
import { ConfirmDialog } from '@/components/admin/inline/ConfirmDialog';
import { useFormDialog } from '@/hooks/useFormDialog';
import { useVenues, useDeleteVenue } from '@/hooks/useVenues';
import { useFields, useDeleteField } from '@/hooks/useFields';
import type { Field, Venue } from '@/types';
import { MapPin, ChevronDown, ChevronRight, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getApiErrorMessage } from '@/lib/errors';
import { ConfirmDialog as ConfirmDel } from '@/components/admin/inline/ConfirmDialog';

function VenueFieldsPanel({ venue }: { venue: Venue }) {
  const { data: fields = [], isLoading } = useFields(venue.id);
  const deleteField = useDeleteField(venue.id);
  const [fieldDialog, setFieldDialog] = useState<{ open: boolean; field: Field | null }>({ open: false, field: null });
  const [deleteFieldTarget, setDeleteFieldTarget] = useState<Field | null>(null);

  return (
    <div className="border-t border-border bg-muted/20 px-4 py-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Fields / Courts
        </p>
        <Button
          size="sm"
          variant="outline"
          className="h-6 px-2 text-xs gap-1"
          onClick={() => setFieldDialog({ open: true, field: null })}
        >
          <Plus className="h-3 w-3" />
          Add Field
        </Button>
      </div>

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Loading…</p>
      ) : fields.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">No fields added yet.</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {fields.map((f) => (
            <li key={f.id} className="flex items-center justify-between gap-2 px-3 py-2">
              <div>
                <p className="text-sm font-medium text-foreground">{f.name}</p>
                <p className="text-xs text-muted-foreground">
                  {[f.surface, f.capacity != null ? `Cap. ${f.capacity}` : null]
                    .filter(Boolean)
                    .join(' · ') || 'No details'}
                </p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={() => setFieldDialog({ open: true, field: f })}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                  onClick={() => setDeleteFieldTarget(f)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <FieldFormDialog
        venueId={venue.id}
        field={fieldDialog.field}
        open={fieldDialog.open}
        onOpenChange={(open) => setFieldDialog({ open, field: fieldDialog.field })}
      />
      <ConfirmDel
        open={!!deleteFieldTarget}
        onOpenChange={(open) => !open && setDeleteFieldTarget(null)}
        title={`Delete field "${deleteFieldTarget?.name}"?`}
        description="This will permanently remove the field."
        confirmLabel="Delete"
        onConfirm={async () => {
          if (!deleteFieldTarget) return;
          await deleteField.mutateAsync(deleteFieldTarget.id);
          setDeleteFieldTarget(null);
        }}
      />
    </div>
  );
}

export default function AdminVenues() {
  const { data: venues = [], isLoading, isError, refetch } = useVenues();
  const deleteMutation = useDeleteVenue();
  const formDialog = useFormDialog<Venue>();
  const [expandedVenues, setExpandedVenues] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<Venue | null>(null);

  const toggleExpanded = (id: string) => {
    setExpandedVenues((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const columns = [
    {
      key: 'expand',
      label: '',
      render: (v: Venue) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => toggleExpanded(v.id)}
          title="Toggle fields"
        >
          {expandedVenues.has(v.id) ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </Button>
      ),
    },
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
            <p className="font-semibold text-foreground">{v.name}</p>
            <p className="text-xs text-muted-foreground">{v.slug}</p>
          </div>
        </div>
      ),
    },
    { key: 'city', label: 'City' },
    { key: 'address', label: 'Address' },
    {
      key: 'fields_count',
      label: 'Fields',
      render: (v: Venue) => (
        <span className="text-xs text-muted-foreground">
          {v.fields?.length ?? 0} field{(v.fields?.length ?? 0) !== 1 ? 's' : ''}
        </span>
      ),
    },
  ];

  return (
    <AdminLayout title="Venues">
      <QueryState isLoading={isLoading} isError={isError} onRetry={() => refetch()}>
        <div className="space-y-0">
          <AdminTable
            title="All Venues"
            data={venues}
            columns={columns}
            onAdd={formDialog.openCreate}
            onEdit={formDialog.openEdit}
            onDelete={(v) => setDeleteTarget(v)}
            searchKeys={['name', 'city', 'address']}
          />
          {/* Expanded field sub-panels rendered below the table */}
          {venues.filter((v) => expandedVenues.has(v.id)).map((venue) => (
            <div key={`fields-${venue.id}`} className="rounded-b-lg border-x border-b border-border overflow-hidden -mt-1">
              <div className="px-3 py-1.5 bg-muted/30 text-xs font-medium text-muted-foreground border-b border-border">
                {venue.name} — Fields
              </div>
              <VenueFieldsPanel venue={venue} />
            </div>
          ))}
        </div>
      </QueryState>

      <VenueFormDialog
        open={formDialog.open}
        onOpenChange={(open) => (open ? formDialog.setOpen(true) : formDialog.close())}
        venue={formDialog.editing}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.name}"?`}
        description="This will permanently delete this venue and all associated field data."
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
