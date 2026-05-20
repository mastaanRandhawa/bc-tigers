import { Link } from 'react-router-dom';
import PortalLayout from '@/components/layouts/PortalLayout';
import QueryState from '@/components/shared/QueryState';
import { useMatches } from '@/hooks/useMatches';
import { useAuthStore } from '@/store/authStore';
import { formatDate, formatTime, getStatusColor } from '@/lib/utils';
import { LayoutDashboard, Calendar, Zap, MapPin, ClipboardList } from 'lucide-react';
import { useEffect } from 'react';

const nav = [
  { label: 'Dashboard', href: '/referee', icon: LayoutDashboard },
  { label: 'Matches', href: '/matches', icon: ClipboardList },
  { label: 'Schedule', href: '/schedule', icon: Calendar },
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
  const upcoming = myMatches
    .filter((m) => m.status === 'SCHEDULED')
    .sort((a, b) => new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime())
    .slice(0, 8);

  return (
    <PortalLayout title="Referee Portal" subtitle="Match Assignments" nav={nav} accentColor="#7C3AED">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Today's Matches", value: todayMatches.length, icon: Calendar },
          { label: 'Live Now', value: live.length, icon: Zap },
          { label: 'Upcoming', value: upcoming.length, icon: ClipboardList },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
            <div className="bg-violet-600 p-3 rounded-xl">
              <stat.icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-400 font-medium">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-violet-600" />
              <h2 className="font-black text-gray-900">Today's Schedule</h2>
            </div>
          </div>
          <QueryState isLoading={isLoading} isEmpty={todayMatches.length === 0} emptyMessage="No matches scheduled today">
            <div className="divide-y divide-gray-50">
              {todayMatches.map((m) => (
                <Link
                  key={m.id}
                  to={`/matches/${m.id}`}
                  className="flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 text-sm">
                    <p className="font-bold text-gray-900">
                      {m.home_team?.name} vs {m.away_team?.name}
                    </p>
                    <p className="text-gray-400 text-xs mt-0.5">
                      {formatTime(m.scheduled_start)}
                      {m.venue && (
                        <>
                          {' · '}
                          <MapPin className="w-3 h-3 inline -mt-0.5" /> {m.venue.name}
                        </>
                      )}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${getStatusColor(m.status)}`}>
                    {m.status}
                  </span>
                </Link>
              ))}
            </div>
          </QueryState>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-red-500" />
              <h2 className="font-black text-gray-900">Live Matches</h2>
              {live.length > 0 && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
            </div>
            <Link to="/matches" className="text-xs text-violet-600 font-semibold hover:underline">
              All Matches →
            </Link>
          </div>
          <QueryState isEmpty={live.length === 0} emptyMessage="No live matches">
            <div className="divide-y divide-gray-50">
              {live.map((m) => (
                <Link
                  key={m.id}
                  to={`/matches/${m.id}`}
                  className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 text-sm">
                    <p className="font-bold text-gray-900">
                      {m.home_team?.name} vs {m.away_team?.name}
                    </p>
                    <p className="text-gray-400 text-xs">{formatDate(m.scheduled_start)}</p>
                  </div>
                  <div className="text-lg font-black text-red-600">
                    {m.home_score} – {m.away_score}
                  </div>
                </Link>
              ))}
            </div>
          </QueryState>
        </div>
      </div>
    </PortalLayout>
  );
}
