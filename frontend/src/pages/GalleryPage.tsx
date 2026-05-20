import PageLayout from '@/components/PageLayout';
import QueryState from '@/components/shared/QueryState';
import { useMedia } from '@/hooks/useMedia';

export default function GalleryPage() {
  const { data: media = [], isLoading } = useMedia();
  const photos = media.filter((m) => m.type === 'PHOTO');

  return (
    <PageLayout>
      <div className="bg-[#0038FF] text-white py-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:3rem_3rem]" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter text-[#CCFF00]" style={{ fontFamily: '"Arial Black", Impact, sans-serif', textShadow: '4px 4px 0 #001A99' }}>
            Gallery
          </h1>
          <p className="text-white/80 mt-4">Moments from the pitch across BC</p>
        </div>
      </div>

      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <QueryState isLoading={isLoading} isEmpty={photos.length === 0} emptyMessage="No photos uploaded yet.">
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
              {photos.map((item) => (
                <div key={item.id} className="break-inside-avoid rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all group">
                  <img
                    src={item.url}
                    alt={item.title ?? 'Gallery photo'}
                    className="w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {item.title && (
                    <div className="bg-white px-4 py-2 text-sm font-semibold text-gray-700">{item.title}</div>
                  )}
                </div>
              ))}
            </div>
          </QueryState>
        </div>
      </section>
    </PageLayout>
  );
}
