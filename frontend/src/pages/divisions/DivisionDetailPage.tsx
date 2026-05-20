import { useParams, Link } from 'react-router-dom';
import PageLayout from '@/components/PageLayout';
import QueryState from '@/components/shared/QueryState';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import StandingsTable from '@/components/StandingsTable';
import MatchCard from '@/components/MatchCard';
import BracketView from '@/components/BracketView';
import { useDivision } from '@/hooks/useDivisions';
import { useStandings } from '@/hooks/useStandings';
import { useMatches } from '@/hooks/useMatches';
import { useBracket } from '@/hooks/useBrackets';
import { useTopScorers } from '@/hooks/useStats';
import { useMedia } from '@/hooks/useMedia';
import { useTeams } from '@/hooks/useTeams';
import { Flag, Users, Calendar, Trophy, TrendingUp, Image } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function DivisionDetailPage() {
  const { tournamentSlug, divisionSlug } = useParams();
  const { data: division, isLoading, isError, refetch } = useDivision(tournamentSlug, divisionSlug);
  const tournament = division?.tournament;
  const { data: standings = [] } = useStandings(division?.id);
  const { data: divMatches = [] } = useMatches(division ? { divisionId: division.id } : undefined);
  const { data: bracketNodes = [] } = useBracket(divisionSlug);
  const { data: topScorers = [] } = useTopScorers(division ? { divisionId: division.id } : undefined);
  const { data: media = [] } = useMedia(division ? { divisionId: division.id } : undefined);
  const { data: divTeams = [] } = useTeams(division ? { divisionId: division.id } : undefined);

  return (
    <PageLayout>
      <QueryState
        isLoading={isLoading}
        isError={isError}
        isEmpty={!division}
        onRetry={() => refetch()}
        emptyMessage="Division not found."
      >
        {division && (
          <>
            <div className="bg-[#0038FF] py-12 px-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:3rem_3rem]" />
              <div className="max-w-7xl mx-auto relative z-10">
                <div className="flex items-center gap-2 text-white/60 text-sm mb-4">
                  <Link to="/tournaments" className="hover:text-white">Tournaments</Link>
                  <span>/</span>
                  {tournament && (
                    <>
                      <Link to={`/tournaments/${tournament.slug}`} className="hover:text-white">{tournament.name}</Link>
                      <span>/</span>
                    </>
                  )}
                  <span className="text-white">{division.name}</span>
                </div>

                <div className="flex flex-col md:flex-row items-start gap-6">
                  <div className="bg-[#CCFF00] p-3 rounded-2xl flex-shrink-0">
                    <Flag className="w-10 h-10 text-black" />
                  </div>
                  <div>
                    <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white" style={{ fontFamily: '"Arial Black", Impact, sans-serif', textShadow: '3px 3px 0 #001A99' }}>
                      {division.name}
                    </h1>
                    <div className="flex flex-wrap gap-3 mt-3">
                      {division.age_group && <Badge variant="secondary">{division.age_group}</Badge>}
                      <Badge variant="secondary">{division.gender}</Badge>
                      <Badge variant="secondary">{division.format}</Badge>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> {divTeams.length} / {division.max_teams} teams
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
              <Tabs defaultValue="standings">
                <TabsList className="mb-6 flex-wrap h-auto gap-1">
                  <TabsTrigger value="standings" className="flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5" /> Standings
                  </TabsTrigger>
                  <TabsTrigger value="schedule" className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Schedule
                  </TabsTrigger>
                  <TabsTrigger value="bracket" className="flex items-center gap-1.5">
                    <Flag className="w-3.5 h-3.5" /> Bracket
                  </TabsTrigger>
                  <TabsTrigger value="teams" className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> Teams
                  </TabsTrigger>
                  <TabsTrigger value="stats" className="flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" /> Stats
                  </TabsTrigger>
                  <TabsTrigger value="media" className="flex items-center gap-1.5">
                    <Image className="w-3.5 h-3.5" /> Media
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="standings">
                  <StandingsTable standings={standings} />
                </TabsContent>

                <TabsContent value="schedule">
                  <div className="space-y-3">
                    {divMatches.length > 0 ? (
                      divMatches.map((m) => <MatchCard key={m.id} match={m} />)
                    ) : (
                      <EmptyState icon={Calendar} message="No matches scheduled yet" />
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="bracket">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <BracketView nodes={bracketNodes} />
                  </div>
                </TabsContent>

                <TabsContent value="teams">
                  {divTeams.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {divTeams.map((team) => (
                        <Link key={team.id} to={`/teams/${team.slug}`} className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-5 flex items-center gap-4">
                          {team.logo ? (
                            <img src={team.logo} alt={team.name} className="w-12 h-12 rounded-full object-cover border-2 border-gray-100" />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-[#0038FF] flex items-center justify-center text-white font-black">
                              {team.name[0]}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-black text-gray-900 group-hover:text-[#0038FF] transition-colors truncate">{team.name}</h3>
                            <p className="text-sm text-gray-400">{team.city}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <EmptyState icon={Users} message="No teams registered yet" />
                  )}
                </TabsContent>

                <TabsContent value="stats">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <div className="p-5 border-b border-gray-100">
                      <h3 className="font-black text-gray-900 uppercase">Top Scorers</h3>
                    </div>
                    {topScorers.length > 0 ? (
                      <div className="divide-y divide-gray-50">
                        {topScorers.map((stat, i) => (
                          <div key={stat.id} className="flex items-center gap-4 px-5 py-3">
                            <span className="text-sm font-black text-gray-300 w-6">{i + 1}</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-gray-900 text-sm">{stat.player?.first_name} {stat.player?.last_name}</p>
                              <p className="text-xs text-gray-400">{stat.team?.name}</p>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-[#0038FF] font-black">{stat.goals}G</span>
                              <span className="text-gray-400">{stat.assists}A</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="px-5 py-8 text-sm text-gray-400 text-center">No stats available yet.</p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="media">
                  {media.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {media.map((item) => (
                        <div key={item.id} className="rounded-2xl overflow-hidden aspect-video cursor-pointer group">
                          <img src={item.url} alt={item.title ?? ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState icon={Image} message="No media uploaded yet" />
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </>
        )}
      </QueryState>
    </PageLayout>
  );
}

function EmptyState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
      <Icon className="w-12 h-12 text-gray-200 mx-auto mb-3" />
      <p className="text-gray-400 font-medium">{message}</p>
    </div>
  );
}
