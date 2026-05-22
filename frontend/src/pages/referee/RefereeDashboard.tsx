import { Link } from 'react-router-dom';
import PortalLayout from '@/components/layouts/PortalLayout';
import QueryState from '@/components/shared/QueryState';
import Section from '@/components/shared/Section';
import SectionHeader from '@/components/shared/SectionHeader';
import { Badge } from '@/components/ui/badge';
import { useMatches } from '@/hooks/useMatches';
import { useAuthStore } from '@/store/authStore';
import { formatDate, formatTime, getMatchStatusBadgeVariant } from '@/lib/utils';
import { getMatchPath } from '@/lib/division-routes';
import { LayoutDashboard, Calendar, Zap, MapPin, ClipboardList, Trophy } from 'lucide-react';
import { useCallback, useEffect } from 'react';
import SearchField from '@/components/shared/SearchField';
import SearchEmpty from '@/components/shared/SearchEmpty';
import { useListSearch } from '@/hooks/useListSearch';
import { matchSearchText } from '@/lib/search-text';

const nav = [
  { label: 'Dashboard', href: '/referee', icon: LayoutDashboard },
  { label: 'Tournaments', href: '/tournaments', icon: Trophy },
];

export default function RefereeDashboard() {
  const { user, refreshUser } = useAuthStore();
  const { data: matches = [], isLoading } = useMatches();

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const assignedMatchIds = new Set(
    user?.referee?.match_referees?.map((mr) => mr.match?.id).filter(Boolean) as string[]
  );

  const myMatches = assignedMatchIds.size > 0
    ? matches.filter((m) => assignedMatchIds.has(m.id))
    : matches;

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
  const livePath = live[0] ? getMatchPath(live[0]) : '/tournaments';

  const getMatchText = useCallback((m: (typeof todayMatches)[0]) => matchSearchText(m), []);
  const {
    search,
    setSearch,
    filtered: filteredToday,
    debouncedSearch,
    hasQuery,
  } = useListSearch(todayMatches, getMatchText);

  const getLiveText = useCallback((m: (typeof live)[0]) => matchSearchText(m), []);
  const {
    search: liveSearch,
    setSearch: setLiveSearch,
    filtered: filteredLive,
    debouncedSearch: debouncedLiveSearch,
    hasQuery: hasLiveQuery,
  } = useListSearch(live, getLiveText);

  const stats = [
    { label: "Today's Matches", value: todayMatches.length, icon: Calendar },
    { label: 'Live Now', value: live.length, icon: Zap },
    { label: 'Assigned', value: myMatches.length, icon: ClipboardList },
  ];

  return (
    <PortalLayout title="Referee Portal" subtitle="Match Assignments" nav={nav}>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
        {stats.map((stat) => (
          <div key={stat.label} className="portal-stat-card">
            <div className="portal-stat-icon" style={{ pointerEvents: 'none' }}>
              <stat.icon className="w-5 h-5" aria-hidden />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground tabular-nums">{stat.value}</p>
              <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Section className="p-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
            <SectionHeader title="Today's Schedule" className="mb-0" />
          </div>
          {todayMatches.length > 3 && (
            <div className="border-b border-border px-4 py-2">
              <SearchField
                value={search}
                onChange={setSearch}
                placeholder="Search today's matches…"
                className="max-w-full"
              />
            </div>
          )}
          <QueryState isLoading={isLoading} isEmpty={todayMatches.length === 0} emptyMessage="No matches scheduled today">
            {hasQuery && filteredToday.length === 0 ? (
              <SearchEmpty query={debouncedSearch} entityLabel="matches" />
            ) : (
              <div className="divide-y divide-border">
                {filteredToday.map((m) => (
                  <Link
                    key={m.id}
                    to={getMatchPath(m)}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-muted transition-colors"
                  >
                    <div className="flex-1 min-w-0 text-sm">
                      <p className="font-semibold text-foreground truncate">
                        {m.home_team?.name} vs {m.away_team?.name}
                      </p>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        {formatTime(m.scheduled_start)}
                        {m.venue && (
                          <>
                            {' · '}
                            <MapPin className="w-3 h-3 inline -mt-0.5" aria-hidden /> {m.venue.name}
                          </>
                        )}
                      </p>
                    </div>
                    <Badge variant={getMatchStatusBadgeVariant(m.status)} className="shrink-0">
                      {m.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </QueryState>
        </Section>

        <Section className="p-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
            <div className="flex items-center gap-2">
              <SectionHeader
                title="Live Matches"
                href={livePath}
                linkLabel="View Live"
                className="mb-0"
              />
              {live.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" aria-hidden />
              )}
            </div>
          </div>
          {live.length > 3 && (
            <div className="border-b border-border px-4 py-2">
              <SearchField
                value={liveSearch}
                onChange={setLiveSearch}
                placeholder="Search live matches…"
                className="max-w-full"
              />
            </div>
          )}
          <QueryState isEmpty={live.length === 0} emptyMessage="No live matches">
            {hasLiveQuery && filteredLive.length === 0 ? (
              <SearchEmpty query={debouncedLiveSearch} entityLabel="matches" />
            ) : (
              <div className="divide-y divide-border">
                {filteredLive.map((m) => (
                  <Link
                    key={m.id}
                    to={getMatchPath(m)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors"
                  >
                    <div className="flex-1 min-w-0 text-sm">
                      <p className="font-semibold text-foreground truncate">
                        {m.home_team?.name} vs {m.away_team?.name}
                      </p>
                      <p className="text-muted-foreground text-xs">{formatDate(m.scheduled_start)}</p>
                    </div>
                    <div className="text-lg font-bold text-primary tabular-nums shrink-0">
                      {m.home_score} – {m.away_score}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </QueryState>
        </Section>
      </div>
    </PortalLayout>
  );
}
