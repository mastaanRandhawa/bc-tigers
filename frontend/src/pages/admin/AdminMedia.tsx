import { useCallback, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import QueryState from '@/components/shared/QueryState';
import SearchField from '@/components/shared/SearchField';
import SearchEmpty from '@/components/shared/SearchEmpty';
import { useListSearch } from '@/hooks/useListSearch';
import MediaFormDialog from '@/components/admin/forms/MediaFormDialog';
import { useMedia, useDeleteMedia } from '@/hooks/useMedia';
import { Upload, Image, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getApiErrorMessage } from '@/lib/errors';

export default function AdminMedia() {
  const { data: media = [], isLoading, isError, refetch } = useMedia();
  const deleteMutation = useDeleteMedia();
  const [formOpen, setFormOpen] = useState(false);
  const getText = useCallback(
    (item: (typeof media)[0]) => [item.title, item.type, item.url].filter(Boolean).join(' '),
    [],
  );
  const { search, setSearch, filtered, debouncedSearch, hasQuery } = useListSearch(media, getText);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this media?')) return;
    try {
      await deleteMutation.mutateAsync(id);
    } catch (err) {
      alert(getApiErrorMessage(err, 'Failed to delete media'));
    }
  };

  return (
    <AdminLayout title="Division Media">
      <div className="space-y-6">
        <div
          className="bg-white rounded-2xl border-2 border-dashed border-border p-10 text-center hover:border-primary transition-colors cursor-pointer"
          onClick={() => setFormOpen(true)}
        >
          <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="font-bold text-muted-foreground">Add media by URL</p>
          <p className="text-xs text-muted-foreground mt-1">Photos, videos, and documents</p>
          <Button size="sm" className="mt-4" onClick={() => setFormOpen(true)}>
            <Upload className="w-4 h-4" /> Add Media
          </Button>
        </div>

        {media.length > 0 && (
          <SearchField
            value={search}
            onChange={setSearch}
            placeholder="Search media…"
            className="mb-4 max-w-md"
          />
        )}

        <QueryState
          isLoading={isLoading}
          isError={isError}
          isEmpty={media.length === 0}
          onRetry={() => refetch()}
          emptyMessage="No media uploaded yet."
        >
          {hasQuery && filtered.length === 0 ? (
            <SearchEmpty query={debouncedSearch} entityLabel="media" />
          ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="group relative bg-white rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-md transition-all"
              >
                <div className="aspect-video overflow-hidden">
                  <img
                    src={item.url}
                    alt={item.title ?? ''}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-3">
                  <p className="text-xs font-semibold text-gray-700 truncate">{item.title ?? 'Untitled'}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <Image className="w-3 h-3" /> {item.type}
                    </span>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}
        </QueryState>
      </div>

      <MediaFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </AdminLayout>
  );
}
