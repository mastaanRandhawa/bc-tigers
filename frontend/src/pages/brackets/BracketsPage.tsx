import PageLayout from '@/components/PageLayout';
import PageHeader from '@/components/shared/PageHeader';
import QueryState from '@/components/shared/QueryState';
import { Link } from 'react-router-dom';
import { useDivisions } from '@/hooks/useDivisions';
import { GitBranch, ChevronRight } from 'lucide-react';

export default function BracketsPage() {
  const { data: divisions = [], isLoading, isError, refetch } = useDivisions();

  return (
    <PageLayout>
      <PageHeader title="Brackets" subtitle="Knockout stage brackets by division" icon={GitBranch} />

      <section className="py-10 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <QueryState
            isLoading={isLoading}
            isError={isError}
            isEmpty={divisions.length === 0}
            onRetry={() => refetch()}
            emptyMessage="No brackets available."
          >
            <div className="space-y-4">
              {divisions.map((div) => (
                <Link key={div.id} to={`/brackets/${div.slug}`} className="group block">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all p-5 flex items-center gap-4">
                    <div className="bg-[#CCFF00] p-2.5 rounded-xl group-hover:scale-110 transition-transform">
                      <GitBranch className="w-6 h-6 text-black" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-black text-gray-900 group-hover:text-[#0038FF] transition-colors">
                        {div.name}
                      </h3>
                      <p className="text-sm text-gray-400">{div.tournament?.name}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#0038FF] transition-colors" />
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
