import { Link } from 'react-router-dom';
import PortalLayout from '@/components/layouts/PortalLayout';
import QueryState from '@/components/shared/QueryState';
import { useTeams } from '@/hooks/useTeams';
import { useMatches } from '@/hooks/useMatches';
import { useTournaments } from '@/hooks/useTournaments';
import { useAuthStore } from '@/store/authStore';
import { formatDate, formatTime } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Trophy,
  Clock,
  Zap,
  BarChart3,
} from 'lucide-react';
import { useEffect } from 'react';

const nav = [
  { label: 'Dashboard', href: '/coach', icon: LayoutDashboard },
  { label: 'Teams', href: '/teams', icon: Users },
  { label: 'Schedule', href: '/schedule', icon: Calendar },
  { label: 'Standings', href: '/standings', icon: BarChart3 },
  { label: 'Tournaments', href: '/tournaments', icon: Trophy },
];

export default function CoachDashboard() {
  const { user, refreshUser } = useAuthStore();
  const { data: teams = [], isLoading: teamsLoading } = useTeams();
  const { data: matches = [], isLoading: matchesLoading } = useMatches();
  const { data: tournaments = [] } = useTournaments();

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const myTeamIds = new Set(
    user?.coach?.team_coaches?.map((tc) => tc.team?.id).filter(Boolean) as string[]
  );
  const myTeams = myTeamIds.size > 0 ? teams.filter((t) => myTeamIds.has(t.id)) : teams;

  const myMatches = myTeamIds.size > 0
    ? matches.filter((m) => myTeamIds.has(m.home_team_id) || myTeamIds.has(m.away_team_id))
    : matches;

  const upcoming = myMatches
    .filter((m) => m.status === 'SCHEDULED')
    .sort((a, b) => new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime())
    .slice(0, 6);

  const live = myMatches.filter((m) => m.status === 'LIVE');

  return (
    <PortalLayout title="Coach Portal" subtitle="Team Management" nav={nav} accentColor="#059669">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Teams', value: myTeams.length, icon: Users, href: '/teams' },
          { label: 'Upcoming', value: upcoming.length, icon: Clock, href: '/schedule' },
          { label: 'Live Now', value: live.length, icon: Zap, href: '/matches' },
          { label: 'Tournaments', value: tournaments.length, icon: Trophy, href: '/tournaments' },
        ].map((stat) => (
          <Link key={stat.label} to={stat.href} className="group">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all p-5 flex items-center gap-4">
              <div className="bg-emerald-600 p-3 rounded-xl group-hover:scale-110 transition-transform">
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
              <Clock className="w-4 h-4 text-emerald-600" />
              <h2 className="font-black text-gray-900">Upcoming Matches</h2>
            </div>
            <Link to="/schedule" className="text-xs text-emerald-600 font-semibold hover:underline">
              Full Schedule →
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
              <Users className="w-4 h-4 text-emerald-600" />
              <h2 className="font-black text-gray-900">Teams</h2>
            </div>
            <Link to="/teams" className="text-xs text-emerald-600 font-semibold hover:underline">
              Browse All →
            </Link>
          </div>
          <QueryState isLoading={teamsLoading} isEmpty={myTeams.length === 0} emptyMessage="No teams assigned">
            <div className="divide-y divide-gray-50">
              {myTeams.slice(0, 6).map((team) => (
                <Link
                  key={team.id}
                  to={`/teams/${team.slug}`}
                  className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black"
                    style={{ backgroundColor: team.primary_color ?? '#059669' }}
                  >
                    {team.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 text-sm">
                    <p className="font-bold text-gray-900">{team.name}</p>
                    <p className="text-gray-400 text-xs">{team.division?.name ?? 'Division'}</p>
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
