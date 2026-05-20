import PageLayout from '@/components/PageLayout';
import PageHeader from '@/components/shared/PageHeader';
import QueryState from '@/components/shared/QueryState';
import { Link } from 'react-router-dom';
import { useTournaments } from '@/hooks/useTournaments';
import { Trophy, Calendar, MapPin, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

export default function TournamentsPage() {
  const { data: tournaments = [], isLoading, isError, refetch } = useTournaments();

  return (
    <PageLayout>
      <PageHeader title="Tournaments" subtitle="All BC Tigers soccer competitions" icon={Trophy} />

      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <QueryState
            isLoading={isLoading}
            isError={isError}
            isEmpty={!isLoading && tournaments.length === 0}
            onRetry={() => refetch()}
            emptyMessage="No tournaments available yet."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {tournaments.map((t) => (
                <Link key={t.id} to={`/tournaments/${t.slug}`} className="group">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all overflow-hidden h-full flex flex-col">
                    <div className="h-44 bg-[#0038FF] relative overflow-hidden">
                      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:2rem_2rem]" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-[#CCFF00] p-4 rounded-2xl shadow-xl group-hover:scale-110 transition-transform duration-300">
                          <Trophy className="w-12 h-12 text-black" />
                        </div>
                      </div>
                      <div className="absolute top-3 left-3">
                        <Badge variant={t.status === 'ACTIVE' ? 'live' : 'default'}>
                          {t.status === 'ACTIVE' ? '● ACTIVE' : t.status}
                        </Badge>
                      </div>
                      <div className="absolute top-3 right-3 bg-black/30 text-white text-xs font-medium px-2 py-1 rounded-lg">
                        {t.tournament_type.replace(/_/g, ' ')}
                      </div>
                    </div>

                    <div className="p-6 flex flex-col flex-1">
                      <h2 className="font-black text-gray-900 text-xl leading-tight group-hover:text-[#0038FF] transition-colors">
                        {t.name}
                      </h2>
                      <p className="text-sm text-gray-500 mt-3 flex-1 line-clamp-2">{t.description}</p>

                      <div className="mt-5 space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="w-4 h-4 text-[#0038FF]" />
                          <span>{formatDate(t.start_date)} – {formatDate(t.end_date)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <MapPin className="w-4 h-4 text-[#0038FF]" />
                          <span>{t.location}</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                        <span className="text-xs text-gray-400 font-medium">View divisions & schedule</span>
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#0038FF] group-hover:translate-x-1 transition-all" />
                      </div>
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
