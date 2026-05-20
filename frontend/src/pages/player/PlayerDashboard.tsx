import { Link } from 'react-router-dom';
import PortalLayout from '@/components/layouts/PortalLayout';
import QueryState from '@/components/shared/QueryState';
import { useMatches } from '@/hooks/useMatches';
import { useTopScorers } from '@/hooks/useStats';
import { useTournaments } from '@/hooks/useTournaments';
import { useAuthStore } from '@/store/authStore';
import { formatDate, formatTime } from '@/lib/utils';
import {
  LayoutDashboard,
  Calendar,
  BarChart3,
  Users,
  Trophy,
  Clock,
  Target,
} from 'lucide-react';
import { useEffect } from 'react';

const nav = [
  { label: 'Dashboard', href: '/player', icon: LayoutDashboard },
  { label: 'Schedule', href: '/schedule', icon: Calendar },
  { label: 'Standings', href: '/standings', icon: BarChart3 },
  { label: 'Stats', href: '/stats', icon: Target },
  { label: 'Teams', href: '/teams', icon: Users },
];

export default function PlayerDashboard() {
  const { user, refreshUser } = useAuthStore();
  const { data: matches = [], isLoading: matchesLoading } = useMatches();
  const { data: scorers = [], isLoading: scorersLoading } = useTopScorers({ limit: 5 });
  const { data: tournaments = [] } = useTournaments();

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const myTeamIds = new Set(
    user?.player?.rosters?.map((r) => r.team?.id).filter(Boolean) as string[]
  );

  const myMatches = myTeamIds.size > 0
    ? matches.filter((m) => myTeamIds.has(m.home_team_id) || myTeamIds.has(m.away_team_id))
    : matches;

  const upcoming = myMatches
    .filter((m) => m.status === 'SCHEDULED')
    .sort((a, b) => new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime())
    .slice(0, 5);

  return (
    <PortalLayout title="Player Portal" subtitle="Your Tournament Hub" nav={nav} accentColor="#EA580C">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Upcoming', value: upcoming.length, icon: Clock, href: '/schedule' },
          { label: 'My Teams', value: myTeamIds.size, icon: Users, href: '/teams' },
          { label: 'Top Scorers', value: scorers.length, icon: Target, href: '/stats/top-scorers' },
          { label: 'Tournaments', value: tournaments.length, icon: Trophy, href: '/tournaments' },
        ].map((stat) => (
          <Link key={stat.label} to={stat.href} className="group">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all p-5 flex items-center gap-4">
              <div className="bg-orange-600 p-3 rounded-xl group-hover:scale-110 transition-transform">
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-400 font-medium">{stat.label}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-orange-600" />
              <h2 className="font-black text-gray-900">Upcoming Matches</h2>
            </div>
            <Link to="/schedule" className="text-xs text-orange-600 font-semibold hover:underline">
              Schedule →
            </Link>
          </div>
          <QueryState isLoading={matchesLoading} isEmpty={upcoming.length === 0} emptyMessage="No upcoming matches">
            <div className="divide-y divide-gray-50">
              {upcoming.map((m) => (
                <Link
                  key={m.id}
                  to={`/matches/${m.id}`}
                  className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 text-sm">
                    <p className="font-bold text-gray-900">
                      {m.home_team?.name} vs {m.away_team?.name}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {formatDate(m.scheduled_start)} · {formatTime(m.scheduled_start)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </QueryState>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-orange-600" />
              <h2 className="font-black text-gray-900">Top Scorers</h2>
            </div>
            <Link to="/stats/top-scorers" className="text-xs text-orange-600 font-semibold hover:underline">
              Full Stats →
            </Link>
          </div>
          <QueryState isLoading={scorersLoading} isEmpty={scorers.length === 0} emptyMessage="No stats available">
            <div className="divide-y divide-gray-50">
              {scorers.map((entry, i) => (
                <div key={entry.player_id ?? i} className="flex items-center gap-3 p-4">
                  <span className="w-6 text-center text-sm font-black text-gray-400">{i + 1}</span>
                  <div className="flex-1 text-sm">
                    <p className="font-bold text-gray-900">
                      {entry.player?.first_name} {entry.player?.last_name}
                    </p>
                    <p className="text-gray-400 text-xs">{entry.team?.name ?? entry.player?.team?.name ?? '—'}</p>
                  </div>
                  <span className="text-lg font-black text-orange-600">{entry.goals ?? 0}</span>
                </div>
              ))}
            </div>
          </QueryState>
        </div>
      </div>
    </PortalLayout>
  );
}
