import { Link } from 'react-router-dom';
import PortalLayout from '@/components/layouts/PortalLayout';
import QueryState from '@/components/shared/QueryState';
import { useTeams } from '@/hooks/useTeams';
import { useMatches } from '@/hooks/useMatches';
import { useTournaments } from '@/hooks/useTournaments';
import { useAuthStore } from '@/store/authStore';
import { formatDate, formatTime } from '@/lib/utils';
import { getMatchPath, getTeamPath, getDivisionSchedulePath } from '@/lib/division-routes';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Trophy,
  Clock,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect } from 'react';
import SearchField from '@/components/shared/SearchField';
import SearchEmpty from '@/components/shared/SearchEmpty';
import { useListSearch } from '@/hooks/useListSearch';
import { matchSearchText, teamSearchText } from '@/lib/search-text';

const nav = [
  { label: 'Dashboard', href: '/coach', icon: LayoutDashboard },
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
  const primaryTeam = myTeams[0];
  const schedulePath = primaryTeam?.division
    ? getDivisionSchedulePath(primaryTeam.division)
    : '/tournaments';

  const myMatches = myTeamIds.size > 0
    ? matches.filter((m) => myTeamIds.has(m.home_team_id) || myTeamIds.has(m.away_team_id))
    : matches;

  const upcoming = myMatches
    .filter((m) => m.status === 'SCHEDULED')
    .sort((a, b) => new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime())
    .slice(0, 6);

  const live = myMatches.filter((m) => m.status === 'LIVE');
  const livePath = live[0] ? getMatchPath(live[0]) : schedulePath ?? '/tournaments';

  const getMatchText = useCallback((m: (typeof upcoming)[0]) => matchSearchText(m), []);
  const {
    search: matchSearch,
    setSearch: setMatchSearch,
    filtered: filteredUpcoming,
    debouncedSearch: debouncedMatchSearch,
    hasQuery: hasMatchQuery,
  } = useListSearch(upcoming, getMatchText);

  const getTeamText = useCallback((t: (typeof myTeams)[0]) => teamSearchText(t), []);
  const {
    search: teamSearch,
    setSearch: setTeamSearch,
    filtered: filteredTeams,
    debouncedSearch: debouncedTeamSearch,
    hasQuery: hasTeamQuery,
  } = useListSearch(myTeams, getTeamText);

  return (
    <PortalLayout title="Coach Portal" subtitle="Team Management" nav={nav}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Teams', value: myTeams.length, icon: Users, href: primaryTeam ? (getTeamPath(primaryTeam) ?? '/tournaments') : '/tournaments' },
          { label: 'Upcoming', value: upcoming.length, icon: Clock, href: schedulePath ?? '/tournaments' },
          { label: 'Live Now', value: live.length, icon: Zap, href: livePath },
          { label: 'Tournaments', value: tournaments.length, icon: Trophy, href: '/tournaments' },
        ].map((stat) => (
          <Link key={stat.label} to={stat.href} className="group">
            <div className="rounded-lg border border-border bg-card shadow-sm hover:shadow-md transition-all p-5 flex items-center gap-4">
              <div className="bg-emerald-600 p-3 rounded-xl group-hover:scale-110 transition-transform">
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
              <Clock className="w-4 h-4 text-emerald-600" />
              <h2 className="font-semibold text-foreground">Upcoming Matches</h2>
            </div>
            <Link to={schedulePath ?? '/tournaments'} className="text-xs text-emerald-600 font-semibold hover:underline">
              Full Schedule →
            </Link>
          </div>
          {upcoming.length > 3 && (
            <div className="border-b border-border px-4 py-2">
              <SearchField
                value={matchSearch}
                onChange={setMatchSearch}
                placeholder="Search matches…"
                className="max-w-full"
              />
            </div>
          )}
          <QueryState
            isLoading={matchesLoading}
            isEmpty={upcoming.length === 0}
            emptyMessage="No upcoming matches"
          >
            {hasMatchQuery && filteredUpcoming.length === 0 ? (
              <SearchEmpty query={debouncedMatchSearch} entityLabel="matches" />
            ) : (
            <div className="divide-y divide-gray-50">
              {filteredUpcoming.map((m) => (
                <Link
                  key={m.id}
                  to={getMatchPath(m)}
                  className="flex items-center gap-3 p-4 hover:bg-muted transition-colors"
                >
                  <div className="flex-1 text-sm">
                    <p className="font-bold text-foreground">
                      {m.home_team?.name} vs {m.away_team?.name}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {formatDate(m.scheduled_start)} · {formatTime(m.scheduled_start)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
            )}
          </QueryState>
        </div>

        <div className="rounded-lg border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              <h2 className="font-semibold text-foreground">Teams</h2>
            </div>
            <Link to="/tournaments" className="text-xs text-emerald-600 font-semibold hover:underline">
              Browse Tournaments →
            </Link>
          </div>
          {myTeams.length > 3 && (
            <div className="border-b border-border px-4 py-2">
              <SearchField
                value={teamSearch}
                onChange={setTeamSearch}
                placeholder="Search teams…"
                className="max-w-full"
              />
            </div>
          )}
          <QueryState isLoading={teamsLoading} isEmpty={myTeams.length === 0} emptyMessage="No teams assigned">
            {hasTeamQuery && filteredTeams.length === 0 ? (
              <SearchEmpty query={debouncedTeamSearch} entityLabel="teams" />
            ) : (
            <div className="divide-y divide-gray-50">
              {filteredTeams.slice(0, 6).map((team) => (
                <Link
                  key={team.id}
                  to={getTeamPath(team) ?? '/tournaments'}
                  className="flex items-center gap-3 p-4 hover:bg-muted transition-colors"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black"
                    style={{ backgroundColor: team.primary_color ?? '#059669' }}
                  >
                    {team.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 text-sm">
                    <p className="font-bold text-foreground">{team.name}</p>
                    <p className="text-muted-foreground text-xs">{team.division?.name ?? 'Division'}</p>
                  </div>
                </Link>
              ))}
            </div>
            )}
          </QueryState>
        </div>
      </div>
    </PortalLayout>
  );
}
