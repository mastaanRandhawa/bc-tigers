import { Link, useParams } from 'react-router-dom';
import PageLayout from '@/components/PageLayout';
import QueryState from '@/components/shared/QueryState';
import { useAnnouncement } from '@/hooks/useAnnouncements';
import { formatDate } from '@/lib/utils';
import { Calendar, ChevronLeft } from 'lucide-react';

export default function NewsDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: article, isLoading, isError } = useAnnouncement(slug);

  return (
    <PageLayout>
      <section className="py-12 px-4 bg-gray-50 min-h-[60vh]">
        <div className="max-w-3xl mx-auto">
          <Link to="/news" className="inline-flex items-center gap-1 text-sm text-[#0038FF] font-semibold hover:underline mb-6">
            <ChevronLeft className="w-4 h-4" /> Back to News
          </Link>

          <QueryState isLoading={isLoading} isError={isError} isEmpty={!article} emptyMessage="Article not found.">
            {article && (
              <article className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {article.image_url && (
                  <img src={article.image_url} alt={article.title} className="w-full h-64 object-cover" />
                )}
                <div className="p-8">
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(article.published_at)}</span>
                  </div>
                  <h1 className="text-3xl font-black text-gray-900 leading-tight">{article.title}</h1>
                  <p className="text-gray-500 mt-4 text-lg">{article.excerpt}</p>
                  <div className="prose prose-gray max-w-none mt-8 text-gray-700 whitespace-pre-line">
                    {article.content}
                  </div>
                </div>
              </article>
            )}
          </QueryState>
        </div>
      </section>
    </PageLayout>
  );
}
