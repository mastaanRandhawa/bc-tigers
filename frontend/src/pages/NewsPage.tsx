import { Link } from 'react-router-dom';
import PageLayout from '@/components/PageLayout';
import QueryState from '@/components/shared/QueryState';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { formatDate } from '@/lib/utils';
import { Calendar, ChevronRight } from 'lucide-react';
import type { AnnouncementCategory } from '@/types';

const categoryColors: Record<AnnouncementCategory, string> = {
  ANNOUNCEMENT: 'bg-[#0038FF] text-white',
  RESULTS: 'bg-green-500 text-white',
  NEWS: 'bg-gray-200 text-gray-800',
  REGISTRATION: 'bg-[#CCFF00] text-black',
};

const categoryLabels: Record<AnnouncementCategory, string> = {
  ANNOUNCEMENT: 'Announcement',
  RESULTS: 'Results',
  NEWS: 'News',
  REGISTRATION: 'Registration',
};

export default function NewsPage() {
  const { data: news = [], isLoading } = useAnnouncements();
  const featured = news[0];

  return (
    <PageLayout>
      <div className="bg-[#0038FF] text-white py-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:3rem_3rem]" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter text-[#CCFF00]" style={{ fontFamily: '"Arial Black", Impact, sans-serif', textShadow: '4px 4px 0 #001A99' }}>
            News & Updates
          </h1>
        </div>
      </div>

      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <QueryState isLoading={isLoading} isEmpty={news.length === 0} emptyMessage="No news articles yet.">
            {featured && (
              <div className="mb-10">
                <Link to={`/news/${featured.slug}`} className="group block bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-all">
                  <div className="grid grid-cols-1 md:grid-cols-2">
                    {featured.image_url && (
                      <img src={featured.image_url} alt={featured.title} className="h-64 md:h-full w-full object-cover" />
                    )}
                    <div className="p-8 flex flex-col justify-center">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full w-fit mb-3 ${categoryColors[featured.category]}`}>
                        {categoryLabels[featured.category]}
                      </span>
                      <h2 className="text-2xl font-black text-gray-900 group-hover:text-[#0038FF] transition-colors leading-tight">{featured.title}</h2>
                      <p className="text-gray-500 mt-3 text-sm">{featured.excerpt}</p>
                      <div className="flex items-center gap-2 mt-4 text-xs text-gray-400">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(featured.published_at)}</span>
                      </div>
                      <span className="mt-4 text-sm font-semibold text-[#0038FF] flex items-center gap-1">
                        Read more <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {news.slice(1).map((article) => (
                <Link key={article.id} to={`/news/${article.slug}`} className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-all flex flex-col">
                  {article.image_url && (
                    <img src={article.image_url} alt={article.title} className="h-44 w-full object-cover" />
                  )}
                  <div className="p-5 flex flex-col flex-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full w-fit mb-2 ${categoryColors[article.category]}`}>
                      {categoryLabels[article.category]}
                    </span>
                    <h3 className="font-black text-gray-900 group-hover:text-[#0038FF] transition-colors leading-snug">{article.title}</h3>
                    <p className="text-xs text-gray-500 mt-2 flex-1 line-clamp-3">{article.excerpt}</p>
                    <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(article.published_at)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </QueryState>
        </div>
      </section>
    </PageLayout>
  );
}
