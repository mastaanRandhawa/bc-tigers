import PortalLayout from '@/components/layouts/PortalLayout';
import PortalStatGrid from '@/components/shared/PortalStatGrid';
import PortalMatchList from '@/components/shared/PortalMatchList';
import { Badge } from '@/components/ui/badge';
import { useMyMatches } from '@/hooks/useMatches';
import { useAuthStore } from '@/store/authStore';
import { formatTime, getMatchStatusBadgeVariant } from '@/lib/utils';
import { MapPin, LayoutDashboard, Calendar, Zap, ClipboardList, Trophy } from 'lucide-react';
import { useCallback, useEffect } from 'react';
import { useListSearch } from '@/hooks/useListSearch';
import { matchSearchText } from '@/lib/search-text';
import type { Match } from '@/types';

const nav = [
  { label: 'Dashboard', href: '/referee', icon: LayoutDashboard },
  { label: 'Tournaments', href: '/tournaments', icon: Trophy },
];

export default function RefereeDashboard() {
  const { refreshUser } = useAuthStore();
  const { data: myMatches = [], isLoading } = useMyMatches({ limit: 100 });

  useEffect(() => { refreshUser(); }, [refreshUser]);

  const refereeLink = (m: Match) => `/referee/matches/${m.id}`;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayMatches = myMatches
    .filter((m) => {
      const d = new Date(m.scheduled_start);
      return d >= today && d < tomorrow && m.status !== 'CANCELLED';
    })
    .sort((a, b) => new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime());

  const live = myMatches.filter((m) => m.status === 'LIVE');

  const getTodayText = useCallback((m: Match) => matchSearchText(m), []);
  const {
    search: todaySearch, setSearch: setTodaySearch,
    filtered: filteredToday, debouncedSearch: debouncedToday, hasQuery: hasTodayQuery,
  } = useListSearch(todayMatches, getTodayText);

  const getLiveText = useCallback((m: Match) => matchSearchText(m), []);
  const {
    search: liveSearch, setSearch: setLiveSearch,
    filtered: filteredLive, debouncedSearch: debouncedLive, hasQuery: hasLiveQuery,
  } = useListSearch(live, getLiveText);

  const stats = [
    { label: "Today's Matches", value: todayMatches.length, icon: Calendar },
    { label: 'Live Now', value: live.length, icon: Zap },
    { label: 'Assigned', value: myMatches.length, icon: ClipboardList },
  ];

  return (
    <PortalLayout title="Referee Portal" subtitle="Match Assignments" nav={nav}>
      <PortalStatGrid stats={stats} columns={3} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <PortalMatchList
          title="Today's Schedule"
          matches={todayMatches}
          search={todaySearch}
          onSearchChange={setTodaySearch}
          filteredMatches={filteredToday}
          debouncedSearch={debouncedToday}
          hasQuery={hasTodayQuery}
          isLoading={isLoading}
          emptyMessage="No matches scheduled today"
          getLink={refereeLink}
          rowSub={(m) => (
            <>
              {formatTime(m.scheduled_start)}
              {m.venue && (
                <span className="ml-1">
                  {' · '}
                  <MapPin className="w-3 h-3 inline -mt-0.5" aria-hidden /> {m.venue.name}
                </span>
              )}
            </>
          )}
          rowRight={(m) => (
            <Badge variant={getMatchStatusBadgeVariant(m.status)} className="shrink-0">
              {m.status}
            </Badge>
          )}
        />

        <PortalMatchList
          title="Live Matches"
          matches={live}
          search={liveSearch}
          onSearchChange={setLiveSearch}
          filteredMatches={filteredLive}
          debouncedSearch={debouncedLive}
          hasQuery={hasLiveQuery}
          emptyMessage="No live matches"
          getLink={refereeLink}
          rowRight={(m) => (
            <div className="text-lg font-bold text-primary tabular-nums shrink-0">
              {m.home_score} – {m.away_score}
            </div>
          )}
        />
      </div>
    </PortalLayout>
  );
}
