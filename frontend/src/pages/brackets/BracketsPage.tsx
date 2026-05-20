import PageLayout from '@/components/PageLayout';
import PageHeader from '@/components/shared/PageHeader';
import PageContent from '@/components/shared/PageContent';
import QueryState from '@/components/shared/QueryState';
import { Link } from 'react-router-dom';
import { useDivisions } from '@/hooks/useDivisions';
import { getDivisionBracketsPath } from '@/lib/division-routes';
import { GitBranch, ChevronRight } from 'lucide-react';

export default function BracketsPage() {
  const { data: divisions = [], isLoading, isError, refetch } = useDivisions();

  return (
    <PageLayout>
      <PageHeader title="Brackets" subtitle="Knockout stage brackets by division" icon={GitBranch} />

      <PageContent innerClassName="max-w-4xl">
          <QueryState
            isLoading={isLoading}
            isError={isError}
            isEmpty={divisions.length === 0}
            onRetry={() => refetch()}
            emptyMessage="No brackets available."
          >
            <div className="space-y-4">
              {divisions.map((div) => {
                const href = getDivisionBracketsPath(div);
                if (!href) return null;
                return (
                <Link key={div.id} to={href} className="group block">
                  <div className="rounded-lg border border-border bg-card shadow-sm hover:shadow-lg transition-all p-5 flex items-center gap-4">
                    <div className="bg-primary-muted p-2.5 rounded-xl group-hover:scale-110 transition-transform">
                      <GitBranch className="w-6 h-6 text-black" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {div.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">{div.tournament?.name}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary transition-colors" />
                  </div>
                </Link>
                );
              })}
            </div>
          </QueryState>
        </PageContent>
    </PageLayout>
  );
}
