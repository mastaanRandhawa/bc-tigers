import PageLayout from '@/components/PageLayout';
import QueryState from '@/components/shared/QueryState';
import { useStatsSummary } from '@/hooks/useStats';
import { useCoaches } from '@/hooks/useCoaches';
import { useVenues } from '@/hooks/useVenues';
import { Trophy, Users, Calendar, MapPin } from 'lucide-react';
import { getInitials } from '@/lib/utils';

export default function AboutPage() {
  const { data: summary, isLoading: summaryLoading } = useStatsSummary();
  const { data: coaches = [], isLoading: coachesLoading } = useCoaches();
  const { data: venues = [] } = useVenues();

  const stats = summary
    ? [
        { label: 'Tournaments Hosted', value: String(summary.tournaments), icon: Trophy },
        { label: 'Teams Registered', value: String(summary.teams), icon: Users },
        { label: 'Matches Played', value: String(summary.matches), icon: Calendar },
        { label: 'Venues', value: String(summary.venues || venues.length), icon: MapPin },
      ]
    : [];

  return (
    <PageLayout>
      <div className="bg-[#0038FF] text-white py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:3rem_3rem]" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-black uppercase tracking-tighter text-[#CCFF00]" style={{ fontFamily: '"Arial Black", Impact, sans-serif', textShadow: '4px 4px 0 #001A99' }}>
            About BC Tigers
          </h1>
          <p className="text-white/80 text-lg mt-6 max-w-2xl mx-auto">
            British Columbia&apos;s premier soccer tournament organization, connecting communities through the beautiful game.
          </p>
        </div>
      </div>

      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <QueryState isLoading={summaryLoading} isEmpty={stats.length === 0} emptyMessage="Stats unavailable.">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center p-6 rounded-2xl bg-gray-50 border border-gray-100">
                  <stat.icon className="w-8 h-8 text-[#0038FF] mx-auto mb-3" />
                  <p className="text-4xl font-black text-[#0038FF]">{stat.value}</p>
                  <p className="text-sm text-gray-500 font-medium mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </QueryState>
        </div>
      </section>

      <section className="py-16 bg-gray-50 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-6">Our Mission</h2>
          <div className="prose prose-lg text-gray-600 max-w-none">
            <p>
              BC Tigers was founded with a simple but powerful mission: to provide world-class soccer tournament management
              for every team, player, and community across British Columbia. From youth U10 leagues to competitive open
              divisions, we ensure every match matters.
            </p>
            <p className="mt-4">
              Our platform enables coaches, players, referees, and fans to stay connected — with real-time scores, automated
              standings, interactive brackets, and comprehensive statistics that bring the game to life.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-8 text-center">Our Team</h2>
          <QueryState isLoading={coachesLoading} isEmpty={coaches.length === 0} emptyMessage="No staff listed yet.">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {coaches.slice(0, 6).map((member) => (
                <div key={member.id} className="text-center bg-gray-50 rounded-2xl p-8 border border-gray-100">
                  {member.profile_image ? (
                    <img
                      src={member.profile_image}
                      alt={`${member.first_name} ${member.last_name}`}
                      className="w-24 h-24 rounded-full object-cover mx-auto mb-4 border-4 border-[#CCFF00]"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-[#0038FF] text-white flex items-center justify-center mx-auto mb-4 border-4 border-[#CCFF00] text-xl font-black">
                      {getInitials(`${member.first_name} ${member.last_name}`)}
                    </div>
                  )}
                  <h3 className="font-black text-gray-900 text-lg">{member.first_name} {member.last_name}</h3>
                  <p className="text-sm text-[#0038FF] font-semibold">
                    {member.team_coaches?.[0]?.role ?? 'Coach'}
                  </p>
                </div>
              ))}
            </div>
          </QueryState>
        </div>
      </section>
    </PageLayout>
  );
}
