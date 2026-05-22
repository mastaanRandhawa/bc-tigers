import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import DivisionPageHeader from '@/components/divisions/DivisionPageHeader';
import ResourceList from '@/components/shared/ResourceList';
import { useDivisionRoute } from '@/context/DivisionContext';
import { useDivisionVenues } from '@/hooks/useDivisionResources';
import { useListSearch } from '@/hooks/useListSearch';
import { venueSearchText } from '@/lib/search-text';
import { useCanAdminEdit } from '@/hooks/useCanAdminEdit';
import { AdminContextBar } from '@/components/admin/inline/AdminContextBar';
import { AdminActionButton } from '@/components/admin/inline/AdminActionButton';
import { ConfirmDialog } from '@/components/admin/inline/ConfirmDialog';
import VenueFormDialog from '@/components/admin/forms/VenueFormDialog';
import { useDeleteVenue } from '@/hooks/useVenues';
import { useFormDialog } from '@/hooks/useFormDialog';
import { useQueryClient } from '@tanstack/react-query';
import { MapPin, Plus, Pencil, Trash2 } from 'lucide-react';
import type { Venue } from '@/types';

export default function DivisionVenuesPage() {
  const { tournamentSlug, divisionSlug, basePath } = useDivisionRoute();
  const { data: venues = [], isLoading, isError, refetch } = useDivisionVenues(
    tournamentSlug,
    divisionSlug,
  );

  const canEdit = useCanAdminEdit();
  const venueDialog = useFormDialog<Venue>();
  const deleteMutation = useDeleteVenue();
  const [deleteTarget, setDeleteTarget] = useState<Venue | null>(null);
  const qc = useQueryClient();

  const getText = useCallback((v: (typeof venues)[0]) => venueSearchText(v), []);
  const { search, setSearch, filtered, debouncedSearch, hasQuery } = useListSearch(venues, getText);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    qc.invalidateQueries({ queryKey: ['division-resources'] });
    setDeleteTarget(null);
  };

  return (
    <>
      <DivisionPageHeader
        title="Venues"
        subtitle="Locations used for matches in this division"
      />

      <AdminContextBar
        label="Editing venues"
        advancedHref="/admin/venues"
        advancedLabel="All venues"
        actions={
          <AdminActionButton onClick={venueDialog.openCreate}>
            <Plus className="h-3 w-3" />
            Add venue
          </AdminActionButton>
        }
      />

      <ResourceList
        items={filtered}
        totalCount={venues.length}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search venues…"
        debouncedSearch={debouncedSearch}
        hasQuery={hasQuery}
        entityLabel="venues"
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        emptyMessage="No venues used in this division yet."
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {filtered.map((venue) => (
            <div key={venue.id} className="group relative">
              <Link
                to={`${basePath}/venues/${venue.slug}`}
                className="block rounded-xl bg-card p-4 shadow-sm border border-border transition-all duration-200 hover:shadow-md hover:border-primary/30"
              >
                <MapPin
                  className="mb-2 h-5 w-5"
                  style={{ color: 'var(--division-primary)' }}
                  aria-hidden
                />
                <h3 className="font-semibold text-foreground">{venue.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{venue.address}</p>
                {venue.city && <p className="mt-0.5 text-xs text-muted-foreground/60">{venue.city}</p>}
              </Link>

              {canEdit && (
                <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <AdminActionButton
                    size="xs"
                    variant="ghost"
                    onClick={(e) => { e.preventDefault(); venueDialog.openEdit(venue); }}
                    aria-label={`Edit ${venue.name}`}
                  >
                    <Pencil className="h-3 w-3" />
                  </AdminActionButton>
                  <AdminActionButton
                    size="xs"
                    variant="destructive"
                    onClick={(e) => { e.preventDefault(); setDeleteTarget(venue); }}
                    aria-label={`Delete ${venue.name}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </AdminActionButton>
                </div>
              )}
            </div>
          ))}
        </div>
      </ResourceList>

      {/* Dialogs */}
      <VenueFormDialog
        open={venueDialog.open}
        onOpenChange={venueDialog.setOpen}
        venue={venueDialog.editing}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete venue?"
        description={`"${deleteTarget?.name}" will be permanently removed.`}
        onConfirm={handleDelete}
      />
    </>
  );
}
