import AdminLayout from '@/components/AdminLayout';
import { Link } from 'react-router-dom';
import QueryState from '@/components/shared/QueryState';
import { useTournaments } from '@/hooks/useTournaments';
import { useMatches } from '@/hooks/useMatches';
import { useTeams } from '@/hooks/useTeams';
import { usePlayers } from '@/hooks/usePlayers';
import { Trophy, Calendar, Users, UserCircle, Zap, TrendingUp, Clock } from 'lucide-react';
import { formatDate, formatTime } from '@/lib/utils';

export default function AdminDashboard() {
  const { data: tournaments = [] } = useTournaments();
  const { data: matches = [] } = useMatches();
  const { data: teams = [] } = useTeams();
  const { data: players = [] } = usePlayers();

  const stats = [
    { label: 'Tournaments', value: tournaments.length, icon: Trophy, href: '/admin/tournaments', color: 'bg-primary' },
    { label: 'Matches', value: matches.length, icon: Calendar, href: '/admin/matches', color: 'bg-green-600' },
    { label: 'Teams', value: teams.length, icon: Users, href: '/admin/teams', color: 'bg-purple-600' },
    { label: 'Players', value: players.length, icon: UserCircle, href: '/admin/players', color: 'bg-orange-500' },
  ];

  const liveMatches = matches.filter((m) => m.status === 'LIVE');
  const upcomingMatches = matches.filter((m) => m.status === 'SCHEDULED').slice(0, 5);

  return (
    <AdminLayout title="Dashboard">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Link key={stat.label} to={stat.href} className="group">
            <div className="rounded-lg border border-border bg-card shadow-sm hover:shadow-md transition-all p-5 flex items-center gap-4">
              <div className={`${stat.color} p-3 rounded-xl group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-red-500" />
              <h2 className="font-semibold text-foreground">Live Now</h2>
              {liveMatches.length > 0 && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
            </div>
            <Link to="/admin/matches" className="text-xs text-primary font-semibold hover:underline">
              Manage →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {liveMatches.length > 0 ? (
              liveMatches.map((m) => (
                <div key={m.id} className="flex items-center gap-3 p-4">
                  <div className="flex-1 text-sm">
                    <p className="font-bold text-foreground">
                      {m.home_team?.name} vs {m.away_team?.name}
                    </p>
                    <p className="text-muted-foreground text-xs">{formatDate(m.scheduled_start)}</p>
                  </div>
                  <div className="text-lg font-black text-red-600">
                    {m.home_score} – {m.away_score}
                  </div>
                  <Link
                    to={`/matches/${m.id}`}
                    className="text-xs px-2 py-1 bg-primary text-white rounded-lg font-semibold hover:bg-primary-hover transition-colors"
                  >
                    View
                  </Link>
                </div>
              ))
            ) : (
              <div className="py-10 text-center text-muted-foreground text-sm">No live matches</div>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-foreground">Upcoming Matches</h2>
            </div>
            <Link to="/admin/schedules" className="text-xs text-primary font-semibold hover:underline">
              Schedule →
            </Link>
          </div>
          <QueryState isEmpty={upcomingMatches.length === 0} emptyMessage="No upcoming matches">
            <div className="divide-y divide-gray-50">
              {upcomingMatches.map((m) => (
                <div key={m.id} className="flex items-center gap-3 p-4">
                  <div className="flex-1 text-sm">
                    <p className="font-bold text-foreground">
                      {m.home_team?.name} vs {m.away_team?.name}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {formatDate(m.scheduled_start)} · {formatTime(m.scheduled_start)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </QueryState>
        </div>

        <div className="rounded-lg border border-border bg-card shadow-sm lg:col-span-2">
          <div className="flex items-center gap-2 p-5 border-b border-border">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground">Quick Actions</h2>
          </div>
          <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'New Tournament', href: '/admin/tournaments', icon: Trophy },
              { label: 'Schedule Match', href: '/admin/schedules', icon: Calendar },
              { label: 'Add Team', href: '/admin/teams', icon: Users },
              { label: 'Add Player', href: '/admin/players', icon: UserCircle },
            ].map((action) => (
              <Link
                key={action.label}
                to={action.href}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-muted hover:bg-primary hover:text-white group transition-all"
              >
                <action.icon className="w-6 h-6 text-primary group-hover:text-white transition-colors" />
                <span className="text-xs font-bold text-gray-700 group-hover:text-white transition-colors text-center">
                  {action.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
