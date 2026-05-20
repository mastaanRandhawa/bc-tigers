import PageLayout from '@/components/PageLayout';
import { Shield, AlertTriangle, Clock, Star } from 'lucide-react';

const ruleSections = [
  {
    icon: Clock, title: 'Match Duration',
    rules: [
      'U10: Two 25-minute halves with a 10-minute break',
      'U14: Two 35-minute halves with a 10-minute break',
      'Premier / Open: Two 45-minute halves with a 15-minute break',
      'Extra time (10 min each half) for knockout stage if tied',
    ],
  },
  {
    icon: Star, title: 'Scoring & Points',
    rules: [
      'Win: 3 points',
      'Draw: 1 point',
      'Loss: 0 points',
      'Tie-breakers: Points → Goal Difference → Goals Scored → Head-to-Head',
    ],
  },
  {
    icon: AlertTriangle, title: 'Disciplinary Rules',
    rules: [
      'Yellow Card: Warning — 2 yellow cards = automatic 1-match suspension',
      'Red Card: Immediate dismissal — minimum 1-match suspension',
      'Violent conduct: Minimum 3-match suspension + review',
      'Players must be at the venue 30 minutes before kickoff',
    ],
  },
  {
    icon: Shield, title: 'Eligibility & Registration',
    rules: [
      'All players must be registered before the tournament start date',
      'Age verification required for youth divisions',
      'Players may only represent one team per division',
      'Coaches must hold valid BC Soccer coaching credentials',
    ],
  },
];

export default function RulesPage() {
  return (
    <PageLayout>
      <div className="bg-[#0038FF] text-white py-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:3rem_3rem]" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter text-[#CCFF00]" style={{ fontFamily: '"Arial Black", Impact, sans-serif', textShadow: '4px 4px 0 #001A99' }}>
            Tournament Rules
          </h1>
          <p className="text-white/80 mt-4">Official BC Tigers competition regulations</p>
        </div>
      </div>

      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto space-y-6">
          {ruleSections.map((section) => (
            <div key={section.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
              <div className="flex items-center gap-3 mb-5">
                <div className="bg-[#CCFF00] p-2 rounded-xl">
                  <section.icon className="w-5 h-5 text-black" />
                </div>
                <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">{section.title}</h2>
              </div>
              <ul className="space-y-3">
                {section.rules.map((rule, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                    <span className="w-5 h-5 rounded-full bg-[#0038FF] text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
                      {i + 1}
                    </span>
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </PageLayout>
  );
}
